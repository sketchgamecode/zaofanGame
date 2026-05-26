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
