import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import type { CharacterInfoView, EquipmentSlot } from '../../types/character';
import { EQUIPMENT_SLOTS, EQUIPMENT_SLOT_LABELS, RARITY_BADGE_CLASS } from '../../types/character';
import { getEquipmentIconPath } from '../../lib/assets';

type EquipSlotProps = {
  slot: EquipmentSlot;
  item: CharacterInfoView['equipment']['equipped'][EquipmentSlot];
  isOver: boolean;
};

const DroppableSlot: React.FC<EquipSlotProps> = ({ slot, item, isOver }) => {
  const { setNodeRef } = useDroppable({
    id: `equip-slot-${slot}`,
    data: {
      type: 'equip_slot',
      slot,
    },
  });

  const rarityClass = item ? (RARITY_BADGE_CLASS[item.rarity] || RARITY_BADGE_CLASS[0]) : 'border-stone-800 bg-black/40';
  
  return (
    <div
      ref={setNodeRef}
      className={`
        relative aspect-square rounded-xl border-2 transition-all duration-200 overflow-hidden
        flex items-center justify-center
        ${isOver ? 'ring-2 ring-indigo-500 scale-105 border-indigo-500' : ''}
        ${rarityClass}
      `}
    >
      {item ? (
        <img 
          src={getEquipmentIconPath(item)} 
          alt={item.name} 
          className="w-full h-full object-contain p-2 drop-shadow-md"
          onError={e => e.currentTarget.style.display='none'} 
        />
      ) : (
        <span className="text-[10px] text-stone-600 font-bold uppercase tracking-widest">{EQUIPMENT_SLOT_LABELS[slot]}</span>
      )}
    </div>
  );
};

type PlayerPanelProps = {
  character: CharacterInfoView;
  activeDragSlot: string | null;
  overSlotId: string | null;
};

export const PlayerPanel: React.FC<PlayerPanelProps> = ({ character, activeDragSlot, overSlotId }) => {
  const leftSlots: EquipmentSlot[] = ['head', 'body', 'hands', 'belt', 'feet'];
  const rightSlots: EquipmentSlot[] = ['neck', 'ring', 'trinket', 'weapon', 'offHand'];

  return (
    <div className="flex flex-col h-full bg-stone-900/60 rounded-3xl border border-stone-800 p-4">
      
      {/* Player header */}
      <div className="text-center mb-4 shrink-0">
        <h2 className="text-xl font-black text-stone-100 tracking-widest">{character.player.displayName || '大宋乱民'}</h2>
        <p className="text-sm font-bold text-stone-400">等级 {character.player.level}</p>
      </div>

      {/* Avatar & Slots */}
      <div className="flex-1 flex items-center justify-between min-h-0">
        
        {/* Left Slots */}
        <div className="flex flex-col gap-3 w-16">
          {leftSlots.map(slot => (
            <DroppableSlot 
              key={slot} 
              slot={slot} 
              item={character.equipment.equipped[slot]} 
              isOver={overSlotId === `equip-slot-${slot}`}
            />
          ))}
        </div>

        {/* Center Avatar Placeholder */}
        <div className="flex-1 flex items-center justify-center relative">
          {/* A glowing backdrop */}
          <div className="absolute inset-0 bg-indigo-900/20 rounded-full blur-3xl scale-75" />
          
          <div className="relative w-40 h-64 border border-dashed border-stone-700/50 rounded-2xl flex items-center justify-center bg-black/20">
             <span className="text-stone-600 font-mono tracking-widest -rotate-90">AVATAR</span>
          </div>
        </div>

        {/* Right Slots */}
        <div className="flex flex-col gap-3 w-16">
          {rightSlots.map(slot => (
            <DroppableSlot 
              key={slot} 
              slot={slot} 
              item={character.equipment.equipped[slot]} 
              isOver={overSlotId === `equip-slot-${slot}`}
            />
          ))}
        </div>

      </div>

      {/* Stats Summary */}
      <div className="mt-4 shrink-0 grid grid-cols-2 gap-2 bg-black/40 rounded-xl p-3 border border-stone-800">
        <div className="flex justify-between items-center text-xs">
          <span className="text-stone-500">力量</span>
          <span className="font-mono text-stone-300">{character.attributes.total.strength}</span>
        </div>
        <div className="flex justify-between items-center text-xs">
          <span className="text-stone-500">智力</span>
          <span className="font-mono text-stone-300">{character.attributes.total.intelligence}</span>
        </div>
        <div className="flex justify-between items-center text-xs">
          <span className="text-stone-500">敏捷</span>
          <span className="font-mono text-stone-300">{character.attributes.total.agility}</span>
        </div>
        <div className="flex justify-between items-center text-xs">
          <span className="text-stone-500">体质</span>
          <span className="font-mono text-stone-300">{character.attributes.total.constitution}</span>
        </div>
        <div className="flex justify-between items-center text-xs">
          <span className="text-stone-500">护甲</span>
          <span className="font-mono text-indigo-300">{character.combatPreview.armor}</span>
        </div>
        <div className="flex justify-between items-center text-xs">
          <span className="text-stone-500">伤害</span>
          <span className="font-mono text-red-300">{character.combatPreview.damageMin}-{character.combatPreview.damageMax}</span>
        </div>
      </div>
    </div>
  );
};
