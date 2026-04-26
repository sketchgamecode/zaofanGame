import type { ActiveMissionView, TavernStatus } from '../../types/tavern';

type ActiveMissionPanelProps = {
  mission: ActiveMissionView | null;
  status: TavernStatus;
  displayRemainingSec: number | null;
  canComplete: boolean;
  onComplete: () => void;
  completePending: boolean;
  onSkip: () => void;
  skipPending: boolean;
};

export function ActiveMissionPanel({
  mission,
  status,
  displayRemainingSec,
  canComplete,
  onComplete,
  completePending,
  onSkip,
  skipPending,
}: ActiveMissionPanelProps) {
  return (
    <section className="rounded-[28px] border border-sky-900/50 bg-[linear-gradient(180deg,rgba(8,20,28,0.95),rgba(6,12,18,0.98))] p-5 text-sky-100 shadow-[0_18px_45px_rgba(0,0,0,0.38)]">
      <p className="text-[11px] uppercase tracking-[0.28em] text-sky-500">Active Mission</p>
      <h2 className="mt-2 text-xl font-black tracking-[0.05em]">
        {mission ? mission.title : 'Mission state unavailable'}
      </h2>
      <p className="mt-3 text-sm leading-6 text-sky-100/80">
        {mission?.description ?? 'C4 and later will add IN_PROGRESS and READY_TO_COMPLETE flows.'}
      </p>
      {mission ? (
        <>
          <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-2xl border border-white/5 bg-black/20 p-3">
              <dt className="text-[11px] uppercase tracking-[0.2em] text-sky-500/70">Status</dt>
              <dd className="mt-2 font-semibold text-sky-100">{status}</dd>
            </div>
            <div className="rounded-2xl border border-white/5 bg-black/20 p-3">
              <dt className="text-[11px] uppercase tracking-[0.2em] text-sky-500/70">Location</dt>
              <dd className="mt-2 font-semibold text-sky-100">{mission.locationName ?? 'Unknown route'}</dd>
            </div>
            <div className="rounded-2xl border border-white/5 bg-black/20 p-3">
              <dt className="text-[11px] uppercase tracking-[0.2em] text-sky-500/70">Remaining</dt>
              <dd className="mt-2 font-semibold text-sky-100">{displayRemainingSec ?? mission.remainingSec}s</dd>
            </div>
            <div className="rounded-2xl border border-white/5 bg-black/20 p-3">
              <dt className="text-[11px] uppercase tracking-[0.2em] text-sky-500/70">Mount Multiplier</dt>
              <dd className="mt-2 font-semibold text-sky-100">{mission.mountSnapshot.timeMultiplierBp} bp</dd>
            </div>
          </dl>

          <div className="mt-4 rounded-2xl border border-emerald-950/60 bg-emerald-950/25 p-4">
            <p className="text-[11px] uppercase tracking-[0.22em] text-emerald-500">Reward Preview</p>
            <div className="mt-3 grid grid-cols-2 gap-2 text-sm text-emerald-100">
              <span>XP +{mission.rewardPreview.xp}</span>
              <span>Copper +{mission.rewardPreview.copper}</span>
              <span>{mission.rewardPreview.hasEquipment ? 'Equipment possible' : 'No gear preview'}</span>
              <span>{mission.rewardPreview.hasDungeonKey ? 'Key possible' : 'No dungeon key'}</span>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={onSkip}
              disabled={skipPending || completePending}
              className="rounded-2xl border border-amber-700/60 bg-amber-700/15 px-4 py-3 text-sm font-semibold tracking-[0.18em] text-amber-100 transition hover:bg-amber-700/25 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {skipPending ? 'SKIPPING' : 'SKIP MISSION'}
            </button>
            <button
              type="button"
              onClick={onComplete}
              disabled={!canComplete || completePending || skipPending}
              className="rounded-2xl border border-sky-700/60 bg-sky-700/15 px-4 py-3 text-sm font-semibold tracking-[0.18em] text-sky-100 transition hover:bg-sky-700/25 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {completePending ? 'SETTLING' : canComplete ? 'COMPLETE MISSION' : 'TRAVELLING'}
            </button>
          </div>
        </>
      ) : (
        <div className="mt-4 rounded-2xl border border-white/5 bg-black/20 p-4 text-sm">
          <p>Status: {status}</p>
        </div>
      )}
    </section>
  );
}
