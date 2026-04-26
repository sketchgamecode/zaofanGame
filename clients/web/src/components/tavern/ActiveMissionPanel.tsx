import type { ActiveMissionView } from '../../types/tavern';

type ActiveMissionPanelProps = {
  mission: ActiveMissionView | null;
  status: string;
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
      <p className="text-[11px] uppercase tracking-[0.28em] text-sky-500">进行中任务</p>
      <h2 className="mt-2 text-xl font-black tracking-[0.05em]">
        {mission ? mission.title : '任务状态不可用'}
      </h2>
      <p className="mt-3 text-sm leading-6 text-sky-100/80">
        {mission?.description ?? '任务数据缺失，请尝试重新同步。'}
      </p>
      {mission ? (
        <>
          <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-2xl border border-white/5 bg-black/20 p-3">
              <dt className="text-[11px] uppercase tracking-[0.2em] text-sky-500/70">状态</dt>
              <dd className="mt-2 font-semibold text-sky-100">{status}</dd>
            </div>
            <div className="rounded-2xl border border-white/5 bg-black/20 p-3">
              <dt className="text-[11px] uppercase tracking-[0.2em] text-sky-500/70">地点</dt>
              <dd className="mt-2 font-semibold text-sky-100">{mission.locationName ?? '未知去向'}</dd>
            </div>
            <div className="rounded-2xl border border-white/5 bg-black/20 p-3">
              <dt className="text-[11px] uppercase tracking-[0.2em] text-sky-500/70">剩余时间</dt>
              <dd className="mt-2 font-semibold text-sky-100">{displayRemainingSec ?? mission.remainingSec}秒</dd>
            </div>
            <div className="rounded-2xl border border-white/5 bg-black/20 p-3">
              <dt className="text-[11px] uppercase tracking-[0.2em] text-sky-500/70">坐骑倍率</dt>
              <dd className="mt-2 font-semibold text-sky-100">{mission.mountSnapshot.timeMultiplierBp} bp</dd>
            </div>
          </dl>

          <div className="mt-4 rounded-2xl border border-emerald-950/60 bg-emerald-950/25 p-4">
            <p className="text-[11px] uppercase tracking-[0.22em] text-emerald-500">奖励预览</p>
            <div className="mt-3 grid grid-cols-2 gap-2 text-sm text-emerald-100">
              <span>XP +{mission.rewardPreview.xp}</span>
              <span>铜钱 +{mission.rewardPreview.copper}</span>
              <span>{mission.rewardPreview.hasEquipment ? '可能掉装备' : '无装备奖励'}</span>
              <span>{mission.rewardPreview.hasDungeonKey ? '可能掉钥匙' : '无副本钥匙'}</span>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={onSkip}
              disabled={skipPending || completePending}
              className="rounded-2xl border border-amber-700/60 bg-amber-700/15 px-4 py-3 text-sm font-semibold tracking-[0.18em] text-amber-100 transition hover:bg-amber-700/25 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {skipPending ? '跳过中' : '立即跳过'}
            </button>
            <button
              type="button"
              onClick={onComplete}
              disabled={!canComplete || completePending || skipPending}
              className="rounded-2xl border border-sky-700/60 bg-sky-700/15 px-4 py-3 text-sm font-semibold tracking-[0.18em] text-sky-100 transition hover:bg-sky-700/25 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {completePending ? '结算中' : canComplete ? '完成领奖' : '执行中'}
            </button>
          </div>
        </>
      ) : (
        <div className="mt-4 rounded-2xl border border-white/5 bg-black/20 p-4 text-sm">
          <p>当前状态：{status}</p>
        </div>
      )}
    </section>
  );
}
