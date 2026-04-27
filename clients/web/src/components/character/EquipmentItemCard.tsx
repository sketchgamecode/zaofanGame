import type { ReactNode } from 'react';
import type { EquipmentItem } from '../../types/character';
import { ATTRIBUTE_LABELS, RARITY_BADGE_CLASS, RARITY_LABELS } from '../../types/character';

type EquipmentItemCardProps = {
  item: EquipmentItem;
  footer?: ReactNode;
};

function renderBonusAttributes(item: EquipmentItem) {
  const entries = Object.entries(item.bonusAttributes).filter((entry): entry is [keyof typeof ATTRIBUTE_LABELS, number] => {
    return typeof entry[1] === 'number' && entry[1] !== 0;
  });

  if (entries.length === 0) {
    return '无属性加成';
  }

  return entries
    .map(([key, value]) => `${ATTRIBUTE_LABELS[key]} +${value}`)
    .join(' · ');
}

export function EquipmentItemCard({ item, footer }: EquipmentItemCardProps) {
  return (
    <div className="rounded-[24px] border border-stone-800/80 bg-black/20 p-4 shadow-[0_10px_30px_rgba(0,0,0,0.18)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-bold text-stone-100">{item.name}</h3>
          <p className="mt-1 text-sm leading-6 text-stone-400">{item.description}</p>
        </div>
        <span className={`shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${RARITY_BADGE_CLASS[item.rarity]}`}>
          {RARITY_LABELS[item.rarity]}
        </span>
      </div>

      <div className="mt-4 flex flex-wrap gap-2 text-[11px] uppercase tracking-[0.18em] text-stone-500">
        <span className="rounded-full border border-stone-800/80 bg-stone-950/70 px-2.5 py-1">{item.slot}</span>
        {item.subType && item.subType !== 'none' ? (
          <span className="rounded-full border border-stone-800/80 bg-stone-950/70 px-2.5 py-1">{item.subType}</span>
        ) : null}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
        <div className="rounded-2xl border border-white/5 bg-stone-950/70 p-3">
          <p className="text-[11px] uppercase tracking-[0.18em] text-stone-500">护甲</p>
          <p className="mt-2 font-semibold text-stone-100">{item.armor ?? '-'}</p>
        </div>
        <div className="rounded-2xl border border-white/5 bg-stone-950/70 p-3">
          <p className="text-[11px] uppercase tracking-[0.18em] text-stone-500">伤害</p>
          <p className="mt-2 font-semibold text-stone-100">
            {item.weaponDamage ? `${item.weaponDamage.min} - ${item.weaponDamage.max}` : '-'}
          </p>
        </div>
      </div>

      <div className="mt-4 rounded-2xl border border-white/5 bg-stone-950/70 p-3">
        <p className="text-[11px] uppercase tracking-[0.18em] text-stone-500">属性加成</p>
        <p className="mt-2 text-sm leading-6 text-stone-200">{renderBonusAttributes(item)}</p>
      </div>

      {footer ? <div className="mt-4">{footer}</div> : null}
    </div>
  );
}
