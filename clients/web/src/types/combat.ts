import type { AttributeValues, PlayerClassId, PowerFactionId, RaceId } from './game';

export type BattleContext =
  | 'MISSION'
  | 'ARENA'
  | 'DUNGEON'
  | 'FORTRESS_ATTACK'
  | 'FORTRESS_DEFENSE';

export type CombatantSnapshot = {
  id: string;
  displayName: string;
  level: number;
  classId: PlayerClassId;
  attributes: AttributeValues;
  hpMax?: number;
  armor: number;
  weaponDamage: { min: number; max: number };
  honor?: number;
  rank?: number | null;
  avatarId?: string;
  equipmentSummary?: {
    weaponId?: string;
    offHandId?: string;
    itemPowerTotal: number;
  };
};

export type BattleHitEvent = {
  hitIndex: number;
  attacker: 'player' | 'enemy';
  defender: 'player' | 'enemy';
  attackerClassId: PlayerClassId;
  defenderClassId: PlayerClassId;
  rawWeaponRoll: number;
  damage: number;
  targetHpAfter: number;
  wasCrit: boolean;
  wasBlocked: boolean;
  wasDodged: boolean;
  armorReductionBp: number;
  rageMultiplierBp: number;
};

export type BattleActionEvent = {
  actionIndex: number;
  roundNumber: number;
  attacker: 'player' | 'enemy';
  hits: BattleHitEvent[];
};

export type BattleResultV2 = {
  schemaVersion: 2;
  context: BattleContext;
  seedPublicHash: string;
  winner: 'player' | 'enemy';
  playerWon: boolean;
  player: {
    id: string;
    name: string;
    level: number;
    classId: PlayerClassId;
    hpMax: number;
    hpEnd: number;
    avatarId?: string;
    snapshot: CombatantSnapshot;
  };
  enemy: {
    id: string;
    name: string;
    level: number;
    classId: PlayerClassId;
    hpMax: number;
    hpEnd: number;
    avatarId?: string;
    snapshot: CombatantSnapshot;
  };
  actions: BattleActionEvent[];
  totalActions: number;
  totalRounds: number;
  endedBy: 'KNOCKOUT' | 'ROUND_LIMIT';
};

export type ArenaOpponentPreview = {
  candidateId: string;
  playerId: string;
  displayName: string;
  avatarId?: string;
  level: number;
  classId: PlayerClassId;
  raceId?: RaceId;
  honor: number;
  rank: number;
  guildName?: string;
  attributes: AttributeValues;
  combatPreview: {
    hp: number;
    armor: number;
    damageMin: number;
    damageMax: number;
    critChanceBp: number;
    blockChanceBp?: number;
    dodgeChanceBp?: number;
  };
};

export type ArenaStateView = {
  status: 'UNINITIALIZED' | 'DISABLED' | 'ACTIVE';
  dailyWins: number;
  honor?: number;
  rank?: number | null;
  dailyXpWins?: number;
  maxDailyXpWins?: number;
  fightsToday?: number;
  lastDailyResetDate: string;
  cooldownEndTime: number | null;
  candidateSetId?: string | null;
  candidates?: ArenaOpponentPreview[];
};

export type ArenaGetInfoData = {
  arena: ArenaStateView;
  playerSummary: {
    honor: number;
    rank: number | null;
    dailyXpWins: number;
    maxDailyXpWins: number;
    cooldownRemainingMs: number;
  };
};

export type ArenaRefreshCandidatesData = {
  candidateSetId: string | null;
  candidates: ArenaOpponentPreview[];
};

export type ArenaFightData = {
  result: 'WIN' | 'LOSE';
  battleResult: BattleResultV2;
  replayId: string;
  honorDelta: number;
  honorBefore: number;
  honorAfter: number;
  rankBefore: number | null;
  rankAfter: number | null;
  rankDelta: number | null;
  grantedReward: {
    xp: number;
    copper: number;
  };
  dailyXpWinsAfter: number;
  cooldownEndTime: number | null;
  nextCandidates: ArenaOpponentPreview[];
};

export type ArenaSkipCooldownData = {
  cooldownEndTime: null;
  spent: 'hourglasses' | 'tokens';
};

export type BattleReplayPreview = {
  type: 'PLAYER' | 'DUNGEON' | 'QUEST';
  result: 'WIN' | 'LOSE';
  playerName: string;
  enemyName: string;
  playerAvatarId?: string;
  enemyAvatarId?: string;
  enemyLevel: number;
};

export type BattleReplayRecord = {
  replayId: string;
  ownerPlayerId: string;
  context: BattleContext;
  createdAt: number;
  expiresAt?: number | null;
  isRead: boolean;
  isSavedByPlayer?: boolean;
  relatedPlayerId?: string | null;
  sourceId?: string | null;
  title: string;
  opponentName: string;
  preview: BattleReplayPreview;
  battleResult: BattleResultV2;
};

export type BattleReplayListItem = Omit<BattleReplayRecord, 'battleResult'>;

export type MailBattleReplayListData = {
  replays: BattleReplayListItem[];
};

export type MailBattleReplayData = {
  replay: BattleReplayRecord;
};

export type MailSaveMissionReplayData = {
  replay: BattleReplayRecord;
  alreadySaved: boolean;
};

export type MailDeleteBattleReplayData = {
  deleted: true;
  replayId: string;
};

export type DungeonFightData = {
  result: 'WIN' | 'LOSE';
  chapterId: string;
  bossId: string;
  progressAfter: number;
  battleResult: BattleResultV2;
  replayId: string;
  grantedReward: {
    xp: number;
    copper: number;
  };
  powerCase?: {
    issuerFaction: PowerFactionId;
    targetFactions: PowerFactionId[];
    historicalHook: string;
    suspicionDeltaOnWin?: Partial<Record<PowerFactionId, number>>;
  };
  powerResult?: {
    suspicionDelta: Partial<Record<PowerFactionId, number>>;
    suspicionAfter: Partial<Record<PowerFactionId, number>>;
  };
};
