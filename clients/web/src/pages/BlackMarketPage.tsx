import React, { useEffect, useState } from 'react';
import { 
  DndContext, 
  DragOverlay, 
  useSensor, 
  useSensors, 
  PointerSensor, 
  TouchSensor 
} from '@dnd-kit/core';
import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core';
import { useCharacter } from '../hooks/useCharacter';
import { useBlackMarket } from '../hooks/useBlackMarket';
import { PlayerPanel } from '../components/blackmarket/PlayerPanel';
import { ShopPanel } from '../components/blackmarket/ShopPanel';
import { SmartTooltip } from '../components/blackmarket/SmartTooltip';
import type { EquipmentItem } from '../types/character';
import { ErrorToast } from '../components/common/ErrorToast';
import { getEquipmentIconPath } from '../lib/assets';

type ShopType = 'weapon' | 'magic';

export function BlackMarketPage() {
  const { character, loadCharacter } = useCharacter();
  const { 
    market, 
    loading: marketLoading, 
    refreshing: marketRefreshing, 
    apiError: marketError, 
    pendingOperation,
    loadMarket, 
    refreshMarket, 
    buyAndEquip 
  } = useBlackMarket();

  const [activeShop, setActiveShop] = useState<ShopType>('weapon');
  const [hoveredItem, setHoveredItem] = useState<EquipmentItem | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number, y: number } | null>(null);
  const [activeDragItem, setActiveDragItem] = useState<EquipmentItem | null>(null);
  const [overSlotId, setOverSlotId] = useState<string | null>(null);

  // Initialize data
  useEffect(() => {
    void loadCharacter();
    void loadMarket();
  }, [loadCharacter, loadMarket]);

  // Sync tooltip pos with mouse if hovering
  useEffect(() => {
    if (!hoveredItem) return;
    
    const handleMouseMove = (e: MouseEvent) => {
      setTooltipPos({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [hoveredItem]);

  const handleHoverStart = (item: EquipmentItem, element: HTMLElement) => {
    setHoveredItem(item);
    const rect = element.getBoundingClientRect();
    setTooltipPos({ x: rect.left, y: rect.top });
  };

  const handleHoverEnd = () => {
    setHoveredItem(null);
    setTooltipPos(null);
  };

  // DnD Sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5, // 5px movement required before drag starts
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 150,
        tolerance: 5,
      },
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const item = active.data.current?.item as EquipmentItem;
    if (item) {
      setActiveDragItem(item);
      handleHoverEnd(); // hide tooltip during drag
    }
  };

  const handleDragOver = (event: DragEndEvent) => {
    const { over } = event;
    if (over) {
      setOverSlotId(String(over.id));
    } else {
      setOverSlotId(null);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveDragItem(null);
    setOverSlotId(null);
    
    const { active, over } = event;
    if (!over) return;

    const dragItem = active.data.current?.item as EquipmentItem;
    const dropSlotId = String(over.id);
    const expectedSlotId = `equip-slot-${dragItem.slot}`;

    if (dropSlotId === expectedSlotId) {
      // Valid drop, check copper
      if (character && character.resources.copper >= (dragItem.price ?? 0)) {
        const success = await buyAndEquip(dragItem.id);
        if (success) {
          void loadCharacter(true); // reload character to see updated stats
        }
      } else {
        // Not enough copper, could show a local toast
      }
    }
  };

  const handleDoubleClick = async (item: EquipmentItem) => {
     if (character && character.resources.copper >= (item.price ?? 0)) {
        const success = await buyAndEquip(item.id);
        if (success) {
          void loadCharacter(true);
        }
      }
  };

  if (marketError) {
    return (
      <div className="min-h-screen bg-[#050406] flex items-center justify-center flex-col gap-4 text-stone-100 p-4">
         <ErrorToast title="加载失败" message={marketError.userMessage} hint={marketError.debugMessage} />
         <button onClick={() => loadMarket()} className="mt-4 rounded-full border border-stone-800/80 bg-black/20 px-4 py-2 text-sm">重试</button>
      </div>
    );
  }

  if (!character || !market) {
    return (
      <div className="min-h-screen bg-[#050406] flex items-center justify-center flex-col gap-4 text-stone-100">
        <div className="h-10 w-10 rounded-full border-4 border-indigo-900/40 border-t-indigo-400 animate-spin" />
        <p className="text-sm tracking-[0.35em] text-stone-500 uppercase">加载黑市</p>
      </div>
    );
  }

  // Filter items
  const weaponShopSlots = ['weapon', 'head', 'body', 'hands', 'feet', 'offHand'];
  const magicShopSlots = ['neck', 'belt', 'ring', 'trinket', 'offHand'];
  
  const currentShopItems = market.items.filter(item => {
    if (activeShop === 'weapon') return weaponShopSlots.includes(item.slot);
    return magicShopSlots.includes(item.slot);
  });

  const equippedItemForHover = hoveredItem ? character.equipment.equipped[hoveredItem.slot] : null;
  const isActionPending = pendingOperation !== null || marketRefreshing;

  return (
    <DndContext 
      sensors={sensors}
      onDragStart={handleDragStart} 
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="min-h-screen bg-[#050406] text-stone-100 flex flex-col p-4 pb-28 pt-[max(1rem,env(safe-area-inset-top))]">
        {marketError && (
           <div className="mb-4">
             <ErrorToast title="操作失败" message={marketError.userMessage} />
           </div>
        )}

        {/* Shop Tabs */}
        <div className="flex bg-stone-900/80 rounded-2xl p-1 mb-4 shrink-0 shadow-lg border border-stone-800">
          <button
            onClick={() => setActiveShop('weapon')}
            className={`flex-1 py-2 text-sm font-bold rounded-xl transition-colors ${
              activeShop === 'weapon' 
                ? 'bg-amber-900/40 text-amber-100 border border-amber-700/50' 
                : 'text-stone-500 hover:text-stone-300'
            }`}
          >
            兵器铺
          </button>
          <button
            onClick={() => setActiveShop('magic')}
            className={`flex-1 py-2 text-sm font-bold rounded-xl transition-colors ${
              activeShop === 'magic' 
                ? 'bg-purple-900/40 text-purple-100 border border-purple-700/50' 
                : 'text-stone-500 hover:text-stone-300'
            }`}
          >
            奇珍阁
          </button>
        </div>

        {/* Main Content Area: Flex row for tablet/desktop, flex-col for small mobile but try side-by-side if possible */}
        <div className="flex-1 flex flex-col md:flex-row gap-4 min-h-0">
          <div className="flex-1 md:flex-[0.45] min-w-0">
            <PlayerPanel 
              character={character} 
              activeDragSlot={activeDragItem?.slot ?? null}
              overSlotId={overSlotId}
            />
          </div>
          <div className="flex-1 md:flex-[0.55] min-w-0">
            <ShopPanel 
              shopType={activeShop}
              items={currentShopItems}
              tokens={character.resources.tokens}
              copper={character.resources.copper}
              isRefreshing={isActionPending}
              onRefresh={() => refreshMarket(true)}
              onHoverStart={handleHoverStart}
              onHoverEnd={handleHoverEnd}
              onDoubleClickItem={handleDoubleClick}
              nextAutoRefreshMs={market.nextAutoRefreshMs}
            />
          </div>
        </div>

        {/* Tooltip Portal */}
        {hoveredItem && !activeDragItem && (
          <SmartTooltip 
            item={hoveredItem} 
            equippedItem={equippedItemForHover} 
            position={tooltipPos} 
          />
        )}

        {/* Drag Overlay */}
        <DragOverlay zIndex={1000}>
          {activeDragItem ? (
            <div className="w-20 h-20 bg-stone-900/80 rounded-xl border-2 border-indigo-500 shadow-2xl flex items-center justify-center p-2 opacity-90 scale-110">
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
}
