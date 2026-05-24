/**
 * InventoryScene.tsx
 *
 * 背包场景。使用 DroppableDraggableSlot 统一背包格逻辑。
 * tooltip 由全局 store 驱动，无 onItemTooltipChange 传递链。
 */

import {
  DndContext,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import { useState } from 'react';
import { CharacterPanel } from '../components/character/CharacterPanel';
import { DroppableDraggableSlot } from '../components/ui/DroppableSlot';
import { ItemSlot } from '../components/ui/ItemSlot';
import { useItemTooltip } from '../state/tooltipStore';
import { useGameState } from '../state/GameStateContext';
import type { EquipmentItem } from '../types/game';

export function InventoryScene() {
  const { character, pendingAction, upgradeAttribute, equipItem, unequipItem } = useGameState();
  const { setTooltip } = useItemTooltip();
  const [activeItem, setActiveItem] = useState<EquipmentItem | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 8 } }),
  );

  if (!character) {
    return (
      <div className="scene scene--inventory">
        <div className="inventory-scene inventory-scene--loading">角色数据载入中...</div>
      </div>
    );
  }

  const inventoryCapacity = Math.max(character.inventory.capacity ?? 5, character.inventory.items.length, 10);
  const inventorySlots = Array.from({ length: inventoryCapacity }, (_, i) => character.inventory.items[i] ?? null);

  const handleDragStart = (event: DragStartEvent) => {
    const item = event.active.data.current?.item as EquipmentItem | undefined;
    setTooltip(null); // 拖拽开始立即关闭 tooltip
    setActiveItem(item ?? null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveItem(null);
    setTooltip(null);

    const item = event.active.data.current?.item as EquipmentItem | undefined;
    const source = event.active.data.current?.source as 'inventory' | 'equipment' | undefined;
    const targetType = event.over?.data.current?.type as 'equip-slot' | 'inventory-slot' | undefined;
    const targetSlot = event.over?.data.current?.slot as EquipmentItem['slot'] | undefined;

    if (!item || !event.over) return;

    if (source === 'inventory' && targetType === 'equip-slot' && targetSlot === item.slot) {
      void equipItem(item.id);
      return;
    }

    if (source === 'equipment' && targetType === 'inventory-slot') {
      void unequipItem(item.slot);
    }
  };

  return (
    <div className="scene scene--inventory">
      <div className="scene__banner scene__banner--left">角色行囊</div>

      <DndContext sensors={sensors} onDragEnd={handleDragEnd} onDragStart={handleDragStart}>
        <div className="inventory-scene">
          {/* 左侧角色面板 */}
          <div className="inventory-scene__panel">
            <CharacterPanel
              character={character}
              highlightedEquipmentSlot={activeItem?.slot ?? null}
              pendingAction={pendingAction}
              onUpgradeAttribute={upgradeAttribute}
            />
          </div>

          {/* 右侧背包 */}
          <div className="inventory-scene__bag">
            <div className="inventory-scene__bag-head">
              <div className="inventory-scene__bag-title">背包</div>
              <div className="inventory-scene__bag-meta">{character.inventory.count} / {inventoryCapacity}</div>
            </div>

            <div className="inventory-scene__grid">
              {inventorySlots.map((item, index) => (
                <DroppableDraggableSlot
                  key={`inventory-slot-${index}`}
                  className="inventory-scene__cell"
                  droppableId={`inventory-slot:${index}`}
                  droppableData={{ type: 'inventory-slot', index }}
                  item={item}
                  source="inventory"
                  variant="inventory"
                />
              ))}
            </div>
          </div>
        </div>

        {/* 拖拽幽灵 */}
        <DragOverlay>
          {activeItem ? (
            <div className="item-slot-overlay">
              <ItemSlot item={activeItem} variant="inventory" />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
