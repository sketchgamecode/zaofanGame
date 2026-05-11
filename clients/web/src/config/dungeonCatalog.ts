export type DungeonChapterMeta = {
  id: string;
  name: string;
  unlockLevel: number;
  flavor: string;
};

export const DUNGEON_CHAPTERS: DungeonChapterMeta[] = [
  {
    id: 'chapter_1',
    name: '废弃的蜀山银矿',
    unlockLevel: 10,
    flavor: '银矿废墟，妖煞盘踞。',
  },
  {
    id: 'chapter_2',
    name: '汴京城谍影',
    unlockLevel: 20,
    flavor: '皇城暗巷，刀笔夺命。',
  },
  {
    id: 'chapter_3',
    name: '邪道修仙书院',
    unlockLevel: 30,
    flavor: '书院表里，人间炼狱。',
  },
  {
    id: 'chapter_4',
    name: '大漠龙门黑客栈',
    unlockLevel: 40,
    flavor: '风沙黑店，强食弱肉。',
  },
  {
    id: 'chapter_5',
    name: '湘西赶尸古墓地牢',
    unlockLevel: 50,
    flavor: '尸瘴冲天，古墓噬人。',
  },
  {
    id: 'chapter_6',
    name: '唐门绝命毒瘴林',
    unlockLevel: 60,
    flavor: '毒瘴蔽日，百蛊夺魂。',
  },
];

export function getDungeonChapterMeta(chapterId: string) {
  return DUNGEON_CHAPTERS.find((chapter) => chapter.id === chapterId) ?? null;
}
