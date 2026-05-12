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
  onItemTooltipChange?: (nextValue: ItemTooltipState | null) => void;
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
  onItemTooltipChange,
}: ItemSlotProps) {
  const className = [
    'item-slot',
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
          <div className="item-slot__icon">{item.name.slice(0, 1)}</div>
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
  onItemTooltipChange,
}: {
  item: EquipmentItem;
  source: ItemDragSource;
  slot?: EquipmentSlot;
  label?: string;
  compact?: boolean;
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
        onItemTooltipChange={isDragging ? undefined : onItemTooltipChange}
      />
    </div>
  );
}
