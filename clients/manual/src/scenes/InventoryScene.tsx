import {
  DndContext,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import { useState } from 'react';
import { CharacterPanel } from '../components/character/CharacterPanel';
import { useGameState } from '../state/GameStateContext';
import type { EquipmentItem } from '../types/game';

type ItemTooltipState = {
  item: EquipmentItem;
  x: number;
  y: number;
};

function InventoryItemCard({
  item,
  onItemTooltipChange,
}: {
  item: EquipmentItem;
  onItemTooltipChange: (nextValue: ItemTooltipState | null) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `inventory-item:${item.id}`,
    data: {
      source: 'inventory',
      item,
    },
  });

  return (
    <button
      ref={setNodeRef}
      className="inventory-item-card"
      style={{
        transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
        opacity: isDragging ? 0.2 : 1,
      }}
      type="button"
      {...listeners}
      {...attributes}
      onPointerEnter={(event) => {
        onItemTooltipChange({
          item,
          x: event.clientX,
          y: event.clientY,
        });
      }}
      onPointerMove={(event) => {
        onItemTooltipChange({
          item,
          x: event.clientX,
          y: event.clientY,
        });
      }}
      onPointerLeave={() => onItemTooltipChange(null)}
    >
      <div className="inventory-item-card__name">{item.name}</div>
      <div className="inventory-item-card__sub">
        {item.armor ? `护甲 ${item.armor}` : item.weaponDamage ? `伤害 ${item.weaponDamage.min}-${item.weaponDamage.max}` : '装备'}
      </div>
    </button>
  );
}

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
      {item ? <InventoryItemCard item={item} onItemTooltipChange={onItemTooltipChange} /> : <span className="inventory-scene__empty">空位</span>}
    </div>
  );
}

export function InventoryScene() {
  const {
    character,
    pendingAction,
    upgradeAttribute,
    equipItem,
    unequipItem,
  } = useGameState();
  const [activeItem, setActiveItem] = useState<EquipmentItem | null>(null);
  const [tooltip, setTooltip] = useState<ItemTooltipState | null>(null);

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
    setActiveItem(item ?? null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveItem(null);
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
              onItemTooltipChange={setTooltip}
            />
          </div>

          <div className="inventory-scene__bag">
            <div className="inventory-scene__bag-head">
              <div className="inventory-scene__bag-title">背包</div>
              <div className="inventory-scene__bag-meta">{character.inventory.count} / {inventoryCapacity}</div>
            </div>

            <div className="inventory-scene__grid">
              {inventorySlots.map((item, index) => (
                <InventoryCell key={`inventory-slot-${index}`} index={index} item={item} onItemTooltipChange={setTooltip} />
              ))}
            </div>
          </div>
        </div>

        <DragOverlay>
          {activeItem ? (
            <div className="inventory-item-card inventory-item-card--overlay">
              <div className="inventory-item-card__name">{activeItem.name}</div>
              <div className="inventory-item-card__sub">拖拽中</div>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      {tooltip ? (
        <div className="item-tooltip" style={{ left: `${tooltip.x + 18}px`, top: `${tooltip.y + 18}px` }}>
          <div className="item-tooltip__name">{tooltip.item.name}</div>
          <div className="item-tooltip__line">{tooltip.item.description}</div>
          {tooltip.item.weaponDamage ? (
            <div className="item-tooltip__line">伤害 {tooltip.item.weaponDamage.min} - {tooltip.item.weaponDamage.max}</div>
          ) : null}
          {tooltip.item.armor ? <div className="item-tooltip__line">护甲 {tooltip.item.armor}</div> : null}
          <div className="item-tooltip__line">售价 {tooltip.item.sellPrice} 铜钱</div>
          <div className="item-tooltip__line item-tooltip__line--muted">
            {Object.entries(tooltip.item.bonusAttributes)
              .map(([key, value]) => `${key} ${value && value > 0 ? `+${value}` : value}`)
              .join(' / ') || '无附加属性'}
          </div>
        </div>
      ) : null}
    </div>
  );
}
