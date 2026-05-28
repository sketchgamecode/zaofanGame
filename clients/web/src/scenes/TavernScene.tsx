import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { postGameAction } from '../api/gameApi';
import { BattleReplay } from '../components/combat/BattleReplay';
import { CharacterPanel, type CharacterPanelPosition } from '../components/character/CharacterPanel';
import { CharacterPortraitCard } from '../components/character/CharacterPortraitCard';
import { getAvatarUrl, POWER_FACTION_LABELS } from '../config/characterCatalog';
import { formatCountdown } from '../lib/formatters';
import { toActionErrorMessage } from '../lib/manualErrors';
import { useGameState } from '../state/GameStateContext';
import type { MailSaveMissionReplayData } from '../types/combat';
import type { PowerFactionId, PowerTransferResult, WorldActorDetailView } from '../types/game';
import type {
  ActiveMissionView,
  CompleteMissionData,
  MissionCaseType,
  MissionIssuerActorPreview,
  MissionOffer,
  MissionPowerContext,
  MissionSourcePayload,
  MissionTargetActorPreview,
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
  sourceLabel?: string;
  powerContext: MissionPowerContext;
  rewardPreview: RewardPreview;
  visibleReward?: VisibleReward;
  targetActor?: MissionTargetActorPreview;
  issuerActor?: MissionIssuerActorPreview;
};

export type TavernMissionSource = {
  locationId: string;
  servicePositionId?: string;
  issuerActorId?: string;
  sourceLabel?: string;
};

type TavernSceneProps = {
  missionSource?: TavernMissionSource;
  onBack?: () => void;
};

type RewardSlot = {
  key: string;
  iconSrc: string;
  amountText: string;
  label: string;
};

const NPC_VISUALS: Record<string, NpcVisualConfig> = {
  npc_laobao: { idleSrc: '/assets/foregrounds/tavern_guest_0.png', hoverSrc: '/assets/foregrounds/tavern_guest_0_hover.png', x: 109, y: 381, width: 245, height: 489 },
  npc_cuihua: { idleSrc: '/assets/foregrounds/tavern_guest_1.png', hoverSrc: '/assets/foregrounds/tavern_guest_1_hover.png', x: 767, y: 351, width: 330, height: 499 },
  npc_daoye: { idleSrc: '/assets/foregrounds/tavern_guest_2.png', hoverSrc: '/assets/foregrounds/tavern_guest_2_hover.png', x: 767, y: 180, width: 443, height: 723 },
  npc_mao_jiu: { idleSrc: '/assets/foregrounds/tavern_guest_3.png', hoverSrc: '/assets/foregrounds/tavern_guest_3_hover.png', x: 109, y: 220, width: 306, height: 667 },
  npc_xue_gu: { idleSrc: '/assets/foregrounds/tavern_guest_4.png', hoverSrc: '/assets/foregrounds/tavern_guest_4_hover.png', x: 767, y: 336, width: 343, height: 508 },
};

const REWARD_X_POSITIONS = [440, 622, 804, 986, 1168];
const REWARD_BASE_Y = 516;

const CASE_TYPE_LABELS: Record<MissionCaseType, string> = {
  raid: '清剿',
  audit: '查账',
  escort: '押送',
  arrest: '缉拿',
  purge: '清洗',
  smuggle: '暗运',
  petition: '奏报',
};

const FALLBACK_POWER_CONTEXTS: MissionPowerContext[] = [
  {
    issuerFaction: 'imperial',
    targetFaction: 'noble',
    caseType: 'arrest',
    suspicionDeltaPreview: { noble: 2, border: 1 },
  },
  {
    issuerFaction: 'border',
    targetFaction: 'underworld',
    caseType: 'raid',
    suspicionDeltaPreview: { underworld: 1 },
  },
  {
    issuerFaction: 'silver',
    targetFaction: 'censorate',
    caseType: 'audit',
    suspicionDeltaPreview: { censorate: 2 },
  },
];
const DEFAULT_POWER_CONTEXT = FALLBACK_POWER_CONTEXTS[0]!;

function formatFaction(faction: PowerFactionId) {
  return POWER_FACTION_LABELS[faction];
}

