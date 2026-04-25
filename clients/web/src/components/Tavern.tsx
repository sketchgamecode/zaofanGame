import { useState, useEffect, useRef } from 'react';
import { type GameState, type ActiveMission, type MissionType } from '../core/gameState';
import { useAction } from '../hooks/useAction';
import { generateEquipment } from '../core/equipmentGenerator';
import { checkLevelUp } from '../core/mathCore';
import { XP_TABLE } from '../data/xpTable';
import { LevelUpModal } from './LevelUpModal';

interface TavernProps {
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

interface QuestRewardInfo {
  missionName: string;
  coinReward: number;
  expReward: number;
  droppedItemName: string | null;
  didLevelUp: boolean;
  newLevel: number;
}

type TavernScene = 'hall' | 'quest-select' | 'travel' | 'reward';

// ─── 任务配置池（保留原有逻辑）────────────────────────────────────────────────
const MISSION_TEMPLATES = [
  { type: 'A' as MissionType, names: ['深夜行刺', '暗杀贪官', '潜入州府'], minT: 120, maxT: 600, minF: 10, maxF: 20, coinMult: 0.5, expMult: 2.0, drop: 0.2 },
  { type: 'B' as MissionType, names: ['劫掠商队', '黑吃黑', '打劫富绅'], minT: 60,  maxT: 300, minF: 5,  maxF: 15, coinMult: 2.0, expMult: 0.5, drop: 0.1 },
  { type: 'C' as MissionType, names: ['传递密信', '打探消息', '接应同僚'], minT: 30,  maxT: 120, minF: 1,  maxF: 5,  coinMult: 1.0, expMult: 1.0, drop: 0.02 },
];

// 掌柜买酒配置
const MAX_DAILY_DRINKS = 10;
const DRINK_ENERGY_GAIN = 20;
const DRINK_TOKEN_COST = 1;
const MAX_ENERGY = 100;

// 更夫打工：每小时每等级基础铜钱
const GUARD_COIN_PER_HOUR_PER_LV = 150;

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function formatTime(sec: number) {
  const m = Math.floor(Math.max(0, sec) / 60).toString().padStart(2, '0');
  const s = (Math.max(0, sec) % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

// ─── 子组件：掌柜面板 ──────────────────────────────────────────────────────────
function BartenderPanel({
  gameState,
  onBuy,
  onClose,
}: {
  gameState: GameState;
  onBuy: () => void;
  onClose: () => void;
}) {
  const today = todayStr();
  const drinksToday = gameState.tavernDailyDrinks.date === today ? gameState.tavernDailyDrinks.count : 0;
  const energy = gameState.resources.rations;
  const canAfford = gameState.resources.tokens >= DRINK_TOKEN_COST;
  const notFull = energy < MAX_ENERGY;
  const notMaxed = drinksToday < MAX_DAILY_DRINKS;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50" onClick={onClose}>
      <div
        className="bg-[#1a120b] border-2 border-amber-800/60 rounded-xl p-6 w-[380px] shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 mb-4">
          <span className="text-4xl">🍺</span>
          <div>
            <h3 className="text-lg font-bold text-amber-300">掌柜老宋</h3>
            <p className="text-xs text-amber-700">"客官，来一杯？提神醒脑，行走江湖必备！"</p>
          </div>
        </div>

        {/* Energy bar */}
        <div className="mb-5">
          <div className="flex justify-between text-xs text-amber-600 mb-1">
            <span>当前精力</span>
            <span className="font-mono text-amber-300">{energy} / {MAX_ENERGY}</span>
          </div>
          <div className="w-full h-4 bg-black/50 rounded-full border border-amber-900/50 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-amber-700 to-amber-400 rounded-full transition-all"
              style={{ width: `${energy}%` }}
            />
          </div>
        </div>

        {/* Drink info */}
        <div className="bg-black/30 rounded-lg p-3 mb-5 space-y-2 text-sm">
          <div className="flex justify-between text-amber-400">
            <span>📈 效果</span>
            <span className="font-bold">+{DRINK_ENERGY_GAIN} 精力</span>
          </div>
          <div className="flex justify-between text-amber-400">
            <span>🪙 费用</span>
            <span className="font-bold">{DRINK_TOKEN_COST} 通宝</span>
          </div>
          <div className="flex justify-between text-amber-400">
            <span>🔢 今日剩余次数</span>
            <span className={`font-bold ${drinksToday >= MAX_DAILY_DRINKS ? 'text-red-400' : 'text-green-400'}`}>
              {MAX_DAILY_DRINKS - drinksToday} / {MAX_DAILY_DRINKS}
            </span>
          </div>
        </div>

        <button
          onClick={onBuy}
          disabled={!canAfford || !notFull || !notMaxed}
          className="w-full py-3 rounded-lg font-bold text-sm transition-all
            bg-amber-700 hover:bg-amber-600 text-amber-100
            disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-amber-700"
        >
          {!notFull
            ? '精力已满'
            : !notMaxed
            ? '今日已达购买上限 (10次)'
            : !canAfford
            ? `通宝不足 (需要 ${DRINK_TOKEN_COST})`
            : '买一杯烈酒！'}
        </button>

        <button onClick={onClose} className="w-full mt-2 py-2 text-xs text-amber-700 hover:text-amber-500 transition-colors">
          关闭
        </button>
      </div>
    </div>
  );
}

// ─── 子组件：更夫打工面板 ──────────────────────────────────────────────────────
function GuardPanel({
  gameState,
  onConfirm,
  onClose,
  onClaim,
}: {
  gameState: GameState;
  onConfirm: (hours: number) => void;
  onClose: () => void;
  onClaim: () => void;
}) {
  const [hours, setHours] = useState(4);
  const guardWork = gameState.activeGuardWork;
  const isWorking = !!guardWork && guardWork.endTime > Date.now();
  const isCompleted = !!guardWork && guardWork.endTime <= Date.now();

  const coinReward = Math.floor(hours * gameState.playerLevel * GUARD_COIN_PER_HOUR_PER_LV);

  const [guardTimeLeft, setGuardTimeLeft] = useState(
    guardWork ? Math.max(0, Math.ceil((guardWork.endTime - Date.now()) / 1000)) : 0
  );

  useEffect(() => {
    if (!isWorking) return;
    const iv = setInterval(() => {
      const remaining = Math.ceil((guardWork!.endTime - Date.now()) / 1000);
      setGuardTimeLeft(Math.max(0, remaining));
      if (remaining <= 0) clearInterval(iv);
    }, 1000);
    return () => clearInterval(iv);
  }, [isWorking]);

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50" onClick={onClose}>
      <div
        className="bg-[#0f1a0f] border-2 border-green-900/60 rounded-xl p-6 w-[400px] shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 mb-4">
          <span className="text-4xl">🗡️</span>
          <div>
            <h3 className="text-lg font-bold text-green-300">镖局趟子手</h3>
            <p className="text-xs text-green-700">"兄弟，要不要跟我跑一趟镖？铜钱少不了你的。"</p>
          </div>
        </div>

        {isCompleted ? (
          <div className="text-center py-6">
            <div className="text-5xl mb-3">🎉</div>
            <p className="text-green-300 font-bold text-lg mb-1">打工结束！</p>
            <p className="text-amber-400 text-sm mb-5">收获了 <span className="font-bold text-xl">{guardWork!.coinReward}</span> 铜钱</p>
            <button
              onClick={onClaim}
              className="w-full py-3 bg-green-700 hover:bg-green-600 text-white rounded-lg font-bold transition-all"
            >
              领取报酬
            </button>
          </div>
        ) : isWorking ? (
          <div className="text-center py-4">
            <div className="text-4xl mb-3 animate-pulse">⚔️</div>
            <p className="text-green-300 font-medium mb-2">正在押镖中……</p>
            <div className="font-mono text-3xl text-amber-300 mb-3">{formatTime(guardTimeLeft)}</div>
            <div className="w-full h-3 bg-black/50 rounded-full border border-green-900/50 overflow-hidden mb-4">
              <div
                className="h-full bg-green-700 rounded-full transition-all"
                style={{
                  width: `${100 - (guardTimeLeft / ((guardWork!.endTime - Date.now() + guardTimeLeft * 1000) / 1000)) * 100}%`,
                }}
              />
            </div>
            <p className="text-xs text-green-700">完成后将获得 {guardWork!.coinReward} 铜钱，期间无法接取任务</p>
          </div>
        ) : (
          <>
            <div className="mb-5">
              <div className="flex justify-between text-sm text-green-400 mb-2">
                <span>打工时长</span>
                <span className="font-bold text-green-200">{hours} 小时</span>
              </div>
              <input
                type="range"
                min={1}
                max={10}
                value={hours}
                onChange={e => setHours(Number(e.target.value))}
                className="w-full accent-green-600"
              />
              <div className="flex justify-between text-xs text-green-800 mt-1">
                <span>1h</span><span>5h</span><span>10h</span>
              </div>
            </div>

            <div className="bg-black/30 rounded-lg p-3 mb-5 text-sm">
              <div className="flex justify-between text-green-400">
                <span>💰 预期铜钱</span>
                <span className="font-bold text-amber-300">{coinReward}</span>
              </div>
              <div className="flex justify-between text-green-400 mt-1">
                <span>⏱ 消耗时间</span>
                <span>{hours} 小时</span>
              </div>
              <div className="flex justify-between text-green-600 mt-1 text-xs">
                <span>消耗精力</span>
                <span>无</span>
              </div>
            </div>

            <button
              onClick={() => onConfirm(hours)}
              disabled={!!gameState.activeMission}
              className="w-full py-3 bg-green-800 hover:bg-green-700 text-green-100 rounded-lg font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {gameState.activeMission ? '执行任务中，无法打工' : '出发押镖！'}
            </button>
          </>
        )}

        <button onClick={onClose} className="w-full mt-2 py-2 text-xs text-green-900 hover:text-green-600 transition-colors">
          关闭
        </button>
      </div>
    </div>
  );
}

// ─── 子组件：赌徒占位面板 ─────────────────────────────────────────────────────
function GamblerPanel({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50" onClick={onClose}>
      <div
        className="bg-[#1a0a1a] border-2 border-purple-900/60 rounded-xl p-6 w-[340px] shadow-2xl text-center"
        onClick={e => e.stopPropagation()}
      >
        <span className="text-5xl">🎲</span>
        <h3 className="text-lg font-bold text-purple-300 mt-3 mb-1">千王老薛</h3>
        <p className="text-xs text-purple-600 mb-4">"小子，敢不敢来一把？"</p>
        <div className="bg-purple-950/40 border border-purple-800/30 rounded-lg p-4 mb-4">
          <p className="text-purple-400 text-sm">赌博系统开发中……</p>
          <p className="text-purple-700 text-xs mt-1">（MVP 阶段暂时关闭，请期待后续版本）</p>
        </div>
        <button onClick={onClose} className="w-full py-2 text-xs text-purple-700 hover:text-purple-500 transition-colors">
          算了，改天再来
        </button>
      </div>
    </div>
  );
}

// ─── 子组件：三选一任务面板 ───────────────────────────────────────────────────
function QuestSelectPanel({
  missions,
  gameState,
  onAccept,
  onClose,
}: {
  missions: MissionData[];
  gameState: GameState;
  onAccept: (m: MissionData) => void;
  onClose: () => void;
}) {
  const energy = gameState.resources.rations;

  return (
    <div className="fixed inset-0 bg-black/75 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="bg-[#120d08] border-2 border-amber-900/50 rounded-xl shadow-2xl w-full max-w-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-3 border-b border-amber-900/30">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🏮</span>
            <div>
              <h3 className="text-base font-bold text-amber-300">江湖客带来了新消息</h3>
              <p className="text-xs text-amber-700">选择一个任务，量力而行</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm bg-black/40 px-3 py-1.5 rounded-lg border border-amber-900/30">
            <span>⚡</span>
            <span className="text-amber-400 font-mono">{energy}<span className="text-amber-700">/{MAX_ENERGY}</span></span>
          </div>
        </div>

        {/* Mission cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-5">
          {missions.map((m, i) => {
            const canAfford = energy >= m.foodCost;
            const typeColors: Record<MissionType, string> = {
              A: 'border-red-800/50 hover:border-red-600/70',
              B: 'border-amber-800/50 hover:border-amber-600/70',
              C: 'border-blue-800/50 hover:border-blue-600/70',
            };
            const typeBadge: Record<MissionType, string> = {
              A: 'bg-red-900/50 text-red-400',
              B: 'bg-amber-900/50 text-amber-400',
              C: 'bg-blue-900/50 text-blue-400',
            };
            const typeLabel: Record<MissionType, string> = {
              A: '⚔️ 高风险',
              B: '💰 高收益',
              C: '📜 低风险',
            };

            return (
              <div
                key={m.id}
                className={`bg-black/40 border-2 rounded-xl p-4 flex flex-col gap-3 transition-all
                  ${canAfford ? typeColors[m.type] + ' cursor-pointer' : 'border-gray-800/40 opacity-50 cursor-not-allowed'}`}
                onClick={() => canAfford && onAccept(m)}
              >
                {/* Badge */}
                <div className="flex justify-between items-start">
                  <span className={`text-xs px-2 py-0.5 rounded font-medium ${typeBadge[m.type]}`}>
                    {typeLabel[m.type]}
                  </span>
                  <span className="text-[10px] text-gray-600 font-mono">#{i + 1}</span>
                </div>

                {/* Name */}
                <h4 className="text-amber-200 font-bold text-sm leading-tight">{m.name}</h4>

                {/* Stats */}
                <div className="space-y-1.5 text-xs flex-1">
                  <div className="flex justify-between text-gray-400">
                    <span>⏱ 耗时</span>
                    <span className="font-mono text-gray-300">{formatTime(m.durationSec)}</span>
                  </div>
                  <div className="flex justify-between text-gray-400">
                    <span>⚡ 消耗精力</span>
                    <span className={`font-bold ${canAfford ? 'text-amber-400' : 'text-red-400'}`}>{m.foodCost}</span>
                  </div>
                  <div className="border-t border-gray-800 my-1" />
                  <div className="flex justify-between text-gray-400">
                    <span>💰 铜钱</span>
                    <span className="text-amber-300 font-medium">+{m.coinReward}</span>
                  </div>
                  <div className="flex justify-between text-gray-400">
                    <span>✨ 经验</span>
                    <span className="text-purple-300 font-medium">+{m.expReward}</span>
                  </div>
                  {m.dropRate > 0.05 && (
                    <div className="flex justify-between text-gray-400">
                      <span>🎁 掉落率</span>
                      <span className="text-green-400">{Math.round(m.dropRate * 100)}%</span>
                    </div>
                  )}
                </div>

                {/* Accept button */}
                <button
                  onClick={e => { e.stopPropagation(); if (canAfford) onAccept(m); }}
                  disabled={!canAfford}
                  className={`w-full py-2 rounded-lg text-xs font-bold transition-all
                    ${canAfford
                      ? 'bg-amber-800/60 hover:bg-amber-700 text-amber-200'
                      : 'bg-gray-900 text-gray-600 cursor-not-allowed'}`}
                >
                  {canAfford ? '接受任务' : '精力不足'}
                </button>
              </div>
            );
          })}
        </div>

        <div className="px-6 pb-5">
          <button onClick={onClose} className="w-full py-2 text-xs text-amber-900 hover:text-amber-600 transition-colors">
            暂不接取，先逛逛
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── 子组件：任务奖励结算 Modal ─────────────────────────────────────────────────
function QuestRewardModal({
  reward,
  onConfirm,
}: {
  reward: QuestRewardInfo;
  onConfirm: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
      <div className="bg-[#120d08] border-2 border-amber-700/60 rounded-xl p-7 w-[360px] shadow-2xl text-center">
        <div className="text-5xl mb-3">{reward.droppedItemName ? '🎊' : '🏆'}</div>
        <h3 className="text-lg font-bold text-amber-300 mb-1">任务完成！</h3>
        <p className="text-sm text-amber-600 mb-5">【{reward.missionName}】</p>

        <div className="bg-black/40 rounded-xl p-4 mb-5 space-y-2 text-sm border border-amber-900/30">
          <div className="flex justify-between text-amber-400">
            <span>💰 铜钱</span>
            <span className="font-bold text-amber-200">+{reward.coinReward}</span>
          </div>
          <div className="flex justify-between text-purple-400">
            <span>✨ 经验</span>
            <span className="font-bold text-purple-200">+{reward.expReward}</span>
          </div>
          {reward.droppedItemName && (
            <div className="flex justify-between text-green-400 pt-2 border-t border-amber-900/20">
              <span>🎁 意外收获</span>
              <span className="font-bold text-green-200">【{reward.droppedItemName}】</span>
            </div>
          )}
        </div>

        {reward.didLevelUp && (
          <div className="bg-yellow-900/30 border border-yellow-700/40 rounded-lg px-4 py-2 mb-4 text-yellow-300 text-sm font-bold">
            🌟 恭喜升级！你现在是 Lv.{reward.newLevel}
          </div>
        )}

        <button
          onClick={onConfirm}
          className="w-full py-3 bg-amber-700 hover:bg-amber-600 text-amber-100 rounded-lg font-bold transition-all"
        >
          收下，继续江湖路
        </button>
      </div>
    </div>
  );
}

