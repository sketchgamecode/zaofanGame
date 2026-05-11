import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { postGameAction } from '../api/gameApi';
import { useGameState } from '../state/GameStateContext';
import type {
  ActiveMissionView,
  BattleResult,
  CompleteMissionData,
  MissionOffer,
  RewardPreview,
  TavernInfoData,
  VisibleReward,
} from '../types/tavern';
import { resolveTaskBackgroundPath } from './tavernMockData';

type NpcVisualConfig = {
  idleSrc: string;
  hoverSrc: string;
  x: number;
  y: number;
  width: number;
  height: number;
};

type MissionPresentation = {
  missionId: string;
  title: string;
  locationName?: string;
  enemyName: string;
  rewardPreview: RewardPreview;
  visibleReward?: VisibleReward;
};

type BattlePlayback = {
  playerName: string;
  enemyName: string;
  playerWon: boolean;
  playerHpMax: number;
  enemyHpMax: number;
  playerHpEnd: number;
  enemyHpEnd: number;
  rounds: BattleResult['rounds'];
};

type RewardSlot = {
  key: string;
  iconSrc: string;
  amountText: string;
  label: string;
};

const NPC_VISUALS: Record<string, NpcVisualConfig> = {
  npc_laobao: {
    idleSrc: '/assets/foregrounds/tavern_guest_0.png',
    hoverSrc: '/assets/foregrounds/tavern_guest_0_hover.png',
    x: 109,
    y: 381,
    width: 245,
    height: 489,
  },
  npc_cuihua: {
    idleSrc: '/assets/foregrounds/tavern_guest_1.png',
    hoverSrc: '/assets/foregrounds/tavern_guest_1_hover.png',
    x: 767,
    y: 351,
    width: 330,
    height: 499,
  },
  npc_daoye: {
    idleSrc: '/assets/foregrounds/tavern_guest_2.png',
    hoverSrc: '/assets/foregrounds/tavern_guest_2_hover.png',
    x: 767,
    y: 180,
    width: 443,
    height: 723,
  },
  npc_mao_jiu: {
    idleSrc: '/assets/foregrounds/tavern_guest_3.png',
    hoverSrc: '/assets/foregrounds/tavern_guest_3_hover.png',
    x: 109,
    y: 220,
    width: 306,
    height: 667,
  },
  npc_xue_gu: {
    idleSrc: '/assets/foregrounds/tavern_guest_4.png',
    hoverSrc: '/assets/foregrounds/tavern_guest_4_hover.png',
    x: 767,
    y: 336,
    width: 343,
    height: 508,
  },
};

const REWARD_X_POSITIONS = [440, 622, 804, 986, 1168];
const REWARD_BASE_Y = 516;
const BATTLE_STEP_MS = 820;

function toErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }
  return '酒馆状态同步失败，请稍后重试。';
}

function createPresentationFromOffer(offer: MissionOffer): MissionPresentation {
  return {
    missionId: offer.missionId,
    title: offer.title,
    locationName: offer.locationName,
    enemyName: offer.enemyPreview.name,
    rewardPreview: {
      xp: offer.visibleReward.xp,
      copper: offer.visibleReward.copper,
      hasEquipment: offer.visibleReward.hasEquipment,
      hasDungeonKey: offer.visibleReward.hasDungeonKey,
      hasHourglass: offer.visibleReward.hasHourglass,
    },
    visibleReward: offer.visibleReward,
  };
}

function createPresentationFromActiveMission(activeMission: ActiveMissionView): MissionPresentation {
  return {
    missionId: activeMission.missionId,
    title: activeMission.title,
    locationName: activeMission.locationName,
    enemyName: '任务目标',
    rewardPreview: activeMission.rewardPreview,
  };
}

