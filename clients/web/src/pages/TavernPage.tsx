import { useCallback, useEffect, useMemo, useState } from 'react';
import { postGameAction } from '../api/gameActions';
import type { ActionErrorResponse } from '../api/actionTypes';
import { ErrorToast } from '../components/common/ErrorToast';
import { ActiveMissionPanel } from '../components/tavern/ActiveMissionPanel';
import { DrinkPanel } from '../components/tavern/DrinkPanel';
import { MissionCard } from '../components/tavern/MissionCard';
import { SettlementModal } from '../components/tavern/SettlementModal';
import type { CompleteMissionData, MissionOffer, TavernInfoData, TavernSummaryView } from '../types/tavern';

type TavernPageProps = {
  onLogout: () => Promise<unknown>;
};

function shouldResyncTavern(errorCode: string) {
  switch (errorCode) {
    case 'INVALID_TAVERN_STATE':
    case 'MISSION_ALREADY_IN_PROGRESS':
    case 'MISSION_NOT_FOUND':
    case 'OFFER_SET_MISMATCH':
    case 'MISSION_NOT_FINISHED':
    case 'NO_ACTIVE_MISSION':
      return true;
    default:
      return false;
  }
}

function isTavernInfoData(value: unknown): value is TavernInfoData {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const candidate = value as Record<string, unknown>;
  const tavern = candidate.tavern as Record<string, unknown> | undefined;
  const mount = candidate.mount as Record<string, unknown> | undefined;

  return (
    typeof tavern === 'object' &&
    tavern !== null &&
    typeof tavern.status === 'string' &&
    Array.isArray(tavern.missionOffers) &&
    'activeMission' in tavern &&
    typeof mount === 'object' &&
    mount !== null &&
    typeof mount.timeMultiplierBp === 'number'
  );
}

function isCompleteMissionData(value: unknown): value is CompleteMissionData {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.result === 'string' &&
    Array.isArray(candidate.nextMissionOffers) &&
    isTavernInfoData({
      tavern: candidate.tavern,
      mount: { timeMultiplierBp: 10000 },
    }) &&
    typeof candidate.playerDelta === 'object' &&
    candidate.playerDelta !== null &&
    typeof candidate.grantedReward === 'object' &&
    candidate.grantedReward !== null &&
    typeof candidate.battleResult === 'object' &&
    candidate.battleResult !== null
  );
}

function mapStatusLabel(status: string | null | undefined) {
  switch (status) {
    case 'IDLE':
      return '空闲中';
    case 'IN_PROGRESS':
      return '任务进行中';
    case 'READY_TO_COMPLETE':
      return '可完成';
    default:
      return '未知状态';
  }
}

function mapErrorToMessage(error: ActionErrorResponse) {
  switch (error.errorCode) {
    case 'INVALID_TAVERN_STATE':
      return '酒馆状态异常，正在重新同步';
    case 'NOT_ENOUGH_TOKENS':
      return '通宝不足';
    case 'TAVERN_DRINK_LIMIT_REACHED':
      return '今日饮酒次数已达上限';
    case 'MISSION_ALREADY_IN_PROGRESS':
      return '已有任务进行中，正在重新同步';
    case 'MISSION_NOT_FOUND':
      return '任务已失效，请重新进入酒馆';
    case 'OFFER_SET_MISMATCH':
      return '任务列表已变化，请重新进入酒馆';
    case 'NOT_ENOUGH_THIRST':
      return '干粮不足，可先喝酒补充';
    case 'MISSION_NOT_FINISHED':
      return '任务尚未完成，正在校准倒计时';
    case 'NO_ACTIVE_MISSION':
      return '当前没有进行中的任务，正在重新同步';
    case 'NOT_ENOUGH_SKIP_RESOURCE':
      return '沙漏/通宝不足，无法跳过';
    default:
      return error.message || '酒馆请求失败';
  }
}