// ─── 主组件：客栈大厅 ─────────────────────────────────────────────────────────
export function Tavern({ gameState, setGameState }: TavernProps) {
  const { dispatchAction } = useAction(setGameState as any);
  const [scene, setScene] = useState<TavernScene>(() =>
    gameState.activeMission ? 'travel' : 'hall'
  );
  
  const [timeLeft, setTimeLeft] = useState(0);
  const [rewardInfo, setRewardInfo] = useState<QuestRewardInfo | null>(null);
  const [levelUpShow, setLevelUpShow] = useState<number | null>(null);

  // Panel visibility
  const [showBartender, setShowBartender] = useState(false);
  const [showGuard, setShowGuard] = useState(false);
  const [showGambler, setShowGambler] = useState(false);

  const gameStateRef = useRef(gameState);
  useEffect(() => { gameStateRef.current = gameState; }, [gameState]);

  // ── 任务倒计时 ─────────────────────────────────────────────────────────────
  useEffect(() => {
    let iv: ReturnType<typeof setInterval>;
    if (gameState.activeMission) {
      setScene('travel');
      const tick = () => {
        const remaining = Math.ceil((gameState.activeMission!.endTime - Date.now()) / 1000);
        if (remaining <= 0) {
          setTimeLeft(0);
          handleMissionComplete(gameState.activeMission!);
          clearInterval(iv);
        } else {
          setTimeLeft(remaining);
        }
      };
      tick();
      iv = setInterval(tick, 1000);
    } else if (scene === 'travel') {
      // activeMission just cleared, go back to hall
      setScene('hall');
    }
    return () => clearInterval(iv);
  }, [gameState.activeMission]);

  // ── 生成三选一任务 ─────────────────────────────────────────────────────────
  const generateMissions = () => {
    const s = gameStateRef.current;
    const baseXp = XP_TABLE[s.playerLevel] ?? 400;
    const baseCoin = s.playerLevel * 50;
    const newMissions: MissionData[] = [];

    // 保证3个任务类型各不同（或随机但不完全重复）
    const shuffled = [...MISSION_TEMPLATES].sort(() => Math.random() - 0.5);
    for (let i = 0; i < 3; i++) {
      const tpl = shuffled[i] ?? MISSION_TEMPLATES[i];
      const name = tpl.names[Math.floor(Math.random() * tpl.names.length)];
      const durationSec = Math.floor(Math.random() * (tpl.maxT - tpl.minT + 1) + tpl.minT);
      const foodCost = Math.floor(Math.random() * (tpl.maxF - tpl.minF + 1) + tpl.minF);
      const f = 0.9 + Math.random() * 0.2;
      const expReward = Math.floor(baseXp * tpl.expMult * f * 0.15);
      const coinReward = Math.floor(baseCoin * tpl.coinMult * f);
      newMissions.push({ id: `m_${Date.now()}_${i}`, type: tpl.type, name, durationSec, foodCost, expReward, coinReward, dropRate: tpl.drop });
    }
    setMissions(newMissions);
  };

  const openQuestPanel = async () => {
    if (gameState.availableMissions.length === 0) {
      await dispatchAction('GENERATE_MISSIONS');
    }
    setScene('quest-select');
  };

  // ── 接受任务 ──────────────────────────────────────────────────────────────
  const handleAccept = async (mission: MissionData) => {
    const ok = await dispatchAction('START_MISSION', { missionId: mission.id });
    if (ok) setScene('travel');
  };

  // ── 任务结算 ──────────────────────────────────────────────────────────────
  const handleMissionComplete = async (_mission: ActiveMission, forceDrop = false) => {
    const res = await dispatchAction('COMPLETE_MISSION', { forceDrop });
    if (res && res.data) {
      setRewardInfo(res.data);
      setScene('reward');
    } else {
      setScene('hall');
    }
  };

  const handleRewardConfirm = async () => {
    if (rewardInfo?.didLevelUp && rewardInfo.newLevel) {
      setLevelUpShow(rewardInfo.newLevel);
    }
    setRewardInfo(null);
    await dispatchAction('GENERATE_MISSIONS');
    setScene('hall');
  };

  // ── 取消任务 ──────────────────────────────────────────────────────────────
  const handleCancelMission = () => {
    if (!gameState.activeMission) return;
    if (!confirm('放弃当前任务？不会扣除精力，但本次没有任何收益。')) return;
    setGameState(prev => {
      if (!prev.activeMission) return prev;
      // Refund rations
      const refunded = Math.min(prev.activeMission.foodCost, MAX_ENERGY - prev.resources.rations);
      const newState = {
        ...prev,
        activeMission: null,
        resources: { ...prev.resources, rations: prev.resources.rations + refunded },
      };
      saveGameState(newState);
      return newState;
    });
    setScene('hall');
  };

  // ── 跳过（通宝） ──────────────────────────────────────────────────────────
  const handleSkipWithToken = () => {
    if (!gameState.activeMission) return;
    if (gameState.resources.tokens < 1) { alert('通宝不足！'); return; }
    setGameState(prev => {
      const newState = { ...prev, resources: { ...prev.resources, tokens: prev.resources.tokens - 1 } };
      saveGameState(newState);
      return newState;
    });
    handleMissionComplete(gameState.activeMission, true);
  };

  // ── 跳过（沙漏） ──────────────────────────────────────────────────────────
  const handleSkipWithHourglass = () => {
    if (!gameState.activeMission) return;
    if (gameState.resources.hourglasses < 1) { alert('沙漏不足！'); return; }
    setGameState(prev => {
      if (!prev.activeMission) return prev;
      const newEndTime = Math.max(Date.now(), prev.activeMission.endTime - 600_000);
      const newState = {
        ...prev,
        activeMission: { ...prev.activeMission, endTime: newEndTime },
        resources: { ...prev.resources, hourglasses: prev.resources.hourglasses - 1 },
      };
      saveGameState(newState);
      return newState;
    });
  };

  // ── 掌柜买酒 ──────────────────────────────────────────────────────────────
  const handleBuyDrink = async () => {
    await dispatchAction('TAVERN_DRINK');
  };

  // ── 更夫开始打工 ──────────────────────────────────────────────────────────
  const handleGuardConfirm = (hours: number) => {
    const coinReward = Math.floor(hours * gameState.playerLevel * GUARD_COIN_PER_HOUR_PER_LV);
    setGameState(prev => {
      const newState = {
        ...prev,
        activeGuardWork: { endTime: Date.now() + hours * 3_600_000, coinReward },
      };
      saveGameState(newState);
      return newState;
    });
    setShowGuard(false);
  };

  // ── 更夫领取报酬 ──────────────────────────────────────────────────────────
  const handleGuardClaim = () => {
    if (!gameState.activeGuardWork) return;
    const reward = gameState.activeGuardWork.coinReward;
    setGameState(prev => {
      const newState = {
        ...prev,
        activeGuardWork: null,
        resources: { ...prev.resources, copper: prev.resources.copper + (prev.activeGuardWork?.coinReward ?? 0) },
      };
      saveGameState(newState);
      return newState;
    });
    setShowGuard(false);
    alert(`押镖归来！获得了 ${reward} 铜钱。`);
  };

  // ── 渲染：赶路/执行任务视图 ───────────────────────────────────────────────
  if (scene === 'travel' && gameState.activeMission) {
    const mission = gameState.activeMission;
    const progress = Math.max(0, Math.min(100, ((mission.durationSec - timeLeft) / mission.durationSec) * 100));

    return (
      <>
        {levelUpShow !== null && (
          <LevelUpModal newLevel={levelUpShow} onClose={() => setLevelUpShow(null)} />
        )}
        {/* 赶路主画面 */}
        <div className="w-full h-full flex flex-col" style={{ background: 'linear-gradient(180deg, #0a1628 0%, #1a2d1a 60%, #0d1a0d 100%)' }}>
          {/* 顶部任务信息栏 */}
          <div className="flex items-center justify-between px-8 pt-6 pb-4">
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-widest mb-0.5">当前任务</p>
              <h2 className="text-xl font-bold text-amber-300">【{mission.name}】</h2>
            </div>
            <div className="flex gap-4 text-sm">
              <div className="bg-black/40 px-3 py-1.5 rounded-lg border border-amber-900/30 text-amber-400">
                💰 +{mission.coinReward}
              </div>
              <div className="bg-black/40 px-3 py-1.5 rounded-lg border border-purple-900/30 text-purple-400">
                ✨ +{mission.expReward}
              </div>
            </div>
          </div>

          {/* 行走动画区 */}
          <div className="flex-1 flex flex-col items-center justify-center gap-6 px-8">
            {/* 背景装饰：模拟滚动地面线 */}
            <div className="w-full max-w-2xl relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-dashed border-gray-700/50"></div>
              </div>
              {/* 场景装饰元素 */}
              <div className="relative flex justify-around items-end py-8 text-4xl opacity-30 select-none">
                <span>🌲</span><span>🪨</span><span>🌿</span><span>🌲</span><span>🌾</span>
              </div>
            </div>

            {/* 角色行走动画 */}
            <div className="text-center">
              <div
                className="text-6xl select-none"
                style={{ animation: 'bounce 0.6s ease-in-out infinite alternate' }}
              >
                🏃
              </div>
              <p className="text-gray-500 text-sm mt-3 tracking-wider">赶路中……</p>
            </div>
          </div>

          {/* 底部进度条区域 */}
          <div className="px-6 pb-8">
            {/* 大进度条 */}
            <div className="w-full bg-black/60 rounded-2xl border-2 border-amber-900/40 overflow-hidden mb-2 shadow-2xl">
              <div className="relative h-14 flex items-center">
                {/* 填充条 */}
                <div
                  className="absolute left-0 top-0 h-full rounded-2xl transition-all duration-1000 ease-linear"
                  style={{
                    width: `${progress}%`,
                    background: 'linear-gradient(90deg, #78350f, #d97706, #fbbf24)',
                  }}
                />
                {/* 倒计时文字 */}
                <div className="relative w-full text-center">
                  <span className="font-mono text-2xl font-bold text-white drop-shadow-lg tracking-widest">
                    {formatTime(timeLeft)}
                  </span>
                </div>
              </div>
            </div>

            {/* 操作按钮行 */}
            <div className="flex justify-between items-center gap-4 mt-3">
              {/* 取消按钮 */}
              <button
                onClick={handleCancelMission}
                className="flex items-center gap-2 px-5 py-2.5 bg-gray-900/80 border border-gray-700 hover:border-red-700/60 hover:text-red-400 text-gray-400 rounded-xl text-sm font-medium transition-all"
              >
                <span>✕</span> 放弃任务
              </button>

              {/* 跳过按钮组 */}
              <div className="flex gap-3">
                <button
                  onClick={handleSkipWithHourglass}
                  disabled={gameState.resources.hourglasses < 1}
                  className="flex items-center gap-2 px-4 py-2.5 bg-cyan-950/60 border border-cyan-800/50 hover:border-cyan-600 hover:bg-cyan-900/60 text-cyan-400 disabled:opacity-30 disabled:cursor-not-allowed rounded-xl text-sm font-medium transition-all"
                >
                  ⏳ -10min <span className="text-xs opacity-70">({gameState.resources.hourglasses})</span>
                </button>
                <button
                  onClick={handleSkipWithToken}
                  disabled={gameState.resources.tokens < 1}
                  className="flex items-center gap-2 px-5 py-2.5 bg-purple-950/60 border border-purple-800/50 hover:border-purple-600 hover:bg-purple-900/60 text-purple-300 disabled:opacity-30 disabled:cursor-not-allowed rounded-xl text-sm font-bold transition-all"
                >
                  ⚡ 立即完成 <span className="text-xs opacity-70 font-normal">1🪙</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* CSS animation keyframes via style tag */}
        <style>{`
          @keyframes bounce {
            from { transform: translateY(0px); }
            to   { transform: translateY(-8px); }
          }
        `}</style>
      </>
    );
  }

  // ── 渲染：奖励结算 ────────────────────────────────────────────────────────
  if (scene === 'reward' && rewardInfo) {
    return (
      <>
        {levelUpShow !== null && <LevelUpModal newLevel={levelUpShow} onClose={() => setLevelUpShow(null)} />}
        <QuestRewardModal reward={rewardInfo} onConfirm={handleRewardConfirm} />
        {/* 暗淡背景 */}
        <div className="w-full h-full" style={{ background: 'linear-gradient(180deg, #0a1628 0%, #1a2d1a 100%)' }} />
      </>
    );
  }

  // ── 渲染：客栈大厅 ────────────────────────────────────────────────────────
  const energy = gameState.resources.rations;
  const today = todayStr();
  const drinksToday = gameState.tavernDailyDrinks.date === today ? gameState.tavernDailyDrinks.count : 0;
  const guardWork = gameState.activeGuardWork;
  const guardWorkDone = guardWork && guardWork.endTime <= Date.now();
  const guardWorkActive = guardWork && guardWork.endTime > Date.now();

  return (
    <>
      {levelUpShow !== null && <LevelUpModal newLevel={levelUpShow} onClose={() => setLevelUpShow(null)} />}

      {/* 各种弹出面板 */}
      {showBartender && (
        <BartenderPanel gameState={gameState} onBuy={handleBuyDrink} onClose={() => setShowBartender(false)} />
      )}
      {showGuard && (
        <GuardPanel
          gameState={gameState}
          onConfirm={handleGuardConfirm}
          onClose={() => setShowGuard(false)}
          onClaim={handleGuardClaim}
        />
      )}
      {showGambler && <GamblerPanel onClose={() => setShowGambler(false)} />}
      {scene === 'quest-select' && (
        <QuestSelectPanel
          missions={gameState.availableMissions}
          gameState={gameState}
          onAccept={mission => { handleAccept(mission); }}
          onClose={() => { setScene('hall'); }}
        />
      )}

      {/* 客栈主视图 */}
      <div className="w-full h-full flex flex-col overflow-hidden" style={{ background: 'linear-gradient(180deg, #120a04 0%, #1c1108 100%)' }}>

        {/* ── 顶部资源栏 ── */}
        <div className="flex items-center gap-4 px-6 pt-4 pb-3 border-b border-amber-900/20 flex-shrink-0">
          {/* 精力条 */}
          <div className="flex items-center gap-2 flex-1 max-w-xs">
            <span className="text-amber-400 text-sm shrink-0">⚡ 精力</span>
            <div className="flex-1 h-4 bg-black/50 rounded-full border border-amber-900/40 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${energy}%`,
                  background: energy > 60 ? 'linear-gradient(90deg,#78350f,#f59e0b)' : energy > 30 ? 'linear-gradient(90deg,#92400e,#dc2626)' : 'linear-gradient(90deg,#7f1d1d,#dc2626)',
                }}
              />
            </div>
            <span className="font-mono text-sm text-amber-300 shrink-0">{energy}<span className="text-amber-700">/{MAX_ENERGY}</span></span>
          </div>

          <div className="flex gap-3 ml-auto text-sm">
            <div className="flex items-center gap-1 bg-black/40 px-3 py-1 rounded-lg border border-amber-900/30">
              <span>💰</span>
              <span className="text-amber-300 font-mono">{gameState.resources.copper.toLocaleString()}</span>
            </div>
            <div className="flex items-center gap-1 bg-black/40 px-3 py-1 rounded-lg border border-purple-900/30">
              <span>🪙</span>
              <span className="text-purple-300 font-mono">{gameState.resources.tokens}</span>
            </div>
            <div className="flex items-center gap-1 bg-black/40 px-3 py-1 rounded-lg border border-cyan-900/30">
              <span>⏳</span>
              <span className="text-cyan-300 font-mono">{gameState.resources.hourglasses}</span>
            </div>
          </div>
        </div>

        {/* ── 客栈标题 ── */}
        <div className="px-6 pt-4 pb-2 flex-shrink-0">
          <h2 className="text-xl font-bold text-amber-200 tracking-wide">🏮 客栈 · 密谋据点</h2>
          <p className="text-xs text-amber-800 mt-0.5">江湖险恶，这里是你落脚的地方。</p>
        </div>

        {/* ── 客栈大厅 NPC 区域 ── */}
        <div className="flex-1 overflow-y-auto px-6 pb-8 pt-2">

          {/* 打工完成提示 */}
          {guardWorkDone && (
            <div
              className="mb-4 flex items-center justify-between bg-green-950/60 border border-green-700/50 rounded-xl px-5 py-3 cursor-pointer hover:border-green-500/70 transition-all"
              onClick={() => setShowGuard(true)}
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">💼</span>
                <div>
                  <p className="text-green-300 font-bold text-sm">押镖归来！点击领取报酬</p>
                  <p className="text-green-700 text-xs">获得 {guardWork!.coinReward} 铜钱</p>
                </div>
              </div>
              <span className="text-green-400 text-lg">→</span>
            </div>
          )}

          {/* 打工中提示 */}
          {guardWorkActive && (
            <div
              className="mb-4 flex items-center justify-between bg-blue-950/40 border border-blue-800/40 rounded-xl px-5 py-3 cursor-pointer hover:border-blue-600/60 transition-all"
              onClick={() => setShowGuard(true)}
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl animate-pulse">⚔️</span>
                <div>
                  <p className="text-blue-300 font-bold text-sm">正在押镖中……</p>
                  <p className="text-blue-700 text-xs">{formatTime(Math.ceil((guardWork!.endTime - Date.now()) / 1000))} 后归来</p>
                </div>
              </div>
              <span className="text-blue-400 text-sm">查看</span>
            </div>
          )}

          {/* NPC 网格 */}
          <div className="grid grid-cols-2 gap-4">

            {/* 掌柜 */}
            <button
              onClick={() => setShowBartender(true)}
              className="relative group bg-[#1c130a] border-2 border-amber-900/40 hover:border-amber-700/70 rounded-2xl p-5 text-left transition-all hover:shadow-[0_0_20px_rgba(180,90,0,0.2)] active:scale-[0.98]"
            >
              <div className="absolute top-3 right-3 text-xs bg-amber-900/40 text-amber-500 px-2 py-0.5 rounded-full font-medium">
                吧台
              </div>
              <div className="text-5xl mb-3 group-hover:scale-110 transition-transform">🍺</div>
              <h3 className="text-amber-300 font-bold text-base mb-1">掌柜老宋</h3>
              <p className="text-amber-800 text-xs leading-relaxed">花 1 通宝买杯烈酒，恢复 {DRINK_ENERGY_GAIN} 点精力。今日剩余次数：<span className="text-amber-500">{MAX_DAILY_DRINKS - drinksToday}/{MAX_DAILY_DRINKS}</span></p>
              <div className="mt-3 w-full h-1.5 bg-black/50 rounded-full overflow-hidden">
                <div className="h-full bg-amber-700 rounded-full" style={{ width: `${energy}%` }} />
              </div>
            </button>

            {/* 江湖客（任务入口） */}
            <button
              onClick={openQuestPanel}
              disabled={!!gameState.activeMission}
              className="relative group bg-[#100d1a] border-2 border-violet-900/40 hover:border-violet-700/70 rounded-2xl p-5 text-left transition-all hover:shadow-[0_0_20px_rgba(120,60,200,0.2)] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="absolute top-3 right-3 text-xs bg-violet-900/40 text-violet-500 px-2 py-0.5 rounded-full font-medium">
                内堂桌
              </div>
              <div className="text-5xl mb-3 group-hover:scale-110 transition-transform">🏮</div>

              {gameState.activeMission ? (
                <>
                  <h3 className="text-violet-300 font-bold text-base mb-1">江湖客</h3>
                  <p className="text-violet-800 text-xs leading-relaxed">你手头有任务未完成，先把它做完吧。</p>
                </>
              ) : (
                <>
                  <h3 className="text-violet-300 font-bold text-base mb-1">江湖客</h3>
                  <p className="text-violet-800 text-xs leading-relaxed">神秘来客带来了新消息，有三条路摆在你面前……</p>
                  <div className="mt-3 inline-flex items-center gap-1 text-xs text-violet-500 bg-violet-950/50 px-2 py-1 rounded-full">
                    <span>三选一任务</span>
                  </div>
                </>
              )}
            </button>

            {/* 更夫/镖局 */}
            <button
              onClick={() => setShowGuard(true)}
              className="relative group bg-[#0a130a] border-2 border-green-900/40 hover:border-green-700/70 rounded-2xl p-5 text-left transition-all hover:shadow-[0_0_20px_rgba(30,120,30,0.2)] active:scale-[0.98]"
            >
              <div className="absolute top-3 right-3 text-xs bg-green-900/40 text-green-600 px-2 py-0.5 rounded-full font-medium">
                门口
              </div>
              <div className="text-5xl mb-3 group-hover:scale-110 transition-transform">🗡️</div>
              <h3 className="text-green-300 font-bold text-base mb-1">镖局趟子手</h3>
              {guardWorkActive ? (
                <p className="text-green-800 text-xs">押镖途中，{formatTime(Math.ceil((guardWork!.endTime - Date.now()) / 1000))} 后归来</p>
              ) : guardWorkDone ? (
                <p className="text-green-400 text-xs font-bold animate-pulse">押镖已完成！点击领取</p>
              ) : (
                <p className="text-green-800 text-xs leading-relaxed">不消耗精力，只需现实时间。跑镖赚铜钱，1~10小时可选。</p>
              )}
            </button>

            {/* 赌徒（TBD） */}
            <button
              onClick={() => setShowGambler(true)}
              className="relative group bg-[#150a15] border-2 border-purple-900/30 hover:border-purple-700/50 rounded-2xl p-5 text-left transition-all hover:shadow-[0_0_20px_rgba(100,20,120,0.15)] active:scale-[0.98] opacity-70"
            >
              <div className="absolute top-3 right-3 text-xs bg-purple-900/30 text-purple-700 px-2 py-0.5 rounded-full font-medium">
                暗处角落
              </div>
              <div className="text-5xl mb-3 group-hover:scale-110 transition-transform grayscale group-hover:grayscale-0">🎲</div>
              <h3 className="text-purple-400 font-bold text-base mb-1">千王老薛</h3>
              <p className="text-purple-900 text-xs leading-relaxed">在阴暗处玩着三仙归洞……</p>
              <div className="mt-3 inline-flex items-center gap-1 text-xs text-purple-800 bg-purple-950/30 px-2 py-1 rounded-full">
                敬请期待
              </div>
            </button>
          </div>

          {/* 底部说明 */}
          <div className="mt-6 flex items-start gap-3 bg-black/20 p-4 rounded-xl text-xs text-amber-900 border border-amber-900/20">
            <span className="shrink-0 mt-0.5">ℹ️</span>
            <p>精力每 10 分钟自然恢复 1 点（上限 100）。即使关闭浏览器，任务和打工的倒计时也会在后台准确运行。</p>
          </div>
        </div>
      </div>
    </>
  );
}