function getMissionPowerContext(offer: Pick<MissionOffer, 'slotIndex' | 'powerContext'>): MissionPowerContext {
  return offer.powerContext ?? FALLBACK_POWER_CONTEXTS[offer.slotIndex] ?? DEFAULT_POWER_CONTEXT;
}

function formatPowerDelta(delta?: Partial<Record<PowerFactionId, number>>) {
  const entries = Object.entries(delta ?? {})
    .filter(([, value]) => typeof value === 'number' && value !== 0) as Array<[PowerFactionId, number]>;

  if (entries.length === 0) {
    return '牵连较轻';
  }

  return entries
    .map(([faction, value]) => `${formatFaction(faction)} ${value > 0 ? '+' : ''}${value}`)
    .join(' / ');
}

function formatSuspicionDelta(context: MissionPowerContext) {
  return formatPowerDelta(context.suspicionDeltaPreview);
}

function formatPowerTransferDelta(delta?: Partial<Record<PowerFactionId, number>>) {
  const entries = Object.entries(delta ?? {})
    .filter(([, value]) => typeof value === 'number' && value !== 0) as Array<[PowerFactionId, number]>;

  if (entries.length === 0) {
    return '无明显变化';
  }

  return entries
    .map(([faction, value]) => `${formatFaction(faction)} ${value > 0 ? '+' : ''}${formatPowerShare(value)}`)
    .join(' / ');
}

function formatPowerShare(value: number) {
  return `${(value / 100).toFixed(2)}%`;
}

function formatPowerTransfer(transfer?: PowerTransferResult) {
  if (!transfer) {
    return null;
  }

  const issuerText = formatPowerTransferDelta(transfer.issuerFactionPowerDelta);
  const targetText = formatPowerTransferDelta(transfer.targetFactionPowerDelta);
  const actorText = transfer.actorPowerDelta ? `本人 ${transfer.actorPowerDelta > 0 ? '+' : ''}${formatPowerShare(transfer.actorPowerDelta)}` : '';

  return [issuerText, targetText, actorText]
    .filter((text) => text && text !== '无明显变化')
    .join(' / ') || '权柄无明显变化';
}

function formatActorPowerDelta(transfer?: PowerTransferResult) {
  const delta = transfer?.actorPowerDelta ?? 0;

  if (delta === 0) {
    return '未夺得个人权柄';
  }

  return `本人权柄 ${delta > 0 ? '+' : ''}${formatPowerShare(delta)}`;
}

function wasTargetActorDebited(transfer: PowerTransferResult | undefined, targetActor: MissionTargetActorPreview | undefined) {
  if (!transfer?.targetActorIds?.length || !targetActor) {
    return false;
  }

  return transfer.targetActorIds.includes(targetActor.actorId);
}

function toPanelPositions(positions: WorldActorDetailView['positions']): CharacterPanelPosition[] {
  return positions.map((position) => ({
    positionId: position.positionId,
    locationName: position.locationName,
    title: position.title,
    serviceLabel: position.serviceLabel,
    ownerLabel: position.ownerLabel,
    incomeHint: position.incomeHint,
    replaceHint: position.replaceHint,
    statusLabel: position.status,
  }));
}

function renderIssuerCard(issuerActor: MissionIssuerActorPreview, label = '发布人', onActorClick?: (actorId: string) => void) {
  return (
    <div
      className="tavern-issuer-card tavern-character-card-clickable"
      role="button"
      tabIndex={0}
      onClick={() => onActorClick?.(issuerActor.actorId)}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onActorClick?.(issuerActor.actorId);
        }
      }}
    >
      <CharacterPortraitCard
        avatarUrl={getAvatarUrl(issuerActor.avatarId)}
        level={issuerActor.level}
        name={issuerActor.displayName}
        rankText={`${formatFaction(issuerActor.faction)} · 权柄${formatPowerShare(issuerActor.powerShare)}`}
        title={issuerActor.title ?? label}
        xpProgress={0.48}
      />
      <div className="tavern-issuer-card__copy">
        <span>{label}</span>
        <strong>{issuerActor.locationName ?? '京城场所'}</strong>
        <em>{issuerActor.title ?? '任职者'}</em>
      </div>
    </div>
  );
}