export function TavernPage({ onLogout }: TavernPageProps) {
  const showDebugPanel = import.meta.env.DEV;
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [serverTime, setServerTime] = useState<number | null>(null);
  const [stateRevision, setStateRevision] = useState<number | null>(null);
  const [lastAction, setLastAction] = useState<string>('TAVERN_GET_INFO');
  const [lastErrorCode, setLastErrorCode] = useState<string | null>(null);
  const [tavernData, setTavernData] = useState<TavernInfoData | null>(null);
  const [drinkPending, setDrinkPending] = useState(false);
  const [startingMissionId, setStartingMissionId] = useState<string | null>(null);
  const [completePending, setCompletePending] = useState(false);
  const [skipPending, setSkipPending] = useState(false);
  const [displayRemainingSec, setDisplayRemainingSec] = useState<number | null>(null);
  const [settlementData, setSettlementData] = useState<CompleteMissionData | null>(null);
  const [settlementOpen, setSettlementOpen] = useState(false);

  const applyTavernSnapshot = useCallback((snapshot: TavernInfoData, nextServerTime: number, nextRevision: number) => {
    setTavernData(snapshot);
    setServerTime(nextServerTime);
    setStateRevision(nextRevision);
  }, []);

  const loadTavern = useCallback(async (background = false) => {
    if (background) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setErrorMessage(null);
    setLastAction('TAVERN_GET_INFO');

    try {
      const response = await postGameAction<unknown>('TAVERN_GET_INFO');

      if (!response.ok) {
        setLastErrorCode(response.errorCode);
        setErrorMessage(mapErrorToMessage(response));
        return;
      }

      if (!isTavernInfoData(response.data)) {
        setLastErrorCode('INVALID_TAVERN_PAYLOAD');
        setErrorMessage('酒馆数据格式异常，请重新同步');
        setTavernData(null);
        return;
      }

      setLastErrorCode(null);
      applyTavernSnapshot(response.data, response.serverTime, response.stateRevision);
    } catch (error) {
      const message = error instanceof Error ? error.message : '酒馆请求失败';
      setLastErrorCode('NETWORK_ERROR');
      setErrorMessage(message);
    } finally {
      if (background) {
        setRefreshing(false);
      } else {
        setLoading(false);
      }
    }
  }, [applyTavernSnapshot]);

  const handleDrink = useCallback(async () => {
    setDrinkPending(true);
    setErrorMessage(null);
    setLastAction('TAVERN_DRINK');

    try {
      const response = await postGameAction<unknown>('TAVERN_DRINK');

      if (!response.ok) {
        setLastErrorCode(response.errorCode);
        setErrorMessage(mapErrorToMessage(response));

        if (shouldResyncTavern(response.errorCode)) {
          await loadTavern(true);
        }

        return;
      }

      if (!isTavernInfoData(response.data)) {
        setLastErrorCode('INVALID_TAVERN_PAYLOAD');
        setErrorMessage('酒馆数据格式异常，请重新同步');
        await loadTavern(true);
        return;
      }

      setLastErrorCode(null);
      applyTavernSnapshot(response.data, response.serverTime, response.stateRevision);
    } catch (error) {
      const message = error instanceof Error ? error.message : '酒馆请求失败';
      setLastErrorCode('NETWORK_ERROR');
      setErrorMessage(message);
    } finally {
      setDrinkPending(false);
    }
  }, [applyTavernSnapshot, loadTavern]);

  const handleStartMission = useCallback(
    async (mission: MissionOffer) => {
      setStartingMissionId(mission.missionId);
      setErrorMessage(null);
      setLastAction('START_MISSION');

      try {
        const response = await postGameAction<unknown>('START_MISSION', {
          missionId: mission.missionId,
          offerSetId: mission.offerSetId,
        });

        if (!response.ok) {
          setLastErrorCode(response.errorCode);
          setErrorMessage(mapErrorToMessage(response));

          if (shouldResyncTavern(response.errorCode)) {
            await loadTavern(true);
          }

          return;
        }

        if (!isTavernInfoData(response.data)) {
          setLastErrorCode('INVALID_TAVERN_PAYLOAD');
          setErrorMessage('任务开始后的酒馆数据异常，请重新同步');
          await loadTavern(true);
          return;
        }

        setLastErrorCode(null);
        applyTavernSnapshot(response.data, response.serverTime, response.stateRevision);
      } catch (error) {
        const message = error instanceof Error ? error.message : '酒馆请求失败';
        setLastErrorCode('NETWORK_ERROR');
        setErrorMessage(message);
      } finally {
        setStartingMissionId(null);
      }
    },
    [applyTavernSnapshot, loadTavern],
  );

  const mergeTavernSummary = useCallback(
    (summary: TavernSummaryView, nextMissionOffers: MissionOffer[]): TavernInfoData | null => {
      if (!tavernData) {
        return null;
      }

      return {
        ...tavernData,
        tavern: {
          ...summary,
          missionOffers: nextMissionOffers,
        },
      };
    },
    [tavernData],
  );

  const applySettlementResponse = useCallback(
    (data: CompleteMissionData, nextServerTime: number, nextRevision: number) => {
      const nextTavernData = mergeTavernSummary(data.tavern, data.nextMissionOffers);
      if (!nextTavernData) {
        setLastErrorCode('INVALID_TAVERN_PAYLOAD');
        setErrorMessage('结算后的酒馆数据异常，请重新同步');
        return;
      }

      applyTavernSnapshot(nextTavernData, nextServerTime, nextRevision);
      setSettlementData(data);
      setSettlementOpen(true);
    },
    [applyTavernSnapshot, mergeTavernSummary],
  );

  const handleCompleteMission = useCallback(async () => {
    setCompletePending(true);
    setErrorMessage(null);
    setLastAction('COMPLETE_MISSION');

    try {
      const response = await postGameAction<unknown>('COMPLETE_MISSION');

      if (!response.ok) {
        setLastErrorCode(response.errorCode);
        setErrorMessage(mapErrorToMessage(response));

        if (shouldResyncTavern(response.errorCode)) {
          await loadTavern(true);
        }

        return;
      }

      if (!isCompleteMissionData(response.data)) {
        setLastErrorCode('INVALID_SETTLEMENT_PAYLOAD');
        setErrorMessage('任务结算数据异常，请重新同步');
        await loadTavern(true);
        return;
      }

      setLastErrorCode(null);
      applySettlementResponse(response.data, response.serverTime, response.stateRevision);
    } catch (error) {
      const message = error instanceof Error ? error.message : '酒馆请求失败';
      setLastErrorCode('NETWORK_ERROR');
      setErrorMessage(message);
    } finally {
      setCompletePending(false);
    }
  }, [applySettlementResponse, loadTavern]);

  const handleSkipMission = useCallback(async () => {
    if (skipPending || completePending) {
      return;
    }

    setSkipPending(true);
    setErrorMessage(null);
    setLastAction('SKIP_MISSION');

    try {
      const response = await postGameAction<unknown>('SKIP_MISSION');

      if (!response.ok) {
        setLastErrorCode(response.errorCode);
        setErrorMessage(mapErrorToMessage(response));

        if (shouldResyncTavern(response.errorCode)) {
          await loadTavern(true);
        }

        return;
      }

      if (!isCompleteMissionData(response.data)) {
        setLastErrorCode('INVALID_SETTLEMENT_PAYLOAD');
        setErrorMessage('跳过结算数据异常，请重新同步');
        await loadTavern(true);
        return;
      }

      setLastErrorCode(null);
      applySettlementResponse(response.data, response.serverTime, response.stateRevision);
    } catch (error) {
      const message = error instanceof Error ? error.message : '酒馆请求失败';
      setLastErrorCode('NETWORK_ERROR');
      setErrorMessage(message);
    } finally {
      setSkipPending(false);
    }
  }, [applySettlementResponse, completePending, loadTavern, skipPending]);

  useEffect(() => {
    loadTavern();
  }, [loadTavern]);

  useEffect(() => {
    const activeMission = tavernData?.tavern.activeMission ?? null;

    if (!activeMission) {
      setDisplayRemainingSec(null);
      return;
    }

    const calibratedRemaining =
      serverTime !== null ? Math.max(0, Math.ceil((activeMission.endTime - serverTime) / 1000)) : activeMission.remainingSec;
    const baseRemainingSec = activeMission.remainingSec ?? calibratedRemaining;
    const syncStartedAt = Date.now();

    setDisplayRemainingSec(baseRemainingSec);

    const interval = setInterval(() => {
      const elapsedSec = Math.floor((Date.now() - syncStartedAt) / 1000);
      setDisplayRemainingSec(Math.max(0, baseRemainingSec - elapsedSec));
    }, 1000);

    return () => clearInterval(interval);
  }, [serverTime, tavernData?.tavern.activeMission?.missionId, tavernData?.tavern.activeMission?.remainingSec, tavernData?.tavern.activeMission?.endTime]);

  const missionCountLabel = useMemo(() => {
    const count = tavernData?.tavern.missionOffers.length ?? 0;
    return `当前任务 ${count} / 3`;
  }, [tavernData]);

  const formattedServerTime = useMemo(() => {
    if (serverTime === null) {
      return '-';
    }

    return new Date(serverTime).toLocaleString('zh-CN', {
      hour12: false,
    });
  }, [serverTime]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[linear-gradient(180deg,#140d08_0%,#090607_100%)] px-5 py-8 text-stone-100">
        <div className="mx-auto flex min-h-[80vh] w-full max-w-md flex-col items-center justify-center gap-5">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-amber-900/40 border-t-amber-400" />
          <div className="text-center">
            <p className="text-xs uppercase tracking-[0.38em] text-amber-700">酒馆</p>
            <h1 className="mt-2 text-2xl font-black tracking-[0.08em] text-amber-100">正在同步酒馆情报</h1>
          </div>
        </div>
      </div>
    );
  }

  const tavern = tavernData?.tavern ?? null;
  const mount = tavernData?.mount ?? null;
  const canCompleteMission =
    tavern?.status === 'READY_TO_COMPLETE' ||
    (tavern?.status === 'IN_PROGRESS' && (displayRemainingSec ?? 0) <= 0);

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#140d08_0%,#0b0709_45%,#050406_100%)] text-stone-100">
      <SettlementModal
        data={settlementData}
        open={settlementOpen}
        onClose={() => setSettlementOpen(false)}
      />

      <div className="mx-auto flex min-h-screen w-full max-w-md flex-col px-4 pb-10 pt-[max(1rem,env(safe-area-inset-top))]">
        <header className="rounded-[30px] border border-amber-900/50 bg-[linear-gradient(160deg,rgba(29,17,11,0.96),rgba(10,7,8,0.98))] px-5 py-5 shadow-[0_20px_60px_rgba(0,0,0,0.42)]">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[11px] uppercase tracking-[0.34em] text-amber-700">game.sketchgame.net</p>
              <h1 className="mt-2 text-2xl font-black tracking-[0.08em] text-amber-100">酒馆任务</h1>
              <p className="mt-3 text-sm leading-6 text-stone-300">
                当前页面只展示服务端权威的酒馆状态，不在本地生成任务或结算奖励。
              </p>
            </div>
            <button
              type="button"
              onClick={() => onLogout()}
              className="shrink-0 rounded-full border border-stone-700/70 bg-black/20 px-3 py-2 text-xs font-semibold tracking-[0.18em] text-stone-300"
            >
              退出登录
            </button>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-2xl border border-white/5 bg-black/20 p-3">
              <p className="text-[11px] uppercase tracking-[0.2em] text-stone-500">当前状态</p>
              <p className="mt-2 font-semibold text-amber-100">{mapStatusLabel(tavern?.status)}</p>
            </div>
            <div className="rounded-2xl border border-white/5 bg-black/20 p-3">
              <p className="text-[11px] uppercase tracking-[0.2em] text-stone-500">坐骑倍率</p>
              <p className="mt-2 font-semibold text-amber-100">{mount?.timeMultiplierBp ?? '-'} bp</p>
            </div>
            <div className="rounded-2xl border border-white/5 bg-black/20 p-3">
              <p className="text-[11px] uppercase tracking-[0.2em] text-stone-500">服务器时间</p>
              <p className="mt-2 font-semibold text-amber-100">{formattedServerTime}</p>
            </div>
            <div className="rounded-2xl border border-white/5 bg-black/20 p-3">
              <p className="text-[11px] uppercase tracking-[0.2em] text-stone-500">状态版本</p>
              <p className="mt-2 font-semibold text-amber-100">{stateRevision ?? '-'}</p>
            </div>
          </div>
        </header>

        <main className="mt-4 flex flex-1 flex-col gap-4">
          {errorMessage ? <ErrorToast message={errorMessage} /> : null}

          {showDebugPanel ? (
            <section className="rounded-2xl border border-cyan-900/40 bg-cyan-950/20 px-4 py-3 text-[11px] text-cyan-100/85">
              <div className="flex items-center justify-between gap-3">
                <span className="uppercase tracking-[0.24em] text-cyan-400">调试状态</span>
                <span className="text-cyan-500">仅开发环境显示</span>
              </div>
              <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1">
                <span>status: {tavernData?.tavern.status ?? '-'}</span>
                <span>revision: {stateRevision ?? '-'}</span>
                <span>serverTime: {formattedServerTime}</span>
                <span>offers: {tavernData?.tavern.missionOffers.length ?? 0}</span>
                <span>activeMission: {tavernData?.tavern.activeMission?.missionId ?? '-'}</span>
                <span>lastAction: {lastAction}</span>
                <span className="col-span-2">lastErrorCode: {lastErrorCode ?? '-'}</span>
              </div>
            </section>
          ) : null}

          {tavern ? (
            <>
              <DrinkPanel
                thirstSecRemaining={tavern.thirstSecRemaining}
                drinksUsedToday={tavern.drinksUsedToday}
                firstMissionBonusAvailable={tavern.firstMissionBonusAvailable}
                onDrink={handleDrink}
                isSubmitting={drinkPending}
              />

              {tavern.status === 'IDLE' ? (
                <section className="space-y-4">
                  <div className="flex items-center justify-between px-1">
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.3em] text-amber-700">任务列表</p>
                      <h2 className="mt-2 text-xl font-black tracking-[0.05em] text-amber-100">三选一任务</h2>
                    </div>
                    <span className="rounded-full border border-amber-900/40 bg-black/20 px-3 py-1.5 text-xs text-amber-400">
                      {missionCountLabel}
                    </span>
                  </div>

                  {tavern.missionOffers.length > 0 ? (
                    tavern.missionOffers.map((mission) => (
                      <MissionCard
                        key={mission.missionId}
                        mission={mission}
                        onStart={handleStartMission}
                        isSubmitting={startingMissionId === mission.missionId}
                      />
                    ))
                  ) : (
                    <div className="rounded-[28px] border border-amber-900/40 bg-black/20 px-5 py-8 text-center text-sm text-stone-300">
                      当前没有可展示的任务，请点击右下角重新同步。
                    </div>
                  )}
                </section>
              ) : (
                <ActiveMissionPanel
                  mission={tavern.activeMission}
                  status={mapStatusLabel(tavern.status)}
                  displayRemainingSec={displayRemainingSec}
                  canComplete={Boolean(canCompleteMission)}
                  onComplete={handleCompleteMission}
                  completePending={completePending}
                  onSkip={handleSkipMission}
                  skipPending={skipPending}
                />
              )}
            </>
          ) : (
            <div className="rounded-[28px] border border-red-900/40 bg-black/20 px-5 py-8 text-center text-sm text-stone-300">
              酒馆数据暂不可用，请稍后重试或点击重新同步。
            </div>
          )}
        </main>

        <footer className="mt-5 flex items-center justify-between px-1 text-xs text-stone-500">
          <span>酒馆联调版本</span>
          <button
            type="button"
            onClick={() => loadTavern(true)}
            disabled={refreshing}
            className="rounded-full border border-stone-800/80 bg-black/20 px-3 py-2 tracking-[0.18em] text-stone-300 disabled:opacity-50"
          >
            {refreshing ? '同步中' : '重新同步'}
          </button>
        </footer>
      </div>
    </div>
  );
}
