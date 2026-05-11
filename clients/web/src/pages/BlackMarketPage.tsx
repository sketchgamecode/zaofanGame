import React, { useEffect, useState } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { useCharacter } from '../hooks/useCharacter';
import { useBlackMarket } from '../hooks/useBlackMarket';
import { ShopPanel } from '../components/blackmarket/ShopPanel';
import { SmartTooltip } from '../components/blackmarket/SmartTooltip';
import type { EquipmentItem } from '../types/character';
import { ErrorToast } from '../components/common/ErrorToast';
import { CharacterPanel } from '../components/character/CharacterPanel';
import { InventoryPanel } from '../components/character/InventoryPanel';

type ShopType = 'weapon' | 'magic';

type BlackMarketPageProps = {
  shopType: ShopType;
};

export function BlackMarketPage({ shopType }: BlackMarketPageProps) {
  const { character } = useCharacter();
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

  const [hoveredItem, setHoveredItem] = useState<EquipmentItem | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number, y: number } | null>(null);

  // Initialize data
  useEffect(() => {
    void loadMarket();
  }, [loadMarket]);

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

  const handleDoubleClick = async (item: EquipmentItem) => {
     if (character && character.resources.copper >= (item.price ?? 0)) {
        await buyAndEquip(item.id);
      }
  };

  const { isOver, setNodeRef } = useDroppable({
    id: 'shop_sell_zone',
    data: {
      type: 'shop_sell_zone'
    }
  });

  if (marketError) {
    return (
      <div className="flex-1 bg-[#050406] flex items-center justify-center flex-col gap-4 text-stone-100 p-4">
         <ErrorToast title="加载失败" message={marketError.userMessage} hint={marketError.debugMessage} />
         <button onClick={() => loadMarket()} className="mt-4 rounded-full border border-stone-800/80 bg-black/20 px-4 py-2 text-sm">重试</button>
      </div>
    );
  }

  if (!character || !market) {
    return (
      <div className="flex-1 bg-[#050406] flex items-center justify-center flex-col gap-4 text-stone-100 h-full">
        <div className="h-10 w-10 rounded-full border-4 border-indigo-900/40 border-t-indigo-400 animate-spin" />
        <p className="text-sm tracking-[0.35em] text-stone-500 uppercase">加载黑市</p>
      </div>
    );
  }

  // Filter items
  const weaponShopSlots = ['weapon', 'head', 'body', 'hands', 'feet', 'offHand'];
  const magicShopSlots = ['neck', 'belt', 'ring', 'trinket', 'offHand'];
  
  const currentShopItems = market.items.filter(item => {
    if (shopType === 'weapon') return weaponShopSlots.includes(item.slot);
    return magicShopSlots.includes(item.slot);
  });

  const equippedItemForHover = hoveredItem ? character.equipment.equipped[hoveredItem.slot] : null;
  const isActionPending = pendingOperation !== null || marketRefreshing;

  return (
    <div className="flex h-full w-full overflow-hidden">
      {/* Left Area: Character Panel (Fixed Width, 0 gap) */}
      <div className="w-[360px] shrink-0 h-full overflow-hidden bg-[#041124] border-r-2 border-[#b8860b]">
        <CharacterPanel character={character} activeDragType={null} />
      </div>

      {/* Right Area: Shop & Inventory (Fixed Width, 0 gap) */}
      <div 
        ref={setNodeRef}
        className={`w-[480px] shrink-0 flex flex-col h-full overflow-hidden relative ${isOver ? 'bg-red-950/20' : ''}`}
      >
        {isOver && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm border-4 border-dashed border-red-500/50 pointer-events-none">
            <span className="text-4xl font-black text-red-500 tracking-widest drop-shadow-[0_5px_10px_rgba(0,0,0,0.8)]">释放以出售</span>
          </div>
        )}
        
        {/* The Shop */}
        <div className="w-full shrink-0 flex flex-col">
          {/* We remove the standalone title since it's already inside ShopPanel now */}
          <div className="h-[400px]">
            <ShopPanel 
              shopType={shopType}
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

        {/* The Backpack */}
        <div className="w-full shrink-0 -mt-0.5 relative z-10">
          <InventoryPanel character={character} />
        </div>

        {/* Tooltip Portal */}
        {hoveredItem && (
          <SmartTooltip 
            item={hoveredItem} 
            equippedItem={equippedItemForHover} 
            position={tooltipPos} 
          />
        )}
      </div>
      
      {/* Empty space filler for the far right */}
      <div className="flex-1 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-30 mix-blend-overlay pointer-events-none" />
    </div>
  );
}
