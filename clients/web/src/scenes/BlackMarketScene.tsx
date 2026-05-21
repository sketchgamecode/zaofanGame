/**
 * BlackMarketScene.tsx
 *
 * 商店场景（兵器铺 / 奇珍阁）。
 * 使用 DroppableSlot / DroppableDraggableSlot，无 onItemTooltipChange 传递链。
 * Tooltip 由全局 tooltipStore 驱动。
 */

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
import { useCallback, useEffect, useMemo, useState } from 'react';
import { postGameAction } from '../api/gameApi';
import { CharacterPanel } from '../components/character/CharacterPanel';
import { DroppableDraggableSlot } from '../components/ui/DroppableSlot';
import { DraggableItemSlot, ItemSlot } from '../components/ui/ItemSlot';
import { ResourceBadge } from '../components/ui/ResourceBadge';
import { formatCountdown } from '../lib/formatters';
import { toActionErrorMessage } from '../lib/manualErrors';
import { useItemTooltip } from '../state/tooltipStore';
import { useGameState } from '../state/GameStateContext';
import type {
  BlackMarketView,
  BuyAndEquipView,
  BuyItemView,
  EquipmentItem,
  EquipmentSlot,
  SellItemView,
} from '../types/game';

type ShopType = 'weapon' | 'magic';

const WEAPON_SHOP_SLOTS: EquipmentSlot[] = ['weapon', 'offHand', 'head', 'body', 'hands', 'feet'];

function getShopTypeForItem(item: EquipmentItem): ShopType {
  return WEAPON_SHOP_SLOTS.includes(item.slot) ? 'weapon' : 'magic';
}

function getShopTitle(shopType: ShopType) {
  return shopType === 'weapon' ? '兵器铺' : '奇珍阁';
}

function getShopFlavor(shopType: ShopType) {
  return shopType === 'weapon'
    ? '铁瞎子守着满墙刀枪甲胄，先看货，再谈命。'
    : '杜半仙把符器饰物摆在烛火里，灵不灵另算，钱先收。';
}

function getShopNpc(shopType: ShopType) {
  return shopType === 'weapon' ? '铁瞎子' : '杜半仙';
}

// ── 出售拖拽区 ────────────────────────────────────────────────────
function ShopSellZone({ children }: { children: React.ReactNode }) {
  const { isOver, setNodeRef } = useDroppable({
    id: 'shop-sell-zone',
    data: { type: 'shop-sell-zone' },
  });

  return (
    <div
      ref={setNodeRef}
      className={`blackmarket-scene__sell-zone${isOver ? ' blackmarket-scene__sell-zone--over' : ''}`}
    >
      {children}
    </div>
  );
}

