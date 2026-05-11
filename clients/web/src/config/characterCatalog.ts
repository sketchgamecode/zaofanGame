import type { AttributeValues, PlayerClassId, RaceId } from '../types/game';

export const CLASS_META: Record<
  PlayerClassId,
  {
    name: string;
    archetype: string;
    mainStat: 'strength' | 'agility' | 'intelligence';
    trait: string;
    summary: string;
    armorCap: number;
  }
> = {
  CLASS_A: {
    name: '猛将',
    archetype: 'Warrior',
    mainStat: 'strength',
    trait: '盾牌格挡',
    summary: '厚甲重兵，耐打，适合稳推。',
    armorCap: 50,
  },
  CLASS_B: {
    name: '游侠',
    archetype: 'Scout',
    mainStat: 'agility',
    trait: '轻身闪避',
    summary: '速度快，闪避高，适合持久周旋。',
    armorCap: 25,
  },
  CLASS_C: {
    name: '谋士',
    archetype: 'Mage',
    mainStat: 'intelligence',
    trait: '必中破防',
    summary: '高爆发，脆身板，适合压制型打法。',
    armorCap: 10,
  },
  CLASS_D: {
    name: '杀手',
    archetype: 'Assassin',
    mainStat: 'agility',
    trait: '双持连击',
    summary: '出手快，打击频繁，适合刺杀路线。',
    armorCap: 25,
  },
  CLASS_E: {
    name: '绿林好汉',
    archetype: 'Berserker',
    mainStat: 'strength',
    trait: '嗜血连斩',
    summary: '赌连续进攻，节奏激进，适合爆发压场。',
    armorCap: 25,
  },
};

export const RACE_META: Record<
  RaceId,
  {
    name: string;
    archetype: string;
    modifiers: AttributeValues;
  }
> = {
  RACE_01: {
    name: '中原人士',
    archetype: 'Human',
    modifiers: { strength: 0, agility: 0, intelligence: 0, constitution: 0, luck: 0 },
  },
  RACE_02: {
    name: '蓬莱仙客',
    archetype: 'Elf',
    modifiers: { strength: -1, agility: 2, intelligence: 0, constitution: -1, luck: 0 },
  },
  RACE_03: {
    name: '漠北蛮族',
    archetype: 'Dwarf',
    modifiers: { strength: 0, agility: -2, intelligence: -1, constitution: 2, luck: 1 },
  },
  RACE_04: {
    name: '苗岭童子',
    archetype: 'Gnome',
    modifiers: { strength: -2, agility: 3, intelligence: -1, constitution: -1, luck: 1 },
  },
  RACE_05: {
    name: '契丹豪勇',
    archetype: 'Orc',
    modifiers: { strength: 1, agility: 0, intelligence: -1, constitution: 0, luck: 0 },
  },
  RACE_06: {
    name: '西夏一品堂',
    archetype: 'Dark Elf',
    modifiers: { strength: -2, agility: 2, intelligence: 1, constitution: -1, luck: 0 },
  },
  RACE_07: {
    name: '岭南流寇',
    archetype: 'Goblin',
    modifiers: { strength: -2, agility: 2, intelligence: 0, constitution: -1, luck: 1 },
  },
  RACE_08: {
    name: '摩尼教徒',
    archetype: 'Demon',
    modifiers: { strength: 3, agility: -1, intelligence: 0, constitution: 1, luck: -3 },
  },
};

export function formatModifiers(modifiers: AttributeValues) {
  const entries: Array<[string, number]> = [
    ['力', modifiers.strength],
    ['敏', modifiers.agility],
    ['智', modifiers.intelligence],
    ['体', modifiers.constitution],
    ['运', modifiers.luck],
  ];

  return entries
    .map(([label, value]) => `${label} ${value > 0 ? `+${value}` : value}`)
    .join(' / ');
}

export function getAvatarUrl(avatarId?: string) {
  if (!avatarId) {
    return '/assets/ui/potrait_00.png';
  }

  return `/assets/figure/portrait/${avatarId}.png`;
}
