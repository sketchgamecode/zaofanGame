import { useCallback, useEffect, useMemo, useState } from 'react';
import { createClientStateError, fetchApiHealth, postGameAction, shouldResyncForError } from '../api/gameActions';
import type { ActionSuccessResult, ApiHealthSummary } from '../api/actionTypes';
import { GameApiError } from '../api/actionTypes';
import { ErrorToast } from '../components/common/ErrorToast';
import { ActiveMissionPanel } from '../components/tavern/ActiveMissionPanel';
import { DrinkPanel } from '../components/tavern/DrinkPanel';
import { MissionCard } from '../components/tavern/MissionCard';
import { SettlementModal } from '../components/tavern/SettlementModal';
import type { CompleteMissionData, MissionOffer, TavernInfoData, TavernSummaryView } from '../types/tavern';

type TavernPageProps = {
  onLogout: () => Promise<unknown>;
};

function isDebugModeEnabled() {
  return import.meta.env.DEV || new URLSearchParams(window.location.search).get('debug') === '1';
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

function mapErrorTitle(error: GameApiError) {
  switch (error.kind) {
    case 'network':
      return '网络连接异常';
    case 'auth':
      return '登录状态异常';
    case 'config':
      return '部署或接口配置异常';
    case 'business':
      return '操作未通过';
    case 'client_state':
      return '页面状态需要刷新';
    default:
      return '请求失败';
  }
}

function mapErrorHint(error: GameApiError) {
  switch (error.kind) {
    case 'network':
      return '可先检查手机网络、代理或稍后重试。';
    case 'auth':
      return '请退出后重新登录，再继续 Tavern 流程。';
    case 'config':
      return '请确认当前前端连接的是正确 API 地址，并检查 CORS / 部署环境。';
    case 'client_state':
      return error.reason === 'DUPLICATE_ACTION'
        ? '同一操作正在处理中，等待返回即可。'
        : '页面会按服务器状态重新同步，也可以手动点击“重新同步”。';
    default:
      return null;
  }
}

function toGameApiError(action: string, error: unknown) {
  if (error instanceof GameApiError) {
    return error;
  }

  return new GameApiError({
    action,
    kind: 'unknown',
    reason: 'UNKNOWN',
    userMessage: '发生了未识别的客户端错误，请稍后重试。',
    debugMessage: error instanceof Error ? error.message : `Unknown error while handling ${action}`,
    apiBaseUrl: window.location.origin,
  });
}

export function TavernPage({ onLogout }: TavernPageProps) {
  const debugMode = isDebugModeEnabled();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [apiError, setApiError] = useState<GameApiError | null>(null);
  const [serverTime, setServerTime] = useState<number | null>(null);
  const [stateRevision, setStateRevision] = useState<number | null>(null);
  const [lastAction, setLastAction] = useState<string>('TAVERN_GET_INFO');
  const [lastErrorCode, setLastErrorCode] = useState<string | null>(null);
  const [lastErrorKind, setLastErrorKind] = useState<string | null>(null);
  const [lastRequestId, setLastRequestId] = useState<string | null>(null);
  const [healthSummary, setHealthSummary] = useState<ApiHealthSummary | null>(null);
  const [tavernData, setTavernData] = useState<TavernInfoData | null>(null);
  const [drinkPending, setDrinkPending] = useState(false);
  const [startingMissionId, setStartingMissionId] = useState<string | null>(null);
  const [completePending, setCompletePending] = useState(false);
  const [skipPending, setSkipPending] = useState(false);
  const [snapshotReceivedAtMs, setSnapshotReceivedAtMs] = useState(0);
  const [currentTimeMs, setCurrentTimeMs] = useState(0);
  const [settlementData, setSettlementData] = useState<CompleteMissionData | null>(null);
  const [settlementOpen, setSettlementOpen] = useState(false);

  const applySuccessMeta = useCallback((action: string, response: ActionSuccessResult<unknown>) => {
    setLastAction(action);
    setLastRequestId(response.meta.requestId);
    setLastErrorCode(null);
    setLastErrorKind(null);
    setApiError(null);
  }, []);

  const applyErrorState = useCallback((action: string, error: GameApiError) => {
    setLastAction(action);
    setLastRequestId(error.requestId);
    setLastErrorCode(error.errorCode);
    setLastErrorKind(error.kind);
    setApiError(error);

    if (typeof error.serverTime === 'number') {
      setServerTime(error.serverTime);
    }

    if (typeof error.stateRevision === 'number') {
      setStateRevision(error.stateRevision);
    }
  }, []);

  const applyTavernSnapshot = useCallback((snapshot: TavernInfoData, nextServerTime: number, nextRevision: number) => {
    const receivedAtMs = Date.now();
    setTavernData(snapshot);
    setServerTime(nextServerTime);
    setStateRevision(nextRevision);
    setSnapshotReceivedAtMs(receivedAtMs);
    setCurrentTimeMs(receivedAtMs);
  }, []);

  const loadHealth = useCallback(async () => {
    const summary = await fetchApiHealth();
    setHealthSummary(summary);
  }, []);

  const loadTavern = useCallback(async (background = false) => {
    if (background) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const response = await postGameAction<unknown>('TAVERN_GET_INFO');
      applySuccessMeta('TAVERN_GET_INFO', response);

      if (!isTavernInfoData(response.data)) {
        const payloadError = new GameApiError({
          action: 'TAVERN_GET_INFO',
          kind: 'config',
          reason: 'INVALID_API_RESPONSE',
          userMessage: '服务器返回了无法识别的 Tavern 数据，请确认部署环境。',
          debugMessage: 'Invalid Tavern info payload shape',
          status: response.meta.status,
          requestId: response.meta.requestId,
          apiBaseUrl: response.meta.apiBaseUrl,
          serverTime: response.serverTime,
          stateRevision: response.stateRevision,
        });
        applyErrorState('TAVERN_GET_INFO', payloadError);
        setTavernData(null);
        return;
      }

      applyTavernSnapshot(response.data, response.serverTime, response.stateRevision);
    } catch (error) {
      applyErrorState('TAVERN_GET_INFO', toGameApiError('TAVERN_GET_INFO', error));
    } finally {
      if (background) {
        setRefreshing(false);
      } else {
        setLoading(false);
      }
    }
  }, [applyErrorState, applySuccessMeta, applyTavernSnapshot]);

  const handleClientStateFailure = useCallback(
    async (error: GameApiError) => {
      applyErrorState(error.action, error);
      if (shouldResyncForError(error)) {
        await loadTavern(true);
      }
    },
    [applyErrorState, loadTavern],
  );

  const handleDrink = useCallback(async () => {
    if (drinkPending) {
      await handleClientStateFailure(
        createClientStateError(
          'TAVERN_DRINK',
          'DUPLICATE_ACTION',
          '补给请求仍在处理中，请勿重复点击。',
          'Duplicate TAVERN_DRINK blocked on client',
        ),
      );
      return;
    }

    setDrinkPending(true);

    try {
      const response = await postGameAction<unknown>('TAVERN_DRINK');
      applySuccessMeta('TAVERN_DRINK', response);

      if (!isTavernInfoData(response.data)) {
        await handleClientStateFailure(
          new GameApiError({
            action: 'TAVERN_DRINK',
            kind: 'config',
            reason: 'INVALID_API_RESPONSE',
            userMessage: '补给后的 Tavern 数据格式异常，请重新同步。',
            debugMessage: 'Invalid Tavern payload after TAVERN_DRINK',
            status: response.meta.status,
            requestId: response.meta.requestId,
            apiBaseUrl: response.meta.apiBaseUrl,
            serverTime: response.serverTime,
            stateRevision: response.stateRevision,
          }),
        );
        return;
      }

      applyTavernSnapshot(response.data, response.serverTime, response.stateRevision);
    } catch (error) {
      const apiFailure = toGameApiError('TAVERN_DRINK', error);
      applyErrorState('TAVERN_DRINK', apiFailure);
      if (shouldResyncForError(apiFailure)) {
        await loadTavern(true);
      }
    } finally {
      setDrinkPending(false);
    }
  }, [applyErrorState, applySuccessMeta, applyTavernSnapshot, drinkPending, handleClientStateFailure, loadTavern]);

  const handleStartMission = useCallback(
    async (mission: MissionOffer) => {
      if (startingMissionId) {
        await handleClientStateFailure(
          createClientStateError(
            'START_MISSION',
            'DUPLICATE_ACTION',
            '上一条任务开始请求仍在处理中，请勿重复点击。',
            `Duplicate START_MISSION blocked while ${startingMissionId} is pending`,
          ),
        );
        return;
      }

      const currentOffers = tavernData?.tavern.missionOffers ?? [];
      const isOfferStillVisible = currentOffers.some((offer) => offer.missionId === mission.missionId && offer.offerSetId === mission.offerSetId);
      const isIdle = tavernData?.tavern.status === 'IDLE';

      if (!isIdle || !isOfferStillVisible) {
        await handleClientStateFailure(
          createClientStateError(
            'START_MISSION',
            'STALE_UI_STATE',
            '当前任务列表已变化，正在重新同步服务器状态。',
            `Stale START_MISSION rejected on client for mission ${mission.missionId}`,
          ),
        );
        return;
      }

      setStartingMissionId(mission.missionId);

      try {
        const response = await postGameAction<unknown>('START_MISSION', {
          missionId: mission.missionId,
          offerSetId: mission.offerSetId,
        });
        applySuccessMeta('START_MISSION', response);

        if (!isTavernInfoData(response.data)) {
          await handleClientStateFailure(
            new GameApiError({
              action: 'START_MISSION',
              kind: 'config',
              reason: 'INVALID_API_RESPONSE',
              userMessage: '开始任务后的 Tavern 数据格式异常，请重新同步。',
              debugMessage: 'Invalid Tavern payload after START_MISSION',
              status: response.meta.status,
              requestId: response.meta.requestId,
              apiBaseUrl: response.meta.apiBaseUrl,
              serverTime: response.serverTime,
              stateRevision: response.stateRevision,
            }),
          );
          return;
        }

        applyTavernSnapshot(response.data, response.serverTime, response.stateRevision);
      } catch (error) {
        const apiFailure = toGameApiError('START_MISSION', error);
        applyErrorState('START_MISSION', apiFailure);
        if (shouldResyncForError(apiFailure)) {
          await loadTavern(true);
        }
      } finally {
        setStartingMissionId(null);
      }
    },
    [applyErrorState, applySuccessMeta, applyTavernSnapshot, handleClientStateFailure, loadTavern, startingMissionId, tavernData],
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
    (data: CompleteMissionData, response: ActionSuccessResult<unknown>) => {
      const nextTavernData = mergeTavernSummary(data.tavern, data.nextMissionOffers);
      if (!nextTavernData) {
        throw new GameApiError({
          action: response.action,
          kind: 'client_state',
          reason: 'STALE_UI_STATE',
          userMessage: '结算时页面状态已经过期，正在重新同步。',
          debugMessage: `Unable to merge settlement response for ${response.action}`,
          status: response.meta.status,
          requestId: response.meta.requestId,
          apiBaseUrl: response.meta.apiBaseUrl,
          serverTime: response.serverTime,
          stateRevision: response.stateRevision,
        });
      }

      applyTavernSnapshot(nextTavernData, response.serverTime, response.stateRevision);
      setSettlementData(data);
      setSettlementOpen(true);
    },
    [applyTavernSnapshot, mergeTavernSummary],
  );

  const handleCompleteMission = useCallback(async () => {
    if (completePending || skipPending) {
      await handleClientStateFailure(
        createClientStateError(
          'COMPLETE_MISSION',
          'DUPLICATE_ACTION',
          '当前已有结算请求在处理中，请等待服务器返回。',
          'Duplicate COMPLETE_MISSION blocked on client',
        ),
      );
      return;
    }

    if (!tavernData?.tavern.activeMission) {
      await handleClientStateFailure(
        createClientStateError(
          'COMPLETE_MISSION',
          'STALE_UI_STATE',
          '当前没有可结算的任务，正在重新同步。',
          'COMPLETE_MISSION blocked because no active mission exists on client',
        ),
      );
      return;
    }

    setCompletePending(true);

    try {
      const response = await postGameAction<unknown>('COMPLETE_MISSION');
      applySuccessMeta('COMPLETE_MISSION', response);

      if (!isCompleteMissionData(response.data)) {
        await handleClientStateFailure(
          new GameApiError({
            action: 'COMPLETE_MISSION',
            kind: 'config',
            reason: 'INVALID_API_RESPONSE',
            userMessage: '任务结算返回了无法识别的数据，请重新同步。',
            debugMessage: 'Invalid settlement payload after COMPLETE_MISSION',
            status: response.meta.status,
            requestId: response.meta.requestId,
            apiBaseUrl: response.meta.apiBaseUrl,
            serverTime: response.serverTime,
            stateRevision: response.stateRevision,
          }),
        );
        return;
      }

      applySettlementResponse(response.data, response);
    } catch (error) {
      const apiFailure = toGameApiError('COMPLETE_MISSION', error);
      applyErrorState('COMPLETE_MISSION', apiFailure);
      if (shouldResyncForError(apiFailure)) {
        await loadTavern(true);
      }
    } finally {
      setCompletePending(false);
    }
  }, [applyErrorState, applySettlementResponse, applySuccessMeta, completePending, handleClientStateFailure, loadTavern, skipPending, tavernData]);

  const handleSkipMission = useCallback(async () => {
    if (skipPending || completePending) {
      await handleClientStateFailure(
        createClientStateError(
          'SKIP_MISSION',
          'DUPLICATE_ACTION',
          '当前已有结算请求在处理中，请等待服务器返回。',
          'Duplicate SKIP_MISSION blocked on client',
        ),
      );
      return;
    }

    if (!tavernData?.tavern.activeMission) {
      await handleClientStateFailure(
        createClientStateError(
          'SKIP_MISSION',
          'STALE_UI_STATE',
          '当前没有可跳过的任务，正在重新同步。',
          'SKIP_MISSION blocked because no active mission exists on client',
        ),
      );
      return;
    }

    setSkipPending(true);

    try {
      const response = await postGameAction<unknown>('SKIP_MISSION');
      applySuccessMeta('SKIP_MISSION', response);

      if (!isCompleteMissionData(response.data)) {
        await handleClientStateFailure(
          new GameApiError({
            action: 'SKIP_MISSION',
            kind: 'config',
            reason: 'INVALID_API_RESPONSE',
            userMessage: '跳过结算返回了无法识别的数据，请重新同步。',
            debugMessage: 'Invalid settlement payload after SKIP_MISSION',
            status: response.meta.status,
            requestId: response.meta.requestId,
            apiBaseUrl: response.meta.apiBaseUrl,
            serverTime: response.serverTime,
            stateRevision: response.stateRevision,
          }),
        );
        return;
      }

      applySettlementResponse(response.data, response);
    } catch (error) {
      const apiFailure = toGameApiError('SKIP_MISSION', error);
      applyErrorState('SKIP_MISSION', apiFailure);
      if (shouldResyncForError(apiFailure)) {
        await loadTavern(true);
      }
    } finally {
      setSkipPending(false);
    }
  }, [applyErrorState, applySettlementResponse, applySuccessMeta, completePending, handleClientStateFailure, loadTavern, skipPending, tavernData]);

  useEffect(() => {
    const timerId = window.setTimeout(() => {
      void loadTavern();
      void loadHealth();
    }, 0);

    return () => window.clearTimeout(timerId);
  }, [loadHealth, loadTavern]);

  useEffect(() => {
    const activeMission = tavernData?.tavern.activeMission ?? null;

    if (!activeMission) {
      return;
    }

    const interval = window.setInterval(() => {
      setCurrentTimeMs(Date.now());
    }, 1000);

    return () => window.clearInterval(interval);
  }, [tavernData?.tavern.activeMission]);

  const displayRemainingSec = useMemo(() => {
    const activeMission = tavernData?.tavern.activeMission ?? null;
    if (!activeMission) {
      return null;
    }

    const calibratedRemaining =
      serverTime !== null ? Math.max(0, Math.ceil((activeMission.endTime - serverTime) / 1000)) : activeMission.remainingSec;
    const baseRemainingSec = activeMission.remainingSec ?? calibratedRemaining;
    const elapsedSec = Math.max(0, Math.floor((currentTimeMs - snapshotReceivedAtMs) / 1000));
    return Math.max(0, baseRemainingSec - elapsedSec);
  }, [currentTimeMs, serverTime, snapshotReceivedAtMs, tavernData?.tavern.activeMission]);

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
              onClick={() => {
                void onLogout();
              }}
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
          {apiError ? (
            <ErrorToast
              title={mapErrorTitle(apiError)}
              message={apiError.userMessage}
              hint={mapErrorHint(apiError)}
              requestId={debugMode ? apiError.requestId : null}
            />
          ) : null}

          {debugMode ? (
            <section className="rounded-2xl border border-cyan-900/40 bg-cyan-950/20 px-4 py-3 text-[11px] text-cyan-100/85">
              <div className="flex items-center justify-between gap-3">
                <span className="uppercase tracking-[0.24em] text-cyan-400">调试状态</span>
                <span className="text-cyan-500">dev / ?debug=1 可见</span>
              </div>
              <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1">
                <span>status: {tavernData?.tavern.status ?? '-'}</span>
                <span>revision: {stateRevision ?? '-'}</span>
                <span>serverTime: {formattedServerTime}</span>
                <span>offers: {tavernData?.tavern.missionOffers.length ?? 0}</span>
                <span>activeMission: {tavernData?.tavern.activeMission?.missionId ?? '-'}</span>
                <span>lastAction: {lastAction}</span>
                <span className="col-span-2">apiBaseUrl: {healthSummary?.apiBaseUrl ?? '-'}</span>
                <span>lastRequestId: {lastRequestId ?? '-'}</span>
                <span>lastErrorCode: {lastErrorCode ?? '-'}</span>
                <span>lastErrorKind: {lastErrorKind ?? '-'}</span>
                <span>healthStatus: {healthSummary?.status ?? '-'}</span>
                <span>healthEnv: {healthSummary?.env ?? '-'}</span>
                <span className="col-span-2">releaseTag: {healthSummary?.releaseTag ?? '-'}</span>
                <span className="col-span-2">healthWarning: {healthSummary?.warning ?? '-'}</span>
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
              Tavern 数据暂不可用，请稍后重试或点击重新同步。
            </div>
          )}
        </main>

        <footer className="mt-5 flex items-center justify-between px-1 text-xs text-stone-500">
          <span>酒馆联调版本</span>
          <button
            type="button"
            onClick={() => {
              void loadTavern(true);
              void loadHealth();
            }}
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
