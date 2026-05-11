import React from 'react';
import type { CharacterInfoView } from '../../types/character';
import { DraggableInventorySlot } from './DraggableInventorySlot';

type InventoryPanelProps = {
  character: CharacterInfoView;
  rows?: number;
  cols?: number;
};

export const InventoryPanel: React.FC<InventoryPanelProps> = ({ 
  character, 
  rows = 3, 
  cols = 5 
}) => {
  const totalSlots = Math.max(character.inventory.capacity ?? 15, rows * cols);

  return (
    <div className="flex flex-col w-full bg-[#08152e] rounded-b-xl border-2 border-[#b8860b] shadow-[0_10px_30px_rgba(0,0,0,0.8)] overflow-hidden relative">
      
      {/* Header Bar with buttons */}
      <div className="h-8 bg-gradient-to-r from-[#002244] to-[#003366] border-b-2 border-[#b8860b] flex items-center justify-between px-2 shadow-inner relative z-10">
        <div className="w-6" /> {/* Placeholder for balance */}
        
        {/* Center chevron button */}
        <button className="w-16 h-5 bg-gradient-to-b from-[#b8860b] to-[#8b6508] hover:from-[#daa520] hover:to-[#b8860b] border border-black rounded-b-md shadow-[0_2px_5px_rgba(0,0,0,0.8)] flex items-center justify-center text-black font-black active:scale-95 transition-transform translate-y-[2px]">
          ^
        </button>
        
        {/* Right close button */}
        <button className="w-6 h-6 flex items-center justify-center text-[#ffcc00] font-black text-lg hover:text-white transition-colors drop-shadow-[0_2px_2px_rgba(0,0,0,1)]">
          ×
        </button>
      </div>

      {/* Grid Zone */}
      <div className="p-3 relative bg-[#041124] min-h-[220px]">
        {/* Background texture */}
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-30 mix-blend-overlay pointer-events-none" />
        
        <div 
          className="grid gap-2 place-content-center relative z-10"
          style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
        >
          {Array.from({ length: totalSlots }).map((_, i) => {
            const item = character.inventory.items[i];
            // Fixed size 64x64 slots for the backpack
            return (
              <div key={i} className="w-[64px] h-[64px] bg-black/40 rounded border border-[#b8860b]/40 shadow-[inset_0_2px_5px_rgba(0,0,0,0.5)]">
                <DraggableInventorySlot index={i} item={item} />
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
};
