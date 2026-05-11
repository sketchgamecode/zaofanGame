import React, { useEffect, useState } from 'react';
import { 
  DndContext, 
  DragOverlay, 
  useSensor, 
  useSensors, 
  PointerSensor, 
  TouchSensor 
} from '@dnd-kit/core';
import type { DragEndEvent, DragStartEvent, Modifier } from '@dnd-kit/core';
import { useCharacter } from '../hooks/useCharacter';
import { useBlackMarket } from '../hooks/useBlackMarket';
import { CharacterPanel } from '../components/character/CharacterPanel';
import type { EquipmentItem } from '../types/character';
import { getEquipmentIconPath } from '../lib/assets';
import { ErrorToast } from '../components/common/ErrorToast';
import { useGameScale } from '../components/layout/GameContainer';
import { SideMenu } from '../components/layout/SideMenu';
import type { AppTab } from '../App';

type MainLayoutProps = {
  children: React.ReactNode;
  activeTab: AppTab;
  onTabChange: (tab: AppTab) => void;
};

export const MainLayout: React.FC<MainLayoutProps> = ({ children, activeTab, onTabChange }) => {
  const { character, setCharacter, loadCharacter, equipItem, unequipItem } = useCharacter();
  const { market, buyAndEquip, buyItem, sellItem } = useBlackMarket();
  const { scale } = useGameScale();
  
  const [activeDragItem, setActiveDragItem] = useState<EquipmentItem | null>(null);

  useEffect(() => {
    void loadCharacter();
  }, [loadCharacter]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 150,
        tolerance: 5,
      },
    })
  );

  // 由于已经移除了 GameContainer 的 CSS scale，这里不再需要 scaleModifier
  const scaleModifier: Modifier = ({ transform }) => {
    return transform;
  };

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const item = active.data.current?.item as EquipmentItem;
    if (item) {
      setActiveDragItem(item);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveDragItem(null);
    const { active, over } = event;
    if (!over) return;

    const dragItem = active.data.current?.item as EquipmentItem;
    const dragType = active.data.current?.type as 'inventory_item' | 'equip_item' | 'shop_item';
    const dropType = over.data.current?.type as 'equip_slot' | 'inventory_slot' | 'shop_sell_zone';
    
    if (!dragItem) return;

    try {
      // 1. Inventory -> Equip Slot (Equip)
      if (dragType === 'inventory_item' && dropType === 'equip_slot') {
        const targetSlot = over.data.current?.slot;
        if (targetSlot === dragItem.slot) {
          await equipItem(dragItem.id);
        }
      }
      
      // 2. Equip -> Inventory Slot (Unequip)
      else if (dragType === 'equip_item' && dropType === 'inventory_slot') {
        await unequipItem(dragItem.slot);
      }
      
      // 3. Shop -> Equip Slot (Buy & Equip)
      else if (dragType === 'shop_item' && dropType === 'equip_slot') {
        const targetSlot = over.data.current?.slot;
        if (targetSlot === dragItem.slot) {
          if (character && character.resources.copper >= (dragItem.price ?? 0)) {
            await buyAndEquip(dragItem.id);
          }
        }
      }
      
      // 4. Shop -> Inventory Slot (Buy to Bag)
      else if (dragType === 'shop_item' && dropType === 'inventory_slot') {
        if (character && character.resources.copper >= (dragItem.price ?? 0)) {
          // Check if inventory has space
          const invCount = character.inventory.items.length;
          const invCap = character.inventory.capacity ?? 5;
          if (invCount < invCap) {
             const success = await buyItem(dragItem.id);
             if (success) {
               // Mock Update Character
               setCharacter(prev => {
                 if (!prev) return prev;
                 return {
                   ...prev,
                   resources: { ...prev.resources, copper: prev.resources.copper - (dragItem.price ?? 0) },
                   inventory: { ...prev.inventory, items: [...prev.inventory.items, dragItem] }
                 };
               });
             }
          }
        }
      }
      
      // 5. Inventory -> Shop Sell Zone (Sell)
      else if (dragType === 'inventory_item' && dropType === 'shop_sell_zone') {
        const confirmSell = window.confirm(`是否确定出售 [${dragItem.name}] 获得 ${dragItem.sellPrice ?? 0} 铜钱？`);
        if (confirmSell) {
          const success = await sellItem(dragItem.id);
          if (success) {
            // Mock Update Character
            setCharacter(prev => {
              if (!prev) return prev;
              return {
                ...prev,
                resources: { ...prev.resources, copper: prev.resources.copper + (dragItem.sellPrice ?? 0) },
                inventory: { ...prev.inventory, items: prev.inventory.items.filter(i => i.id !== dragItem.id) }
              };
            });
          }
        }
      }
    } catch (e) {
      console.error('DnD Action Failed:', e);
    }
  };

  if (!character) {
    return (
      <div className="h-full bg-[#050406] flex items-center justify-center flex-col gap-4 text-stone-100">
        <div className="h-10 w-10 rounded-full border-4 border-indigo-900/40 border-t-indigo-400 animate-spin" />
        <p className="text-sm tracking-[0.35em] text-stone-500 uppercase">加载角色数据</p>
      </div>
    );
  }

  return (
    <DndContext 
      sensors={sensors}
      modifiers={[scaleModifier]}
      onDragStart={handleDragStart} 
      onDragEnd={handleDragEnd}
    >
      <div className="flex h-full bg-[#050406] overflow-hidden relative">
        
        {/* Left Global Menu: SideMenu */}
        <SideMenu activeTab={activeTab} onTabChange={onTabChange} />

        {/* Right Content Area */}
        <div className="flex-1 relative overflow-y-auto custom-scrollbar">
          {children}
        </div>

        {/* Drag Overlay */}
        <DragOverlay zIndex={1000}>
          {activeDragItem ? (
            <div className="w-16 h-16 bg-stone-900/80 rounded-xl border-2 border-indigo-500 shadow-2xl flex items-center justify-center p-2 opacity-90 scale-110 pointer-events-none">
              <img 
                src={getEquipmentIconPath(activeDragItem)} 
                alt={activeDragItem.name} 
                className="w-full h-full object-contain"
                onError={e => e.currentTarget.style.display='none'} 
              />
            </div>
          ) : null}
        </DragOverlay>

      </div>
    </DndContext>
  );
};