// ── 商店主体 ──────────────────────────────────────────────────────
function ShopScene({ shopType }: { shopType: ShopType }) {
  const {
    character,
    equipItem,
    pendingAction: characterPendingAction,
    refreshCharacterInfo,
    unequipItem,
    upgradeAttribute,
  } = useGameState();
  const { setTooltip } = useItemTooltip();

  const [market, setMarket] = useState<BlackMarketView | null>(null);
  const [activeItem, setActiveItem] = useState<EquipmentItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const [requestError, setRequestError] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 8 } }),
  );

  const loadMarket = useCallback(async (force = false) => {
    setPendingAction(force ? 'REFRESH_BLACKMARKET_FORCE' : 'REFRESH_BLACKMARKET');
    setRequestError(null);
    try {
      const data = await postGameAction<BlackMarketView>('REFRESH_BLACKMARKET', { force });
      setMarket(data);
    } catch (error) {
      setRequestError(toActionErrorMessage(error, '黑市货单读取失败。'));
    } finally {
      setLoading(false);
      setPendingAction(null);
    }
  }, []);

  useEffect(() => { void loadMarket(false); }, [loadMarket]);

  // 入场音效
  useEffect(() => {
    const audio = new Audio('/assets/audio/ui_panel_slide_in.ogg');
    audio.volume = 0.6;
    audio.play().catch(() => {});
  }, []);

  const shopItems = useMemo(() => {
    const items = market?.items ?? [];
    return items.filter((item) => getShopTypeForItem(item) === shopType).slice(0, 6);
  }, [market?.items, shopType]);

  const shopSlots = Array.from({ length: 6 }, (_, i) => shopItems[i] ?? null);

  const inventoryCapacity = character
    ? Math.max(character.inventory.capacity ?? 5, character.inventory.items.length, 10)
    : 10;
  const inventoryItems = character
    ? Array.from({ length: inventoryCapacity }, (_, i) => character.inventory.items[i] ?? null)
    : [];

  const refreshCountdown = market ? formatCountdown(market.nextAutoRefreshMs) : '--:--';

  const applyRemainingMarketItems = (remainingItems: EquipmentItem[], nextAutoRefreshMs: number) => {
    setMarket((prev) =>
      prev ? { ...prev, items: remainingItems, nextAutoRefreshMs } : prev,
    );
  };

  const handleBuyToInventory = async (item: EquipmentItem) => {
    setPendingAction(`BUY_ITEM:${item.id}`);
    setRequestError(null);
    try {
      const data = await postGameAction<BuyItemView>('BUY_ITEM', { itemId: item.id });
      applyRemainingMarketItems(data.remainingItems, data.nextAutoRefreshMs);
      await refreshCharacterInfo();
    } catch (error) {
      setRequestError(toActionErrorMessage(error, '买入失败。'));
    } finally {
      setPendingAction(null);
    }
  };

  const handleBuyAndEquip = async (item: EquipmentItem) => {
    setPendingAction(`BUY_AND_EQUIP_ITEM:${item.id}`);
    setRequestError(null);
    try {
      const data = await postGameAction<BuyAndEquipView>('BUY_AND_EQUIP_ITEM', { itemId: item.id });
      applyRemainingMarketItems(data.remainingItems, data.nextAutoRefreshMs);
      await refreshCharacterInfo();
    } catch (error) {
      setRequestError(toActionErrorMessage(error, '购买并穿戴失败。'));
    } finally {
      setPendingAction(null);
    }
  };

  const handleSell = async (item: EquipmentItem) => {
    setPendingAction(`SELL_ITEM:${item.id}`);
    setRequestError(null);
    try {
      await postGameAction<SellItemView>('SELL_ITEM', { itemId: item.id });
      await refreshCharacterInfo();
    } catch (error) {
      setRequestError(toActionErrorMessage(error, '出售失败。'));
    } finally {
      setPendingAction(null);
    }
  };

  const handleDragStart = (event: DragStartEvent) => {
    const item = event.active.data.current?.item as EquipmentItem | undefined;
    setTooltip(null);
    setActiveItem(item ?? null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveItem(null);
    setTooltip(null);

    const item = event.active.data.current?.item as EquipmentItem | undefined;
    const source = event.active.data.current?.source as 'inventory' | 'equipment' | 'shop' | undefined;
    const targetType = event.over?.data.current?.type as 'equip-slot' | 'inventory-slot' | 'shop-sell-zone' | undefined;
    const targetSlot = event.over?.data.current?.slot as EquipmentSlot | undefined;

    if (!item || !event.over || pendingAction) return;

    if (source === 'shop' && targetType === 'inventory-slot') {
      void handleBuyToInventory(item);
      return;
    }

    if (source === 'shop' && targetType === 'equip-slot' && targetSlot === item.slot) {
      void handleBuyAndEquip(item);
      return;
    }

    if (source === 'inventory' && targetType === 'equip-slot' && targetSlot === item.slot) {
      void equipItem(item.id);
      return;
    }

    if (source === 'equipment' && targetType === 'inventory-slot') {
      void unequipItem(item.slot);
      return;
    }

    if ((source === 'inventory' || source === 'equipment') && targetType === 'shop-sell-zone') {
      void handleSell(item);
    }
  };

  if (!character) {
    return (
      <div className="scene scene--blackmarket scene-status">
        <div className="scene-status__panel">角色数据载入中...</div>
      </div>
    );
  }

  return (
    <div className="scene scene--blackmarket">
      {requestError ? <div className="scene-error-banner">{requestError}</div> : null}

      <DndContext sensors={sensors} onDragEnd={handleDragEnd} onDragStart={handleDragStart}>
        <div className={`blackmarket-scene blackmarket-scene--${shopType}`}>

          {/* 左侧角色面板 */}
          <div className="blackmarket-scene__character">
            <CharacterPanel
              character={character}
              pendingAction={characterPendingAction}
              onUpgradeAttribute={upgradeAttribute}
            />
          </div>

          {/* 右上商店货架 */}
          <section className={`blackmarket-scene__shop blackmarket-scene__shop--${shopType}`}>
            <header className="blackmarket-scene__shop-header">
              <div>
                <div className="blackmarket-scene__title">{getShopTitle(shopType)}</div>
                <div className="blackmarket-scene__flavor">{getShopFlavor(shopType)}</div>
              </div>
              <button className="blackmarket-scene__info" type="button" aria-label="店铺信息">i</button>
              <button
                className="blackmarket-scene__refresh"
                disabled={pendingAction !== null}
                type="button"
                onClick={() => void loadMarket(true)}
              >
                {pendingAction === 'REFRESH_BLACKMARKET_FORCE' ? '换货中...' : '换批货 · 1 令牌'}
              </button>
            </header>

            <div className="blackmarket-scene__npc" aria-hidden="true">
              <span>{getShopNpc(shopType)}</span>
            </div>

            <div className="blackmarket-scene__body">
              <ShopSellZone>
                <div className="blackmarket-scene__goods-head">
                  <span>货架</span>
                  <span>免费刷新 {refreshCountdown}</span>
                </div>

                {loading && !market ? (
                  <div className="blackmarket-scene__loading">正在盘货...</div>
                ) : (
                  <div className="blackmarket-scene__goods-grid">
                    {shopSlots.map((item, index) => (
                      <div
                        key={item?.id ?? `empty-shop-slot-${index}`}
                        className="blackmarket-scene__goods-cell"
                      >
                        {item ? (
                          <DraggableItemSlot item={item} source="shop" variant="shop" />
                        ) : (
                          <ItemSlot item={null} variant="shop" />
                        )}
                      </div>
                    ))}
                  </div>
                )}

                <div className="blackmarket-scene__sell-copy">把背包或身上的装备拖到这里出售。</div>
              </ShopSellZone>
            </div>
          </section>

          {/* 右下背包抽屉 */}
          <aside className="blackmarket-scene__ledger">
            <div className="blackmarket-scene__resources">
              <ResourceBadge label="铜钱" type="copper" value={character.resources.copper} />
              <ResourceBadge label="令牌" type="token" value={character.resources.tokens} />
            </div>
            <div className="blackmarket-scene__inventory-head">
              <span>随身行囊</span>
              <span>{character.inventory.count} / {inventoryCapacity}</span>
            </div>
            <div className="blackmarket-scene__inventory-grid">
              {inventoryItems.map((item, index) => (
                <DroppableDraggableSlot
                  key={`shop-inventory-slot-${index}`}
                  className="blackmarket-scene__inventory-cell"
                  droppableId={`shop-inventory-slot:${index}`}
                  droppableData={{ type: 'inventory-slot', index }}
                  item={item}
                  source="inventory"
                  variant="inventory"
                />
              ))}
            </div>
          </aside>
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

export function WeaponShopScene() {
  return <ShopScene shopType="weapon" />;
}

export function MagicShopScene() {
  return <ShopScene shopType="magic" />;
}

export function BlackMarketScene() {
  return <ShopScene shopType="weapon" />;
}
