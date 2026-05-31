export const ATTRIBUTE_KEYS = [
  'strength',
  'intelligence',
  'agility',
  'constitution',
  'luck',
] as const;

export const EQUIPMENT_SLOTS = [
  'head',
  'body',
  'hands',
  'feet',
  'neck',
  'belt',
  'ring',
  'trinket',
  'weapon',
  'offHand',
] as const;

export type PlayerClassId = 'CLASS_A' | 'CLASS_B' | 'CLASS_C' | 'CLASS_D' | 'CLASS_E';
export type RaceId =
  | 'RACE_01'
  | 'RACE_02'
  | 'RACE_03'
  | 'RACE_04'
  | 'RACE_05'
  | 'RACE_06'
  | 'RACE_07'
  | 'RACE_08';
export type PowerFactionId = 'imperial' | 'noble' | 'censorate' | 'border' | 'silver' | 'underworld';
export type AttributeKey = (typeof ATTRIBUTE_KEYS)[number];
export type EquipmentSlot = (typeof EQUIPMENT_SLOTS)[number];
export type ItemRarity = 0 | 1 | 2 | 3 | 4;
export type SceneId = 'city' | 'tavern' | 'weaponshop' | 'magicshop' | 'blackmarket' | 'inventory' | 'dungeon' | 'arena' | 'mail';

export type AttributeValues = Record<AttributeKey, number>;

export type EquipmentItem = {
  id: string;
  name: string;
  description: string;
  slot: EquipmentSlot;
  rarity: ItemRarity;
  iconId?: string;
  subType?: 'weapon' | 'shield' | 'none';
  armor?: number;
  weaponDamage?: {
    min: number;
    max: number;
  };
  price?: number;
  sellPrice: number;
  bonusAttributes: Partial<AttributeValues>;
};

export type ResourceState = {
  copper: number;
  tokens: number;
  hourglasses: number;
  prestige: number;
};

export type CharacterInfoView = {
  player: {
    level: number;
    exp: number;
    classId: PlayerClassId;
    raceId: RaceId;
    displayName?: string;
    avatarId?: string;
    powerFaction?: PowerFactionId;
    suspicion?: Partial<Record<PowerFactionId, number>>;
    status: 'PENDING_CREATION' | 'ACTIVE';
  };
  resources: ResourceState;
  attributes: {
    base: AttributeValues;
    total: AttributeValues;
    upgradeCosts: Record<AttributeKey, number>;
  };
  combatPreview: {
    hp: number;
    armor: number;
    damageMin: number;
    damageMax: number;
    critChanceBp: number;
    dodgeChanceBp?: number;
    blockChanceBp?: number;
    itemPowerTotal: number;
    combatRating: number;
  };
  equipment: {
    equipped: Record<EquipmentSlot, EquipmentItem | null>;
  };
  inventory: {
    capacity?: number;
    count: number;
    items: EquipmentItem[];
  };
};

export type GameSaveState = {
  player: {
    level: number;
    exp: number;
    classId: PlayerClassId;
    raceId: RaceId;
    displayName?: string;
    avatarId?: string;
    powerFaction?: PowerFactionId;
    suspicion?: Partial<Record<PowerFactionId, number>>;
    status: 'PENDING_CREATION' | 'ACTIVE';
  };
  resources: ResourceState;
};

export type SaveResponse = {
  save: GameSaveState;
  saveVersion: number;
  updatedAt: string;
};

export type ActionSuccessResponse<TData> = {
  ok: true;
  action: string;
  serverTime: number;
  stateRevision: number | null;
  data: TData;
};

export type ActionFailureResponse = {
  ok: false;
  action: string;
  serverTime: number;
  stateRevision: number | null;
  errorCode: string;
  message: string;
};

export type ActionResponse<TData> = ActionSuccessResponse<TData> | ActionFailureResponse;

