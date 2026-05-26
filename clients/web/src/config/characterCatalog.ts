import type { AttributeValues, PlayerClassId, PowerFactionId, RaceId } from '../types/game';

export const POWER_FACTION_LABELS: Record<PowerFactionId, string> = {
  imperial: '皇权',
  noble: '勋贵',
  censorate: '清流',
  border: '边镇',
  silver: '商税',
  underworld: '暗流',
};

export const POWER_FACTION_BADGES: Record<PowerFactionId, string> = {
  imperial: '皇权差遣',
  noble: '勋贵门荫',
  censorate: '清流门第',
  border: '边镇军籍',
  silver: '商税门路',
  underworld: '民间暗流',
};

export const POWER_FACTION_HINTS: Record<PowerFactionId, string> = {
  imperial: '受皇权直接驱使，升迁快，牵连也重。',
  noble: '依附军功勋贵和旧门第，根深但容易被清算。',
  censorate: '靠士林清议、科举门生和言路立足。',
  border: '靠边镇军功、卫所体系和私兵关系求活。',
  silver: '靠税银、盐引、织造和商路打开门路。',
  underworld: '来自无籍、香会、帮派和民间暗线。',
};

export const CLASS_META: Record<
  PlayerClassId,
  {
    name: string;
    archetype: string;
    mainStat: 'strength' | 'agility' | 'intelligence';
    trait: string;
    summary: string;
    powerFaction: PowerFactionId;
    bureau: string;
    route: string;
    restriction: string;
    armorCap: number;
  }
> = {
  CLASS_A: {
    name: '卫所猛将',
    archetype: 'Warrior',
    mainStat: 'strength',
    trait: '天子守国门',
    summary: '厚甲重兵，气血足，适合在边镇硬顶。',
    powerFaction: 'border',
    bureau: '卫所与边镇军府',
    route: '靠军功、守城和剿乱往上爬，适合从军户或边塞老兵出身切入。',
    restriction: '离朝堂中心较远，想进内廷必须先证明自己不是边镇尾大不掉。',
    armorCap: 50,
  },
  CLASS_B: {
    name: '锦衣缇骑',
    archetype: 'Scout',
    mainStat: 'agility',
    trait: '缇骑夜行',
    summary: '身法快，闪避高，适合先手缉拿。',
    powerFaction: 'imperial',
    bureau: '北镇抚司',
    route: '直接替皇权办脏活，靠查抄、缉捕和密奏换取晋身。',
    restriction: '升得快，也最容易卷入诏狱牵连；站错队时没有体面退路。',
    armorCap: 25,
  },
  CLASS_C: {
    name: '神机营',
    archetype: 'Mage',
    mainStat: 'intelligence',
    trait: '火药过载',
    summary: '火器爆发高，身板薄，适合远程压制。',
    powerFaction: 'imperial',
    bureau: '神机营',
    route: '靠火器、军械和宫城防务取得皇权信任。',
    restriction: '军械钱粮受内廷和兵部双重掣肘，缺资源时战力波动明显。',
    armorCap: 10,
  },
  CLASS_D: {
    name: '西厂番子',
    archetype: 'Assassin',
    mainStat: 'agility',
    trait: '诏狱伺候',
    summary: '出手快，打击频繁，适合暗查刺杀。',
    powerFaction: 'imperial',
    bureau: '西厂与内廷番役',
    route: '走内廷近侍路线，以密探、栽赃和恐吓压服各路官绅。',
    restriction: '名声最差，清流和世家天然猜疑；权力全靠上意维持。',
    armorCap: 25,
  },
  CLASS_E: {
    name: '边防总兵',
    archetype: 'Berserker',
    mainStat: 'strength',
    trait: '家丁死士',
    summary: '节奏激进，压场凶，适合边镇悍打法。',
    powerFaction: 'border',
    bureau: '九边总兵府',
    route: '依附边镇军头，靠私兵、粮饷和战功形成自己的小山头。',
    restriction: '实力越强越容易被中枢忌惮，后期必然面对削藩式打压。',
    armorCap: 25,
  },
};

export const RACE_META: Record<
  RaceId,
  {
    name: string;
    archetype: string;
    modifiers: AttributeValues;
    powerFaction: PowerFactionId;
    status: string;
    socialReview: string;
    rightsRepresentative: string;
    route: string;
    limits: string;
    recommendedClassIds: PlayerClassId[];
  }
