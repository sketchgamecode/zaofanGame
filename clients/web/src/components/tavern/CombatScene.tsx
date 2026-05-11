import React, { useEffect } from 'react';

type CombatSceneProps = {
  onAnimationEnd: () => void;
};

export const CombatScene: React.FC<CombatSceneProps> = ({ onAnimationEnd }) => {
  // 简易战斗演出：2秒后自动调用结算
  useEffect(() => {
    const timer = setTimeout(() => {
      onAnimationEnd();
    }, 2000);
    return () => clearTimeout(timer);
  }, [onAnimationEnd]);

  return (
    <div className="absolute inset-0 w-full h-full bg-[#111] flex flex-col items-center justify-center overflow-hidden z-40">
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-30" />
      
      <div className="relative z-10 flex flex-col items-center animate-pulse">
        <h2 className="text-5xl font-black text-red-600 tracking-widest uppercase mb-4 drop-shadow-[0_0_20px_rgba(220,38,38,0.8)]">
          COMBAT IN PROGRESS
        </h2>
        <div className="flex items-center gap-8 text-6xl">
          <span className="animate-bounce inline-block">⚔️</span>
          <span className="animate-bounce inline-block delay-100">🛡️</span>
          <span className="animate-bounce inline-block delay-200">🔥</span>
        </div>
        <p className="mt-8 text-stone-500 font-mono tracking-widest text-sm">
          (战斗表现层正在加载占位符，即将进入结算...)
        </p>
      </div>

      {/* Screen flash effect */}
      <div className="absolute inset-0 bg-red-500/20 mix-blend-screen animate-pulse pointer-events-none" />
    </div>
  );
};
