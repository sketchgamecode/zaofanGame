import React, { useState } from 'react';
import { useDraggable, useDroppable } from '@dnd-kit/core';
import type { EquipmentItem } from '../../types/character';
import { RARITY_BADGE_CLASS } from '../../types/character';
import { getEquipmentIconPath } from '../../lib/assets';
import { SmartTooltip } from '../blackmarket/SmartTooltip';

type DraggableInventorySlotProps = {
  index: number;
  item: EquipmentItem | undefined;
};

export const DraggableInventorySlot: React.FC<DraggableInventorySlotProps> = ({ index, item }) => {
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null);

  const { isOver, setNodeRef: setDroppableRef } = useDroppable({
    id: `inventory_slot_${index}`,
    data: {
      type: 'inventory_slot',
      index,
    },
  });

  const { attributes, listeners, setNodeRef: setDraggableRef, isDragging } = useDraggable({
    id: `inventory_item_${item?.id ?? index}`,
    data: {
      type: 'inventory_item',
      index,
      item,
    },
    disabled: !item,
  });

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
        className={`relative aspect-square w-full rounded-lg border-2 flex flex-col items-center justify-center transition-all group overflow-hidden touch-none ${
          isOver 
            ? 'border-emerald-400 bg-emerald-950/40 shadow-[0_0_10px_rgba(52,211,153,0.3)] z-10' 
            : item 
              ? `${RARITY_BADGE_CLASS[item.rarity].split(' ')[0]} bg-stone-900/80 hover:border-amber-500` 
              : 'border-stone-800 bg-stone-900/40'
        } ${isDragging ? 'opacity-30' : ''}`}
        onPointerEnter={handlePointerEnter}
        onPointerMove={handlePointerMove}
        onPointerLeave={handlePointerLeave}
        onPointerCancel={handlePointerLeave}
      >
        {item && (
          <img 
            src={getEquipmentIconPath(item)} 
            alt={item.name} 
            className="w-4/5 h-4/5 object-contain filter drop-shadow-md"
            onError={e => e.currentTarget.style.display='none'} 
          />
        )}
      </div>

      {item && tooltipPos && !isDragging && (
        <SmartTooltip item={item} equippedItem={undefined} position={tooltipPos} />
      )}
    </>
  );
};
