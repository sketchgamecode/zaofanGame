import {
  DndContext,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import { useState } from 'react';
import { CharacterPanel } from '../components/character/CharacterPanel';
import { DraggableItemSlot, ItemSlot } from '../components/ui/ItemSlot';
import type { ItemTooltipState } from '../components/ui/ItemTooltip';
import { useGameState } from '../state/GameStateContext';
import type { EquipmentItem } from '../types/game';

function InventoryCell({
  index,
  item,
  onItemTooltipChange,
}: {
  index: number;
  item: EquipmentItem | null;
  onItemTooltipChange: (nextValue: ItemTooltipState | null) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: `inventory-slot:${index}`,
    data: {
      type: 'inventory-slot',
      index,
    },
  });

  return (
    <div ref={setNodeRef} className={`inventory-scene__cell${isOver ? ' inventory-scene__cell--over' : ''}`}>
      {item ? (
        <DraggableItemSlot item={item} source="inventory" variant="inventory" onItemTooltipChange={onItemTooltipChange} />
      ) : (
        <ItemSlot isDropTarget={isOver} item={null} variant="inventory" />
      )}
    </div>
  );
}

export function InventoryScene({
  onItemTooltipChange,
}: {
  onItemTooltipChange: (nextValue: ItemTooltipState | null) => void;
}) {
  const {
    character,
    pendingAction,
    upgradeAttribute,
    equipItem,
    unequipItem,
  } = useGameState();
  const [activeItem, setActiveItem] = useState<EquipmentItem | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 6,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 150,
        tolerance: 8,
      },
    }),
  );

  if (!character) {
    return (
      <div className="scene scene--inventory">
        <div className="inventory-scene inventory-scene--loading">角色数据载入中...</div>
      </div>
    );
  }

  const inventoryCapacity = Math.max(character.inventory.capacity ?? 5, character.inventory.items.length, 10);
  const inventorySlots = Array.from({ length: inventoryCapacity }, (_, index) => character.inventory.items[index] ?? null);

  const handleDragStart = (event: DragStartEvent) => {
    const item = event.active.data.current?.item as EquipmentItem | undefined;
    onItemTooltipChange(null);
    setActiveItem(item ?? null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveItem(null);
    onItemTooltipChange(null);
    const item = event.active.data.current?.item as EquipmentItem | undefined;
    const source = event.active.data.current?.source as 'inventory' | 'equipment' | undefined;
    const targetType = event.over?.data.current?.type as 'equip-slot' | 'inventory-slot' | undefined;
    const targetSlot = event.over?.data.current?.slot as EquipmentItem['slot'] | undefined;

    if (!item || !event.over) {
      return;
    }

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
      <div className="scene__banner scene__banner--center">左侧是角色面板，右侧是背包区。拖拽装备与背包可穿戴或卸下。</div>

      <DndContext sensors={sensors} onDragEnd={handleDragEnd} onDragStart={handleDragStart}>
        <div className="inventory-scene">
          <div className="inventory-scene__panel">
            <CharacterPanel
              character={character}
              pendingAction={pendingAction}
              onUpgradeAttribute={upgradeAttribute}
              onItemTooltipChange={onItemTooltipChange}
            />
          </div>

          <div className="inventory-scene__bag">
            <div className="inventory-scene__bag-head">
              <div className="inventory-scene__bag-title">背包</div>
              <div className="inventory-scene__bag-meta">{character.inventory.count} / {inventoryCapacity}</div>
            </div>

            <div className="inventory-scene__grid">
              {inventorySlots.map((item, index) => (
                <InventoryCell
                  key={`inventory-slot-${index}`}
                  index={index}
                  item={item}
                  onItemTooltipChange={onItemTooltipChange}
                />
              ))}
            </div>
          </div>
        </div>

        <DragOverlay>
          {activeItem ? (
            <div className="item-slot-overlay">
              <ItemSlot compact item={activeItem} variant="inventory" />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
