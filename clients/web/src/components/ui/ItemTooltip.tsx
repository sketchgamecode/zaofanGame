/**
 * ItemTooltip.tsx
 *
 * 全局唯一的物品信息浮窗。
 * 直接从 useItemTooltip() 读取状态，不接收任何 props。
 */

import { ATTRIBUTE_KEYS, type AttributeKey, type EquipmentItem } from '../../types/game';
import { useItemTooltip } from '../../state/tooltipStore';

const RARITY_LABELS: Record<number, string> = {
  0: '凡品',
  1: '良品',
  2: '珍品',
  3: '绝品',
  4: '神品',
  5: '天命',
};

const SLOT_LABELS: Record<EquipmentItem['slot'], string> = {
  head: '冠帽',
  body: '衣甲',
  hands: '护手',
  feet: '履靴',
  neck: '项饰',
  belt: '腰带',
  ring: '戒指',
  trinket: '佩饰',
  weapon: '兵刃',
  offHand: '副手',
};

const ATTRIBUTE_LABELS: Record<AttributeKey, string> = {
  strength: '膂力',
  intelligence: '谋略',
  agility: '身法',
  constitution: '根骨',
  luck: '气运',
};

type StatLine = {
  key: string;
  label: string;
  value: string;
  compareValue?: number;
  valueNumber?: number;
};

function formatSigned(value: number) {
  return value > 0 ? `+${value}` : `${value}`;
}

function getWeaponAverage(item: EquipmentItem) {
  if (!item.weaponDamage) return undefined;
  return Math.round((item.weaponDamage.min + item.weaponDamage.max) / 2);
}

function getStatLines(item: EquipmentItem, compareItem?: EquipmentItem | null): StatLine[] {
  const lines: StatLine[] = [];

  if (item.weaponDamage || compareItem?.weaponDamage) {
    lines.push({
      key: 'weaponDamage',
      label: '杀伤',
      value: item.weaponDamage ? `${item.weaponDamage.min} - ${item.weaponDamage.max}` : '0 - 0',
      valueNumber: getWeaponAverage(item) ?? 0,
    });
  }

  if (item.armor || compareItem?.armor) {
    lines.push({
      key: 'armor',
      label: '护身',
      value: `${item.armor ?? 0}`,
      valueNumber: item.armor ?? 0,
    });
  }

  for (const key of ATTRIBUTE_KEYS) {
    const value = item.bonusAttributes[key];
    const compareValue = compareItem?.bonusAttributes[key];
    if (!value && !compareValue) continue;
    lines.push({
      key,
      label: ATTRIBUTE_LABELS[key],
      value: formatSigned(value ?? 0),
      valueNumber: value ?? 0,
    });
  }

  if (lines.length === 0) {
    lines.push({
      key: 'empty',
      label: '附加',
      value: '无',
    });
  }

  return lines;
}

function getCompareNumber(compareItem: EquipmentItem | null | undefined, line: StatLine) {
  if (!compareItem) return undefined;

  if (line.key === 'weaponDamage') return getWeaponAverage(compareItem) ?? 0;
  if (line.key === 'armor') return compareItem.armor ?? 0;
  if (ATTRIBUTE_KEYS.includes(line.key as AttributeKey)) {
    return compareItem.bonusAttributes[line.key as AttributeKey] ?? 0;
  }

  return undefined;
}

function getTooltipPosition(x: number, y: number, hasCompare: boolean) {
  const width = hasCompare ? 632 : 300;
  const height = 360;
  const viewportWidth = typeof window === 'undefined' ? 1920 : window.innerWidth;
  const viewportHeight = typeof window === 'undefined' ? 1080 : window.innerHeight;
  const left = x + width + 24 > viewportWidth ? Math.max(16, x - width - 18) : x + 18;
  const top = Math.min(Math.max(16, y + 18), Math.max(16, viewportHeight - height));

  return { left, top };
}

function ItemTooltipPanel({
  compareItem = null,
  item,
  priceLabel,
  priceValue,
  title,
  showDelta = false,
}: {
  compareItem?: EquipmentItem | null;
  item: EquipmentItem;
  priceLabel?: string;
  priceValue?: number;
  title: string;
  showDelta?: boolean;
}) {
  const statLines = getStatLines(item, compareItem);

  return (
    <div className="item-tooltip__panel">
      <div className="item-tooltip__panel-title">{title}</div>
      <div className={`item-tooltip__name item-tooltip__name--rarity-${item.rarity}`}>
        {item.name}
      </div>
      <div className="item-tooltip__rarity">{RARITY_LABELS[item.rarity] ?? '凡品'}</div>
      <div className="item-tooltip__divider" />
      <div className="item-tooltip__line">部位：{SLOT_LABELS[item.slot] ?? item.slot}</div>
      {statLines.map((line) => {
        const compareValue = getCompareNumber(compareItem, line);
        const delta = showDelta && typeof line.valueNumber === 'number' && typeof compareValue === 'number'
          ? line.valueNumber - compareValue
          : 0;

        return (
          <div className="item-tooltip__line item-tooltip__stat" key={line.key}>
            <span>{line.label}</span>
            <strong>{line.value}</strong>
            {showDelta && delta !== 0 ? (
              <em className={`item-tooltip__delta item-tooltip__delta--${delta > 0 ? 'up' : 'down'}`}>
                {formatSigned(delta)}
              </em>
            ) : null}
          </div>
        );
      })}
      {item.description ? (
        <div className="item-tooltip__line item-tooltip__line--flavor">{item.description}</div>
      ) : null}
      {priceLabel && typeof priceValue === 'number' ? (
        <>
          <div className="item-tooltip__divider" />
          <div className="item-tooltip__line item-tooltip__line--price">
            {priceLabel}　{priceValue} 铜钱
          </div>
        </>
      ) : null}
    </div>
  );
}

export function ItemTooltip() {
  const { tooltip } = useItemTooltip();

  if (!tooltip) return null;

  const { compareItem, item, priceMode = 'sell', x, y } = tooltip;
  const matchedCompareItem = compareItem?.slot === item.slot && compareItem.id !== item.id ? compareItem : null;
  const hasCompare = Boolean(matchedCompareItem);
  const priceLabel = priceMode === 'buy' ? '购入' : '出手';
  const priceValue = priceMode === 'buy' ? item.price ?? item.sellPrice : item.sellPrice;
  const position = getTooltipPosition(x, y, hasCompare);

  return (
    <div
      className={`item-tooltip${hasCompare ? ' item-tooltip--compare' : ''}`}
      style={{
        left: `${position.left}px`,
        top: `${position.top}px`,
      }}
    >
      <ItemTooltipPanel
        compareItem={matchedCompareItem}
        item={item}
        priceLabel={priceLabel}
        priceValue={priceValue}
        showDelta={hasCompare}
        title={priceMode === 'buy' ? '货架' : '物品'}
      />
      {matchedCompareItem ? (
        <ItemTooltipPanel
          item={matchedCompareItem}
          priceLabel="出手"
          priceValue={matchedCompareItem.sellPrice}
          title="身上"
        />
      ) : null}
    </div>
  );
}

export type { ItemTooltipState } from '../../state/tooltipStore';
