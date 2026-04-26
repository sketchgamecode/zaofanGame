import type { MissionOffer } from '../../types/tavern';

type MissionCardProps = {
  mission: MissionOffer;
  onStart: (mission: MissionOffer) => void;
  isSubmitting: boolean;
};

function formatDuration(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;

  if (minutes === 0) {
    return `${remainder}s`;
  }

  if (remainder === 0) {
    return `${minutes}m`;
  }

  return `${minutes}m ${remainder}s`;
}

export function MissionCard({ mission, onStart, isSubmitting }: MissionCardProps) {
  return (
    <article className="rounded-[28px] border border-amber-900/50 bg-[linear-gradient(180deg,rgba(34,20,10,0.96),rgba(18,10,5,0.98))] p-5 shadow-[0_20px_50px_rgba(0,0,0,0.45)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] uppercase tracking-[0.28em] text-amber-700">Offer {mission.offerSeq}</p>
          <h3 className="mt-2 text-lg font-bold text-amber-100">{mission.title}</h3>
        </div>
        <span className="rounded-full border border-amber-800/60 bg-black/20 px-2.5 py-1 text-[11px] font-medium text-amber-300">
          Lv.{mission.enemyPreview.level}
        </span>
      </div>

      <p className="mt-3 text-sm leading-6 text-stone-300">{mission.description}</p>

      <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
        <div className="rounded-2xl border border-white/5 bg-black/20 p-3">
          <dt className="text-[11px] uppercase tracking-[0.2em] text-stone-500">Location</dt>
          <dd className="mt-2 text-amber-100">{mission.locationName ?? 'Unknown route'}</dd>
        </div>
        <div className="rounded-2xl border border-white/5 bg-black/20 p-3">
          <dt className="text-[11px] uppercase tracking-[0.2em] text-stone-500">Duration</dt>
          <dd className="mt-2 text-amber-100">{formatDuration(mission.actualDurationSec)}</dd>
        </div>
        <div className="rounded-2xl border border-white/5 bg-black/20 p-3">
          <dt className="text-[11px] uppercase tracking-[0.2em] text-stone-500">Thirst Cost</dt>
          <dd className="mt-2 text-amber-100">{formatDuration(mission.thirstCostSec)}</dd>
        </div>
        <div className="rounded-2xl border border-white/5 bg-black/20 p-3">
          <dt className="text-[11px] uppercase tracking-[0.2em] text-stone-500">Enemy</dt>
          <dd className="mt-2 text-amber-100">{mission.enemyPreview.name}</dd>
        </div>
      </dl>

      <div className="mt-4 rounded-2xl border border-emerald-950/60 bg-emerald-950/30 p-4">
        <p className="text-[11px] uppercase tracking-[0.22em] text-emerald-500">Visible Reward</p>
        <div className="mt-3 grid grid-cols-2 gap-2 text-sm text-emerald-100">
          <span>XP +{mission.visibleReward.xp}</span>
          <span>Copper +{mission.visibleReward.copper}</span>
          <span>{mission.visibleReward.hasEquipment ? 'Equipment possible' : 'No gear preview'}</span>
          <span>{mission.visibleReward.hasDungeonKey ? 'Key possible' : 'No dungeon key'}</span>
        </div>
      </div>

      <button
        type="button"
        onClick={() => onStart(mission)}
        disabled={isSubmitting}
        className="mt-5 w-full rounded-2xl border border-amber-700/60 bg-amber-700/15 px-4 py-3 text-sm font-semibold tracking-[0.18em] text-amber-200 transition hover:bg-amber-700/25 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSubmitting ? 'STARTING' : 'START MISSION'}
      </button>
    </article>
  );
}
