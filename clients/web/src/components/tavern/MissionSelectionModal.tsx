import React, { useState } from 'react';
import type { MissionOffer } from '../../types/tavern';

type MissionSelectionModalProps = {
  isOpen: boolean;
  onClose: () => void;
  offers: MissionOffer[];
  onStart: (offer: MissionOffer) => void;
  isSubmitting: boolean;
};

export const MissionSelectionModal: React.FC<MissionSelectionModalProps> = ({
  isOpen,
  onClose,
  offers,
  onStart,
  isSubmitting
}) => {
  const [activeIdx, setActiveIdx] = useState(0);

  if (!isOpen || offers.length === 0) return null;

  const activeOffer = offers[activeIdx];
  const { xp, copper, hasEquipment, hasDungeonKey } = activeOffer.visibleReward;

  // Format time
  const mm = Math.floor(activeOffer.actualDurationSec / 60);
  const ss = (activeOffer.actualDurationSec % 60).toString().padStart(2, '0');

  // Handle clicking outside to close
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div 
      className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={handleBackdropClick}
    >
      <div className="relative w-[500px] bg-[#1a1c23] border-2 border-amber-900/60 rounded-xl shadow-[0_0_50px_rgba(0,0,0,0.8)] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Top Header */}
        <div className="bg-[#12141a] p-3 flex justify-between items-start border-b border-stone-800">
          <div className="flex items-center gap-3">
             <img src="/assets/npcs/npc_orc.png" alt="NPC" className="w-16 h-16 object-cover bg-stone-900 border border-stone-700 rounded shadow-inner" onError={e=>e.currentTarget.style.display='none'}/>
             <div>
               <h3 className="text-amber-500 font-black tracking-widest text-sm mb-1 uppercase">Select a Quest:</h3>
               <p className="text-xs text-stone-400 italic line-clamp-3">
                 "Grrr... I hope you have balls, as my quests are not designed for weaklings. Take a look at what I have to offer, but if you are afraid then just go away."
               </p>
             </div>
          </div>
          <button onClick={onClose} className="text-stone-500 hover:text-stone-300 font-bold p-1">
            ✕
          </button>
        </div>

        {/* Tabs */}
        <div className="flex bg-[#0a0c10] border-b border-stone-800">
          {[0, 1, 2].map((idx) => {
            const offer = offers[idx];
            if (!offer) return null;
            const isActive = activeIdx === idx;
            
            return (
              <button
                key={offer.missionId}
                onClick={() => setActiveIdx(idx)}
                className={`
                  flex-1 py-3 text-sm font-black tracking-widest transition-all relative
                  ${isActive 
                    ? 'text-amber-400 bg-amber-900/10' 
                    : 'text-stone-600 hover:text-stone-400 hover:bg-stone-900'
                  }
                `}
              >
                {/* Visual Tab Indicator */}
                <div className="flex items-center justify-center gap-2">
                  <span className={`text-[10px] ${isActive ? 'text-amber-600' : 'text-stone-700'}`}>◀</span>
                  {idx === 0 ? 'Ⅰ' : idx === 1 ? 'Ⅱ' : 'Ⅲ'}
                  <span className={`text-[10px] ${isActive ? 'text-amber-600' : 'text-stone-700'}`}>▶</span>
                </div>
                
                {isActive && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.8)]" />
                )}
              </button>
            );
          })}
        </div>

        {/* Quest Details */}
        <div className="p-5 flex-1 flex flex-col bg-[url('https://www.transparenttextures.com/patterns/dark-leather.png')]">
           <h2 className="text-xl font-black text-stone-200 mb-2 tracking-wider uppercase">{activeOffer.title}</h2>
           <p className="text-sm text-stone-400 leading-relaxed mb-6 flex-1">
             {activeOffer.description}
           </p>

           {/* Rewards Area */}
           <div className="bg-black/30 border border-stone-800 rounded-lg p-4 mb-5">
             <div className="text-xs text-stone-500 font-bold tracking-widest mb-3">REWARD:</div>
             <div className="flex items-center justify-between">
                {/* Copper */}
                <div className="flex items-center gap-2">
                  <img src="/assets/ui/icon_copper.png" alt="Copper" className="w-6 h-6" onError={e=>e.currentTarget.style.display='none'}/>
                  <span className="font-mono text-lg font-bold text-stone-200">{copper}</span>
                </div>
                {/* XP */}
                <div className="flex items-center gap-2">
                  <span className="text-amber-600 font-black italic text-lg tracking-wider">XP</span>
                  <span className="font-mono text-lg font-bold text-stone-200">{xp}</span>
                </div>
                {/* Time */}
                <div className="flex items-center gap-2">
                  <span className="text-stone-500 text-lg">⏳</span>
                  <span className="font-mono text-lg font-bold text-stone-200">{mm}:{ss}</span>
                </div>
             </div>

             {/* Items */}
             {(hasEquipment || hasDungeonKey) && (
               <div className="mt-4 flex gap-2">
                 {hasEquipment && (
                    <div className="w-10 h-10 bg-red-900/40 border border-red-700/50 rounded flex items-center justify-center relative">
                      <span className="text-lg">🛡️</span>
                      <span className="absolute -bottom-1 -right-1 text-[10px] bg-red-600 text-white px-1 rounded-full border border-red-900">!</span>
                    </div>
                 )}
                 {hasDungeonKey && (
                    <div className="w-10 h-10 bg-purple-900/40 border border-purple-700/50 rounded flex items-center justify-center">
                      <span className="text-lg">🗝️</span>
                    </div>
                 )}
               </div>
             )}
           </div>

           {/* Accept Button */}
           <button
             onClick={() => onStart(activeOffer)}
             disabled={isSubmitting}
             className="w-full py-3 bg-gradient-to-b from-blue-600 to-blue-800 hover:from-blue-500 hover:to-blue-700 text-blue-100 font-black tracking-widest text-lg rounded border border-blue-400 shadow-[0_0_15px_rgba(37,99,235,0.4)] disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95"
           >
             {isSubmitting ? 'ACCEPTING...' : 'ACCEPT'}
           </button>
        </div>

      </div>
    </div>
  );
};
