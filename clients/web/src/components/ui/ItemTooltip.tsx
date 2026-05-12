import type { EquipmentItem } from '../../types/game';

export type ItemTooltipState = {
  item: EquipmentItem;
  x: number;
  y: number;
};

function formatItemMainStat(item: EquipmentItem) {
  if (item.weaponDamage) {
    return `伤害 ${item.weaponDamage.min} - ${item.weaponDamage.max}`;
  }

  if (item.armor) {
    return `护甲 ${item.armor}`;
  }

  return '装备';
}

function formatAttributeLine(item: EquipmentItem) {
  return (
    Object.entries(item.bonusAttributes)
      .map(([key, value]) => `${key} ${value && value > 0 ? `+${value}` : value}`)
      .join(' / ') || '无附加属性'
  );
}

export function ItemTooltip({ tooltip }: { tooltip: ItemTooltipState }) {
  return (
    <div className="item-tooltip" style={{ left: `${tooltip.x + 18}px`, top: `${tooltip.y + 18}px` }}>
      <div className="item-tooltip__name">{tooltip.item.name}</div>
      <div className="item-tooltip__line">{tooltip.item.description}</div>
      <div className="item-tooltip__line">{formatItemMainStat(tooltip.item)}</div>
      <div className="item-tooltip__line">售价 {tooltip.item.sellPrice} 铜钱</div>
      <div className="item-tooltip__line item-tooltip__line--muted">{formatAttributeLine(tooltip.item)}</div>
    </div>
  );
}
