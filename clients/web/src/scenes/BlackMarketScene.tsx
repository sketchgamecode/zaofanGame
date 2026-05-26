/**
 * BlackMarketScene.tsx
 *
 * 商店场景（神机营 / 内务府）。
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
import { DraggableItemSlot, ItemDragPreview, ItemSlot } from '../components/ui/ItemSlot';
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
  return shopType === 'weapon' ? '神机营' : '内务府';
}

function getShopFlavor(shopType: ShopType) {
  return shopType === 'weapon'
    ? '军械案牍齐备，刀枪甲胄明码交易。'
    : '宫中旧物流转宫外，真假成色各凭眼力。';
}

function getShopNpc(shopType: ShopType) {
  return shopType === 'weapon' ? '神机营军需官' : '内务府采办';
}

function getShopIntroLines(shopType: ShopType) {
  return shopType === 'weapon'
    ? [
        '神机营军械入册出库，刀枪弓弩、甲胄护具皆可照价购买，莫问来路，只看银钱。',
        '营中器械不赊不欠。想换趁手兵刃，先看货色，再掂掂自个儿的钱袋。',
        '凡在此处买走的军械，皆有营中火漆为凭。拿去办差用，别说是偷来的便成。',
      ]
    : [
        '这批物件是宫里娘娘身边人托出来的，簪环佩饰都有讲究，不过真假还得凭客官眼力。',
        '内务府只管牵线，不管故事。说是宫里流出的，也有几件像是外头人硬往宫里攀的。',
        '娘娘们换下来的旧物最讲缘分，灵不灵另说，体面总是有几分的。',
      ];
}

function pickIntroLine(shopType: ShopType) {
  const lines = getShopIntroLines(shopType);
  return lines[Math.floor(Math.random() * lines.length)];
}

function SceneNpcIntro({
  line,
  npcName,
  placeName,
  onContinue,
}: {
  line: string;
  npcName: string;
  placeName: string;
  onContinue: () => void;
}) {
  return (
    <button className="blackmarket-scene__intro" type="button" onClick={onContinue}>
      <div className="blackmarket-scene__intro-panel">
        <div className="blackmarket-scene__intro-place">{placeName}</div>
        <div className="blackmarket-scene__intro-npc">{npcName}</div>
        <p>{line}</p>
        <span>点击继续</span>
      </div>
    </button>
  );
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
    runServerAction,
    unequipItem,
    upgradeAttribute,
  } = useGameState();
  const { setTooltip } = useItemTooltip();

  const [market, setMarket] = useState<BlackMarketView | null>(null);
  const [activeItem, setActiveItem] = useState<EquipmentItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const [requestError, setRequestError] = useState<string | null>(null);
  const [introLine, setIntroLine] = useState(() => pickIntroLine(shopType));
  const [introDismissed, setIntroDismissed] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 8 } }),
  );

  const loadMarket = useCallback(async (force = false) => {
    setPendingAction(force ? 'REFRESH_BLACKMARKET_FORCE' : 'REFRESH_BLACKMARKET');
    setRequestError(null);
    try {
      const data = await runServerAction(
        force ? 'REFRESH_BLACKMARKET_FORCE' : 'REFRESH_BLACKMARKET',
        () => postGameAction<BlackMarketView>('REFRESH_BLACKMARKET', { force }),
      );
      setMarket(data);
    } catch (error) {
      setRequestError(toActionErrorMessage(error, '黑市货单读取失败。'));
    } finally {
      setLoading(false);
      setPendingAction(null);
    }
  }, [runServerAction]);

  useEffect(() => { void loadMarket(false); }, [loadMarket]);

  useEffect(() => {
    setIntroLine(pickIntroLine(shopType));
    setIntroDismissed(false);
  }, [shopType]);

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
      const data = await runServerAction(`BUY_ITEM:${item.id}`, async () => {
        const result = await postGameAction<BuyItemView>('BUY_ITEM', { itemId: item.id });
        await refreshCharacterInfo();
        return result;
      });
      applyRemainingMarketItems(data.remainingItems, data.nextAutoRefreshMs);
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
      const data = await runServerAction(`BUY_AND_EQUIP_ITEM:${item.id}`, async () => {
        const result = await postGameAction<BuyAndEquipView>('BUY_AND_EQUIP_ITEM', { itemId: item.id });
        await refreshCharacterInfo();
        return result;
      });
      applyRemainingMarketItems(data.remainingItems, data.nextAutoRefreshMs);
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
      await runServerAction(`SELL_ITEM:${item.id}`, async () => {
        await postGameAction<SellItemView>('SELL_ITEM', { itemId: item.id });
        await refreshCharacterInfo();
      });
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

      {!introDismissed ? (
        <div className={`blackmarket-scene blackmarket-scene--${shopType}`}>
          <SceneNpcIntro
            line={introLine}
            npcName={getShopNpc(shopType)}
            placeName={getShopTitle(shopType)}
            onContinue={() => setIntroDismissed(true)}
          />
        </div>
      ) : (
      <DndContext sensors={sensors} onDragEnd={handleDragEnd} onDragStart={handleDragStart}>
        <div className={`blackmarket-scene blackmarket-scene--${shopType}`}>

          {/* 左侧角色面板 */}
          <div className="blackmarket-scene__character">
            <CharacterPanel
              character={character}
              highlightedEquipmentSlot={activeItem?.slot ?? null}
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
                          <DraggableItemSlot
                            compareItem={character.equipment.equipped[item.slot]}
                            item={item}
                            source="shop"
                            variant="shop"
                          />
                        ) : (
                          <ItemSlot item={null} variant="shop" />
                        )}
                      </div>
                    ))}
                  </div>
                )}

                <div className="blackmarket-scene__sell-copy">把行囊或身上的装备拖到这里出售。</div>
              </ShopSellZone>
            </div>
          </section>

          {/* 右下背包抽屉 */}
          <aside className="blackmarket-scene__ledger">
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
        <DragOverlay dropAnimation={null}>
          {activeItem ? (
            <div className="item-slot-overlay">
              <ItemDragPreview item={activeItem} />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
      )}
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
