import React, { useState } from 'react';
import { useDraggable, useDroppable } from '@dnd-kit/core';
import type { EquipmentItem, EquipmentSlot } from '../../types/character';
import { EQUIPMENT_SLOT_LABELS, RARITY_BADGE_CLASS } from '../../types/character';
import { getEquipmentIconPath } from '../../lib/assets';
import { SmartTooltip } from '../blackmarket/SmartTooltip';

type DroppableEquipSlotProps = {
  slot: EquipmentSlot;
  item: EquipmentItem | null | undefined;
  isHighlighted?: boolean;
};

export const DroppableEquipSlot: React.FC<DroppableEquipSlotProps> = ({ slot, item, isHighlighted }) => {
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null);

  const { isOver, setNodeRef: setDroppableRef } = useDroppable({
    id: `equip_slot_${slot}`,
    data: {
      type: 'equip_slot',
      slot,
    },
  });

  const { attributes, listeners, setNodeRef: setDraggableRef, isDragging } = useDraggable({
    id: `equipped_${slot}`,
    data: {
      type: 'equip_item',
      slot,
      item,
    },
    disabled: !item,
  });

  // Combine refs if item exists so it can be both dragged out and dropped onto
  const setCombinedRef = (node: HTMLElement | null) => {
    setDroppableRef(node);
    if (item) setDraggableRef(node);
  };

  const handlePointerEnter = (e: React.PointerEvent) => {
    if (isDragging) return;
    setTooltipPos({ x: e.clientX, y: e.clientY });
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (isDragging || !tooltipPos) return;
    setTooltipPos({ x: e.clientX, y: e.clientY });
  };

  const handlePointerLeave = () => {
    setTooltipPos(null);
  };

  return (
    <>
      <div 
        ref={setCombinedRef}
        {...listeners}
        {...attributes}
        className={`relative aspect-square rounded-xl border-2 flex flex-col items-center justify-center transition-all group overflow-hidden touch-none ${
          isOver 
            ? 'border-emerald-400 bg-emerald-950/40 scale-105 shadow-[0_0_15px_rgba(52,211,153,0.3)] z-10' 
            : isHighlighted 
              ? 'border-amber-500/80 bg-amber-950/20 shadow-[0_0_10px_rgba(245,158,11,0.2)] animate-pulse'
              : item 
                ? `${RARITY_BADGE_CLASS[item.rarity].split(' ')[0]} bg-stone-900/80 hover:border-amber-500` 
                : 'border-stone-800 bg-stone-900/40'
        } ${isDragging ? 'opacity-30' : ''}`}
        onPointerEnter={handlePointerEnter}
        onPointerMove={handlePointerMove}
        onPointerLeave={handlePointerLeave}
        onPointerCancel={handlePointerLeave}
      >
        {item ? (
          <img 
            src={getEquipmentIconPath(item)} 
            alt={item.name} 
            className="w-4/5 h-4/5 object-contain filter drop-shadow-lg"
            onError={e => e.currentTarget.style.display='none'} 
          />
        ) : (
          <span className="text-[10px] text-stone-600 font-bold font-mono tracking-wider opacity-50 uppercase">{EQUIPMENT_SLOT_LABELS[slot]}</span>
        )}
      </div>

      {item && tooltipPos && !isDragging && (
        <SmartTooltip item={item} equippedItem={item} position={tooltipPos} />
      )}
    </>
  );
};