function renderTargetCard(targetActor: MissionTargetActorPreview, label = '差事目标', onActorClick?: (actorId: string) => void) {
  return (
    <div
      className="tavern-target-card tavern-character-card-clickable"
      role="button"
      tabIndex={0}
      onClick={() => onActorClick?.(targetActor.actorId)}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onActorClick?.(targetActor.actorId);
        }
      }}
    >
      <CharacterPortraitCard
        avatarUrl={getAvatarUrl(targetActor.avatarId)}
        level={targetActor.level}
        name={targetActor.displayName}
        rankText={`${formatFaction(targetActor.faction)} · 权柄${formatPowerShare(targetActor.powerShare)}`}
        title={targetActor.title ?? label}
        xpProgress={0.35}
      />
      <div className="tavern-target-card__copy">
        <span>{label}</span>
        <strong>{targetActor.reason}</strong>
        <em>{targetActor.locationName ?? '京城名册'}</em>
      </div>
    </div>
  );
}

function createPresentationFromOffer(offer: MissionOffer): MissionPresentation {
  return {
    missionId: offer.missionId,
    title: offer.title,
    locationName: offer.sourceLocationName ?? offer.locationName,
    enemyName: offer.targetActor?.displayName ?? offer.enemyPreview.name,
    sourceLabel: offer.issuerDisplayName
      ? `${offer.sourceLocationName ?? offer.locationName ?? '差事场所'} · ${offer.issuerTitle ?? '任职者'} ${offer.issuerDisplayName}`
      : undefined,
    powerContext: getMissionPowerContext(offer),
    targetActor: offer.targetActor,
    issuerActor: offer.issuerActor,
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
    locationName: activeMission.sourceLocationName ?? activeMission.locationName,
    enemyName: '差事目标',
    sourceLabel: activeMission.issuerDisplayName
      ? `${activeMission.sourceLocationName ?? activeMission.locationName ?? '差事场所'} · ${activeMission.issuerTitle ?? '任职者'} ${activeMission.issuerDisplayName}`
      : undefined,
    powerContext: activeMission.powerContext ?? FALLBACK_POWER_CONTEXTS[activeMission.slotIndex] ?? DEFAULT_POWER_CONTEXT,
    rewardPreview: activeMission.rewardPreview,
    targetActor: activeMission.targetActor,
    issuerActor: activeMission.issuerActor,
  };
}

function buildRewardSlots(rewardPreview: RewardPreview, visibleReward?: VisibleReward): RewardSlot[] {
  const rewardSlots: RewardSlot[] = [
    {
      key: 'copper',
      iconSrc: '/assets/ui/token_0.png',
      amountText: String(rewardPreview.copper),
      label: '铜钱',
    },
    {
      key: 'xp',
      iconSrc: '/assets/ui/token_1.png',
      amountText: String(rewardPreview.xp),
      label: '经验',
    },
  ];

  if (rewardPreview.hasEquipment) {
    rewardSlots.push({
      key: 'equipment',
      iconSrc: '/assets/ui/token_placehoder.png',
      amountText: '1',
      label: visibleReward?.equipmentPreview?.name ?? '装备',
    });
  }

  if (rewardPreview.hasDungeonKey) {
    rewardSlots.push({
      key: 'dungeon_key',
      iconSrc: '/assets/ui/token_placehoder.png',
      amountText: '1',
      label: visibleReward?.dungeonKeyPreview?.name ?? '钥牌',
    });
  }

  if (rewardPreview.hasHourglass) {
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
    rewardSlots.push({ key: 'copper', iconSrc: '/assets/ui/token_0.png', amountText: String(data.grantedReward.copper), label: '铜钱' });
  }
  if (data.grantedReward.xp > 0) {
    rewardSlots.push({ key: 'xp', iconSrc: '/assets/ui/token_1.png', amountText: String(data.grantedReward.xp), label: '经验' });
  }
  if (data.grantedReward.equipment) {
    rewardSlots.push({ key: 'equipment', iconSrc: '/assets/ui/token_placehoder.png', amountText: '1', label: data.grantedReward.equipment.name });
  }
  if (data.grantedReward.dungeonKey) {
    rewardSlots.push({ key: 'dungeon_key', iconSrc: '/assets/ui/token_placehoder.png', amountText: '1', label: data.grantedReward.dungeonKey.name });
  }
  if (data.grantedReward.hourglass > 0) {
    rewardSlots.push({ key: 'hourglass', iconSrc: '/assets/ui/token_placehoder.png', amountText: String(data.grantedReward.hourglass), label: '沙漏' });
  } else if (data.grantedReward.tokens > 0) {
    rewardSlots.push({ key: 'tokens', iconSrc: '/assets/ui/token_placehoder.png', amountText: String(data.grantedReward.tokens), label: '令牌' });
  }

  return rewardSlots.slice(0, REWARD_X_POSITIONS.length);
}

