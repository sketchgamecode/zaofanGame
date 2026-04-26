export type TavernStatus = 'IDLE' | 'IN_PROGRESS' | 'READY_TO_COMPLETE';

export type VisibleReward = {
  xp: number;
  copper: number;
  hasEquipment: boolean;
  hasDungeonKey: boolean;
  hasHourglass?: boolean;
};

export type EnemyPreview = {
  enemyId: string;
  name: string;
  level: number;
  archetype?: string;
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
  generatedAt: number;
};

export type RewardPreview = {
  xp: number;
  copper: number;
  hasEquipment: boolean;
  hasDungeonKey: boolean;
  hasHourglass?: boolean;
};

export type MountSnapshotView = {
  timeMultiplierBp: number;
  name?: string;
  tier?: string;
  capturedAt?: number;
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
  mountSnapshot: MountSnapshotView;
};

export type TavernView = {
  status: TavernStatus;
  thirstSecRemaining: number;
  drinksUsedToday: number;
  firstMissionBonusAvailable: boolean;
  missionOffers: MissionOffer[];
  activeMission: ActiveMissionView | null;
};

export type MountView = {
  timeMultiplierBp: number;
  expiresAt: number | null;
  name?: string;
  tier?: string;
};

export type TavernInfoData = {
  tavern: TavernView;
  mount: MountView;
};

export type TavernSummaryView = TavernView;

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

export type BattleRound = {
  attacker: 'player' | 'enemy';
  damage: number;
  targetHpAfter: number;
  wasCrit?: boolean;
};

export type BattleResult = {
  playerWon: boolean;
  rounds: BattleRound[];
  playerHpEnd: number;
  enemyHpEnd: number;
  totalRounds: number;
};

export type CompleteMissionResult = 'SUCCESS' | 'FAILED' | 'ALREADY_SETTLED';

export type CompleteMissionData = {
  result: CompleteMissionResult;
  missionId: string;
  offerSetId: string;
  battleResult: BattleResult;
  rewardGranted: boolean;
  grantedReward: GrantedReward;
  playerDelta: PlayerDelta;
  nextMissionOffers: MissionOffer[];
  tavern: TavernSummaryView;
};
