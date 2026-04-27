import type { CharacterInfoView } from '../../types/character';

type CombatPreviewPanelProps = {
  combatPreview: CharacterInfoView['combatPreview'];
};

export function CombatPreviewPanel({ combatPreview }: CombatPreviewPanelProps) {
  return (
    <section className="rounded-[28px] border border-sky-900/50 bg-[linear-gradient(180deg,rgba(8,20,28,0.95),rgba(6,12,18,0.98))] p-5 text-sky-100 shadow-[0_18px_45px_rgba(0,0,0,0.38)]">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[11px] uppercase tracking-[0.28em] text-sky-500">战斗预览</p>
          <h2 className="mt-2 text-xl font-black tracking-[0.05em]">服务端战斗力快照</h2>
        </div>
        <div className="rounded-2xl border border-sky-800/50 bg-sky-950/25 px-4 py-3 text-right">
          <p className="text-[11px] uppercase tracking-[0.18em] text-sky-400/70">Combat Rating</p>
          <p className="mt-2 text-lg font-bold text-sky-100">{combatPreview.combatRating}</p>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
        <div className="rounded-2xl border border-white/5 bg-black/20 p-3">
          <p className="text-[11px] uppercase tracking-[0.18em] text-sky-500/70">HP</p>
          <p className="mt-2 font-semibold text-sky-100">{combatPreview.hp}</p>
        </div>
        <div className="rounded-2xl border border-white/5 bg-black/20 p-3">
          <p className="text-[11px] uppercase tracking-[0.18em] text-sky-500/70">护甲</p>
          <p className="mt-2 font-semibold text-sky-100">{combatPreview.armor}</p>
        </div>
        <div className="rounded-2xl border border-white/5 bg-black/20 p-3">
          <p className="text-[11px] uppercase tracking-[0.18em] text-sky-500/70">伤害</p>
          <p className="mt-2 font-semibold text-sky-100">
            {combatPreview.damageMin} - {combatPreview.damageMax}
          </p>
        </div>
        <div className="rounded-2xl border border-white/5 bg-black/20 p-3">
          <p className="text-[11px] uppercase tracking-[0.18em] text-sky-500/70">暴击率</p>
          <p className="mt-2 font-semibold text-sky-100">{combatPreview.critChanceBp} bp</p>
        </div>
        <div className="rounded-2xl border border-white/5 bg-black/20 p-3">
          <p className="text-[11px] uppercase tracking-[0.18em] text-sky-500/70">闪避率</p>
          <p className="mt-2 font-semibold text-sky-100">{combatPreview.dodgeChanceBp ?? 0} bp</p>
        </div>
        <div className="rounded-2xl border border-white/5 bg-black/20 p-3">
          <p className="text-[11px] uppercase tracking-[0.18em] text-sky-500/70">格挡率</p>
          <p className="mt-2 font-semibold text-sky-100">{combatPreview.blockChanceBp ?? 0} bp</p>
        </div>
      </div>

      <div className="mt-4 rounded-2xl border border-white/5 bg-black/20 p-4 text-sm">
        <p className="text-[11px] uppercase tracking-[0.18em] text-sky-500/70">装备总功率</p>
        <p className="mt-2 font-semibold text-sky-100">{combatPreview.itemPowerTotal}</p>
      </div>
    </section>
  );
}