export function TavernScene({ missionSource, onBack }: TavernSceneProps = {}) {
  const { refreshCharacterInfo, runServerAction } = useGameState();
  const [tavernData, setTavernData] = useState<TavernInfoData | null>(null);
  const [loading, setLoading] = useState(true);
  const [requestError, setRequestError] = useState<string | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const [selectedOfferIndex, setSelectedOfferIndex] = useState(0);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [snapshotReceivedAtMs, setSnapshotReceivedAtMs] = useState(0);
  const [nowMs, setNowMs] = useState(Date.now());
  const [missionPresentation, setMissionPresentation] = useState<MissionPresentation | null>(null);
  const [settlementData, setSettlementData] = useState<CompleteMissionData | null>(null);
  const [replaySaved, setReplaySaved] = useState(false);
  const [actorDetail, setActorDetail] = useState<WorldActorDetailView | null>(null);
  const [actorDetailError, setActorDetailError] = useState<string | null>(null);
  const autoResolveMissionIdRef = useRef<string | null>(null);

  const tavern = tavernData?.tavern ?? null;
  const activeMission = tavern?.activeMission ?? null;
  const npcGreeting = tavern?.npcGreeting ?? null;
  const npcVisual = npcGreeting ? NPC_VISUALS[npcGreeting.npcId] : null;
  const selectedOffer = tavern?.missionOffers[selectedOfferIndex] ?? tavern?.missionOffers[0] ?? null;
  const previewPresentation = selectedOffer ? createPresentationFromOffer(selectedOffer) : null;
  const currentPresentation = missionPresentation ?? (activeMission ? createPresentationFromActiveMission(activeMission) : null);
  const previewRewardSlots = previewPresentation ? buildRewardSlots(previewPresentation.rewardPreview, previewPresentation.visibleReward) : [];
  const settlementRewardSlots = settlementData ? buildSettlementRewardSlots(settlementData) : [];
  const taskBackgroundPath = currentPresentation ? resolveTaskBackgroundPath(currentPresentation.locationName) : null;
  const missionSourcePayload: MissionSourcePayload = useMemo(() => ({
    locationId: missionSource?.locationId,
    servicePositionId: missionSource?.servicePositionId,
    issuerActorId: missionSource?.issuerActorId,
  }), [missionSource]);

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
      const snapshot = await runServerAction(
        'TAVERN_GET_INFO',
        () => postGameAction<TavernInfoData>('TAVERN_GET_INFO', missionSourcePayload),
      );
      applyTavernSnapshot(snapshot);
    } catch (error) {
      setRequestError(toActionErrorMessage(error, '差房案牌读取失败。'));
    } finally {
      setLoading(false);
    }
  }, [applyTavernSnapshot, missionSourcePayload, runServerAction]);

  useEffect(() => {
    void loadTavern();
  }, [loadTavern]);

  useEffect(() => {
    if (missionSource && tavern?.status === 'IDLE' && tavern.missionOffers.length > 0) {
      setSelectedOfferIndex(0);
      setPanelOpen(true);
    }
  }, [missionSource, tavern?.missionOffers.length, tavern?.status]);

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
    if (!activeMission || settlementData) {
      return;
    }

    const timerId = window.setInterval(() => {
      setNowMs(Date.now());
    }, 1000);

    return () => window.clearInterval(timerId);
  }, [activeMission, settlementData]);

  useEffect(() => {
    if (!activeMission) {
      autoResolveMissionIdRef.current = null;
      return;
    }

    if (!missionPresentation || missionPresentation.missionId !== activeMission.missionId) {
      setMissionPresentation(createPresentationFromActiveMission(activeMission));
    }
  }, [activeMission, missionPresentation]);

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

  const runMissionSettlement = useCallback(async (action: 'COMPLETE_MISSION' | 'SKIP_MISSION') => {
    if (!activeMission || loadingAction) {
      return;
    }

    const resolvedPresentation = missionPresentation ?? createPresentationFromActiveMission(activeMission);
    setMissionPresentation(resolvedPresentation);
    setLoadingAction(action);
    setRequestError(null);

    try {
      const data = await runServerAction(action, async () => {
        const result = await postGameAction<CompleteMissionData>(action);
        await refreshCharacterInfo().catch(() => {});
        return result;
      });
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
      setReplaySaved(!data.canSaveReplay);

      if (data.result === 'ALREADY_SETTLED') {
        setSettlementData(null);
        setMissionPresentation(null);
      } else {
        setSettlementData(data);
      }

    } catch (error) {
      autoResolveMissionIdRef.current = null;
      setRequestError(toActionErrorMessage(error, '差事结算失败。'));
    } finally {
      setLoadingAction(null);
    }
  }, [activeMission, loadingAction, missionPresentation, refreshCharacterInfo, runServerAction]);

  useEffect(() => {
    if (!activeMission || settlementData || loadingAction) {
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
  }, [activeMission, loadingAction, remainingSec, runMissionSettlement, settlementData, tavern?.status]);

  async function handleActorDetail(actorId: string | undefined) {
    if (!actorId) {
      return;
    }

    setActorDetailError(null);
    try {
      const detail = await runServerAction(
        'WORLD_ACTOR_GET_DETAIL',
        () => postGameAction<WorldActorDetailView>('WORLD_ACTOR_GET_DETAIL', { actorId }),
      );
      setActorDetail(detail);
    } catch (error) {
      setActorDetailError(toActionErrorMessage(error, '角色详情读取失败。'));
    }
  }

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
      const snapshot = await runServerAction(
        'START_MISSION',
        () => postGameAction<TavernInfoData>('START_MISSION', {
          missionId: selectedOffer.missionId,
          offerSetId: selectedOffer.offerSetId,
        }),
      );
      setMissionPresentation(createPresentationFromOffer(selectedOffer));
      applyTavernSnapshot(snapshot);
      setPanelOpen(false);
    } catch (error) {
      setRequestError(toActionErrorMessage(error, '领取差事失败。'));
    } finally {
      setLoadingAction(null);
    }
  };

  const handleSkipCountdown = () => {
    void runMissionSettlement('SKIP_MISSION');
  };

  const handleSaveReplay = async () => {
    if (!settlementData || replaySaved || loadingAction === 'MAIL_SAVE_MISSION_REPLAY') {
      return;
    }

    setLoadingAction('MAIL_SAVE_MISSION_REPLAY');
    setRequestError(null);

    try {
      const data = await runServerAction(
        'MAIL_SAVE_MISSION_REPLAY',
        () => postGameAction<MailSaveMissionReplayData>('MAIL_SAVE_MISSION_REPLAY'),
      );
      setReplaySaved(true);
      if (!data.alreadySaved) {
        setSettlementData((previous) => (
          previous
            ? {
                ...previous,
                canSaveReplay: false,
                replayId: data.replay.replayId,
              }
            : previous
        ));
      }
    } catch (error) {
      setRequestError(toActionErrorMessage(error, '保存回放失败。'));
    } finally {
      setLoadingAction(null);
    }
  };

  const handleSettlementConfirm = () => {
    setSettlementData(null);
    setPanelOpen(false);
    setSelectedOfferIndex(0);
    setMissionPresentation(null);
    setReplaySaved(false);
    if (missionSource && onBack) {
      onBack();
    }
  };

  const taskSceneStyle = taskBackgroundPath
    ? {
        backgroundImage: `linear-gradient(180deg, rgba(18, 12, 8, 0.2), rgba(10, 9, 8, 0.12)), url(${taskBackgroundPath})`,
      }
    : undefined;
  const sourceBackButton = onBack ? (
    <button className="tavern-source-back" type="button" onClick={onBack}>
      返回场所
    </button>
  ) : null;
  const actorDetailModal = actorDetail ? (
    <div className="character-detail-modal" role="dialog" aria-modal="true" aria-label="角色详情">
      <button className="character-detail-modal__close" type="button" onClick={() => setActorDetail(null)}>
        关闭
      </button>
      <div className="character-detail-modal__panel">
        <CharacterPanel
          character={actorDetail.character}
          pendingAction={null}
          positions={toPanelPositions(actorDetail.positions)}
          readOnly
        />
      </div>
    </div>
  ) : null;
  const actorDetailErrorBanner = actorDetailError ? (
    <div className="scene-error-banner scene-error-banner--floating">{actorDetailError}</div>
  ) : null;

  if (loading && !tavern) {
    return (
      <div className="scene scene--tavern scene-status">
        {sourceBackButton}
        <div className="scene-status__panel">正在同步差房案牌...</div>
      </div>
    );
  }

  if (!tavern) {
    return (
      <div className="scene scene--tavern scene-status">
        {sourceBackButton}
        <div className="scene-status__panel scene-status__panel--error">
          {requestError ?? '差房暂不可用，请稍后重试。'}
        </div>
      </div>
    );
  }

  if (settlementData && currentPresentation) {
    return (
      <div className="scene scene--taskbackdrop" style={taskSceneStyle}>
        {sourceBackButton}
        {requestError ? <div className="scene-error-banner">{requestError}</div> : null}
        {actorDetailErrorBanner}
        <BattleReplay
          battleResult={settlementData.battleResult}
          heading={settlementData.result === 'SUCCESS' ? '差事得手' : '差事失利'}
          subheading={`${currentPresentation.title} · ${currentPresentation.locationName ?? '未知地点'}`}
          contextLabel="MISSION"
          resultBody={(
            <div className="battle-summary">
              {/* Left Column: Issuer Card and Target Details */}
              <div className="battle-summary__left-col">
                {(settlementData.issuerActor ?? currentPresentation.issuerActor)
                  ? renderIssuerCard((settlementData.issuerActor ?? currentPresentation.issuerActor)!, '交差对象', (actorId) => void handleActorDetail(actorId))
                  : null}
                
                {settlementData.result === 'SUCCESS' ? (
                  <>
                    {(settlementData.targetActor ?? currentPresentation.targetActor) ? (
                      <div
                        className="battle-summary__target tavern-character-card-clickable"
                        role="button"
                        tabIndex={0}
                        onClick={() => void handleActorDetail((settlementData.targetActor ?? currentPresentation.targetActor)?.actorId)}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter' || event.key === ' ') {
                            event.preventDefault();
                            void handleActorDetail((settlementData.targetActor ?? currentPresentation.targetActor)?.actorId);
                          }
                        }}
                      >
                        <div className="battle-summary__target-label">本案目标</div>
                        <div className="battle-summary__target-name">
                          {(settlementData.targetActor ?? currentPresentation.targetActor)!.displayName}
                        </div>
                        <div className="battle-summary__target-reason">
                          {(settlementData.targetActor ?? currentPresentation.targetActor)!.reason}
                        </div>
                      </div>
                    ) : null}
                  </>
                ) : (
                  <>
                    {(settlementData.targetActor ?? currentPresentation.targetActor) ? (
                      <div
                        className="battle-summary__target tavern-character-card-clickable"
                        role="button"
                        tabIndex={0}
                        onClick={() => void handleActorDetail((settlementData.targetActor ?? currentPresentation.targetActor)?.actorId)}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter' || event.key === ' ') {
                            event.preventDefault();
                            void handleActorDetail((settlementData.targetActor ?? currentPresentation.targetActor)?.actorId);
                          }
                        }}
                      >
                        <div className="battle-summary__target-label">被挡下目标</div>
                        <div className="battle-summary__target-name">
                          {(settlementData.targetActor ?? currentPresentation.targetActor)!.displayName}
                        </div>
                        <div className="battle-summary__target-reason">
                          {(settlementData.targetActor ?? currentPresentation.targetActor)!.reason}
                        </div>
                      </div>
                    ) : null}
                  </>
                )}
              </div>

              {/* Right Column: Consequences, Rewards, Faction changes */}
              <div className="battle-summary__right-col">
                {settlementData.result === 'SUCCESS' ? (
                  <>
                    {settlementData.powerResult?.powerTransfer ? (
                      <div className="battle-summary__consequence-grid">
                        <div>
                          <span>个人权柄</span>
                          <strong>{formatActorPowerDelta(settlementData.powerResult.powerTransfer)}</strong>
                        </div>
                        <div>
                          <span>目标扣减</span>
                          <strong>
                            {wasTargetActorDebited(
                              settlementData.powerResult.powerTransfer,
                              settlementData.targetActor ?? currentPresentation.targetActor,
                            )
                              ? '优先从该目标名下扣除'
                              : '从目标派系名册扣除'}
                          </strong>
                        </div>
                        <div>
                          <span>派系疑心</span>
                          <strong>{formatPowerDelta(settlementData.powerResult.suspicionDelta)}</strong>
                        </div>
                        <div>
                          <span>目标状态</span>
                          <strong>未死亡 · 未夺职</strong>
                        </div>
                      </div>
                    ) : null}

                    <div className="battle-summary__reward-row">
                      {settlementRewardSlots.map((reward) => (
                        <div
                          key={reward.key}
                          className="battle-summary__reward"
                          title={reward.label}
                        >
                          <img className="tavern-reward__slot" src="/assets/ui/token_slot_bg.png" alt="" />
                          <img className="tavern-reward__icon" src={reward.iconSrc} alt={reward.label} />
                          <div className="tavern-reward__value">{reward.amountText}</div>
                        </div>
                      ))}
                    </div>

                    <div className="battle-summary__power-info">
                      <div className="battle-summary__power-note">
                        {settlementData.powerResult
                          ? `牵连变化：${formatPowerDelta(settlementData.powerResult.suspicionDelta)}`
                          : `牵连预估：${formatSuspicionDelta(currentPresentation.powerContext)}`}
                      </div>
                      {settlementData.powerResult ? (
                        <div className="battle-summary__power-after">
                          当前牵连：{formatPowerDelta(settlementData.powerResult.suspicionAfter)}
                        </div>
                      ) : null}
                      {settlementData.powerResult?.powerTransfer ? (
                        <div className="battle-summary__power-after">
                          权柄变化：{formatPowerTransfer(settlementData.powerResult.powerTransfer)}
                        </div>
                      ) : null}
                    </div>
                  </>
                ) : (
                  <>
                    <div className="battle-summary__consequence-grid battle-summary__consequence-grid--failure">
                      <div>
                        <span>个人权柄</span>
                        <strong>未转移</strong>
                      </div>
                      <div>
                        <span>目标权柄</span>
                        <strong>守住名下权柄</strong>
                      </div>
                      <div>
                        <span>派系疑心</span>
                        <strong>未增加</strong>
                      </div>
                      <div>
                        <span>目标状态</span>
                        <strong>未死亡 · 未夺职</strong>
                      </div>
                    </div>
                    <div className="battle-summary__failure">此行空手而归，待整顿后再走一遭。</div>
                  </>
                )}
              </div>
            </div>
          )}
          actions={[
            ...(settlementData.canSaveReplay && !replaySaved
              ? [{
                  key: 'save',
                  label: loadingAction === 'MAIL_SAVE_MISSION_REPLAY' ? '保存中...' : '保存回放',
                  onClick: () => void handleSaveReplay(),
                  disabled: loadingAction === 'MAIL_SAVE_MISSION_REPLAY',
                  variant: 'secondary' as const,
                }]
              : []),
            {
              key: 'confirm',
              label: '确认收取',
              onClick: handleSettlementConfirm,
              variant: 'primary' as const,
            },
          ]}
        />
        {actorDetailModal}
      </div>
    );
  }

  if (activeMission && currentPresentation) {
    return (
      <div className="scene scene--taskbackdrop" style={taskSceneStyle}>
        {sourceBackButton}
        {requestError ? <div className="scene-error-banner">{requestError}</div> : null}
        {actorDetailErrorBanner}
        <div className="journey-screen journey-screen--countdown">
          {currentPresentation.issuerActor ? (
            <div className="journey-screen__side-panel">
              <div className="journey-screen__side-title">发布差事</div>
              {renderIssuerCard(currentPresentation.issuerActor, '发布差事', (actorId) => void handleActorDetail(actorId))}
            </div>
          ) : null}

          <div className="journey-screen__center-panel">
            <div className="journey-screen__title">赶路中</div>
            <div className="journey-screen__location">前往 {currentPresentation.locationName ?? '未知地点'}</div>
            {currentPresentation.sourceLabel ? (
              <div className="journey-screen__issuer">{currentPresentation.sourceLabel}</div>
            ) : null}
            <div className="journey-screen__mission">{currentPresentation.title}</div>
            <div className="journey-screen__power">
              <span>{formatFaction(currentPresentation.powerContext.issuerFaction)}发差</span>
              <span>{CASE_TYPE_LABELS[currentPresentation.powerContext.caseType]}</span>
              <span>目标：{formatFaction(currentPresentation.powerContext.targetFaction)}</span>
            </div>
            <div className="journey-screen__countdown">{formatCountdown(remainingSec * 1000)}</div>
            <div className="journey-screen__progress">
              <div className="journey-screen__progress-fill" style={{ width: `${countdownProgress * 100}%` }} />
            </div>
            <div className="journey-screen__hint">倒计时结束后将直接播放服务端已结算的战斗回放。</div>
            <button
              className="journey-screen__skip"
              type="button"
              disabled={loadingAction === 'SKIP_MISSION' || loadingAction === 'COMPLETE_MISSION'}
              onClick={handleSkipCountdown}
            >
              {loadingAction === 'SKIP_MISSION' ? '正在跳过...' : '-1 沙漏，跳过赶路'}
            </button>
          </div>

          {currentPresentation.targetActor ? (
            <div className="journey-screen__side-panel">
              <div className="journey-screen__side-title">差事目标</div>
              {renderTargetCard(currentPresentation.targetActor, '差事目标', (actorId) => void handleActorDetail(actorId))}
            </div>
          ) : null}
        </div>
        {actorDetailModal}
      </div>
    );
  }

  return (
    <div className="scene scene--tavern">
      {sourceBackButton}
      {requestError ? <div className="scene-error-banner">{requestError}</div> : null}
      {actorDetailErrorBanner}

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
              去{previewPresentation.locationName ?? '办差地点'}拿下{previewPresentation.enemyName}。
            </div>
          </div>

          {previewPresentation.sourceLabel ? (
            <div className="tavern-source-label">发布：{previewPresentation.sourceLabel}</div>
          ) : null}

          {previewPresentation.issuerActor ? renderIssuerCard(previewPresentation.issuerActor, '发布差事', (actorId) => void handleActorDetail(actorId)) : null}

          <div className="tavern-power-brief">
            <div>
              <span>发布方</span>
              <strong>{formatFaction(previewPresentation.powerContext.issuerFaction)}</strong>
            </div>
            <div>
              <span>目标方</span>
              <strong>{formatFaction(previewPresentation.powerContext.targetFaction)}</strong>
            </div>
            <div>
              <span>案类</span>
              <strong>{CASE_TYPE_LABELS[previewPresentation.powerContext.caseType]}</strong>
            </div>
            <div>
              <span>牵连预估</span>
              <strong>{formatSuspicionDelta(previewPresentation.powerContext)}</strong>
            </div>
          </div>

          {previewPresentation.targetActor ? (
            <div
              className="tavern-target-card tavern-character-card-clickable"
              role="button"
              tabIndex={0}
              onClick={() => void handleActorDetail(previewPresentation.targetActor?.actorId)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  void handleActorDetail(previewPresentation.targetActor?.actorId);
                }
              }}
            >
              <CharacterPortraitCard
                avatarUrl={getAvatarUrl(previewPresentation.targetActor.avatarId)}
                level={previewPresentation.targetActor.level}
                name={previewPresentation.targetActor.displayName}
                rankText={`${formatFaction(previewPresentation.targetActor.faction)} · 权柄${formatPowerShare(previewPresentation.targetActor.powerShare)}`}
                title={previewPresentation.targetActor.title ?? CASE_TYPE_LABELS[previewPresentation.powerContext.caseType]}
                xpProgress={0.35}
              />
              <div className="tavern-target-card__copy">
                <span>本案目标</span>
                <strong>{previewPresentation.targetActor.reason}</strong>
                <em>{previewPresentation.targetActor.locationName ?? previewPresentation.locationName ?? '京城名册'}</em>
              </div>
            </div>
          ) : null}

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
              onClick={() => void handleStartMission()}
            >
              {loadingAction === 'START_MISSION' ? '领牌中...' : '领取差事'}
            </button>
            <button className="tavern-panel__action tavern-panel__action--close" type="button" onClick={() => setPanelOpen(false)}>
              关闭
            </button>
          </div>
        </div>
      ) : null}
      {actorDetailModal}
    </div>
  );
}
