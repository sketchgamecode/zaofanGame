import { useDraggable } from '@dnd-kit/core';
import type { CSSProperties } from 'react';
import type { EquipmentItem, EquipmentSlot } from '../../types/game';
import type { ItemTooltipState } from './ItemTooltip';

export type ItemDragSource = 'inventory' | 'equipment' | 'shop';

type ItemSlotProps = {
  item: EquipmentItem | null;
  label?: string;
  compact?: boolean;
  isDropTarget?: boolean;
  variant?: 'equipment' | 'inventory' | 'shop';
  onItemTooltipChange?: (nextValue: ItemTooltipState | null) => void;
};

const ITEM_ICON_BY_SLOT: Record<EquipmentSlot, string> = {
  head: '/assets/items/icons/item_head_placeholder.png',
  body: '/assets/items/icons/item_body_placeholder.png',
  hands: '/assets/items/icons/item_hands_placeholder.png',
  feet: '/assets/items/icons/item_feet_placeholder.png',
  neck: '/assets/items/icons/item_neck_placeholder.png',
  belt: '/assets/items/icons/item_belt_placeholder.png',
  ring: '/assets/items/icons/item_ring_placeholder.png',
  trinket: '/assets/items/icons/item_trinket_placeholder.png',
  weapon: '/assets/items/icons/item_weapon_placeholder.png',
  offHand: '/assets/items/icons/item_offhand_placeholder.png',
};

function getItemStatLabel(item: EquipmentItem) {
  if (item.armor) {
    return `甲 ${item.armor}`;
  }

  if (item.weaponDamage) {
    return `伤 ${item.weaponDamage.min}-${item.weaponDamage.max}`;
  }

  return '装备';
}

function getRarityClass(item: EquipmentItem | null) {
  return item ? ` item-slot--rarity-${item.rarity}` : '';
}

export function ItemSlot({
  item,
  label,
  compact = false,
  isDropTarget = false,
  variant,
  onItemTooltipChange,
}: ItemSlotProps) {
  const className = [
    'item-slot',
    variant ? `item-slot--${variant}` : '',
    item ? 'item-slot--filled' : 'item-slot--empty-state',
    compact ? 'item-slot--compact' : '',
    isDropTarget ? 'item-slot--over' : '',
    getRarityClass(item),
  ].filter(Boolean).join(' ');

  return (
    <div
      className={className}
      onPointerEnter={(event) => {
        if (!item) {
          return;
        }

        onItemTooltipChange?.({
          item,
          x: event.clientX,
          y: event.clientY,
        });
      }}
      onPointerMove={(event) => {
        if (!item) {
          return;
        }

        onItemTooltipChange?.({
          item,
          x: event.clientX,
          y: event.clientY,
        });
      }}
      onPointerLeave={() => onItemTooltipChange?.(null)}
    >
      {label ? <div className="item-slot__label">{label}</div> : null}
      {item ? (
        <>
          <div className="item-slot__icon">
            <img alt="" src={ITEM_ICON_BY_SLOT[item.slot]} />
          </div>
          <div className="item-slot__name">{item.name}</div>
          <div className="item-slot__stat">{getItemStatLabel(item)}</div>
          <div className="item-slot__badge item-slot__badge--gem" />
          <div className="item-slot__badge item-slot__badge--rune" />
        </>
      ) : (
        <span className="item-slot__empty">空位</span>
      )}
    </div>
  );
}

export function DraggableItemSlot({
  item,
  source,
  slot,
  label,
  compact = false,
  variant,
  onItemTooltipChange,
}: {
  item: EquipmentItem;
  source: ItemDragSource;
  slot?: EquipmentSlot;
  label?: string;
  compact?: boolean;
  variant?: ItemSlotProps['variant'];
  onItemTooltipChange?: (nextValue: ItemTooltipState | null) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `${source}-item:${item.id}`,
    data: {
      source,
      slot,
      item,
    },
  });
  const style: CSSProperties = {
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
    opacity: isDragging ? 0.2 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      className="item-slot-drag-handle"
      style={style}
      {...listeners}
      {...attributes}
    >
      <ItemSlot
        compact={compact}
        item={item}
        label={label}
        variant={variant}
        onItemTooltipChange={isDragging ? undefined : onItemTooltipChange}
      />
    </div>
  );
}
