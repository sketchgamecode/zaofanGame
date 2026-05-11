import React from 'react';
import type { ActiveMissionView } from '../../types/tavern';
import { useCharacter } from '../../hooks/useCharacter';

type AdventureSceneProps = {
  mission: ActiveMissionView;
  displayRemainingSec: number;
  canComplete: boolean;
  onComplete: () => void;
  onSkip: () => void;
  skipPending: boolean;
  completePending: boolean;
};

export const AdventureScene: React.FC<AdventureSceneProps> = ({
  mission,
  displayRemainingSec,
  canComplete,
  onComplete,
  onSkip,
  skipPending,
  completePending
}) => {
  const { character } = useCharacter();

  const mm = Math.floor(displayRemainingSec / 60).toString().padStart(2, '0');
  const ss = (displayRemainingSec % 60).toString().padStart(2, '0');
  
  // Calculate progress percentage
  const totalDuration = mission.actualDurationSec;
  const progressPercent = Math.max(0, Math.min(100, ((totalDuration - displayRemainingSec) / totalDuration) * 100));

  return (
    <div className="absolute inset-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')] bg-[#2a2d34] flex flex-col items-center justify-between overflow-hidden">
      
      {/* Fake Background Landscape */}
      <div className="absolute inset-0 pointer-events-none opacity-40">
         <img src="/assets/ui/bg_landscape_placeholder.jpg" alt="Landscape" className="w-full h-full object-cover" onError={e => e.currentTarget.style.display='none'} />
         {/* Simple CSS gradient sky */}
         <div className="absolute inset-0 bg-gradient-to-b from-amber-900/40 via-transparent to-[#2a2d34]" />
      </div>

      {/* Top Mission Info */}
      <div className="relative mt-8 text-center z-10 px-8 py-4 bg-black/40 backdrop-blur rounded-2xl border border-stone-700/50 shadow-xl">
        <h2 className="text-3xl font-black text-amber-500 tracking-widest uppercase drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
          {mission.title}
        </h2>
        <p className="text-stone-300 mt-2 italic max-w-lg mx-auto">
          {mission.description}
        </p>
      </div>

      {/* Character vs Enemy Stand */}
      <div className="relative w-full flex-1 flex items-center justify-between px-24 z-10">
        
        {/* Player Left */}
        <div className="flex flex-col items-center gap-4">
           <div className="w-48 h-48 bg-stone-900 border-4 border-stone-800 rounded-2xl shadow-2xl overflow-hidden relative group">
             <img src="/assets/npcs/npc_wizard.png" alt="Player" className="h-[120%] object-cover opacity-90" onError={e => e.currentTarget.style.display='none'}/>
             <div className="absolute bottom-0 inset-x-0 bg-black/80 py-1 text-center font-black text-amber-500 text-sm tracking-wider">
               {character?.player.displayName || 'HERO'}
             </div>
           </div>
           {/* Player HP bar placeholder */}
           <div className="w-48 h-6 bg-red-950 rounded border-2 border-red-900 overflow-hidden relative">
             <div className="absolute inset-y-0 left-0 bg-gradient-to-b from-red-500 to-red-700 w-full" />
             <span className="absolute inset-0 flex items-center justify-center text-[10px] font-black text-white drop-shadow-md">
               {character?.player.health || 100} / {character?.player.health || 100}
             </span>
           </div>
        </div>

        {/* VS text */}
        <div className="text-6xl font-black text-red-600/50 italic pointer-events-none drop-shadow-[0_0_20px_rgba(220,38,38,0.5)]">
          VS
        </div>

        {/* Enemy Right */}
        <div className="flex flex-col items-center gap-4">
           <div className="w-48 h-48 bg-stone-900 border-4 border-stone-800 rounded-2xl shadow-2xl overflow-hidden relative">
             <img src="/assets/npcs/npc_orc.png" alt="Enemy" className="h-[120%] object-cover opacity-90 scale-x-[-1]" onError={e => e.currentTarget.style.display='none'}/>
             <div className="absolute bottom-0 inset-x-0 bg-black/80 py-1 text-center font-black text-red-500 text-sm tracking-wider">
               {mission.enemyPreview?.name || 'MONSTER'} Lv.{mission.enemyPreview?.level || 1}
             </div>
           </div>
           {/* Enemy HP bar placeholder */}
           <div className="w-48 h-6 bg-red-950 rounded border-2 border-red-900 overflow-hidden relative">
             <div className="absolute inset-y-0 left-0 bg-gradient-to-b from-red-500 to-red-700 w-full" />
             <span className="absolute inset-0 flex items-center justify-center text-[10px] font-black text-white drop-shadow-md">
               ??? / ???
             </span>
           </div>
        </div>

      </div>

      {/* Bottom Progress Bar & Actions */}
      <div className="relative w-full px-20 pb-12 z-10 flex flex-col items-center">
         
         {/* Wooden Progress Bar Container */}
         <div className="w-full h-12 bg-stone-900 border-4 border-stone-700 rounded shadow-[0_10px_20px_rgba(0,0,0,0.8)] overflow-hidden relative">
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/wood-pattern.png')] opacity-20 pointer-events-none" />
            
            {/* Fill */}
            <div 
              className="h-full bg-gradient-to-r from-blue-700 to-blue-400 transition-all duration-1000 ease-linear shadow-[inset_0_2px_10px_rgba(255,255,255,0.3)]"
              style={{ width: `${progressPercent}%` }}
            />
            
            {/* Text overlay */}
            <div className="absolute inset-0 flex items-center justify-center font-black text-white text-xl tracking-widest drop-shadow-[0_2px_2px_rgba(0,0,0,1)]">
              {canComplete ? 'FIGHT!' : `${mm}:${ss}`}
            </div>
         </div>

         {/* Skip/Complete Buttons */}
         <div className="mt-6 flex gap-6">
           {canComplete ? (
             <button
               onClick={onComplete}
               disabled={completePending}
               className="px-16 py-3 bg-gradient-to-b from-red-600 to-red-800 hover:from-red-500 hover:to-red-700 text-white font-black tracking-widest text-2xl rounded-lg border-2 border-red-400 shadow-[0_0_20px_rgba(220,38,38,0.6)] active:scale-95 transition-all disabled:opacity-50"
             >
               {completePending ? '...' : 'ATTACK!'}
             </button>
           ) : (
             <button
               onClick={onSkip}
               disabled={skipPending}
               className="px-10 py-3 bg-gradient-to-b from-stone-600 to-stone-800 hover:from-stone-500 hover:to-stone-700 text-stone-100 font-bold tracking-widest text-lg rounded-lg border border-stone-500 shadow-lg active:scale-95 transition-all disabled:opacity-50 flex items-center gap-3"
             >
               {skipPending ? '...' : (
                 <>
                   SKIP
                   {/* 暂时免费，之后可以在这里放一个沙漏图标 -1 */}
                   <span className="text-xs bg-black/40 px-2 py-1 rounded text-stone-400">FREE</span>
                 </>
               )}
             </button>
           )}
         </div>

      </div>
    </div>
  );
};
