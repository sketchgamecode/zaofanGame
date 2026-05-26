import type { PowerFactionId } from '../types/game';

export type DungeonChapterMeta = {
  id: string;
  name: string;
  unlockLevel: number;
  flavor: string;
  powerCase?: {
    issuerFaction: PowerFactionId;
    targetFactions: PowerFactionId[];
    historicalHook: string;
    suspicionDeltaOnWin?: Partial<Record<PowerFactionId, number>>;
  };
};

export const DUNGEON_CHAPTERS: DungeonChapterMeta[] = [
  {
    id: 'chapter_1',
    name: '废弃银矿追赃案',
    unlockLevel: 10,
    flavor: '矿税账册不清，矿工散尽，剩下的全是会动刀的人。',
  },
  {
    id: 'chapter_2',
    name: '南镇抚司密查案',
    unlockLevel: 20,
    flavor: '暗巷里有假腰牌，也有真刀子。',
  },
  {
    id: 'chapter_3',
    name: '贡院舞弊案',
    unlockLevel: 30,
    flavor: '满墙圣贤文章，底下全是银票和血指印。',
  },
  {
    id: 'chapter_4',
    name: '边镇军粮亏空案',
    unlockLevel: 40,
    flavor: '粮仓空得能跑马，账册却丰收到吓人。',
  },
  {
    id: 'chapter_5',
    name: '白莲香会搜捕案',
    unlockLevel: 50,
    flavor: '香灰未冷，供桌后头藏着刀。',
  },
  {
    id: 'chapter_6',
    name: '内库贡品失窃案',
    unlockLevel: 60,
    flavor: '贡品进了内库，出来时只剩封条。',
  },
  {
    id: 'case_lanyu_purge',
    name: '蓝玉案',
    unlockLevel: 1,
    flavor: '皇权翻开军功旧账，国公府、边镇旧部和供状经手人都在名册上。',
    powerCase: {
      issuerFaction: 'imperial',
      targetFactions: ['noble', 'border'],
      historicalHook: '皇权清洗军功集团，查抄、拿问、追捕牵连旧部。',
      suspicionDeltaOnWin: { noble: 2, border: 1 },
    },
  },
];

export function getDungeonChapterMeta(chapterId: string) {
  return DUNGEON_CHAPTERS.find((chapter) => chapter.id === chapterId) ?? null;
}