function buildPreviewRewardSlots(presentation: MissionPresentation): RewardSlot[] {
  const rewardSlots: RewardSlot[] = [
    {
      key: 'copper',
      iconSrc: '/assets/ui/token_0.png',
      amountText: String(presentation.rewardPreview.copper),
      label: '铜钱',
    },
    {
      key: 'xp',
      iconSrc: '/assets/ui/token_1.png',
      amountText: String(presentation.rewardPreview.xp),
      label: '经验',
    },
  ];

  if (presentation.rewardPreview.hasEquipment) {
    rewardSlots.push({
      key: 'equipment',
      iconSrc: '/assets/ui/token_placehoder.png',
      amountText: '1',
      label: presentation.visibleReward?.equipmentPreview?.name ?? '装备',
    });
  }

  if (presentation.rewardPreview.hasDungeonKey) {
    rewardSlots.push({
      key: 'dungeon_key',
      iconSrc: '/assets/ui/token_placehoder.png',
      amountText: '1',
      label: presentation.visibleReward?.dungeonKeyPreview?.name ?? '钥牌',
    });
  }

  if (presentation.rewardPreview.hasHourglass) {
    rewardSlots.push({
      key: 'hourglass',
      iconSrc: '/assets/ui/token_placehoder.png',
      amountText: '1',
      label: '沙漏',
    });
  }

  return rewardSlots.slice(0, REWARD_X_POSITIONS.length);
}

function buildSettlementRewardSlots(data: CompleteMissionData): RewardSlot[] {
  const rewardSlots: RewardSlot[] = [];

  if (data.grantedReward.copper > 0) {
    rewardSlots.push({
      key: 'copper',
      iconSrc: '/assets/ui/token_0.png',
      amountText: String(data.grantedReward.copper),
      label: '铜钱',
    });
  }

  if (data.grantedReward.xp > 0) {
    rewardSlots.push({
      key: 'xp',
      iconSrc: '/assets/ui/token_1.png',
      amountText: String(data.grantedReward.xp),
      label: '经验',
    });
  }

  if (data.grantedReward.equipment) {
    rewardSlots.push({
      key: 'equipment',
      iconSrc: '/assets/ui/token_placehoder.png',
      amountText: '1',
      label: data.grantedReward.equipment.name,
    });
  }

  if (data.grantedReward.dungeonKey) {
    rewardSlots.push({
      key: 'dungeon_key',
      iconSrc: '/assets/ui/token_placehoder.png',
      amountText: '1',
      label: data.grantedReward.dungeonKey.name,
    });
  }

  if (data.grantedReward.hourglass > 0) {
    rewardSlots.push({
      key: 'hourglass',
      iconSrc: '/assets/ui/token_placehoder.png',
      amountText: String(data.grantedReward.hourglass),
      label: '沙漏',
    });
  } else if (data.grantedReward.tokens > 0) {
    rewardSlots.push({
      key: 'tokens',
      iconSrc: '/assets/ui/token_placehoder.png',
      amountText: String(data.grantedReward.tokens),
      label: '令牌',
    });
  }

  return rewardSlots.slice(0, REWARD_X_POSITIONS.length);
}

