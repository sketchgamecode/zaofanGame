import type { AttributeKey, CharacterInfoView } from '../../types/character';
import { ATTRIBUTE_KEYS, ATTRIBUTE_LABELS } from '../../types/character';

type AttributePanelProps = {
  attributes: CharacterInfoView['attributes'];
  pendingAttribute?: AttributeKey;
  onUpgrade: (attribute: AttributeKey) => void;
};

export function AttributePanel({ attributes, pendingAttribute, onUpgrade }: AttributePanelProps) {
  return (
    <section className="rounded-[28px] border border-emerald-900/50 bg-[linear-gradient(180deg,rgba(8,24,18,0.95),rgba(5,14,11,0.98))] p-5 text-emerald-100 shadow-[0_18px_45px_rgba(0,0,0,0.38)]">
      <p className="text-[11px] uppercase tracking-[0.28em] text-emerald-500">属性面板</p>
      <h2 className="mt-2 text-xl font-black tracking-[0.05em]">基础属性与升级</h2>

      <div className="mt-5 space-y-3">
        {ATTRIBUTE_KEYS.map((attribute) => (
          <div
            key={attribute}
            className="rounded-[22px] border border-white/5 bg-black/20 p-4"
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-emerald-100">{ATTRIBUTE_LABELS[attribute]}</p>
                <p className="mt-1 text-xs text-emerald-100/60">
                  base {attributes.base[attribute]} · total {attributes.total[attribute]}
                </p>
              </div>
              <div className="text-right">
                <p className="text-[11px] uppercase tracking-[0.18em] text-emerald-500/70">升级花费</p>
                <p className="mt-1 font-semibold text-amber-100">{attributes.upgradeCosts[attribute]} 铜钱</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => onUpgrade(attribute)}
              disabled={pendingAttribute === attribute}
              className="mt-4 w-full rounded-2xl border border-emerald-700/60 bg-emerald-700/15 px-4 py-3 text-sm font-semibold tracking-[0.18em] text-emerald-100 transition hover:bg-emerald-700/25 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {pendingAttribute === attribute ? '升级中' : '升级属性'}
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}
