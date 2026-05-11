import React, { useRef } from 'react';
import { useDraggable } from '@dnd-kit/core';
import type { EquipmentItem } from '../../types/character';
import { getEquipmentIconPath } from '../../lib/assets';
import { RARITY_BADGE_CLASS } from '../../types/character';

type ShopItemCardProps = {
  item: EquipmentItem;
  onHoverStart: (item: EquipmentItem, element: HTMLElement) => void;
  onHoverEnd: () => void;
  onDoubleClick: (item: EquipmentItem) => void;
  disabled?: boolean;
};

export const ShopItemCard: React.FC<ShopItemCardProps> = ({ 
  item, 
  onHoverStart, 
  onHoverEnd,
  onDoubleClick,
  disabled 
}) => {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `shop-item-${item.id}`,
    data: {
      type: 'shop_item',
      itemId: item.id,
      slot: item.slot,
      item,
    },
    disabled,
  });

  const cardRef = useRef<HTMLDivElement | null>(null);

  const handleMouseEnter = () => {
    if (!isDragging && cardRef.current) {
      onHoverStart(item, cardRef.current);
    }
  };

  const handleMouseLeave = () => {
    onHoverEnd();
  };

  const iconPath = getEquipmentIconPath(item);
  const rarityClass = RARITY_BADGE_CLASS[item.rarity] || RARITY_BADGE_CLASS[0];

  return (
    <div
      ref={(node) => {
        setNodeRef(node);
        cardRef.current = node;
      }}
      {...listeners}
      {...attributes}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onDoubleClick={() => onDoubleClick(item)}
      className={`
        relative w-full h-full aspect-square rounded-xl border-2 cursor-grab active:cursor-grabbing 
        transition-all duration-200 overflow-hidden group
        ${isDragging ? 'opacity-50 scale-95 z-50 shadow-2xl' : 'opacity-100 hover:scale-105 hover:shadow-lg'}
        ${disabled ? 'pointer-events-none opacity-50 grayscale' : ''}
        ${rarityClass}
      `}
      style={{
        touchAction: 'none', // Prevents scrolling while dragging on mobile
      }}
    >
      {/* Background Glow based on rarity */}
      <div className="absolute inset-0 opacity-20 group-hover:opacity-40 transition-opacity bg-current" />
      
      {/* Item Icon */}
      <div className="absolute inset-2 flex items-center justify-center">
        <img 
          src={iconPath} 
          alt={item.name} 
          className="w-full h-full object-contain drop-shadow-md"
          onError={(e) => {
            // Fallback for placeholder testing if image doesn't exist
            const target = e.currentTarget;
            target.style.display = 'none';
            if (target.parentElement) {
               target.parentElement.innerHTML = `<div class="text-[10px] text-center opacity-50 font-mono break-all px-1">${iconPath.split('/').pop()}</div>`;
            }
          }}
        />
      </div>

      {/* Price tag */}
      <div className="absolute bottom-0 inset-x-0 bg-black/60 backdrop-blur text-[10px] py-1 px-2 flex items-center justify-center gap-1 font-semibold text-amber-400">
        <img src="/assets/ui/icon_copper.png" alt="c" className="w-3 h-3" onError={e => e.currentTarget.style.display='none'} />
        {item.price ?? 0}
      </div>
    </div>
  );
};
