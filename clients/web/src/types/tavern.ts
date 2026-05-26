import type { BattleResultV2 } from './combat';
import type { PowerFactionId } from './game';

export type TavernStatus = 'IDLE' | 'IN_PROGRESS' | 'READY_TO_COMPLETE';

export type VisibleReward = {
  xp: number;
  copper: number;
  hasEquipment: boolean;
  equipmentPreview?: {
    slot: string;
    rarity: number;
    name?: string;
  };
  hasDungeonKey: boolean;
  dungeonKeyPreview?: {
    dungeonId: string;
    name: string;
  };
  hasHourglass?: boolean;
};

export type EnemyPreview = {
  enemyId: string;
  name: string;
  level: number;
  archetype?: string;
};

export type MissionCaseType = 'raid' | 'audit' | 'escort' | 'arrest' | 'purge' | 'smuggle' | 'petition';

export type MissionPowerContext = {
  issuerFaction: PowerFactionId;
  targetFaction: PowerFactionId;
  caseType: MissionCaseType;
  powerDeltaPreview?: Partial<Record<PowerFactionId, number>>;
  suspicionDeltaPreview?: Partial<Record<PowerFactionId, number>>;
};

export type MissionOffer = {
  offerSetId: string;
  missionId: string;
  offerSeq: number;
  slotIndex: 0 | 1 | 2;
  title: string;
  description: string;
  locationName?: string;
  baseDurationSec: number;
  actualDurationSec: number;
  thirstCostSec: number;
  visibleReward: VisibleReward;
  enemyPreview: EnemyPreview;
  powerContext?: MissionPowerContext;
  generatedAt: number;
};

export type RewardPreview = {
  xp: number;
  copper: number;
  hasEquipment: boolean;
  hasDungeonKey: boolean;
  hasHourglass?: boolean;
};

export type ActiveMissionView = {
  missionId: string;
  offerSetId: string;
  offerSeq: number;
  slotIndex: 0 | 1 | 2;
  title: string;
  description: string;
  locationName?: string;
  startedAt: number;
  endTime: number;
  remainingSec: number;
  baseDurationSec: number;
  actualDurationSec: number;
  thirstCostSec: number;
  rewardPreview: RewardPreview;
  powerContext?: MissionPowerContext;
  mountSnapshot: {
    timeMultiplierBp: number;
    name?: string;
    tier?: string;
    capturedAt?: number;
  };
};

export type TavernNpcGreeting = {
  npcId: string;
  name: string;
  dialogue: string;
};

export type TavernInfoData = {
  tavern: {
    status: TavernStatus;
    thirstSecRemaining: number;
    drinksUsedToday: number;
    firstMissionBonusAvailable: boolean;
    missionOffers: MissionOffer[];
    activeMission: ActiveMissionView | null;
    npcGreeting: TavernNpcGreeting | null;
  };
  mount: {
    timeMultiplierBp: number;
    expiresAt: number | null;
    name?: string;
    tier?: string;
  };
};

export type TavernSummaryView = TavernInfoData['tavern'];

export type GrantedReward = {
  xp: number;
  copper: number;
  tokens: number;
  hourglass: number;
  equipment?: {
    id: string;
    name: string;
    slot: string;
  };
  dungeonKey?: {
    dungeonId: string;
    name: string;
  };
};

export type PlayerDelta = {
  levelBefore: number;
  levelAfter: number;
  xpBefore: number;
  xpAfter: number;
  copperBefore: number;
  copperAfter: number;
  tokensBefore: number;
  tokensAfter: number;
  hourglassesBefore: number;
  hourglassesAfter: number;
  prestigeBefore: number;
  prestigeAfter: number;
};

export type MissionPowerResult = {
  suspicionDelta: Partial<Record<PowerFactionId, number>>;
  suspicionAfter: Partial<Record<PowerFactionId, number>>;
};

export type CompleteMissionResult = 'SUCCESS' | 'FAILED' | 'ALREADY_SETTLED';

export type CompleteMissionData = {
  result: CompleteMissionResult;
  missionId: string;
  offerSetId: string;
  battleResult: BattleResultV2;
  rewardGranted: boolean;
  grantedReward: GrantedReward;
  playerDelta: PlayerDelta;
  nextMissionOffers: MissionOffer[];
  tavern: TavernSummaryView;
  powerResult?: MissionPowerResult;
  canSaveReplay?: boolean;
  replayId?: string | null;
};