export type CreateCharacterPayload = {
  nickname: string;
  classId: PlayerClassId;
  raceId: RaceId;
  avatarId: string;
};

export type BlackMarketView = {
  status: 'ACTIVE';
  items: EquipmentItem[];
  nextAutoRefreshMs: number;
};

export type BuyItemView = {
  purchasedItemId: string;
  copperSpent: number;
  remainingItems: EquipmentItem[];
  nextAutoRefreshMs: number;
};

export type BuyAndEquipView = BuyItemView & {
  unequippedItem: EquipmentItem | null;
};

export type SellItemView = {
  soldItemId: string;
  copperGained: number;
};

export type WorldFactionOverview = {
  faction: PowerFactionId;
  actorCount: number;
  powerShare: number;
};

export type WorldLocationOverview = {
  locationId: string;
  name: string;
  ownerFaction: PowerFactionId;
  actorCount: number;
  powerShare: number;
};

export type WorldActorsOverview = {
  totalActors: number;
  totalPowerShare: number;
  byFaction: WorldFactionOverview[];
  byLocation: WorldLocationOverview[];
};

export type PowerLocationService =
  | 'missions'
  | 'shop'
  | 'dungeon'
  | 'arena'
  | 'promotion'
  | 'intel'
  | 'estate'
  | 'stamina'
  | 'office_registry'
  | 'appointment'
  | 'evaluation';
export type PowerLocationStatus = 'locked' | 'open' | 'hostile' | 'favored';

export type PowerLocationServiceActor = {
  actorId: string;
  displayName: string;
  avatarId: string;
  faction: PowerFactionId;
  title: string;
  level: number;
  powerShare: number;
  services: PowerLocationService[];
};

export type ServicePositionStatus = 'bot_held' | 'player_held' | 'vacant' | 'locked';

export type ServicePositionControlProfile = {
  appointmentControllerLabel: string;
  financeControllerLabel: string;
  paylineHint: string;
  loyaltyCostHint: string;
};

export type ServicePositionView = {
  positionId: string;
  locationId: string;
  title: string;
  service: PowerLocationService;
  ownerFaction: PowerFactionId;
  minLevel: number;
  incomeHint: string;
  replaceHint: string;
  status: ServicePositionStatus;
  controlProfile?: ServicePositionControlProfile;
  occupant: {
    actorId: string;
    kind: 'bot' | 'player';
    displayName: string;
    avatarId: string;
    faction: PowerFactionId;
    level: number;
    powerShare: number;
  };
};

export type PowerLocationView = {
  locationId: string;
  name: string;
  ownerFaction: PowerFactionId;
  x: number;
  y: number;
  unlockLevel: number;
  services: PowerLocationService[];
  connectedLocationIds: string[];
  travelCostSecBase?: number;
  actorCount: number;
  powerShare: number;
  status: PowerLocationStatus;
  playerRelationHint: string;
  servicePositions?: ServicePositionView[];
  serviceActors?: PowerLocationServiceActor[];
};

export type WorldLocationsStatusView = {
  locations: PowerLocationView[];
};

export type ActorPositionSummary = {
  positionId: string;
  locationId: string;
  locationName: string;
  title: string;
  service: PowerLocationService;
  serviceLabel: string;
  ownerFaction: PowerFactionId;
  ownerLabel: string;
  incomeHint: string;
  replaceHint: string;
  status: ServicePositionStatus;
};

export type WorldActorDetailView = {
  actorId: string;
  kind: 'player' | 'bot';
  character: CharacterInfoView;
  positions: ActorPositionSummary[];
};

export type WorldServicePositionListItem = ActorPositionSummary & {
  controlProfile?: ServicePositionControlProfile;
  occupant: {
    actorId: string;
    kind: 'player' | 'bot';
    displayName: string;
    avatarId: string;
    faction: PowerFactionId;
    level: number;
    powerShare: number;
  };
};

export type WorldServicePositionsListView = {
  positions: WorldServicePositionListItem[];
};

