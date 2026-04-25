import { useState, useEffect, useRef } from 'react';
import { type GameState, type ActiveMission, type MissionType, saveGameState } from '../core/gameState';
import { Clock, Coins, Star, Activity, AlertCircle, FastForward, CircleDollarSign, Hourglass } from 'lucide-react';
import { generateEquipment } from '../core/equipmentGenerator';
import { checkLevelUp } from '../core/mathCore';
import { XP_TABLE } from '../data/xpTable';
import { LevelUpModal } from './LevelUpModal';

interface MissionHubProps {
  gameState: GameState;
  setGameState: React.Dispatch<React.SetStateAction<GameState>>;
}

interface MissionData {
  id: string;
  type: MissionType;
  name: string;
  durationSec: number;
  foodCost: number;
  expReward: number;
  coinReward: number;
  dropRate: number;
}

// 任务配置池
const MISSION_TEMPLATES = [
  { type: 'A' as MissionType, names: ['深夜行刺', '暗杀贪官', '潜入州府'], minT: 300, maxT: 900, minF: 10, maxF: 20, coinMult: 0.5, expMult: 2.0, drop: 0.2 },
  { type: 'B' as MissionType, names: ['劫掠商队', '黑吃黑', '打劫富绅'], minT: 180, maxT: 600, minF: 5, maxF: 15, coinMult: 2.0, expMult: 0.5, drop: 0.1 },
  { type: 'C' as MissionType, names: ['传递密信', '打探消息', '接应同僚'], minT: 60, maxT: 180, minF: 1, maxF: 5, coinMult: 1.0, expMult: 1.0, drop: 0.02 },
];

