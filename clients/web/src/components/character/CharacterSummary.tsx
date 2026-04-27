import type { CharacterInfoView } from '../../types/character';

type CharacterSummaryProps = {
  character: CharacterInfoView;
};

export function CharacterSummary({ character }: CharacterSummaryProps) {
  const { player, resources } = character;

  return (
    <section className="rounded-[28px] border border-indigo-900/50 bg-[linear-gradient(160deg,rgba(17,18,33,0.96),rgba(7,8,15,0.98))] px-5 py-5 shadow-[0_20px_60px_rgba(0,0,0,0.42)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] uppercase tracking-[0.3em] text-indigo-400">角色总览</p>
          <h1 className="mt-2 text-2xl font-black tracking-[0.06em] text-stone-100">
            {player.displayName || '未命名角色'}
          </h1>
          <p className="mt-2 text-sm text-stone-400">
            Lv.{player.level} · {player.classId}
          </p>
        </div>
        <div className="rounded-2xl border border-indigo-800/50 bg-indigo-950/30 px-4 py-3 text-right">
          <p className="text-[11px] uppercase tracking-[0.18em] text-indigo-300/70">经验</p>
          <p className="mt-2 font-semibold text-stone-100">{player.exp}</p>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
        <div className="rounded-2xl border border-white/5 bg-black/20 p-3">
          <p className="text-[11px] uppercase tracking-[0.18em] text-stone-500">铜钱</p>
          <p className="mt-2 font-semibold text-amber-100">{resources.copper}</p>
        </div>
        <div className="rounded-2xl border border-white/5 bg-black/20 p-3">
          <p className="text-[11px] uppercase tracking-[0.18em] text-stone-500">通宝</p>
          <p className="mt-2 font-semibold text-cyan-100">{resources.tokens}</p>
        </div>
        <div className="rounded-2xl border border-white/5 bg-black/20 p-3">
          <p className="text-[11px] uppercase tracking-[0.18em] text-stone-500">沙漏</p>
          <p className="mt-2 font-semibold text-fuchsia-100">{resources.hourglasses}</p>
        </div>
        <div className="rounded-2xl border border-white/5 bg-black/20 p-3">
          <p className="text-[11px] uppercase tracking-[0.18em] text-stone-500">声望</p>
          <p className="mt-2 font-semibold text-emerald-100">{resources.prestige}</p>
        </div>
      </div>
    </section>
  );
}
