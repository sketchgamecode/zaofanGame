/**
 * ItemSlot.tsx
 *
 * 通用物品格原子组件。设计原则：
 * 1. 纯展示层，不持有任何 DnD 状态。
 * 2. 不渲染 name/stat 文字（已移入 Tooltip）。
 * 3. Tooltip 触发通过全局 useItemTooltip() hook，无需 prop drilling。
 * 4. 所有格子统一 128×128px 基准尺寸（由外层容器或 CSS 控制）。
 *
 * 分层（自底向上）：
 *   1. 背景槽底纹 (CSS background-image by variant)
 *   2. 物品 Icon (img, 统一尺寸)
 *   3. 挂件层 (gem badge 右下, rune badge 左下, 绝对定位)
 *   4. 交互遮罩 (pointer events → Tooltip)
 *
 * 合成组件（同文件导出）：
 *   - DraggableItemSlot：可拖拽版本
 *   - DroppableDraggableSlot：在 DroppableSlot.tsx 中导出，或由场景层组合
 */

import { useDraggable } from '@dnd-kit/core';
import type { CSSProperties } from 'react';
import type { EquipmentItem, EquipmentSlot } from '../../types/game';
import { useItemTooltip } from '../../state/tooltipStore';

export type ItemDragSource = 'inventory' | 'equipment' | 'shop';

// 各装备槽物品图占位
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

function getRarityClass(item: EquipmentItem | null) {
  return item ? ` item-slot--rarity-${item.rarity}` : '';
}

// ── ItemSlotProps ─────────────────────────────────────────────────
export type ItemSlotVariant = 'equipment' | 'inventory' | 'shop';

export type ItemSlotProps = {
  item: EquipmentItem | null;
  variant: ItemSlotVariant;
  /** compact: 用于 DragOverlay 幽灵或特殊场合缩小显示。默认 false。 */
  compact?: boolean;
  /** 外层 DroppableSlot 传入，控制高亮底纹 */
  isOver?: boolean;
  /** DraggableItemSlot 拖拽中时传入，降低本体透明度 */
  isDragging?: boolean;
  /** 是否显示宝石/符文角标，默认 true */
  showBadges?: boolean;
  className?: string;
};

// ── 核心原子组件 ──────────────────────────────────────────────────
export function ItemSlot({
  item,
  variant,
  compact = false,
  isOver = false,
  isDragging = false,
  showBadges = true,
  className,
}: ItemSlotProps) {
  const { setTooltip } = useItemTooltip();
  const priceMode = variant === 'shop' ? 'buy' : 'sell';

  const classNames = [
    'item-slot',
    `item-slot--${variant}`,
    item ? 'item-slot--filled' : 'item-slot--empty',
    compact ? 'item-slot--compact' : '',
    isOver ? 'item-slot--over' : '',
    isDragging ? 'item-slot--dragging' : '',
    getRarityClass(item),
    className ?? '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div
      className={classNames}
      onPointerEnter={(e) => {
        if (item) setTooltip({ item, priceMode, x: e.clientX, y: e.clientY });
      }}
      onPointerMove={(e) => {
        if (item) setTooltip({ item, priceMode, x: e.clientX, y: e.clientY });
      }}
      onPointerLeave={() => setTooltip(null)}
    >
      {item ? (
        <>
          <div className="item-slot__icon">
            <img alt="" src={ITEM_ICON_BY_SLOT[item.slot]} />
          </div>
          {showBadges && (
            <>
              <div className="item-slot__badge item-slot__badge--gem" />
              <div className="item-slot__badge item-slot__badge--rune" />
            </>
          )}
        </>
      ) : (
        <div className="item-slot__empty-bg" />
      )}
    </div>
  );
}

// ── DraggableItemSlot ─────────────────────────────────────────────
/**
 * 可拖拽的物品格。拖拽过程中：
 * - 本体透明度降低（isDragging = true）
 * - Tooltip 自动关闭（由 DndContext onDragStart 处理，ItemSlot 仅接收 isDragging prop）
 * - 拖拽幽灵由场景层的 <DragOverlay> 渲染
 */
export function DraggableItemSlot({
  item,
  source,
  slot,
  variant,
  compact = false,
}: {
  item: EquipmentItem;
  source: ItemDragSource;
  slot?: EquipmentSlot;
  variant: ItemSlotVariant;
  compact?: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `${source}-item:${item.id}`,
    data: { source, slot, item },
  });

  const style: CSSProperties = {
    transform: transform
      ? `translate3d(${transform.x}px, ${transform.y}px, 0)`
      : undefined,
    opacity: isDragging ? 0.25 : 1,
    // 拖拽时屏蔽 pointer events，防止 Tooltip 在拖拽过程中意外触发
    pointerEvents: isDragging ? 'none' : undefined,
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
        isDragging={isDragging}
        item={item}
        variant={variant}
      />
    </div>
  );
}