function formatRemainingTime(totalSec: number) {
  const safe = Math.max(0, totalSec);
  const minutes = Math.floor(safe / 60);
  const seconds = safe % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

function buildBattlePlaybackFromResult(
  battleResult: BattleResult,
  playerName: string,
  enemyName: string,
): BattlePlayback {
  let playerHpMax = battleResult.playerHpEnd;
  let enemyHpMax = battleResult.enemyHpEnd;

  for (const round of battleResult.rounds) {
    if (round.attacker === 'player') {
      enemyHpMax = Math.max(enemyHpMax, round.targetHpAfter + round.damage);
    } else {
      playerHpMax = Math.max(playerHpMax, round.targetHpAfter + round.damage);
    }
  }

  return {
    playerName,
    enemyName,
    playerWon: battleResult.playerWon,
    playerHpMax,
    enemyHpMax,
    playerHpEnd: battleResult.playerHpEnd,
    enemyHpEnd: battleResult.enemyHpEnd,
    rounds: battleResult.rounds,
  };
}

function getBattleHpState(playback: BattlePlayback, roundIndex: number) {
  let playerHp = playback.playerHpMax;
  let enemyHp = playback.enemyHpMax;

  for (let index = 0; index < roundIndex; index += 1) {
    const round = playback.rounds[index];
    if (!round) {
      break;
    }

    if (round.attacker === 'player') {
      enemyHp = round.targetHpAfter;
    } else {
      playerHp = round.targetHpAfter;
    }
  }

  return { playerHp, enemyHp };
}

export function TavernScene() {
  const { character, refreshCharacterInfo } = useGameState();
  const [tavernData, setTavernData] = useState<TavernInfoData | null>(null);
  const [loading, setLoading] = useState(true);
  const [requestError, setRequestError] = useState<string | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const [selectedOfferIndex, setSelectedOfferIndex] = useState(0);
  const [snapshotReceivedAtMs, setSnapshotReceivedAtMs] = useState(0);
  const [nowMs, setNowMs] = useState(Date.now());
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [missionPresentation, setMissionPresentation] = useState<MissionPresentation | null>(null);
  const [battlePlayback, setBattlePlayback] = useState<BattlePlayback | null>(null);
  const [battleRoundIndex, setBattleRoundIndex] = useState(0);
  const [settlementData, setSettlementData] = useState<CompleteMissionData | null>(null);
  const [settlementOpen, setSettlementOpen] = useState(false);
  const autoResolveMissionIdRef = useRef<string | null>(null);

  const tavern = tavernData?.tavern ?? null;
  const activeMission = tavern?.activeMission ?? null;
  const npcGreeting = tavern?.npcGreeting ?? null;
  const npcVisual = npcGreeting ? NPC_VISUALS[npcGreeting.npcId] : null;
  const selectedOffer = tavern?.missionOffers[selectedOfferIndex] ?? tavern?.missionOffers[0] ?? null;
  const previewPresentation = selectedOffer ? createPresentationFromOffer(selectedOffer) : null;
  const currentPresentation = missionPresentation ?? (activeMission ? createPresentationFromActiveMission(activeMission) : null);
  const previewRewardSlots = previewPresentation ? buildPreviewRewardSlots(previewPresentation) : [];
  const settlementRewardSlots = settlementData ? buildSettlementRewardSlots(settlementData) : [];

  const applyTavernSnapshot = useCallback((snapshot: TavernInfoData) => {
    setTavernData(snapshot);
    setSnapshotReceivedAtMs(Date.now());
    setNowMs(Date.now());
    setRequestError(null);
  }, []);

  const loadTavern = useCallback(async () => {
    setLoading(true);
    setRequestError(null);

    try {
      const snapshot = await postGameAction<TavernInfoData>('TAVERN_GET_INFO');
      applyTavernSnapshot(snapshot);
    } catch (error) {
      setRequestError(toErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }, [applyTavernSnapshot]);

  useEffect(() => {
    void loadTavern();
  }, [loadTavern]);

  useEffect(() => {
    if (!tavern?.missionOffers.length) {
      setSelectedOfferIndex(0);
      return;
    }

    if (selectedOfferIndex > tavern.missionOffers.length - 1) {
      setSelectedOfferIndex(0);
    }
  }, [selectedOfferIndex, tavern?.missionOffers]);

  useEffect(() => {
    if (activeMission) {
      if (!missionPresentation || missionPresentation.missionId !== activeMission.missionId) {
        setMissionPresentation(createPresentationFromActiveMission(activeMission));
      }
      return;
    }

    autoResolveMissionIdRef.current = null;
    if (!battlePlayback && !settlementOpen) {
      setMissionPresentation(null);
    }
  }, [activeMission, battlePlayback, settlementOpen, missionPresentation]);

  useEffect(() => {
    if (!activeMission || battlePlayback || settlementOpen) {
      return;
    }

    const timerId = window.setInterval(() => {
      setNowMs(Date.now());
    }, 1000);

    return () => window.clearInterval(timerId);
  }, [activeMission, battlePlayback, settlementOpen]);

  const remainingSec = useMemo(() => {
    if (!activeMission) {
      return 0;
    }

    const elapsedSec = Math.max(0, Math.floor((nowMs - snapshotReceivedAtMs) / 1000));
    return Math.max(0, activeMission.remainingSec - elapsedSec);
  }, [activeMission, nowMs, snapshotReceivedAtMs]);

  const countdownProgress = useMemo(() => {
    if (!activeMission || activeMission.actualDurationSec <= 0) {
      return 0;
    }

    const elapsed = activeMission.actualDurationSec - remainingSec;
    return Math.max(0, Math.min(1, elapsed / activeMission.actualDurationSec));
  }, [activeMission, remainingSec]);

  const battleHpState = useMemo(() => {
    if (!battlePlayback) {
      return null;
    }

    return getBattleHpState(battlePlayback, battleRoundIndex);
  }, [battlePlayback, battleRoundIndex]);

  const currentBattleRound = battlePlayback?.rounds[Math.max(0, battleRoundIndex - 1)] ?? null;
  const taskBackgroundPath = currentPresentation ? resolveTaskBackgroundPath(currentPresentation.locationName) : null;

  const runMissionSettlement = useCallback(async (action: 'COMPLETE_MISSION' | 'SKIP_MISSION') => {
    if (!activeMission || loadingAction) {
      return;
    }

    const resolvedPresentation = missionPresentation ?? createPresentationFromActiveMission(activeMission);
    setMissionPresentation(resolvedPresentation);
    setLoadingAction(action);
    setRequestError(null);

    try {
      const data = await postGameAction<CompleteMissionData>(action);
      setTavernData((previous) => (
        previous
          ? {
              ...previous,
              tavern: {
                ...data.tavern,
                missionOffers: data.nextMissionOffers,
              },
            }
          : previous
      ));
      setSnapshotReceivedAtMs(Date.now());
      setNowMs(Date.now());
      setBattlePlayback(
        buildBattlePlaybackFromResult(
          data.battleResult,
          character?.player.displayName ?? '无名好汉',
          resolvedPresentation.enemyName,
        ),
      );
      setBattleRoundIndex(0);
      setSettlementData(data);
      setSettlementOpen(false);

      void refreshCharacterInfo().catch((error) => {
        setRequestError(toErrorMessage(error));
      });
    } catch (error) {
      autoResolveMissionIdRef.current = null;
      setRequestError(toErrorMessage(error));
    } finally {
      setLoadingAction(null);
    }
  }, [activeMission, character?.player.displayName, loadingAction, missionPresentation, refreshCharacterInfo]);

  useEffect(() => {
    if (!activeMission || battlePlayback || settlementOpen || loadingAction) {
      return;
    }

    const shouldResolve =
      tavern?.status === 'READY_TO_COMPLETE' ||
      (tavern?.status === 'IN_PROGRESS' && remainingSec <= 0);

    if (!shouldResolve) {
      return;
    }

    if (autoResolveMissionIdRef.current === activeMission.missionId) {
      return;
    }

    autoResolveMissionIdRef.current = activeMission.missionId;
    void runMissionSettlement('COMPLETE_MISSION');
  }, [
    activeMission,
    battlePlayback,
    loadingAction,
    remainingSec,
    runMissionSettlement,
    settlementOpen,
    tavern?.status,
  ]);

  useEffect(() => {
    if (!battlePlayback) {
      return;
    }

    if (battleRoundIndex >= battlePlayback.rounds.length) {
      setSettlementOpen(true);
      return;
    }

    const timerId = window.setTimeout(() => {
      setBattleRoundIndex((previous) => previous + 1);
    }, BATTLE_STEP_MS);

    return () => window.clearTimeout(timerId);
  }, [battlePlayback, battleRoundIndex]);

  const handleNpcClick = () => {
    if (!tavern || tavern.status !== 'IDLE' || loading) {
      return;
    }

    setSelectedOfferIndex(0);
    setPanelOpen(true);
  };

  const handleStartMission = async () => {
    if (!selectedOffer || loadingAction) {
      return;
    }

    setLoadingAction('START_MISSION');
    setRequestError(null);

    try {
      const snapshot = await postGameAction<TavernInfoData>('START_MISSION', {
        missionId: selectedOffer.missionId,
        offerSetId: selectedOffer.offerSetId,
      });
      setMissionPresentation(createPresentationFromOffer(selectedOffer));
      applyTavernSnapshot(snapshot);
      setPanelOpen(false);
    } catch (error) {
      setRequestError(toErrorMessage(error));
    } finally {
      setLoadingAction(null);
    }
  };

  const handleSkipCountdown = () => {
    void runMissionSettlement('SKIP_MISSION');
  };

  const handleSkipBattle = () => {
    if (!battlePlayback) {
      return;
    }

    setBattleRoundIndex(battlePlayback.rounds.length);
  };

  const handleSettlementConfirm = () => {
    setBattlePlayback(null);
    setBattleRoundIndex(0);
    setSettlementData(null);
    setSettlementOpen(false);
    setPanelOpen(false);
    setSelectedOfferIndex(0);
    setMissionPresentation(null);
  };

  const taskSceneStyle = taskBackgroundPath
    ? {
        backgroundImage: `linear-gradient(180deg, rgba(18, 12, 8, 0.2), rgba(10, 9, 8, 0.12)), url(${taskBackgroundPath})`,
      }
    : undefined;

  if (loading && !tavern) {
    return (
      <div className="scene scene--tavern scene-status">
        <div className="scene-status__panel">正在同步酒馆情报...</div>
      </div>
    );
  }

  if (!tavern) {
    return (
      <div className="scene scene--tavern scene-status">
        <div className="scene-status__panel scene-status__panel--error">
          {requestError ?? '酒馆状态暂不可用，请稍后重试。'}
        </div>
      </div>
    );
  }

  if (battlePlayback && battleHpState && currentPresentation && !settlementOpen) {
    const playerHpPercent = battlePlayback.playerHpMax > 0
      ? (battleHpState.playerHp / battlePlayback.playerHpMax) * 100
      : 0;
    const enemyHpPercent = battlePlayback.enemyHpMax > 0
      ? (battleHpState.enemyHp / battlePlayback.enemyHpMax) * 100
      : 0;

    return (
      <div className="scene scene--taskbackdrop" style={taskSceneStyle}>
        {requestError ? <div className="scene-error-banner">{requestError}</div> : null}
        <div className="battle-stage">
          <section className="battle-card battle-card--player">
            <div className="battle-card__name">{battlePlayback.playerName}</div>
            <div className="battle-card__bar">
              <div className="battle-card__fill battle-card__fill--player" style={{ width: `${playerHpPercent}%` }} />
            </div>
            <div className="battle-card__hp">{battleHpState.playerHp} / {battlePlayback.playerHpMax}</div>
          </section>

          <section className="battle-card battle-card--enemy">
            <div className="battle-card__name">{battlePlayback.enemyName}</div>
            <div className="battle-card__bar">
              <div className="battle-card__fill battle-card__fill--enemy" style={{ width: `${enemyHpPercent}%` }} />
            </div>
            <div className="battle-card__hp">{battleHpState.enemyHp} / {battlePlayback.enemyHpMax}</div>
          </section>

          <div className="battle-log">
            {currentBattleRound ? (
              <>
                <div className="battle-log__actor">
                  {currentBattleRound.attacker === 'player' ? '我方出手' : '敌方出手'}
                </div>
                <div className="battle-log__damage">
                  -{currentBattleRound.damage}
                  {currentBattleRound.wasCrit ? ' 暴击' : ''}
                </div>
              </>
            ) : (
              <>
                <div className="battle-log__actor">交手前夕</div>
                <div className="battle-log__damage">战斗即将开始</div>
              </>
            )}
          </div>

          <button className="battle-skip" type="button" onClick={handleSkipBattle}>
            跳过演示
          </button>
        </div>
      </div>
    );
  }

  if (settlementOpen && settlementData && currentPresentation) {
    return (
      <div className="scene scene--taskbackdrop" style={taskSceneStyle}>
        {requestError ? <div className="scene-error-banner">{requestError}</div> : null}
        <div className="settlement-panel">
          <div className="settlement-panel__title">
            {settlementData.result === 'SUCCESS' ? '任务成功' : '任务失败'}
          </div>
          <div className="settlement-panel__subtitle">
            {currentPresentation.title} · {currentPresentation.locationName ?? '未知地点'}
          </div>

          {settlementData.result === 'SUCCESS' ? (
            settlementRewardSlots.map((reward, index) => (
              <div
                key={reward.key}
                className="tavern-reward"
                style={{
                  left: `${REWARD_X_POSITIONS[index] ?? REWARD_X_POSITIONS[0]}px`,
                  top: `${REWARD_BASE_Y}px`,
                }}
                title={reward.label}
              >
                <img className="tavern-reward__slot" src="/assets/ui/token_slot_bg.png" alt="" />
                <img className="tavern-reward__icon" src={reward.iconSrc} alt={reward.label} />
                <div className="tavern-reward__value">{reward.amountText}</div>
              </div>
            ))
          ) : (
            <div className="settlement-panel__failure">这趟空手而归，下次再试。</div>
          )}

          <button className="settlement-panel__confirm" type="button" onClick={handleSettlementConfirm}>
            确认收取
          </button>
        </div>
      </div>
    );
  }

  if (activeMission && currentPresentation) {
    return (
      <div className="scene scene--taskbackdrop" style={taskSceneStyle}>
        {requestError ? <div className="scene-error-banner">{requestError}</div> : null}
        <div className="journey-screen journey-screen--countdown">
          <div className="journey-screen__title">赶路中</div>
          <div className="journey-screen__location">前往 {currentPresentation.locationName ?? '未知地点'}</div>
          <div className="journey-screen__mission">{currentPresentation.title}</div>
          <div className="journey-screen__countdown">{formatRemainingTime(remainingSec)}</div>
          <div className="journey-screen__progress">
            <div className="journey-screen__progress-fill" style={{ width: `${countdownProgress * 100}%` }} />
          </div>
          <div className="journey-screen__hint">倒计时结束后，将自动进入服务端已结算的战斗演示。</div>
          <button
            className="journey-screen__skip"
            type="button"
            disabled={loadingAction === 'SKIP_MISSION' || loadingAction === 'COMPLETE_MISSION'}
            onClick={handleSkipCountdown}
          >
            {loadingAction === 'SKIP_MISSION' ? '正在跳过...' : '-1 沙漏，跳过赶路'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="scene scene--tavern">
      {requestError ? <div className="scene-error-banner">{requestError}</div> : null}

      {npcVisual && npcGreeting ? (
        <button
          className="scene__npc"
          style={{
            left: `${npcVisual.x}px`,
            top: `${npcVisual.y}px`,
            width: `${npcVisual.width}px`,
            height: `${npcVisual.height}px`,
          }}
          type="button"
          aria-label={npcGreeting.name}
          onClick={handleNpcClick}
        >
          <img className="scene__npc-image scene__npc-image--idle" src={npcVisual.idleSrc} alt="" />
          <img className="scene__npc-image scene__npc-image--hover" src={npcVisual.hoverSrc} alt="" />
        </button>
      ) : null}

      {panelOpen && npcGreeting && previewPresentation ? (
        <div className="tavern-panel">
          <div className="tavern-dialog" style={{ backgroundImage: 'url(/assets/ui/dialog_bg_in_tavern.png)' }}>
            <div className="tavern-dialog__text">
              {npcGreeting.name}说：{npcGreeting.dialogue}
              <br />
              去{previewPresentation.locationName ?? '任务地点'}干掉{previewPresentation.enemyName}。
            </div>
          </div>

          {previewRewardSlots.map((reward, index) => (
            <div
              key={reward.key}
              className="tavern-reward"
              style={{
                left: `${REWARD_X_POSITIONS[index] ?? REWARD_X_POSITIONS[0]}px`,
                top: `${REWARD_BASE_Y}px`,
              }}
              title={reward.label}
            >
              <img className="tavern-reward__slot" src="/assets/ui/token_slot_bg.png" alt="" />
              <img className="tavern-reward__icon" src={reward.iconSrc} alt={reward.label} />
              <div className="tavern-reward__value">{reward.amountText}</div>
            </div>
          ))}

          <div className="tavern-panel__actions">
            {tavern.missionOffers.map((offer, index) => (
              <button
                key={offer.missionId}
                className={`tavern-panel__action${selectedOfferIndex === index ? ' tavern-panel__action--active' : ''}`}
                type="button"
                onClick={() => setSelectedOfferIndex(index)}
              >
                {offer.title}
              </button>
            ))}
            <button
              className="tavern-panel__action tavern-panel__action--confirm"
              type="button"
              disabled={loadingAction === 'START_MISSION'}
              onClick={handleStartMission}
            >
              {loadingAction === 'START_MISSION' ? '领取中...' : '领取任务'}
            </button>
            <button
              className="tavern-panel__action tavern-panel__action--close"
              type="button"
              onClick={() => setPanelOpen(false)}
            >
              关闭
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
