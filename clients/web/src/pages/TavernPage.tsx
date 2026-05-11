import { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import { createClientStateError, fetchApiHealth, postGameAction, shouldResyncForError } from '../api/gameActions';
import type { ActionSuccessResult, ApiHealthSummary } from '../api/actionTypes';
import { GameApiError } from '../api/actionTypes';
import { ErrorToast } from '../components/common/ErrorToast';
import { DrinkPanel } from '../components/tavern/DrinkPanel';
import { SettlementModal } from '../components/tavern/SettlementModal';
import { MissionSelectionModal } from '../components/tavern/MissionSelectionModal';
import { AdventureScene } from '../components/tavern/AdventureScene';
import { CombatScene } from '../components/tavern/CombatScene';
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

// 预设几种NPC占位符，用来模拟回酒馆遇到不同人的感觉
const NPC_IMAGES = [
  '/assets/npcs/npc_bartender.png',
  '/assets/npcs/npc_wizard.png',
  '/assets/npcs/npc_blacksmith.png',
  '/assets/npcs/npc_orc.png'
];

export function TavernPage({ onLogout }: TavernPageProps) {
  const debugMode = isDebugModeEnabled();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [apiError, setApiError] = useState<GameApiError | null>(null);
  
  // Tavern State
  const [serverTime, setServerTime] = useState<number | null>(null);
  const [stateRevision, setStateRevision] = useState<number | null>(null);
  const [tavernData, setTavernData] = useState<TavernInfoData | null>(null);
  const [snapshotReceivedAtMs, setSnapshotReceivedAtMs] = useState(0);
  const [currentTimeMs, setCurrentTimeMs] = useState(0);
  
  // Operations State
  const [drinkPending, setDrinkPending] = useState(false);
  const [startingMissionId, setStartingMissionId] = useState<string | null>(null);
  const [skipPending, setSkipPending] = useState(false);
  const [completePending, setCompletePending] = useState(false);

  // Settlement State
  const [settlementData, setSettlementData] = useState<CompleteMissionData | null>(null);
  const [settlementOpen, setSettlementOpen] = useState(false);
  
  // Visual Scenes State
  const [missionModalOpen, setMissionModalOpen] = useState(false);
  const [isCombatAnimating, setIsCombatAnimating] = useState(false);
  const [currentNpcImg, setCurrentNpcImg] = useState(NPC_IMAGES[0]);

  // Handle randomly swapping the NPC image when returning to IDLE
  useEffect(() => {
    if (tavernData?.tavern.status === 'IDLE' && !isCombatAnimating && !settlementOpen) {
       const randomImg = NPC_IMAGES[Math.floor(Math.random() * NPC_IMAGES.length)];
       setCurrentNpcImg(randomImg);
    }
  }, [tavernData?.tavern.status, isCombatAnimating, settlementOpen]);

  const applySuccessMeta = useCallback((action: string, response: ActionSuccessResult<unknown>) => {
    setApiError(null);
  }, []);

  const applyErrorState = useCallback((action: string, error: GameApiError) => {
    setApiError(error);
    if (typeof error.serverTime === 'number') setServerTime(error.serverTime);
    if (typeof error.stateRevision === 'number') setStateRevision(error.stateRevision);
  }, []);

  const applyTavernSnapshot = useCallback((snapshot: TavernInfoData, nextServerTime: number, nextRevision: number) => {
    const receivedAtMs = Date.now();
    setTavernData(snapshot);
    setServerTime(nextServerTime);
    setStateRevision(nextRevision);
    setSnapshotReceivedAtMs(receivedAtMs);
    setCurrentTimeMs(receivedAtMs);
  }, []);

  const loadTavern = useCallback(async (background = false) => {
    if (background) setRefreshing(true);
    else setLoading(true);

    try {
      const response = await postGameAction<unknown>('TAVERN_GET_INFO');
      applySuccessMeta('TAVERN_GET_INFO', response);

      if (!isTavernInfoData(response.data)) {
        throw new Error('Invalid API Response');
      }
      applyTavernSnapshot(response.data, response.serverTime, response.stateRevision);
    } catch (error) {
      applyErrorState('TAVERN_GET_INFO', toGameApiError('TAVERN_GET_INFO', error));
    } finally {
      if (background) setRefreshing(false);
      else setLoading(false);
    }
  }, [applyErrorState, applySuccessMeta, applyTavernSnapshot]);

  const handleClientStateFailure = useCallback(async (error: GameApiError) => {
    applyErrorState(error.action, error);
    if (shouldResyncForError(error)) {
      await loadTavern(true);
    }
  }, [applyErrorState, loadTavern]);

  const handleDrink = useCallback(async () => {
    if (drinkPending) return;
    setDrinkPending(true);
    try {
      const response = await postGameAction<unknown>('TAVERN_DRINK');
      applySuccessMeta('TAVERN_DRINK', response);
      if (!isTavernInfoData(response.data)) throw new Error('Invalid Data');
      applyTavernSnapshot(response.data, response.serverTime, response.stateRevision);
    } catch (error) {
      await handleClientStateFailure(toGameApiError('TAVERN_DRINK', error));
    } finally {
      setDrinkPending(false);
    }
  }, [drinkPending, applySuccessMeta, applyTavernSnapshot, handleClientStateFailure]);

  const handleStartMission = useCallback(async (mission: MissionOffer) => {
    if (startingMissionId) return;
    setStartingMissionId(mission.missionId);

    try {
      const response = await postGameAction<unknown>('START_MISSION', {
        missionId: mission.missionId,
        offerSetId: mission.offerSetId,
      });
      applySuccessMeta('START_MISSION', response);
      if (!isTavernInfoData(response.data)) throw new Error('Invalid Data');
      applyTavernSnapshot(response.data, response.serverTime, response.stateRevision);
      setMissionModalOpen(false); // Close modal on success
    } catch (error) {
      await handleClientStateFailure(toGameApiError('START_MISSION', error));
    } finally {
      setStartingMissionId(null);
    }
  }, [startingMissionId, applySuccessMeta, applyTavernSnapshot, handleClientStateFailure]);

  const handleCompleteMission = useCallback(async () => {
    if (completePending) return;
    setIsCombatAnimating(true); // 触发战斗演出
    setCompletePending(true);

    try {
      const response = await postGameAction<unknown>('COMPLETE_MISSION');
      applySuccessMeta('COMPLETE_MISSION', response);
      if (!isCompleteMissionData(response.data)) throw new Error('Invalid Data');
      
      // Save data, but DO NOT show settlement yet. Wait for combat animation.
      applyTavernSnapshot(
        { tavern: { ...response.data.tavern, missionOffers: response.data.nextMissionOffers }, mount: tavernData!.mount }, 
        response.serverTime, 
        response.stateRevision
      );
      setSettlementData(response.data as CompleteMissionData);
    } catch (error) {
      await handleClientStateFailure(toGameApiError('COMPLETE_MISSION', error));
      setIsCombatAnimating(false); // 取消战斗演出
    } finally {
      setCompletePending(false);
    }
  }, [completePending, applySuccessMeta, applyTavernSnapshot, tavernData, handleClientStateFailure]);

  const handleSkipMission = useCallback(async () => {
    if (skipPending) return;
    setIsCombatAnimating(true); // 触发战斗演出
    setSkipPending(true);

    try {
      const response = await postGameAction<unknown>('SKIP_MISSION');
      applySuccessMeta('SKIP_MISSION', response);
      if (!isCompleteMissionData(response.data)) throw new Error('Invalid Data');
      
      // Save data, wait for combat animation to end before opening modal
      applyTavernSnapshot(
        { tavern: { ...response.data.tavern, missionOffers: response.data.nextMissionOffers }, mount: tavernData!.mount }, 
        response.serverTime, 
        response.stateRevision
      );
      setSettlementData(response.data as CompleteMissionData);
    } catch (error) {
      await handleClientStateFailure(toGameApiError('SKIP_MISSION', error));
      setIsCombatAnimating(false);
    } finally {
      setSkipPending(false);
    }
  }, [skipPending, applySuccessMeta, applyTavernSnapshot, tavernData, handleClientStateFailure]);

  const onCombatAnimationEnd = useCallback(() => {
    setIsCombatAnimating(false);
    if (settlementData) {
      setSettlementOpen(true);
    }
  }, [settlementData]);

  useEffect(() => {
    void loadTavern();
  }, [loadTavern]);

  useEffect(() => {
    if (!tavernData?.tavern.activeMission) return;
    const interval = window.setInterval(() => setCurrentTimeMs(Date.now()), 1000);
    return () => window.clearInterval(interval);
  }, [tavernData?.tavern.activeMission]);

  const displayRemainingSec = useMemo(() => {
    const activeMission = tavernData?.tavern.activeMission ?? null;
    if (!activeMission) return null;

    const calibratedRemaining = serverTime !== null ? Math.max(0, Math.ceil((activeMission.endTime - serverTime) / 1000)) : activeMission.remainingSec;
    const baseRemainingSec = activeMission.remainingSec ?? calibratedRemaining;
    const elapsedSec = Math.max(0, Math.floor((currentTimeMs - snapshotReceivedAtMs) / 1000));
    return Math.max(0, baseRemainingSec - elapsedSec);
  }, [currentTimeMs, serverTime, snapshotReceivedAtMs, tavernData?.tavern.activeMission]);

  if (loading) {
    return (
      <div className="h-full bg-[linear-gradient(180deg,#140d08_0%,#090607_100%)] flex items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-amber-900/40 border-t-amber-400" />
      </div>
    );
  }

  const tavern = tavernData?.tavern ?? null;
  const canCompleteMission = tavern?.status === 'READY_TO_COMPLETE' || (tavern?.status === 'IN_PROGRESS' && (displayRemainingSec ?? 0) <= 0);

  // Scene Routing Logic
  if (isCombatAnimating) {
    return <CombatScene onAnimationEnd={onCombatAnimationEnd} />;
  }

  if (tavern?.status === 'IN_PROGRESS' || tavern?.status === 'READY_TO_COMPLETE') {
    return (
      <div className="h-full relative">
         {apiError && <div className="absolute top-4 left-4 right-4 z-50"><ErrorToast title="错误" message={apiError.userMessage} /></div>}
         <AdventureScene 
           mission={tavern.activeMission!}
           displayRemainingSec={displayRemainingSec ?? 0}
           canComplete={canCompleteMission}
           onComplete={handleCompleteMission}
           onSkip={handleSkipMission}
           skipPending={skipPending}
           completePending={completePending}
         />
      </div>
    );
  }

  // IDLE SCENE
  return (
    <div className="h-full bg-[#1c1a17] relative flex flex-col justify-end overflow-hidden">
      
      {/* Background Layer */}
      <div className="absolute inset-0 pointer-events-none">
         <img src="/assets/ui/bg_tavern_indoor.jpg" alt="Tavern" className="w-full h-full object-cover opacity-60" onError={e => e.currentTarget.style.display='none'}/>
         <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30" />
      </div>

      {/* NPC Area (Clickable) */}
      <div 
         className="absolute inset-x-0 bottom-32 flex justify-center cursor-pointer group"
         onClick={() => setMissionModalOpen(true)}
      >
         <img 
           src={currentNpcImg} 
           alt="Tavern Owner" 
           className="h-[450px] object-contain origin-bottom transition-transform duration-300 group-hover:scale-105 group-hover:brightness-110 drop-shadow-[0_10px_20px_rgba(0,0,0,0.8)]"
           onError={e => e.currentTarget.style.display='none'}
         />
         {/* Hover Hint */}
         <div className="absolute top-1/4 opacity-0 group-hover:opacity-100 transition-opacity bg-black/60 backdrop-blur border border-amber-900/50 text-amber-500 font-bold px-4 py-2 rounded shadow-xl -translate-y-full">
           点击查看任务
         </div>
      </div>

      {/* Top Error / Debug layer */}
      <div className="absolute top-0 inset-x-0 p-4 z-40 pointer-events-none">
        {apiError && <div className="pointer-events-auto"><ErrorToast title={mapErrorTitle(apiError)} message={apiError.userMessage} /></div>}
      </div>

      {/* Modals */}
      <MissionSelectionModal 
        isOpen={missionModalOpen} 
        onClose={() => setMissionModalOpen(false)} 
        offers={tavern?.missionOffers || []}
        onStart={handleStartMission}
        isSubmitting={startingMissionId !== null}
      />
      
      <SettlementModal
        data={settlementData}
        open={settlementOpen}
        onClose={() => {
          setSettlementOpen(false);
          setSettlementData(null);
        }}
      />

      {/* Drink Panel (Absolutely positioned) */}
      {tavern && (
        <DrinkPanel
          thirstSecRemaining={tavern.thirstSecRemaining}
          drinksUsedToday={tavern.drinksUsedToday}
          firstMissionBonusAvailable={tavern.firstMissionBonusAvailable}
          onDrink={handleDrink}
          isSubmitting={drinkPending}
        />
      )}

    </div>
  );
}
