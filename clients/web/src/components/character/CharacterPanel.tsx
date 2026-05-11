import React, { useState } from 'react';
import type { CharacterInfoView } from '../../types/character';
import { EQUIPMENT_SLOTS } from '../../types/character';
import { DroppableEquipSlot } from './DroppableEquipSlot';
import { DraggableInventorySlot } from './DraggableInventorySlot';
import { AttributesTab } from './AttributesTab';

type CharacterPanelProps = {
  character: CharacterInfoView;
  activeDragType: string | null;
};

type TabId = 'ATTRIBUTES' | 'DESCRIPTION' | 'INFO' | 'INTERACTIONS';

export const CharacterPanel: React.FC<CharacterPanelProps> = ({ character, activeDragType }) => {
  const [activeTab, setActiveTab] = useState<TabId>('ATTRIBUTES');

  const leftSlots = EQUIPMENT_SLOTS.slice(0, 4); // head, body, hands, feet
  const rightSlots = EQUIPMENT_SLOTS.slice(4, 8); // neck, belt, ring, trinket
  const bottomSlots = EQUIPMENT_SLOTS.slice(8, 10); // weapon, offHand

  // Calculate XP percentage
  const xpPercent = Math.min(100, Math.max(0, character.player.exp / 100)); // TODO: Needs actual max XP formula.

  return (
    <div className="flex flex-col h-full gap-2 text-stone-200">
      
      {/* 1. Header Zone (Avatar & Equipment) */}
      <div className="relative shrink-0 flex flex-col h-[280px] bg-[#041124] rounded-t-xl border-t-2 border-x-2 border-[#b8860b] shadow-[inset_0_0_50px_rgba(0,0,0,0.8)] overflow-hidden">
        
        {/* Background Avatar (Full Width Integration) */}
        <div className="absolute inset-0 z-0 pointer-events-none flex justify-center items-start overflow-hidden">
          <div className="absolute bottom-0 inset-x-0 h-1/2 bg-gradient-to-t from-[#041124] to-transparent z-10" />
          <img 
            src="/assets/npcs/avatar_girl.png" 
            alt="Avatar" 
            className="w-full h-full object-cover object-top drop-shadow-[-5px_5px_15px_rgba(0,0,0,0.8)] opacity-90"
            onError={e=>e.currentTarget.style.display='none'}
          />
        </div>

        {/* Name Title */}
        <div className="relative z-20 mt-2 mb-2 text-center">
          <h2 className="text-2xl font-fantasy font-black text-[#ffcc00] tracking-widest uppercase drop-shadow-[0_2px_4px_rgba(0,0,0,1)] stroke-black">
            {character.player.displayName || 'Hero'}
          </h2>
        </div>
        
        {/* Equip Slots overlay */}
        <div className="flex justify-between w-full px-3 relative z-20 flex-1">
          
          {/* Left Slots */}
          <div className="flex flex-col gap-1.5 w-[52px]">
            {leftSlots.map(slot => (
              <div key={slot} className="w-full h-[52px] bg-black/40 rounded border border-[#b8860b]/60 shadow-[0_4px_6px_rgba(0,0,0,0.5),inset_0_2px_4px_rgba(0,0,0,0.5)]">
                <DroppableEquipSlot 
                  slot={slot} 
                  item={character.equipment.equipped[slot]} 
                  isHighlighted={activeDragType === slot}
                />
              </div>
            ))}
          </div>
          
          {/* Center Bottom (Level, XP, Weapon, Offhand) */}
          <div className="flex-1 flex flex-col justify-end items-center pb-2 px-2">
            
            {/* Level Badge Over Avatar */}
            <div className="mb-2 px-4 py-1 bg-gradient-to-r from-transparent via-[#b8860b]/80 to-transparent flex items-center justify-center shadow-lg border-y border-[#ffcc00]/50 backdrop-blur-sm">
              <span className="text-sm font-fantasy font-black text-white drop-shadow-md">Level {character.player.level}</span>
            </div>
            
            {/* XP Bar */}
            <div className="w-full h-2 bg-black rounded-full border border-[#b8860b]/50 overflow-hidden shadow-inner mb-2 relative">
               <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-30 mix-blend-overlay z-10" />
               <div className="h-full bg-gradient-to-r from-emerald-700 to-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.5)] relative z-0" style={{ width: `${xpPercent}%` }} />
            </div>
            
            {/* Bottom Slots (Weapon, Offhand) */}
            <div className="flex gap-4 w-full justify-center">
              {bottomSlots.map(slot => (
                <div key={slot} className="w-[52px] h-[52px] bg-black/60 rounded border-2 border-[#b8860b]/80 shadow-[0_4px_10px_rgba(0,0,0,0.8),inset_0_2px_4px_rgba(0,0,0,0.5)]">
                  <DroppableEquipSlot 
                    slot={slot} 
                    item={character.equipment.equipped[slot]} 
                    isHighlighted={activeDragType === slot}
                  />
                </div>
              ))}
            </div>
          </div>
          
          {/* Right Slots */}
          <div className="flex flex-col gap-1.5 w-[52px]">
            {rightSlots.map(slot => (
              <div key={slot} className="w-full h-[52px] bg-black/40 rounded border border-[#b8860b]/60 shadow-[0_4px_6px_rgba(0,0,0,0.5),inset_0_2px_4px_rgba(0,0,0,0.5)]">
                <DroppableEquipSlot 
                  slot={slot} 
                  item={character.equipment.equipped[slot]} 
                  isHighlighted={activeDragType === slot}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* 2. Bottom Tabs Zone (Replaces Backpack) */}
      <div className="flex-1 flex flex-col min-h-0 bg-[#08152e] rounded-lg border-2 border-[#b8860b] shadow-[0_10px_30px_rgba(0,0,0,0.8)] overflow-hidden mt-2 relative">
        {/* Tab Headers */}
        <div className="flex border-b-2 border-[#b8860b] bg-gradient-to-r from-[#002244] to-[#003366] shrink-0 relative z-10 shadow-[0_2px_10px_rgba(0,0,0,0.5)]">
          {(['ATTRIBUTES', 'DESCRIPTION', 'INFO', 'INTERACTIONS'] as TabId[]).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-1.5 text-[10px] font-fantasy font-black text-center border-r-2 border-[#b8860b]/50 last:border-r-0 transition-colors drop-shadow-md ${
                activeTab === tab 
                  ? 'text-white bg-[#b8860b]/40 shadow-[inset_0_-3px_0_#ffcc00]' 
                  : 'text-amber-500/60 hover:text-amber-300 hover:bg-white/5'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
        
        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-2 custom-scrollbar bg-[#041124] relative">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-30 mix-blend-overlay pointer-events-none" />
          <div className="relative z-10 h-full">
            {activeTab === 'ATTRIBUTES' && <AttributesTab character={character} />}
            {activeTab === 'DESCRIPTION' && <div className="text-sm text-amber-200 italic p-2 font-fantasy">"天道不仁，以万物为刍狗。"</div>}
            {activeTab === 'INFO' && <div className="text-sm text-amber-200 p-2 font-fantasy">详细信息...</div>}
            {activeTab === 'INTERACTIONS' && <div className="text-sm text-amber-200 p-2 font-fantasy">互动选项...</div>}
          </div>
        </div>
      </div>

    </div>
  );
};
