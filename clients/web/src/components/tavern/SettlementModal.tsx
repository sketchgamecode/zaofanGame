import type { CompleteMissionData } from '../../types/tavern';

type SettlementModalProps = {
  data: CompleteMissionData | null;
  open: boolean;
  onClose: () => void;
};

function diffLabel(before: number, after: number) {
  const delta = after - before;
  const sign = delta >= 0 ? '+' : '';
  return `${sign}${delta}`;
}

export function SettlementModal({ data, open, onClose }: SettlementModalProps) {
  if (!open || !data) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-4 sm:items-center">
      <div className="w-full max-w-md rounded-[30px] border border-stone-700/60 bg-[linear-gradient(180deg,rgba(19,15,18,0.98),rgba(8,8,10,0.99))] p-5 text-stone-100 shadow-[0_24px_80px_rgba(0,0,0,0.55)]">
        <p className="text-[11px] uppercase tracking-[0.34em] text-stone-500">任务结算</p>
        <h2 className="mt-2 text-2xl font-black tracking-[0.06em]">
          {data.result === 'SUCCESS' ? '胜利' : data.result === 'FAILED' ? '失败' : '已结算'}
        </h2>

        <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
          <div className="rounded-2xl border border-white/5 bg-black/20 p-3">
            <p className="text-[11px] uppercase tracking-[0.2em] text-stone-500">是否发奖</p>
            <p className="mt-2 font-semibold">{data.rewardGranted ? '是' : '否'}</p>
          </div>
          <div className="rounded-2xl border border-white/5 bg-black/20 p-3">
            <p className="text-[11px] uppercase tracking-[0.2em] text-stone-500">战斗结果</p>
            <p className="mt-2 font-semibold">{data.battleResult.playerWon ? '我方胜利' : '我方失败'}</p>
            <p className="mt-1 text-xs text-stone-400">{data.battleResult.totalRounds} 回合</p>
          </div>
        </div>

        <div className="mt-4 rounded-2xl border border-emerald-950/60 bg-emerald-950/25 p-4">
          <p className="text-[11px] uppercase tracking-[0.22em] text-emerald-500">实际奖励</p>
          <div className="mt-3 grid grid-cols-2 gap-2 text-sm text-emerald-100">
            <span>XP {data.grantedReward.xp}</span>
            <span>铜钱 {data.grantedReward.copper}</span>
            <span>通宝 {data.grantedReward.tokens}</span>
            <span>沙漏 {data.grantedReward.hourglass}</span>
          </div>
        </div>

        <div className="mt-4 rounded-2xl border border-sky-950/60 bg-sky-950/20 p-4">
          <p className="text-[11px] uppercase tracking-[0.22em] text-sky-400">角色变化</p>
          <div className="mt-3 space-y-2 text-sm text-sky-100">
            <p>等级：{data.playerDelta.levelBefore} {'->'} {data.playerDelta.levelAfter} ({diffLabel(data.playerDelta.levelBefore, data.playerDelta.levelAfter)})</p>
            <p>XP: {data.playerDelta.xpBefore} {'->'} {data.playerDelta.xpAfter} ({diffLabel(data.playerDelta.xpBefore, data.playerDelta.xpAfter)})</p>
            <p>铜钱：{data.playerDelta.copperBefore} {'->'} {data.playerDelta.copperAfter} ({diffLabel(data.playerDelta.copperBefore, data.playerDelta.copperAfter)})</p>
            <p>通宝：{data.playerDelta.tokensBefore} {'->'} {data.playerDelta.tokensAfter} ({diffLabel(data.playerDelta.tokensBefore, data.playerDelta.tokensAfter)})</p>
            <p>沙漏：{data.playerDelta.hourglassesBefore} {'->'} {data.playerDelta.hourglassesAfter} ({diffLabel(data.playerDelta.hourglassesBefore, data.playerDelta.hourglassesAfter)})</p>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="mt-5 w-full rounded-2xl border border-amber-700/60 bg-amber-700/15 px-4 py-3 text-sm font-semibold tracking-[0.18em] text-amber-100 transition hover:bg-amber-700/25"
        >
          继续
        </button>
      </div>
    </div>
  );
}
