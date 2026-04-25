import { type GameState } from '../core/gameState';
import { CLASS_CONFIG } from '../core/mathCore';
import { XP_TABLE, MAX_LEVEL } from '../data/xpTable';
import { AttributeUpgrade } from './AttributeUpgrade';
import { Inventory } from './Inventory';
import { Coins, Star, Activity, Sword, CircleDollarSign, Hourglass } from 'lucide-react';


interface CharacterPanelProps {
  gameState: GameState;
  setGameState: React.Dispatch<React.SetStateAction<GameState>>;
}

export function CharacterPanel({ gameState, setGameState }: CharacterPanelProps) {
  const { playerLevel, resources } = gameState;

  const currentExp = gameState.exp ?? 0;
  const expNeeded = XP_TABLE[playerLevel] ?? 0;
  const isMaxLevel = playerLevel >= MAX_LEVEL;
  const expPct = isMaxLevel ? 100 : Math.min(100, expNeeded > 0 ? (currentExp / expNeeded) * 100 : 0);

  return (
    <div className="w-full max-w-4xl mx-auto py-8 px-6">
      {/* Top Section: Avatar & Base Info */}
      <div className="flex flex-col md:flex-row gap-6 bg-darkSurface p-6 rounded-lg border border-darkBorder shadow-lg">
        {/* Avatar Placeholder */}
        <div className="w-32 h-32 shrink-0 rounded-lg bg-darkBg border border-darkBorder flex items-center justify-center shadow-inner relative overflow-hidden group">
          <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <span className="text-textMuted font-medium tracking-widest">【无名氏】</span>
        </div>

        {/* Info Area */}
        <div className="flex-1 flex flex-col justify-center">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-2xl font-bold text-textMain tracking-wide flex items-baseline gap-2">
              无名好汉
              <span className="text-xs font-normal text-textMuted px-2 py-0.5 border border-darkBorder rounded bg-darkBg">{CLASS_CONFIG[gameState.classId].name}</span>
            </h2>
            <span className="px-3 py-1 bg-primary/20 text-primary text-sm font-bold rounded-full border border-primary/30 shadow-sm">
              Lv. {playerLevel}
            </span>
          </div>

          {/* XP Progress Bar */}
          <div className="mb-4">
            <div className="w-full h-2 bg-black/60 rounded-full overflow-hidden border border-white/5">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${expPct}%`, backgroundColor: '#b02a2a' }}
              />
            </div>
            <p className="text-xs text-textMuted font-mono mt-1">
              {isMaxLevel
                ? '已达满级'
                : `经验 ${currentExp.toLocaleString()} / ${expNeeded.toLocaleString()}`}
            </p>
          </div>

          <p className="text-sm text-textMuted mb-4 italic">暂无名号，图谋造反之辈。常于黑夜客栈出没。</p>

          <div className="flex flex-wrap gap-4 md:gap-6">
            <div className="flex items-center gap-2 bg-darkBg px-4 py-2 rounded-md border border-darkBorder shadow-sm">
              <Coins size={16} className="text-amber-500" />
              <span className="text-sm text-textMuted">铜钱</span>
              <span className="font-bold text-amber-500 ml-1">{resources.copper}</span>
            </div>

            <div className="flex items-center gap-2 bg-darkBg px-4 py-2 rounded-md border border-darkBorder shadow-sm">
              <Star size={16} className="text-blue-400" />
              <span className="text-sm text-textMuted">声望</span>
              <span className="font-bold text-blue-400 ml-1">{resources.prestige}</span>
            </div>

            <div className="flex items-center gap-2 bg-darkBg px-4 py-2 rounded-md border border-darkBorder shadow-sm">
              <Activity size={16} className="text-emerald-500" />
              <span className="text-sm text-textMuted">干粮</span>
              <span className="font-bold text-emerald-500 ml-1">{resources.rations}<span className="text-textMuted text-xs font-normal">/100</span></span>
              <span className="text-textMuted/50 text-[10px] font-mono ml-1">+1/10min</span>
            </div>

            <div className="flex items-center gap-2 bg-darkBg px-4 py-2 rounded-md border border-darkBorder shadow-sm">
              <Sword size={16} className="text-red-400" />
              <span className="text-sm text-textMuted">竞技场胜场</span>
              <span className="font-bold text-red-400 ml-1">{gameState.arenaWins ?? 0}</span>
            </div>

            <div className="flex items-center gap-2 bg-darkBg px-4 py-2 rounded-md border border-darkBorder shadow-sm">
              <CircleDollarSign size={16} className="text-purple-400" />
              <span className="text-sm text-textMuted">通宝</span>
              <span className="font-bold text-purple-400 ml-1">{resources.tokens}</span>
            </div>

            <div className="flex items-center gap-2 bg-darkBg px-4 py-2 rounded-md border border-darkBorder shadow-sm">
              <Hourglass size={16} className="text-cyan-400" />
              <span className="text-sm text-textMuted">沙漏</span>
              <span className="font-bold text-cyan-400 ml-1">{resources.hourglasses}</span>
            </div>
          </div>
        </div>
      </div>

      <AttributeUpgrade gameState={gameState} setGameState={setGameState} />
      <Inventory gameState={gameState} setGameState={setGameState} />
    </div>
  );
}
