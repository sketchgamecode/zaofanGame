import { EquipmentItemCard } from './EquipmentItemCard';
import type { CharacterInfoView, EquipmentSlot } from '../../types/character';
import { EQUIPMENT_SLOTS, EQUIPMENT_SLOT_LABELS } from '../../types/character';

type EquipmentPanelProps = {
  equipped: CharacterInfoView['equipment']['equipped'];
  pendingSlot?: EquipmentSlot;
  onUnequip: (slot: EquipmentSlot) => void;
};

export function EquipmentPanel({ equipped, pendingSlot, onUnequip }: EquipmentPanelProps) {
  return (
    <section className="rounded-[28px] border border-amber-900/50 bg-[linear-gradient(180deg,rgba(28,18,9,0.95),rgba(15,10,5,0.98))] p-5 text-amber-100 shadow-[0_18px_45px_rgba(0,0,0,0.38)]">
      <p className="text-[11px] uppercase tracking-[0.28em] text-amber-600">装备槽位</p>
      <h2 className="mt-2 text-xl font-black tracking-[0.05em]">当前穿戴</h2>

      <div className="mt-5 space-y-4">
        {EQUIPMENT_SLOTS.map((slot) => {
          const item = equipped[slot];

          return (
            <div key={slot} className="rounded-[24px] border border-white/5 bg-black/20 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.18em] text-amber-500/70">{slot}</p>
                  <h3 className="mt-1 text-base font-semibold text-amber-100">{EQUIPMENT_SLOT_LABELS[slot]}</h3>
                </div>
              </div>

              {item ? (
                <div className="mt-4">
                  <EquipmentItemCard
                    item={item}
                    footer={
                      <button
                        type="button"
                        onClick={() => onUnequip(slot)}
                        disabled={pendingSlot === slot}
                        className="w-full rounded-2xl border border-amber-700/60 bg-amber-700/15 px-4 py-3 text-sm font-semibold tracking-[0.18em] text-amber-100 transition hover:bg-amber-700/25 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {pendingSlot === slot ? '卸下中' : '卸下装备'}
                      </button>
                    }
                  />
                </div>
              ) : (
                <div className="mt-4 rounded-2xl border border-dashed border-white/10 bg-stone-950/50 px-4 py-5 text-sm text-stone-400">
                  未装备
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
