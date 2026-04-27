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

export type PlayerClassId = 'CLASS_A' | 'CLASS_B' | 'CLASS_C' | 'CLASS_D';
export type AttributeKey = (typeof ATTRIBUTE_KEYS)[number];
export type EquipmentSlot = (typeof EQUIPMENT_SLOTS)[number];
export type ItemRarity = 0 | 1 | 2 | 3 | 4;

export type AttributeValues = Record<AttributeKey, number>;

export type EquipmentItem = {
  id: string;
  name: string;
  description: string;
  slot: EquipmentSlot;
  rarity: ItemRarity;
  subType?: 'weapon' | 'shield' | 'none';
  armor?: number;
  weaponDamage?: {
    min: number;
    max: number;
  };
  price?: number;
  bonusAttributes: Partial<AttributeValues>;
};

export type CharacterInfoView = {
  player: {
    level: number;
    exp: number;
    classId: PlayerClassId;
    displayName?: string;
  };
  resources: {
    copper: number;
    tokens: number;
    hourglasses: number;
    prestige: number;
  };
  attributes: {
    base: AttributeValues;
    total: AttributeValues;
    upgradeCosts: AttributeValues;
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

export const ATTRIBUTE_LABELS: Record<AttributeKey, string> = {
  strength: '力量',
  intelligence: '智力',
  agility: '敏捷',
  constitution: '体质',
  luck: '幸运',
};

export const EQUIPMENT_SLOT_LABELS: Record<EquipmentSlot, string> = {
  head: '头部',
  body: '身体',
  hands: '手部',
  feet: '足部',
  neck: '项链',
  belt: '腰带',
  ring: '戒指',
  trinket: '饰品',
  weapon: '武器',
  offHand: '副手',
};

export const RARITY_LABELS: Record<ItemRarity, string> = {
  0: '普通',
  1: '精良',
  2: '稀有',
  3: '史诗',
  4: '传奇',
};

export const RARITY_BADGE_CLASS: Record<ItemRarity, string> = {
  0: 'border-stone-700/70 bg-stone-900/60 text-stone-200',
  1: 'border-emerald-700/60 bg-emerald-950/40 text-emerald-200',
  2: 'border-sky-700/60 bg-sky-950/40 text-sky-200',
  3: 'border-fuchsia-700/60 bg-fuchsia-950/40 text-fuchsia-200',
  4: 'border-amber-600/60 bg-amber-950/40 text-amber-100',
};
