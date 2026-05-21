/**
 * ItemTooltip.tsx
 *
 * 全局唯一的物品信息浮窗。
 * 直接从 useItemTooltip() 读取状态，不接收任何 props。
 * 必须在 <TooltipProvider> 内使用（ManualGameApp 层挂载）。
 *
 * 渲染在 OverlayRoot 内，不受 SceneViewport overflow:hidden 裁剪。
 */

import { useItemTooltip } from '../../state/tooltipStore';
import type { EquipmentItem } from '../../types/game';

// ── 格式化辅助 ────────────────────────────────────────────────────

const RARITY_LABELS: Record<number, string> = {
  0: '普通',
  1: '精良',
  2: '稀有',
  3: '史诗',
  4: '传说',
};

const SLOT_LABELS: Record<EquipmentItem['slot'], string> = {
  head: '头部',
  body: '上衣',
  hands: '护手',
  feet: '鞋子',
  neck: '项链',
  belt: '腰带',
  ring: '戒指',
  trinket: '饰品',
  weapon: '武器',
  offHand: '副手',
};

function formatMainStat(item: EquipmentItem): string {
  if (item.weaponDamage) {
    return `伤害  ${item.weaponDamage.min} – ${item.weaponDamage.max}`;
  }
  if (item.armor) {
    return `护甲  ${item.armor}`;
  }
  return '装备';
}

function formatBonusAttributes(item: EquipmentItem): string {
  const entries = Object.entries(item.bonusAttributes);
  if (entries.length === 0) return '无附加属性';
  return entries
    .map(([key, value]) => `${key}  ${value && value > 0 ? `+${value}` : value}`)
    .join('　');
}

// ── 组件 ──────────────────────────────────────────────────────────

export function ItemTooltip() {
  const { tooltip } = useItemTooltip();

  if (!tooltip) return null;

  const { item, priceMode = 'sell', x, y } = tooltip;
  const priceLabel = priceMode === 'buy' ? '买价' : '售价';
  const priceValue = priceMode === 'buy' ? item.price ?? item.sellPrice : item.sellPrice;

  return (
    <div
      className="item-tooltip"
      style={{
        left: `${x + 18}px`,
        top: `${y + 18}px`,
      }}
    >
      <div className={`item-tooltip__name item-tooltip__name--rarity-${item.rarity}`}>
        {item.name}
      </div>
      <div className="item-tooltip__rarity">{RARITY_LABELS[item.rarity] ?? '普通'}</div>
      <div className="item-tooltip__divider" />
      <div className="item-tooltip__line">部位：{SLOT_LABELS[item.slot] ?? item.slot}</div>
      <div className="item-tooltip__line">{formatMainStat(item)}</div>
      {item.description ? (
        <div className="item-tooltip__line item-tooltip__line--flavor">{item.description}</div>
      ) : null}
      <div className="item-tooltip__divider" />
      <div className="item-tooltip__line item-tooltip__line--muted">
        {formatBonusAttributes(item)}
      </div>
      <div className="item-tooltip__line item-tooltip__line--price">
        {priceLabel}　{priceValue} 铜钱
      </div>
    </div>
  );
}

// 保留类型导出，兼容可能还在引用 ItemTooltipState 的外部文件
export type { ItemTooltipState } from '../../state/tooltipStore';