> = {
  RACE_01: {
    name: '军户',
    archetype: 'Human',
    modifiers: { strength: 0, agility: 0, intelligence: 0, constitution: 0, luck: 0 },
    powerFaction: 'border',
    status: '世袭卫所籍。名义上为国当兵，实际常被军役、屯田和欠饷拴住。',
    socialReview: '朝廷需要你流血，但不一定记得给你饭吃。',
    rightsRepresentative: '边镇军府、卫所体系、勋贵旧军权。',
    route: '最顺的路是卫所、神机营和边防军功。',
    limits: '读书入仕阻力大；想进内廷或清流系统，需要先洗掉“粗鄙军户”的标签。',
    recommendedClassIds: ['CLASS_A', 'CLASS_C', 'CLASS_E'],
  },
  RACE_02: {
    name: '边塞老兵',
    archetype: 'Elf',
    modifiers: { strength: -1, agility: 2, intelligence: 0, constitution: -1, luck: 0 },
    powerFaction: 'border',
    status: '边镇滚出来的老卒。见过鞑靼、倭寇和克扣军粮的自己人。',
    socialReview: '命硬、手黑、话少，朝堂只在要死人时想起你。',
    rightsRepresentative: '九边总兵、家丁私兵、军功集团。',
    route: '适合走边防总兵、卫所猛将或锦衣缉捕的实战路线。',
    limits: '离京越近越被怀疑；功劳太大时，功劳本身就是罪证。',
    recommendedClassIds: ['CLASS_E', 'CLASS_A', 'CLASS_B'],
  },
  RACE_03: {
    name: '市井商贾',
    archetype: 'Dwarf',
    modifiers: { strength: 0, agility: -2, intelligence: -1, constitution: 2, luck: 1 },
    powerFaction: 'silver',
    status: '有钱无名分。能用银子打通门路，也会被任何衙门当肥肉。',
    socialReview: '你可以被需要、被勒索、被抄家，但很少被尊重。',
    rightsRepresentative: '盐引、织造、牙行、地方豪商和税银网络。',
    route: '适合借神机营军械、内务府采买或西厂暗线进入体制。',
    limits: '士林看不起，军头想榨钱，皇权缺银时最先想到你。',
    recommendedClassIds: ['CLASS_C', 'CLASS_D', 'CLASS_B'],
  },
  RACE_04: {
    name: '江南牙行',
    archetype: 'Gnome',
    modifiers: { strength: -2, agility: 3, intelligence: -1, constitution: -1, luck: 1 },
    powerFaction: 'silver',
    status: '夹在官、商、民之间的掮客。消息灵，账本脏，退路多。',
    socialReview: '没人承认你重要，但所有人办事都绕不开你。',
    rightsRepresentative: '江南商税、织造局、盐商会馆。',
    route: '适合西厂番子、锦衣缇骑或神机营采办线。',
    limits: '缺少硬身份，出事时最容易被推出去顶罪。',
    recommendedClassIds: ['CLASS_D', 'CLASS_B', 'CLASS_C'],
  },
  RACE_05: {
    name: '清流世家',
    archetype: 'Orc',
    modifiers: { strength: 1, agility: 0, intelligence: -1, constitution: 0, luck: 0 },
    powerFaction: 'censorate',
    status: '诗书门第，祖上有人入阁，有祠堂、有田产，也有一堆不能输的体面。',
    socialReview: '嘴上为天下苍生，手里握着宗族、田亩和门生故旧。',
    rightsRepresentative: '士林、都察院、科举门第、地方宗族。',
    route: '适合走清流言官、锦衣调查或借神机营技术线避开党争。',
    limits: '皇权会用你，也会防你；家族声望既是护身符也是枷锁。',
    recommendedClassIds: ['CLASS_B', 'CLASS_C'],
  },
  RACE_06: {
    name: '国子监生',
    archetype: 'Dark Elf',
    modifiers: { strength: -2, agility: 2, intelligence: 1, constitution: -1, luck: 0 },
    powerFaction: 'censorate',
    status: '半只脚进了官场，另一只脚还在排队等缺。',
    socialReview: '会背圣贤书，也知道圣贤书该在什么时候合上。',
    rightsRepresentative: '科举、监生名额、师门和清议舆论。',
    route: '适合神机营、锦衣缇骑或后续言官路线。',
    limits: '没有实缺前只是候补棋子；得罪座师和同年会很麻烦。',
    recommendedClassIds: ['CLASS_C', 'CLASS_B'],
  },
  RACE_07: {
    name: '流民',
    archetype: 'Goblin',
    modifiers: { strength: -2, agility: 2, intelligence: 0, constitution: -1, luck: 1 },
    powerFaction: 'underworld',
    status: '失地、逃役、无籍。你在账册上不存在，所以谁都能利用你。',
    socialReview: '朝廷说你是乱源，豪强说你是劳力，秘社说你是兄弟。',
    rightsRepresentative: '灾荒流民、脚夫帮会、民变边缘。',
    route: '适合西厂暗线、锦衣缉捕或边镇敢死路线。',
    limits: '没有户籍就没有信用；任何晋升都要先找一个愿意替你背书的人。',
    recommendedClassIds: ['CLASS_D', 'CLASS_B', 'CLASS_E'],
  },
  RACE_08: {
    name: '秘社信众',
    archetype: 'Demon',
    modifiers: { strength: 3, agility: -1, intelligence: 0, constitution: 1, luck: -3 },
    powerFaction: 'underworld',
    status: '香会、白莲、暗誓和地下网络交织出来的人。',
    socialReview: '你可以发动人心，也可能随时被当成妖言惑众的证据。',
    rightsRepresentative: '民间暗流、秘密会社、灾年信仰网络。',
    route: '适合西厂番子反向收编、边镇死士或锦衣暗查。',
    limits: '一旦身份暴露，清流要弹劾你，皇权要借你立威，商人要与你切割。',
    recommendedClassIds: ['CLASS_D', 'CLASS_E', 'CLASS_B'],
  },
};

export function formatModifiers(modifiers: AttributeValues) {
  const entries: Array<[string, number]> = [
    ['膂', modifiers.strength],
    ['身', modifiers.agility],
    ['谋', modifiers.intelligence],
    ['骨', modifiers.constitution],
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
