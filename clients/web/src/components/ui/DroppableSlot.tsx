/**
 * DroppableSlot.tsx
 *
 * 封装 @dnd-kit/core 的 useDroppable，提供两个可复用合成组件：
 *
 * 1. DroppableSlot
 *    - 纯 droppable 容器，render prop 注入 isOver
 *    - 适合：装备槽（自身不可拖拽，只接收拖入）
 *
 * 2. DroppableDraggableSlot
 *    - 同时支持接收拖拽（DroppableSlot）和本身可拖拽（DraggableItemSlot）
 *    - 适合：背包格（有物品时可拖出，同时可接收其他物品拖入）
 */

import { useDroppable } from '@dnd-kit/core';
import type { ReactNode } from 'react';
import { DraggableItemSlot, ItemSlot, type ItemDragSource, type ItemSlotVariant } from './ItemSlot';
import type { EquipmentItem, EquipmentSlot } from '../../types/game';

// ── DroppableSlot ─────────────────────────────────────────────────
type DroppableSlotProps = {
  droppableId: string;
  data?: Record<string, unknown>;
  /** className 应用到外层 div */
  className?: string;
  /** render prop：子组件接收 isOver 决定 ItemSlot 高亮 */
  children: (isOver: boolean) => ReactNode;
};

export function DroppableSlot({ droppableId, data, className, children }: DroppableSlotProps) {
  const { isOver, setNodeRef } = useDroppable({ id: droppableId, data });
  return (
    <div ref={setNodeRef} className={className}>
      {children(isOver)}
    </div>
  );
}

// ── DroppableDraggableSlot ────────────────────────────────────────
/**
 * 背包格标准组件。
 * - 有物品：渲染 DraggableItemSlot（可拖出），且格子本身是 droppable（可接收）
 * - 空格：渲染空 ItemSlot（可接收）
 */
type DroppableDraggableSlotProps = {
  /** droppable id，建议格式: "inventory-slot:0" */
  droppableId: string;
  /** droppable data，会附加在 event.over.data.current */
  droppableData?: Record<string, unknown>;
  item: EquipmentItem | null;
  /** 拖拽来源标识，有物品时传给 DraggableItemSlot */
  source: ItemDragSource;
  /** 物品所在装备槽（若来自已装备槽，传入对应 slot） */
  slot?: EquipmentSlot;
  variant: ItemSlotVariant;
  /** className 应用到外层 div */
  className?: string;
};

export function DroppableDraggableSlot({
  droppableId,
  droppableData,
  item,
  source,
  slot,
  variant,
  className,
}: DroppableDraggableSlotProps) {
  const { isOver, setNodeRef } = useDroppable({ id: droppableId, data: droppableData });

  return (
    <div ref={setNodeRef} className={className}>
      {item ? (
        <DraggableItemSlot item={item} slot={slot} source={source} variant={variant} />
      ) : (
        <ItemSlot isOver={isOver} item={null} variant={variant} />
      )}
    </div>
  );
}
