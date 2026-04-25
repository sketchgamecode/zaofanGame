import { Zap } from 'lucide-react';

interface LevelUpModalProps {
  newLevel: number;
  onClose: () => void;
}

export function LevelUpModal({ newLevel, onClose }: LevelUpModalProps) {
  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/70 backdrop-blur-sm anim-fade-in">
      <div className="relative flex flex-col items-center text-center bg-[#0d0d0d] border-2 border-yellow-500/60 rounded-2xl px-14 py-12 shadow-[0_0_80px_rgba(234,179,8,0.25)] max-w-sm w-full mx-4 anim-fade-in">
        {/* Glow ring */}
        <div className="absolute inset-0 rounded-2xl pointer-events-none overflow-hidden">
          <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-48 h-48 bg-yellow-500/10 rounded-full blur-3xl" />
        </div>

        {/* Stars */}
        <div className="flex gap-1 mb-4 text-2xl select-none">
          <span>⭐</span><span>⭐</span><span>⭐</span>
        </div>

        {/* Main title */}
        <div className="flex items-center gap-3 mb-2">
          <Zap className="text-yellow-400 w-7 h-7" />
          <h2 className="text-4xl font-black tracking-[0.25em] text-yellow-400 drop-shadow-[0_0_12px_rgba(234,179,8,0.6)]">
            LEVEL UP
          </h2>
          <Zap className="text-yellow-400 w-7 h-7" />
        </div>

        {/* Sub title */}
        <p className="text-sm text-yellow-300/70 tracking-widest mb-6 font-mono">
          恭喜少侠修为精进
        </p>

        {/* Level badge */}
        <div className="w-28 h-28 rounded-full border-4 border-yellow-500 bg-yellow-500/10 flex flex-col items-center justify-center mb-6 shadow-[0_0_30px_rgba(234,179,8,0.4)]">
          <span className="text-xs text-yellow-600 font-mono tracking-widest">LEVEL</span>
          <span className="text-5xl font-black text-yellow-400 leading-none">{newLevel}</span>
        </div>

        {/* Subtitle */}
        <p className="text-textMuted text-sm tracking-wide mb-8">
          已达到 <span className="text-yellow-300 font-bold">Lv.{newLevel}</span>，实力大增！
        </p>

        <button
          onClick={onClose}
          className="px-12 py-3 bg-yellow-500/20 text-yellow-300 border border-yellow-500/50 hover:bg-yellow-500 hover:text-black font-bold rounded-lg transition-all tracking-widest text-sm"
        >
          继  续
        </button>
      </div>
    </div>
  );
}