export function MissionHub({ gameState, setGameState }: MissionHubProps) {
  const [missions, setMissions] = useState<MissionData[]>([]);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [levelUpShow, setLevelUpShow] = useState<number | null>(null); // null = hidden, number = new level

  const gameStateRef = useRef(gameState);
  useEffect(() => {
    gameStateRef.current = gameState;
  }, [gameState]);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (gameState.activeMission) {
      const checkTimer = () => {
        const remaining = Math.ceil((gameState.activeMission!.endTime - Date.now()) / 1000);
        if (remaining <= 0) {
          setTimeLeft(0);
          handleMissionComplete(gameState.activeMission!);
        } else {
          setTimeLeft(remaining);
        }
      };

      checkTimer();
      if (gameState.activeMission.endTime > Date.now()) {
        interval = setInterval(checkTimer, 1000);
      }
    } else {
      if (missions.length === 0) {
        generateMissions();
      }
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [gameState.activeMission]);

  const generateMissions = () => {
    const currentState = gameStateRef.current;
    const newMissions: MissionData[] = [];
    // 奖励基准：当前等级升级所需 XP 的 15%，再乘以任务类型系数
    const baseXpNeeded = XP_TABLE[currentState.playerLevel] ?? 400;
    const baseCoinReward = currentState.playerLevel * 50;

    for (let i = 0; i < 3; i++) {
      const tpl = MISSION_TEMPLATES[Math.floor(Math.random() * MISSION_TEMPLATES.length)];
      const name = tpl.names[Math.floor(Math.random() * tpl.names.length)];
      const durationSec = Math.floor(Math.random() * (tpl.maxT - tpl.minT + 1) + tpl.minT);
      const foodCost = Math.floor(Math.random() * (tpl.maxF - tpl.minF + 1) + tpl.minF);

      const fluctuation = 0.9 + Math.random() * 0.2; // 0.9 ~ 1.1
      // 经验奖励：约为升级所需 XP 的 15%，乘以任务类型系数（A 类高风险高回报）
      const expReward = Math.floor(baseXpNeeded * tpl.expMult * fluctuation * 0.15);
      const coinReward = Math.floor(baseCoinReward * tpl.coinMult * fluctuation);

      newMissions.push({
        id: `m_${Date.now()}_${i}`,
        type: tpl.type,
        name,
        durationSec,
        foodCost,
        expReward,
        coinReward,
        dropRate: tpl.drop,
      });
    }
    setMissions(newMissions);
  };

  const handleAccept = (mission: MissionData) => {
    if (gameState.resources.rations < mission.foodCost) {
      alert('干粮不足！');
      return;
    }

    const newActiveMission: ActiveMission = {
      ...mission,
      endTime: Date.now() + mission.durationSec * 1000
    };

    setGameState((prev: GameState) => {
      const newState = {
        ...prev,
        activeMission: newActiveMission,
        resources: {
          ...prev.resources,
          rations: prev.resources.rations - mission.foodCost
        }
      };
      saveGameState(newState);
      return newState;
    });
  };

  const handleMissionComplete = (mission: ActiveMission, forceDrop: boolean = false) => {
    const currentState = gameStateRef.current;

    // 防止二次结算
    if (!currentState.activeMission || currentState.activeMission.id !== mission.id) {
      return;
    }

    // 装备掉落判定
    const droppedItem = generateEquipment(currentState.playerLevel, mission.type, forceDrop);

    // 升级判断（在 setGameState 外预计算 didLevelUp，用于弹窗触发）
    let pendingLevelUpTo: number | null = null;

    setGameState((prev: GameState) => {
      if (!prev.activeMission || prev.activeMission.id !== mission.id) {
        return prev;
      }

      // 接入升级系统
      const newExp = (prev.exp ?? 0) + mission.expReward;
      const { newLevel, newExp: remainingExp, didLevelUp } = checkLevelUp(prev.playerLevel, newExp);

      if (didLevelUp) {
        pendingLevelUpTo = newLevel;
      }

      const newState: GameState = {
        ...prev,
        playerLevel: newLevel,
        exp: remainingExp,
        activeMission: null,
        resources: {
          ...prev.resources,
          copper: prev.resources.copper + mission.coinReward,
          // prestige 保持不变，声望与经验是两回事
        },
        inventory: droppedItem ? [...prev.inventory, droppedItem] : prev.inventory
      };
      saveGameState(newState);
      return newState;
    });

    let alertMsg = `任务【${mission.name}】完成！获得 ${mission.coinReward} 铜钱，${mission.expReward} 经验。`;
    if (droppedItem) {
      alertMsg += `\n意外发现了一件装备：【${droppedItem.name}】！`;
    }

    setTimeout(() => {
      alert(alertMsg);
      generateMissions();
      // 升级弹窗延迟到 alert 关闭后弹出
      if (pendingLevelUpTo !== null) {
        setLevelUpShow(pendingLevelUpTo);
      }
    }, 50);
  };

  const handleTokenSkip = () => {
    if (gameState.activeMission && gameState.resources.tokens >= 1) {
      setGameState(prev => {
        const newState = { ...prev, resources: { ...prev.resources, tokens: prev.resources.tokens - 1 } };
        saveGameState(newState);
        return newState;
      });
      handleMissionComplete(gameState.activeMission, true);
    } else {
      alert('通宝不足！');
    }
  };

  const handleHourglassSkip = () => {
    if (gameState.activeMission && gameState.resources.hourglasses >= 1) {
      setGameState(prev => {
        if (!prev.activeMission) return prev;
        const newEndTime = prev.activeMission.endTime - 600_000; // subtract 10 minutes
        const newState = {
          ...prev,
          activeMission: { ...prev.activeMission, endTime: newEndTime },
          resources: { ...prev.resources, hourglasses: prev.resources.hourglasses - 1 }
        };
        saveGameState(newState);
        return newState;
      });
    } else {
      alert('沙漏不足！');
    }
  };

  if (gameState.activeMission) {
    const activeMission = gameState.activeMission;
    const progress = Math.max(0, Math.min(100, ((activeMission.durationSec - timeLeft) / activeMission.durationSec) * 100));

    return (
      <>
        {levelUpShow !== null && (
          <LevelUpModal newLevel={levelUpShow} onClose={() => setLevelUpShow(null)} />
        )}
        <div className="w-full h-full flex flex-col items-center justify-center p-8 bg-black/40">
          <div className="bg-darkSurface border border-darkBorder p-8 rounded-lg shadow-2xl max-w-md w-full text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 h-1 bg-primary/20 w-full">
              <div className="h-full bg-primary transition-all duration-1000 ease-linear" style={{ width: `${progress}%` }}></div>
            </div>

            <Clock size={48} className="mx-auto mb-6 text-primary animate-pulse" />
            <h2 className="text-2xl font-bold text-textMain mb-2">执行任务中...</h2>
            <p className="text-lg text-primary mb-6">【{activeMission.name}】</p>

            <div className="text-4xl font-mono text-textMain tracking-widest mb-8">
              {Math.floor(Math.max(0, timeLeft) / 60).toString().padStart(2, '0')}:
              {(Math.max(0, timeLeft) % 60).toString().padStart(2, '0')}
            </div>

            <div className="flex justify-center gap-6 text-sm text-textMuted bg-darkBg py-3 rounded border border-darkBorder mb-6">
              <div className="flex items-center gap-1">
                <Coins size={14} className="text-amber-500" /> +{activeMission.coinReward} 铜钱
              </div>
              <div className="flex items-center gap-1">
                <Star size={14} className="text-purple-400" /> +{activeMission.expReward} 经验
              </div>
            </div>

            <div className="flex flex-col gap-3 w-full">
              <button
                onClick={handleTokenSkip}
                disabled={gameState.resources.tokens < 1}
                className="flex items-center justify-center gap-2 w-full py-2 bg-purple-500/10 text-purple-400 border border-purple-500/30 hover:bg-purple-600 hover:text-white disabled:opacity-30 disabled:hover:bg-purple-500/10 disabled:hover:text-purple-400 rounded transition-all group"
              >
                <CircleDollarSign size={16} className="group-hover:scale-110 transition-transform" />
                瞬间完成 (消耗 1 通宝)
              </button>
              <button
                onClick={handleHourglassSkip}
                disabled={gameState.resources.hourglasses < 1}
                className="flex items-center justify-center gap-2 w-full py-2 bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 hover:bg-cyan-600 hover:text-white disabled:opacity-30 disabled:hover:bg-cyan-500/10 disabled:hover:text-cyan-400 rounded transition-all group"
              >
                <Hourglass size={16} className="group-hover:scale-110 transition-transform" />
                减少10分钟 (消耗 1 沙漏)
              </button>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      {levelUpShow !== null && (
        <LevelUpModal newLevel={levelUpShow} onClose={() => setLevelUpShow(null)} />
      )}
      <div className="w-full max-w-4xl mx-auto py-8 px-6">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-textMain tracking-wide flex items-center gap-2">
              <span className="text-primary">|</span> 密谋据点
            </h2>
            <p className="text-sm text-textMuted mt-1">接头人带来了新的风声，量力而行。</p>
          </div>

          <div className="flex items-center gap-2 bg-darkSurface px-4 py-2 rounded-md border border-darkBorder shadow-sm">
            <Activity size={18} className="text-emerald-500" />
            <span className="text-sm text-textMuted">当前干粮：</span>
            <span className="font-bold text-emerald-500 text-lg">{gameState.resources.rations}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {missions.map((m) => (
            <div key={m.id} className="bg-darkSurface border border-darkBorder rounded-lg p-5 flex flex-col hover:border-primary/50 transition-colors shadow-lg group relative overflow-hidden">
              <div className="absolute top-0 right-0 -mr-6 -mt-6 w-24 h-24 bg-primary/10 rounded-full blur-2xl group-hover:bg-primary/20 transition-all"></div>

              <div className="flex justify-between items-start mb-4 relative z-10">
                <h3 className="text-lg font-bold text-textMain">{m.name}</h3>
                <span className="text-xs px-2 py-1 bg-darkBg text-textMuted rounded border border-darkBorder/50">
                  类型 {m.type}
                </span>
              </div>

              <div className="space-y-3 mb-6 relative z-10 flex-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-textMuted flex items-center gap-1"><Clock size={14}/> 耗时</span>
                  <span className="text-textMain font-mono">{Math.floor(m.durationSec / 60)}分{m.durationSec % 60}秒</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-textMuted flex items-center gap-1"><Activity size={14}/> 消耗干粮</span>
                  <span className={`${gameState.resources.rations < m.foodCost ? 'text-red-400' : 'text-emerald-500'} font-bold`}>{m.foodCost}</span>
                </div>

                <div className="h-px w-full bg-darkBorder/50 my-2"></div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-textMuted flex items-center gap-1"><Coins size={14} className="text-amber-500"/> 预期铜钱</span>
                  <span className="text-textMain font-medium">{m.coinReward}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-textMuted flex items-center gap-1"><Star size={14} className="text-purple-400"/> 预期经验</span>
                  <span className="text-textMain font-medium">{m.expReward}</span>
                </div>
              </div>

              <button
                onClick={() => handleAccept(m)}
                disabled={gameState.resources.rations < m.foodCost}
                className="w-full py-3 bg-darkBg border border-darkBorder hover:border-primary hover:bg-primary/10 hover:text-primary text-textMain font-medium rounded transition-all disabled:opacity-50 disabled:cursor-not-allowed relative z-10"
              >
                {gameState.resources.rations < m.foodCost ? '干粮不足' : '接受任务'}
              </button>
            </div>
          ))}
        </div>

        <div className="mt-8 flex items-start gap-3 bg-darkSurface/50 p-4 rounded text-sm text-textMuted border border-darkBorder/50">
          <AlertCircle size={16} className="text-primary shrink-0 mt-0.5" />
          <p>一旦开始任务，中途不可取消。且即使切页或关闭浏览器，任务的倒计时也会在后台准确运行。完成后奖励将自动发放。</p>
        </div>
      </div>
    </>
  );
}