export type OfficeLedgerEntryType =
  | 'mission_tax'
  | 'mission_power'
  | 'bot_tax'
  | 'bot_power'
  | 'shop_tax'
  | 'stamina_tax'
  | 'evaluation';

export type OfficeLedgerEntry = {
  entryId: string;
  createdAt: number;
  positionId: string;
  locationId: string;
  service: PowerLocationService;
  beneficiaryActorId?: string;
  beneficiaryDisplayName?: string;
  sourceActorId?: string;
  sourceActorDisplayName?: string;
  targetActorId?: string;
  targetActorDisplayName?: string;
  type: OfficeLedgerEntryType;
  taxValueDelta?: number;
  powerValueDelta?: number;
  description: string;
};

export type WorldServicePositionLedgerView = {
  entries: OfficeLedgerEntry[];
};

export type OfficeCandidateScoreItem = {
  label: string;
  value: number;
  passed: boolean;
  hint: string;
};

export type OfficeCandidateView = {
  actorId: string;
  kind: 'player' | 'bot';
  displayName: string;
  avatarId: string;
  level: number;
  faction: PowerFactionId;
  powerShare: number;
  combatRating?: number;
  isCurrentPlayer: boolean;
  score: number;
  scoreBreakdown: OfficeCandidateScoreItem[];
  recommendation: string;
};

export type WorldServicePositionCandidatesView = {
  positionId: string;
  incumbent: OfficeCandidateView;
  currentPlayer?: OfficeCandidateView;
  candidates: OfficeCandidateView[];
  plottingAdvice: string[];
  currentPlayerRank?: number;
};

export type ServicePositionCandidatesPreview = {
  currentPlayerRank?: number;
  topCandidate?: OfficeCandidateView;
  advice: string[];
};

export type OfficeKpiProfile = {
  termStartsAt: number;
  termEndsAt: number;
  taxDuePerTerm: number;
  taxDeliveredThisTerm: number;
  powerDuePerTerm: number;
  powerDeliveredThisTerm: number;
};

export type OfficeControlDetail = {
  appointmentControllerActorId?: string;
  appointmentControllerDisplayName?: string;
  financeControllerActorId?: string;
  financeControllerDisplayName?: string;
  treasurySplit: {
    imperialPrivatePct: number;
    publicTreasuryPct: number;
    superiorPct: number;
    officeHolderPct: number;
  };
};

export type OfficeEligibility = {
  canBeConsidered: boolean;
  reasons: string[];
};

export type WorldServicePositionDetailView = {
  position: ServicePositionView;
  occupant: ServicePositionView['occupant'];
  location: {
    locationId: string;
    name: string;
    ownerFaction: PowerFactionId;
    unlockLevel: number;
  };
  service: PowerLocationService;
  incomeHint: string;
  replaceHint: string;
  controlProfile?: ServicePositionControlProfile;
  kpiProfile: OfficeKpiProfile;
  controlDetail: OfficeControlDetail;
  eligibility: OfficeEligibility;
  imperialOverrideHint: string;
  ledgerPreview: OfficeLedgerEntry[];
  candidatesPreview?: ServicePositionCandidatesPreview;
};

export type PowerTransferResult = {
  worldPowerTotal: number;
  actorPowerDelta?: number;
  issuerFactionPowerDelta?: Partial<Record<PowerFactionId, number>>;
  targetFactionPowerDelta?: Partial<Record<PowerFactionId, number>>;
  targetActorIds?: string[];
  worldPowerAfter?: {
    byFaction: WorldFactionOverview[];
  };
};

export const EQUIPMENT_SLOT_LABELS: Record<EquipmentSlot, string> = {
  head: '头',
  body: '衣',
  hands: '手',
  feet: '靴',
  neck: '链',
  belt: '带',
  ring: '戒',
  trinket: '饰',
  weapon: '兵',
  offHand: '副',
};
