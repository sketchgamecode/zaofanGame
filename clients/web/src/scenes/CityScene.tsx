import { useEffect, useMemo, useRef, useState, type PointerEvent } from 'react';
import { postGameAction } from '../api/gameApi';
import { BattleReplay } from '../components/combat/BattleReplay';
import {
  LocationSceneView,
  type LocationSceneArt,
  type LocationSceneNpcCard,
  type LocationSceneServiceEntry,
} from '../components/city/LocationSceneView';
import { CharacterPanel, type CharacterPanelPosition } from '../components/character/CharacterPanel';
import { CharacterPortraitCard } from '../components/character/CharacterPortraitCard';
import { getAvatarUrl, getClassPowerFaction, POWER_FACTION_LABELS } from '../config/characterCatalog';
import { CITY_MAP_SCENE_ENTRIES, SERVICE_LABELS, resolveSceneEntryForFaction } from '../config/sceneRegistry';
import type { SceneRegistryEntry } from '../config/sceneRegistry';
import { toActionErrorMessage } from '../lib/manualErrors';
import { useGameState } from '../state/GameStateContext';
import type {
  PowerFactionId,
  PowerLocationService,
  PowerLocationStatus,
  PowerLocationView,
  SceneId,
  ServicePositionControlProfile,
  OfficeLedgerEntry,
  OfficeCandidateView,
  LocationGuardClaimData,
  LocationChiefDashboardView,
  LocationFinanceReportView,
  LocationRaidChoice,
  LocationRaidSettleData,
  LocationRaidStartData,
  LocationTreasuryView,
  OfficeTributeListView,
  OfficeTributePayData,
  OfficeTributeTerm,
  WorldActorDetailView,
  WorldLocationsStatusView,
  WorldServicePositionCandidatesView,
  WorldServicePositionDetailView,
  WorldServicePositionLedgerView,
  WorldServicePositionsListView,
} from '../types/game';
import type { TavernInfoData } from '../types/tavern';
import { ArenaScene, type ArenaSource } from './ArenaScene';
import { MagicShopScene, WeaponShopScene, type ShopSource } from './BlackMarketScene';
import { DungeonScene, type DungeonSource } from './DungeonScene';
import { TavernScene, type TavernMissionSource } from './TavernScene';

type CitySceneProps = {
  onSceneChange: (sceneId: SceneId) => void;
};

type FactionLocationRow = {
  faction: PowerFactionId;
  actorCount: number;
  powerShare: number;
};

type ActiveShopSource = ShopSource & {
  shopType: 'weapon' | 'magic';
};

type MingCityEntry = {
  cityId: string;
  name: string;
  region: string;
  summary: string;
  detail: string;
  x: number;
  y: number;
  locationIds: string[];
  background?: string;
  plannedLocations?: {
    id: string;
    name: string;
    kind: string;
    summary: string;
    detail: string;
  }[];
};

const MING_CITY_ENTRIES: MingCityEntry[] = [
  {
    cityId: 'beijing',
    name: '顺天府',
    region: '京师',
    summary: '皇城、厂卫、六部与京师生活场所',
    detail: '大明权力机器的中心。升迁、差事、守卫、劫掠与人事名册目前都先在这里展开。',
    x: 59,
    y: 28,
    background: '/assets/backgrounds/bg_ming_dynasty_map.png',
    locationIds: [
      'imperial_palace',
      'ministry_of_personnel',
      'northern_bureau',
      'divine_engine_camp',
      'censorate',
      'noble_mansion',
      'wine_house',
      'bun_shop',
      'pleasure_quarter',
    ],
  },
  {
    cityId: 'liaodong',
    name: '辽阳',
    region: '九边军镇',
    summary: '边镇军令、军需、塘报与武职门路',
    detail: '边防军镇的代表。后续适合承载军户、边镇总兵、军需粮饷和外敌压力。',
    x: 78,
    y: 22,
    background: '/assets/backgrounds/landscapes/bg_build_border.png',
    locationIds: ['border_command'],
  },
  {
    cityId: 'lianghuai',
    name: '扬州府',
    region: '两淮盐引',
    summary: '盐商、税银、贡品和灰色采购',
    detail: '盐引与银路聚集之地。商贾、税务、走私和地方财权可以从这里继续扩。',
    x: 62,
    y: 61,
    background: '/assets/backgrounds/landscapes/bg_build_store.png',
    locationIds: ['salt_merchant_guild'],
  },
  {
    cityId: 'nanjing',
    name: '应天府',
    region: '留都旧制',
    summary: '织造、内库采办与南方门路',
    detail: '留都和江南门路的代表。织造、贡品、世家、清流和商业利益适合放在这里。',
    x: 57,
    y: 67,
    background: '/assets/backgrounds/citys/ChatGPT Image Jun 9, 2026, 11_58_25 PM (6).png',
    locationIds: ['weaving_bureau'],
  },
];

function createProvincePlannedLocations(cityId: string, cityName: string, militaryName: string, famousName: string) {
  return [
    {
      id: `${cityId}_three_commission`,
      name: '三司署',
      kind: '地方官署',
      summary: '布政、按察、都司三路地方权力',
      detail: `${cityName}的省级官署预告。后续可承载地方税粮、刑名、军政和赴任考功。`,
    },
    {
      id: `${cityId}_military`,
      name: militaryName,
      kind: '军事场所',
      summary: '卫所、营伍、军械、塘报',
      detail: `${cityName}的军事门路预告。后续可承载当地军务、守备、军需和武职任务。`,
    },
    {
      id: `${cityId}_inn`,
      name: '客栈',
      kind: '市井补给',
      summary: '住宿、打听消息、补给体力',
      detail: `${cityName}的客栈预告。后续可承载旅行、补给、地方传闻和低门槛差事。`,
    },
    {
      id: `${cityId}_famous`,
      name: famousName,
      kind: '地方名胜',
      summary: '地方文化、人情、名望门路',
      detail: `${cityName}的著名场所预告。后续可承载地方声望、人情、奇遇和历史事件包装。`,
    },
  ];
}

const MING_CITY_PLANNED_BY_ID: Record<string, ReturnType<typeof createProvincePlannedLocations>> = {
  beijing: createProvincePlannedLocations('beijing', '顺天府', '京营校场', '天坛'),
  liaodong: createProvincePlannedLocations('liaodong', '辽阳', '辽东镇军府', '辽阳城'),
  lianghuai: createProvincePlannedLocations('lianghuai', '扬州府', '漕运营汛', '瘦西湖'),
  nanjing: createProvincePlannedLocations('nanjing', '应天府', '南京守备府', '秦淮河'),
};

const ADDITIONAL_MING_CITY_ENTRIES: MingCityEntry[] = [
  {
    cityId: 'shanhai_pass',
    name: '山海关',
    region: '蓟辽咽喉',
    summary: '关城、边墙、塘报与入关门户',
    detail: '山海关地标预告。后续可承载边墙守御、入关盘查、军情塘报和辽东牵连。',
    x: 67,
    y: 25,
    background: '/assets/backgrounds/landscapes/bg_build_border.png',
    locationIds: [],
    plannedLocations: createProvincePlannedLocations('shanhai_pass', '山海关', '山海关守御署', '天下第一关'),
  },
  {
    cityId: 'jiayu_pass',
    name: '嘉峪关',
    region: '河西锁钥',
    summary: '关城、烽燧、军屯与西陲商路',
    detail: '嘉峪关地标预告。后续可承载河西军屯、烽燧传报、西域商路和边关劫掠。',
    x: 28,
    y: 37,
    background: '/assets/backgrounds/landscapes/bg_build_border.png',
    locationIds: [],
    plannedLocations: createProvincePlannedLocations('jiayu_pass', '嘉峪关', '嘉峪关守备营', '关城楼'),
  },
  {
    cityId: 'jinan',
    name: '济南府',
    region: '山东布政司治所',
    summary: '漕粮、河道、山东士绅与布政门路',
    detail: '山东省会预告。后续可承载漕运、河道、士绅、粮税和北方门户事件。',
    x: 60,
    y: 39,
    background: '/assets/backgrounds/citys/bg_city_jinan.png',
    locationIds: [],
    plannedLocations: createProvincePlannedLocations('jinan', '济南府', '山东都司营', '趵突泉'),
  },
  {
    cityId: 'taiyuan',
    name: '太原府',
    region: '山西布政司治所',
    summary: '晋商、边饷、煤铁与北地军务',
    detail: '山西省会预告。后续可承载晋商银路、边饷、矿产和北地军务。',
    x: 51,
    y: 34,
    background: '/assets/backgrounds/landscapes/bg_build_offical_road.png',
    locationIds: [],
    plannedLocations: createProvincePlannedLocations('taiyuan', '太原府', '山西都司营', '晋祠'),
  },
  {
    cityId: 'kaifeng',
    name: '开封府',
    region: '河南布政司治所',
    summary: '中原粮道、河患与王府旧势',
    detail: '河南省会预告。后续可承载中原粮道、黄河水患、王府与地方官场。',
    x: 55,
    y: 48,
    background: '/assets/backgrounds/citys/bg_city_kaifeng.png',
    locationIds: [],
    plannedLocations: createProvincePlannedLocations('kaifeng', '开封府', '河南卫所营', '大相国寺'),
  },
  {
    cityId: 'xian',
    name: '西安府',
    region: '陕西布政司治所',
    summary: '西北军饷、秦地门阀与边防根基',
    detail: '陕西省会预告。后续可承载西北军饷、秦地门阀、边防和流民压力。',
    x: 43,
    y: 48,
    background: '/assets/backgrounds/citys/bg_city_xian.png',
    locationIds: [],
    plannedLocations: createProvincePlannedLocations('xian', '西安府', '陕西都司营', '钟鼓楼'),
  },
  {
    cityId: 'hangzhou',
    name: '杭州府',
    region: '浙江布政司治所',
    summary: '丝绸、海贸、士林与江南财富',
    detail: '浙江省会预告。后续可承载丝绸、海贸、士林声望和江南财富。',
    x: 66,
    y: 70,
    background: '/assets/backgrounds/citys/bg_city_hangzhou.png',
    locationIds: [],
    plannedLocations: createProvincePlannedLocations('hangzhou', '杭州府', '浙江都司营', '西湖'),
  },
  {
    cityId: 'nanchang',
    name: '南昌府',
    region: '江西布政司治所',
    summary: '赣江粮道、书院士林与地方税粮',
    detail: '江西省会预告。后续可承载粮道、书院、税粮和江右士林。',
    x: 58,
    y: 75,
    background: '/assets/backgrounds/landscapes/bg_build_xihu.png',
    locationIds: [],
    plannedLocations: createProvincePlannedLocations('nanchang', '南昌府', '江西都司营', '滕王阁'),
  },
  {
    cityId: 'wuchang',
    name: '武昌府',
    region: '湖广布政司治所',
    summary: '湖广粮仓、长江水路与楚地军政',
    detail: '湖广省会预告。后续可承载粮仓、水路、地方军政和长江利益。',
    x: 51,
    y: 68,
    background: '/assets/backgrounds/landscapes/bg_build_offical_road.png',
    locationIds: [],
    plannedLocations: createProvincePlannedLocations('wuchang', '武昌府', '湖广都司营', '黄鹤楼'),
  },
  {
    cityId: 'chengdu',
    name: '成都府',
    region: '四川布政司治所',
    summary: '蜀地财赋、茶马门路与西南兵备',
    detail: '四川省会预告。后续可承载茶马、蜀地财赋、西南兵备和土司关系。',
    x: 35,
    y: 68,
    background: '/assets/backgrounds/citys/bg_city_chengdu.png',
    locationIds: [],
    plannedLocations: createProvincePlannedLocations('chengdu', '成都府', '四川都司营', '武侯祠'),
  },
  {
    cityId: 'fuzhou',
    name: '福州府',
    region: '福建布政司治所',
    summary: '海防、船厂、闽商与沿海走私',
    detail: '福建省会预告。后续可承载海防、船厂、闽商和沿海走私。',
    x: 70,
    y: 82,
    background: '/assets/backgrounds/citys/bg_city_fuzhou.png',
    locationIds: [],
    plannedLocations: createProvincePlannedLocations('fuzhou', '福州府', '福建水师营', '三坊七巷'),
  },
  {
    cityId: 'guangzhou',
    name: '广州府',
    region: '广东布政司治所',
    summary: '海贸、粤商、关税与南海门路',
    detail: '广东省会预告。后续可承载海贸、粤商、关税和南海门路。',
    x: 58,
    y: 88,
    background: '/assets/backgrounds/landscapes/bg_build_sea.png',
    locationIds: [],
    plannedLocations: createProvincePlannedLocations('guangzhou', '广州府', '广东水师营', '镇海楼'),
  },
  {
    cityId: 'guilin',
    name: '桂林府',
    region: '广西布政司治所',
    summary: '土司、山地军务与西南转运',
    detail: '广西省会预告。后续可承载土司、山地军务、转运和边地人情。',
    x: 47,
    y: 84,
    background: '/assets/backgrounds/landscapes/bg_build_xihu.png',
    locationIds: [],
    plannedLocations: createProvincePlannedLocations('guilin', '桂林府', '广西都司营', '象鼻山'),
  },
  {
    cityId: 'kunming',
    name: '云南府',
    region: '云南布政司治所',
    summary: '滇地土司、矿路与西南边务',
    detail: '云南省会预告。后续可承载矿路、土司、西南边务和贡道。',
    x: 31,
    y: 88,
    background: '/assets/backgrounds/citys/city_bg_yunnan.png',
    locationIds: [],
    plannedLocations: createProvincePlannedLocations('kunming', '云南府', '云南都司营', '金马碧鸡坊'),
  },
  {
    cityId: 'guiyang',
    name: '贵阳府',
    region: '贵州布政司治所',
    summary: '苗疆、土司、驿道与山地军务',
    detail: '贵州省会预告。后续可承载苗疆、土司、驿道和山地军务。',
    x: 41,
    y: 80,
    background: '/assets/backgrounds/landscapes/bg_build_offical_road.png',
    locationIds: [],
    plannedLocations: createProvincePlannedLocations('guiyang', '贵阳府', '贵州都司营', '甲秀楼'),
  },
];

const ALL_MING_CITY_ENTRIES = [...MING_CITY_ENTRIES, ...ADDITIONAL_MING_CITY_ENTRIES];

const STATUS_LABELS: Record<PowerLocationStatus, string> = {
  locked: '未够资格',
  open: '可通行',
  hostile: '严查',
  favored: '照应',
};

const SERVICE_ACTION_LABELS: Partial<Record<PowerLocationService, string>> = {
  missions: '领差事',
  shop: '看货采买',
  dungeon: '翻查案卷',
  arena: '入场考绩',
  promotion: '求见升迁',
  intel: '查看情报',
  stamina: '补充体力',
  office_registry: '\u67e5\u770b\u540d\u518c',
  appointment: '\u95ee\u4efb\u514d',
  evaluation: '\u67e5\u8003\u529f',
};

const SERVICE_SCENE_BY_LOCATION: Record<string, Partial<Record<PowerLocationService, SceneId>>> = {
  northern_bureau: { missions: 'tavern', intel: 'tavern' },
  divine_engine_camp: { shop: 'weaponshop' },
  censorate: { dungeon: 'dungeon', missions: 'dungeon' },
  noble_mansion: { arena: 'arena' },
  salt_merchant_guild: { shop: 'magicshop' },
};

const LOCATION_ART: Record<string, LocationSceneArt> = {
  imperial_palace: {
    background: '/assets/backgrounds/landscapes/bg_build_huanggong.png',
    npcImage: '/assets/figure/portrait/avatar_placeholder_021.png',
    npcName: '内廷门官',
  },
  northern_bureau: {
    background: '/assets/backgrounds/landscapes/bg_build_beizhenfusi.png',
    npcImage: '/assets/foregrounds/tavern_guest_1.png',
    npcName: '北镇经历司吏',
  },
  divine_engine_camp: {
    background: '/assets/backgrounds/landscapes/bg_build_battlefield.png',
    npcImage: '/assets/figure/npc/npc_weaponshop_keeper.png',
    npcName: '神机营军需官',
  },
  censorate: {
    background: '/assets/backgrounds/landscapes/bg_build_offical_road.png',
    npcImage: '/assets/foregrounds/tavern_guest_3.png',
    npcName: '都察院书吏',
  },
  noble_mansion: {
    background: '/assets/backgrounds/landscapes/bg_huild_countryyard.png',
    npcImage: '/assets/foregrounds/tavern_guest_0.png',
    npcName: '国公府校尉',
  },
  border_command: {
    background: '/assets/backgrounds/landscapes/bg_build_border.png',
    npcImage: '/assets/foregrounds/tavern_guest_4.png',
    npcName: '九边塘报官',
  },
  salt_merchant_guild: {
    background: '/assets/backgrounds/landscapes/bg_build_store.png',
    npcImage: '/assets/figure/npc/npc_magicshop_keeper.png',
    npcName: '盐商会馆账房',
  },
  weaving_bureau: {
    background: '/assets/backgrounds/landscapes/bg_build_store.png',
    npcImage: '/assets/figure/portrait/avatar_placeholder_030.png',
    npcName: '织造局买办',
  },
  ministry_of_personnel: {
    background: '/assets/backgrounds/landscapes/bg_build_linyingshi.png',
    npcImage: '/assets/figure/portrait/avatar_placeholder_044.png',
    npcName: '\u540f\u90e8\u4e66\u540f',
  },
  wine_house: {
    background: '/assets/backgrounds/landscapes/bg_build_tavern.png',
    npcImage: '/assets/figure/npc/npc_wine_house_keeper_placeholder.png',
    npcName: '酒楼掌柜',
  },
  bun_shop: {
    background: '/assets/backgrounds/landscapes/bg_build_poor_house.png',
    npcImage: '/assets/figure/npc/npc_bun_shop_keeper_placeholder.png',
    npcName: '包子铺老板',
  },
  pleasure_quarter: {
    background: '/assets/backgrounds/landscapes/bg_build_happy_ending.png',
    npcImage: '/assets/figure/npc/npc_pleasure_quarter_madam_placeholder.png',
    npcName: '教司坊妈妈',
  },
};

function formatPowerShare(value = 0) {
  return `${(value / 100).toFixed(2)}%`;
}

function getRaidChoiceLabel(choice: LocationRaidChoice) {
  return choice === 'wealth' ? '\u52ab\u63a0\u516c\u8d26' : '\u52ab\u63a0\u7ed3\u679c';
}

function getRaidOutcomeTitle(choice: LocationRaidChoice) {
  return choice === 'wealth' ? '\u89e3\u8863\u88f9\u8d27\uff0c\u591c\u5954\u800c\u8d70' : '\u5f97\u624b\u800c\u8d70';
}

function formatRaidReward(settlement: LocationRaidSettleData) {
  const rewards = [
    settlement.rewardCopper ? `\u94dc\u94b1 +${settlement.rewardCopper}` : null,
    settlement.rewardPower ? `\u6743\u67c4 +${formatPowerShare(settlement.rewardPower)}` : null,
    settlement.rewardPrestige ? `\u58f0\u671b +${settlement.rewardPrestige}` : null,
  ].filter(Boolean);

  return rewards.join(' / ') || '\u6b64\u6b21\u672a\u83b7\u5f97\u53ef\u89c1\u6536\u76ca';
}

function formatRaidTreasuryDelta(before: LocationTreasuryView, after: LocationTreasuryView) {
  const copperDelta = after.copperBalance - before.copperBalance;

  return copperDelta ? `\u516c\u8d26\u94dc\u94b1 ${copperDelta}` : '\u516c\u8d26\u6570\u989d\u672a\u89c1\u53d8\u52a8';
}

function getRaidDefenderRole(data: LocationRaidStartData) {
  const defenderId = data.defenderActor?.actorId ?? data.battleResult.enemy.id;
  const guard = data.treasuryBefore.guards.find((entry) => entry.actorId === defenderId);

  if (guard) {
    return {
      label: '\u503c\u5b88\u5b88\u536b',
      reason: `\u6b64\u4eba\u5f53\u65f6\u5728${data.locationName}\u5e94\u4e0b\u5b88\u536b\u5dee\uff0c\u4e3b\u5b98\u672a\u4eb2\u81ea\u4e0b\u573a\u3002`,
      detail: `\u5269\u4f59 ${Math.max(0, Math.ceil(guard.remainingSeconds / 60))}\u5206 \u00b7 \u9977\u94f6 ${guard.wageCopper}`,
    };
  }

  const reason = data.defenderActor?.reason ?? '';
  if (reason.includes('\u573a\u6240\u5b88\u536b') || reason.includes('\u9632\u5b88')) {
    return {
      label: '\u573a\u6240\u9632\u4e01',
      reason: '\u6b64\u5730\u6ca1\u6709\u73a9\u5bb6\u503c\u5b88\uff0c\u7531\u573a\u6240\u9632\u4e01\u51fa\u9762\u62e6\u4f60\u3002',
      detail: '\u4e34\u65f6\u9632\u52a1',
    };
  }

  return {
    label: '\u573a\u6240\u4e3b\u4e8b',
    reason: '\u6b64\u5730\u65e0\u503c\u5b88\u5b88\u536b\u53ef\u7528\uff0c\u624d\u7531\u4efb\u4e8b\u8005\u6216\u573a\u6240\u4e2d\u4eba\u4eb2\u81ea\u5e94\u6218\u3002',
    detail: data.defenderActor?.reason || '\u4eb2\u81ea\u5e94\u6218',
  };
}

function formatServices(services: PowerLocationService[]) {
  if (services.length === 0) {
    return '随身功能';
  }

  return services.map((service) => SERVICE_LABELS[service] ?? service).join(' / ');
}

function getLocation(locations: PowerLocationView[] | null, locationId: string) {
  return locations?.find((location) => location.locationId === locationId) ?? null;
}

function getFactionRows(locations: PowerLocationView[] | null): FactionLocationRow[] {
  const rows = new Map<PowerFactionId, FactionLocationRow>();

  for (const location of locations ?? []) {
    const current = rows.get(location.ownerFaction) ?? {
      faction: location.ownerFaction,
      actorCount: 0,
      powerShare: 0,
    };
    current.actorCount += location.actorCount;
    current.powerShare += location.powerShare;
    rows.set(location.ownerFaction, current);
  }

  return [...rows.values()].sort((left, right) => right.powerShare - left.powerShare);
}

function getNodeName(node: SceneRegistryEntry, location: PowerLocationView | null) {
  return location?.name ?? node.fallbackName;
}

function getNodeOwner(node: SceneRegistryEntry, location: PowerLocationView | null) {
  return location?.ownerFaction ?? node.fallbackOwner;
}

function getNodeServices(node: SceneRegistryEntry, location: PowerLocationView | null) {
  return location?.services ?? node.services;
}

function getLocationArt(locationId: string): LocationSceneArt {
  return LOCATION_ART[locationId] ?? {
    background: '/assets/backgrounds/bg_system_tavern_task_bg_placeholder.png',
    npcImage: '/assets/figure/portrait/avatar_placeholder_000.png',
    npcName: '门房',
  };
}

function getLocationDialogue(node: SceneRegistryEntry, location: PowerLocationView | null, status: PowerLocationStatus) {
  if (node.lifecycle !== 'active') {
    return '此处衙门已经立在地图上，但具体差事、人手和账房还没铺开。先认门，日后再来。';
  }

  if (status === 'hostile') {
    return '你身上的牵连太重，进去可以，但每句话都会被记在册上。';
  }

  if (status === 'locked') {
    return `门房打量了你一眼：名分还浅，只能先走${node.channelName}这条外圈门路。`;
  }

  if (status === 'favored') {
    return `里面有人认得你的职司，${node.channelName}已经替你留了话。`;
  }

  return location?.playerRelationHint ?? node.fallbackDetail;
}

function getServiceScene(node: SceneRegistryEntry, service: PowerLocationService): SceneId | null {
  return SERVICE_SCENE_BY_LOCATION[node.locationId]?.[service] ?? node.sceneId ?? null;
}

function buildServiceEntry(
  node: SceneRegistryEntry,
  service: PowerLocationService,
  source?: Pick<
    LocationSceneServiceEntry,
    | 'sourceLocationId'
    | 'sourcePositionId'
    | 'issuerActorId'
    | 'issuerDisplayName'
    | 'issuerAvatarId'
    | 'issuerTitle'
    | 'issuerLevel'
    | 'issuerRankText'
  >,
): LocationSceneServiceEntry {
  return {
    service,
    sceneId: getServiceScene(node, service),
    label: SERVICE_ACTION_LABELS[service] ?? SERVICE_LABELS[service] ?? service,
    summary: node.channelSummary,
    sourceLocationId: source?.sourceLocationId,
    sourcePositionId: source?.sourcePositionId,
    issuerActorId: source?.issuerActorId,
    issuerDisplayName: source?.issuerDisplayName,
    issuerAvatarId: source?.issuerAvatarId,
    issuerTitle: source?.issuerTitle,
    issuerLevel: source?.issuerLevel,
    issuerRankText: source?.issuerRankText,
  };
}

function resolveShopType(node: SceneRegistryEntry, sceneId: SceneId | null | undefined): ActiveShopSource['shopType'] {
  if (sceneId === 'weaponshop' || node.locationId === 'divine_engine_camp') {
    return 'weapon';
  }

  return 'magic';
}

function buildRoleplaySource(
  node: SceneRegistryEntry,
  entry: LocationSceneServiceEntry,
  locations: PowerLocationView[] | null,
) {
  return {
    locationId: entry.sourceLocationId ?? node.locationId,
    servicePositionId: entry.sourcePositionId,
    issuerActorId: entry.issuerActorId,
    issuerDisplayName: entry.issuerDisplayName,
    issuerAvatarId: entry.issuerAvatarId,
    issuerTitle: entry.issuerTitle,
    issuerLevel: entry.issuerLevel,
    issuerRankText: entry.issuerRankText,
    sourceLabel: `${getNodeName(node, getLocation(locations, node.locationId))} - ${entry.label}`,
  };
}

function buildNpcClickMessage(npc: LocationSceneNpcCard) {
  if (npc.incomeHint || npc.replaceHint) {
    const parts = [
      `${npc.name}现任${npc.title}。`,
      npc.ownerLabel ? `所属门路：${npc.ownerLabel}。` : '',
      typeof npc.minLevel === 'number' ? `任职门槛：${npc.minLevel}级。` : '',
      npc.incomeHint,
      npc.replaceHint,
    ].filter(Boolean);

    return parts.join('');
  }

  return `${npc.name}的详细履历与离线角色信息尚在接入。后续这里会显示该角色的职位、权柄和可替代关系。`;
}

function toPanelPositions(positions: WorldActorDetailView['positions']): CharacterPanelPosition[] {
  return positions.map((position) => ({
    positionId: position.positionId,
    locationName: position.locationName,
    title: position.title,
    serviceLabel: position.serviceLabel,
    ownerLabel: position.ownerLabel,
    incomeHint: position.incomeHint,
    replaceHint: position.replaceHint,
    statusLabel: position.status,
  }));
}

type HuangcePosition = WorldServicePositionsListView['positions'][number];

type HuangcePositionGroup = {
  locationId: string;
  locationName: string;
  ownerLabel: string;
  positions: HuangcePosition[];
};

const HUANGCE_STATUS_LABELS: Record<string, string> = {
  bot_held: '\u521d\u59cb\u540d\u518c\u5360\u4f4d',
  player_held: '\u73a9\u5bb6\u4efb\u804c',
  vacant: '\u6682\u7f3a',
  locked: '\u672a\u5f00\u653e',
};

const HUANGCE_FALLBACK_CONTROL_PROFILE = {
  appointmentControllerLabel: '\u5f85\u5b9a\u4eba\u4e8b\u6743',
  financeControllerLabel: '\u5f85\u5b9a\u8d22\u6743',
  paylineHint: '\u4ff8\u7984\u94fe\u5c1a\u672a\u767b\u8bb0\u3002',
  loyaltyCostHint: '\u5fe0\u8bda\u4ee3\u4ef7\u5c1a\u672a\u767b\u8bb0\u3002',
};

const LOCATION_LEDGER_LIMIT = 20;

function formatHuangceStatus(status: string) {
  return HUANGCE_STATUS_LABELS[status] ?? status;
}

function getHuangceControlProfile(position: { controlProfile?: ServicePositionControlProfile }) {
  return position.controlProfile ?? HUANGCE_FALLBACK_CONTROL_PROFILE;
}

function formatOfficeAmount(value: number) {
  return value.toLocaleString('zh-CN');
}

function isCurrentPlayerActorByName(character: ReturnType<typeof useGameState>['character'], actor?: { displayName?: string }) {
  return Boolean(actor?.displayName && character?.player.displayName && actor.displayName === character.player.displayName);
}

function toDateFromEpoch(value: number) {
  return new Date(value > 10_000_000_000 ? value : value * 1000);
}

function formatOfficeDate(epoch: number) {
  if (!epoch) {
    return '--';
  }

  return toDateFromEpoch(epoch).toLocaleDateString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
  });
}

function formatOfficeProgress(done: number, due: number) {
  if (due <= 0) {
    return '\u6682\u65e0\u8003\u8bfe';
  }

  return `${formatOfficeAmount(done)} / ${formatOfficeAmount(due)}`;
}

function formatLedgerAmount(entry: OfficeLedgerEntry) {
  const parts = [
    entry.taxValueDelta ? `\u7a0e\u94b1 +${entry.taxValueDelta}` : null,
    entry.powerValueDelta ? `\u6743\u67c4 +${formatPowerShare(entry.powerValueDelta)}` : null,
  ].filter(Boolean);

  return parts.join(' / ') || '\u8bb0\u8d26';
}

function formatLedgerTime(createdAt: number) {
  if (!createdAt) {
    return '--';
  }

  return toDateFromEpoch(createdAt).toLocaleDateString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
  });
}

function formatCandidateScore(score: number) {
  return `${Math.round(score)}\u5206`;
}

function groupHuangcePositions(positions: HuangcePosition[]): HuangcePositionGroup[] {
  const groups = new Map<string, HuangcePositionGroup>();

  for (const position of positions) {
    const group = groups.get(position.locationId) ?? {
      locationId: position.locationId,
      locationName: position.locationName,
      ownerLabel: position.ownerLabel,
      positions: [],
    };

    group.positions.push(position);
    groups.set(position.locationId, group);
  }

  return [...groups.values()].sort((left, right) => left.locationName.localeCompare(right.locationName, 'zh-Hans-CN'));
}

const INITIAL_LOCATION_ID =
  CITY_MAP_SCENE_ENTRIES.find((entry) => entry.sceneId && entry.lifecycle === 'active')?.locationId
  ?? CITY_MAP_SCENE_ENTRIES[0]?.locationId
  ?? 'imperial_palace';

const RECOMMENDED_FIRST_LOCATION_BY_FACTION: Record<PowerFactionId, string> = {
  imperial: 'northern_bureau',
  noble: 'noble_mansion',
  censorate: 'censorate',
  border: 'northern_bureau',
  silver: 'northern_bureau',
  underworld: 'northern_bureau',
};

const CITY_GUIDE_COPY = {
  ariaLabel: '\u5165\u4eac\u6307\u5f15',
  kicker: '\u5165\u4eac\u7b2c\u4e00\u6b65',
  title: '\u5148\u53bb\u4eae\u8d77\u7684\u95e8\u8def\u63a5\u4e00\u6869\u5dee\u4e8b',
  body: '\u5f53\u524d\u804c\u53f8\u4f1a\u5f71\u54cd\u5404\u5904\u5bf9\u4f60\u7684\u6001\u5ea6\u3002\u70b9\u51fb\u9ad8\u4eae\u573a\u6240\uff0c\u8fdb\u53bb\u540e\u627e\u5e95\u90e8\u4efb\u804c\u7684\u89d2\u8272\u5361\uff0c\u518d\u70b9\u4ed6\u8eab\u4e0b\u7684\u5dee\u4e8b\u6309\u94ae\u3002',
  go: '\u524d\u5f80\u63a8\u8350\u95e8\u8def',
  dismiss: '\u6211\u77e5\u9053\u4e86',
};

function getRecommendedFirstLocationId(faction?: PowerFactionId) {
  return faction ? RECOMMENDED_FIRST_LOCATION_BY_FACTION[faction] : INITIAL_LOCATION_ID;
}

function getCityById(cityId: string | null) {
  return ALL_MING_CITY_ENTRIES.find((city) => city.cityId === cityId) ?? ALL_MING_CITY_ENTRIES[0];
}

function getCityForLocation(locationId: string) {
  return ALL_MING_CITY_ENTRIES.find((city) => city.locationIds.includes(locationId)) ?? ALL_MING_CITY_ENTRIES[0];
}

function getCitySceneEntries(city: MingCityEntry, faction?: PowerFactionId) {
  return city.locationIds
    .map((locationId) => CITY_MAP_SCENE_ENTRIES.find((entry) => entry.locationId === locationId))
    .filter((entry): entry is SceneRegistryEntry => Boolean(entry))
    .map((entry) => resolveSceneEntryForFaction(entry, faction));
}

function getCityLocationStats(city: MingCityEntry, locations: PowerLocationView[] | null) {
  const cityLocations = city.locationIds
    .map((locationId) => getLocation(locations, locationId))
    .filter((location): location is PowerLocationView => Boolean(location));

  return {
    actorCount: cityLocations.reduce((sum, location) => sum + location.actorCount, 0),
    powerShare: cityLocations.reduce((sum, location) => sum + location.powerShare, 0),
  };
}

function getPlannedLocationsForCity(city: MingCityEntry) {
  return city.plannedLocations ?? MING_CITY_PLANNED_BY_ID[city.cityId] ?? [];
}

function getCityGuideStorageKey(characterName?: string) {
  return `manual.cityGuide.v1.${characterName || 'anonymous'}`;
}

function OfficeCandidateCard({
  candidate,
  label,
  onActorClick,
}: {
  candidate: OfficeCandidateView;
  label?: string;
  onActorClick: (actorId: string) => void;
}) {
  return (
    <article className={`office-detail-modal__candidate-card${candidate.isCurrentPlayer ? ' office-detail-modal__candidate-card--current' : ''}`}>
      <div className="office-detail-modal__candidate-portrait">
        <CharacterPortraitCard
          avatarUrl={getAvatarUrl(candidate.avatarId)}
          level={candidate.level}
          name={candidate.displayName}
          rankText={`${POWER_FACTION_LABELS[candidate.faction]} \u00b7 \u6743\u67c4${formatPowerShare(candidate.powerShare)}`}
          title={label ?? (candidate.kind === 'player' ? '\u73a9\u5bb6' : '\u53ef\u7528\u4eba\u9009')}
          xpProgress={Math.min(1, candidate.score / 100)}
        />
      </div>
      <div className="office-detail-modal__candidate-body">
        <div className="office-detail-modal__candidate-head">
          <span>{label ?? '\u53ef\u7528\u4eba\u9009'}</span>
          <strong>{formatCandidateScore(candidate.score)}</strong>
        </div>
        <p>{candidate.recommendation}</p>
        <div className="office-detail-modal__candidate-breakdown">
          {candidate.scoreBreakdown.map((item) => (
            <span key={item.label} className={item.passed ? 'is-passed' : 'is-blocked'} title={item.hint}>
              {item.label} {Math.round(item.value)}
            </span>
          ))}
        </div>
        <button type="button" onClick={() => onActorClick(candidate.actorId)}>
          {'\u67e5\u770b\u5c65\u5386'}
        </button>
      </div>
    </article>
  );
}

export function CityScene({ onSceneChange }: CitySceneProps) {
  const { character, refreshCharacterInfo, runServerAction } = useGameState();
  const powerFaction = getClassPowerFaction(character?.player.classId);
  const recommendedLocationId = getRecommendedFirstLocationId(powerFaction);
  const [locationsStatus, setLocationsStatus] = useState<WorldLocationsStatusView | null>(null);
  const [locationsError, setLocationsError] = useState<string | null>(null);
  const [activeLocationId, setActiveLocationId] = useState(INITIAL_LOCATION_ID);
  const [selectedCityId, setSelectedCityId] = useState<string | null>(null);
  const [enteredLocationId, setEnteredLocationId] = useState<string | null>(null);
  const [serviceMessage, setServiceMessage] = useState<string | null>(null);
  const [actorDetail, setActorDetail] = useState<WorldActorDetailView | null>(null);
  const [actorLedgerEntries, setActorLedgerEntries] = useState<OfficeLedgerEntry[]>([]);
  const [locationLedgerEntries, setLocationLedgerEntries] = useState<OfficeLedgerEntry[]>([]);
  const [locationLedgerLoading, setLocationLedgerLoading] = useState(false);
  const [locationTreasury, setLocationTreasury] = useState<LocationTreasuryView | null>(null);
  const [locationTreasuryLoading, setLocationTreasuryLoading] = useState(false);
  const [locationTributes, setLocationTributes] = useState<OfficeTributeTerm[]>([]);
  const [locationTributesLoading, setLocationTributesLoading] = useState(false);
  const [locationFinanceReport, setLocationFinanceReport] = useState<LocationFinanceReportView | null>(null);
  const [locationFinanceReportLoading, setLocationFinanceReportLoading] = useState(false);
  const [locationChiefDashboard, setLocationChiefDashboard] = useState<LocationChiefDashboardView | null>(null);
  const [locationChiefDashboardLoading, setLocationChiefDashboardLoading] = useState(false);
  const [tributePayLoading, setTributePayLoading] = useState(false);
  const [raidStartData, setRaidStartData] = useState<LocationRaidStartData | null>(null);
  const [raidSettleData, setRaidSettleData] = useState<LocationRaidSettleData | null>(null);
  const [raidLoading, setRaidLoading] = useState(false);
  const [guardActionLoading, setGuardActionLoading] = useState<string | null>(null);
  const [actorDetailError, setActorDetailError] = useState<string | null>(null);
  const [servicePositions, setServicePositions] = useState<WorldServicePositionsListView | null>(null);
  const [positionDetail, setPositionDetail] = useState<WorldServicePositionDetailView | null>(null);
  const [positionDetailLoading, setPositionDetailLoading] = useState(false);
  const [positionCandidates, setPositionCandidates] = useState<WorldServicePositionCandidatesView | null>(null);
  const [positionCandidatesLoading, setPositionCandidatesLoading] = useState(false);
  const [huangceOpen, setHuangceOpen] = useState(false);
  const [missionSource, setMissionSource] = useState<TavernMissionSource | null>(null);
  const [shopSource, setShopSource] = useState<ActiveShopSource | null>(null);
  const [dungeonSource, setDungeonSource] = useState<DungeonSource | null>(null);
  const [arenaSource, setArenaSource] = useState<ArenaSource | null>(null);
  const [cityGuideDismissed, setCityGuideDismissed] = useState(false);
  const mapScrollRef = useRef<HTMLDivElement | null>(null);
  const mapDragRef = useRef({
    active: false,
    pointerId: -1,
    startX: 0,
    startY: 0,
    scrollLeft: 0,
    scrollTop: 0,
  });
  const [isMapDragging, setIsMapDragging] = useState(false);

  const handleMapPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) {
      return;
    }

    const target = event.target as HTMLElement;
    if (target.closest('button, a, input, textarea, select, [role="button"]')) {
      return;
    }

    mapDragRef.current = {
      active: true,
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      scrollLeft: event.currentTarget.scrollLeft,
      scrollTop: event.currentTarget.scrollTop,
    };
    setIsMapDragging(true);
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handleMapPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const drag = mapDragRef.current;
    if (!drag.active || drag.pointerId !== event.pointerId) {
      return;
    }

    event.currentTarget.scrollLeft = drag.scrollLeft - (event.clientX - drag.startX);
    event.currentTarget.scrollTop = drag.scrollTop - (event.clientY - drag.startY);
  };

  const handleMapPointerEnd = (event: PointerEvent<HTMLDivElement>) => {
    const drag = mapDragRef.current;
    if (!drag.active || drag.pointerId !== event.pointerId) {
      return;
    }

    mapDragRef.current.active = false;
    setIsMapDragging(false);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const storageKey = getCityGuideStorageKey(character?.player.displayName);
    setCityGuideDismissed(window.localStorage.getItem(storageKey) === 'dismissed');
  }, [character?.player.displayName]);

  useEffect(() => {
    if (!cityGuideDismissed && !enteredLocationId) {
      setActiveLocationId(recommendedLocationId);
    }
  }, [cityGuideDismissed, enteredLocationId, recommendedLocationId]);

  useEffect(() => {
    if (!enteredLocationId) {
      setLocationLedgerEntries([]);
      setLocationLedgerLoading(false);
      setLocationTreasury(null);
      setLocationTreasuryLoading(false);
      setLocationTributes([]);
      setLocationTributesLoading(false);
      setLocationFinanceReport(null);
      setLocationFinanceReportLoading(false);
      setLocationChiefDashboard(null);
      setLocationChiefDashboardLoading(false);
      setRaidStartData(null);
      setRaidSettleData(null);
      return;
    }

    let cancelled = false;

    async function loadLocationLedgerAndTreasury() {
      setLocationLedgerLoading(true);
      setLocationTreasuryLoading(true);
      setLocationTributesLoading(true);
      try {
        const [ledger, treasury, tribute] = await Promise.all([
          runServerAction(
          'WORLD_SERVICE_POSITION_LEDGER_GET',
          () => postGameAction<WorldServicePositionLedgerView>('WORLD_SERVICE_POSITION_LEDGER_GET', {
            locationId: enteredLocationId,
            limit: LOCATION_LEDGER_LIMIT,
          }),
          ),
          runServerAction(
            'WORLD_LOCATION_TREASURY_GET',
            () => postGameAction<LocationTreasuryView>('WORLD_LOCATION_TREASURY_GET', { locationId: enteredLocationId }),
          ),
          runServerAction(
            'WORLD_OFFICE_TRIBUTE_GET',
            () => postGameAction<OfficeTributeListView>('WORLD_OFFICE_TRIBUTE_GET', {
              locationId: enteredLocationId,
              includeHistory: true,
            }),
          ),
        ]);
        if (!cancelled) {
          setLocationLedgerEntries(ledger.entries);
          setLocationTreasury(treasury);
          setLocationTributes(tribute.terms);
        }
      } catch (error) {
        if (!cancelled) {
          setLocationLedgerEntries([]);
          setLocationTreasury(null);
          setLocationTributes([]);
          setServiceMessage(toActionErrorMessage(error, '\u672c\u5730\u8fd1\u65e5\u62a5\u544a\u8bfb\u53d6\u5931\u8d25\u3002'));
        }
      } finally {
        if (!cancelled) {
          setLocationLedgerLoading(false);
          setLocationTreasuryLoading(false);
          setLocationTributesLoading(false);
        }
      }
    }

    void loadLocationLedgerAndTreasury();

    return () => {
      cancelled = true;
    };
  }, [enteredLocationId, runServerAction]);

  useEffect(() => {
    let cancelled = false;

    async function loadLocationsStatus() {
      try {
        const status = await runServerAction(
          'WORLD_LOCATIONS_GET_STATUS',
          () => postGameAction<WorldLocationsStatusView>('WORLD_LOCATIONS_GET_STATUS'),
        );
        if (!cancelled) {
          setLocationsStatus(status);
          setLocationsError(null);
        }
      } catch (error) {
        if (!cancelled) {
          setLocationsError(toActionErrorMessage(error, '大明权力地图读取失败。'));
        }
      }
    }

    void loadLocationsStatus();

    return () => {
      cancelled = true;
    };
  }, [runServerAction]);

  const locations = locationsStatus?.locations ?? null;
  const totals = useMemo(() => {
    return (locations ?? []).reduce(
      (acc, location) => ({
        actorCount: acc.actorCount + location.actorCount,
        powerShare: acc.powerShare + location.powerShare,
      }),
      { actorCount: 0, powerShare: 0 },
    );
  }, [locations]);
  const selectedCity = selectedCityId ? getCityById(selectedCityId) : null;
  const selectedCityEntries = selectedCity ? getCitySceneEntries(selectedCity, powerFaction) : [];
  const selectedCityPlannedEntries = selectedCity ? getPlannedLocationsForCity(selectedCity) : [];
  const huangceGroups = useMemo(
    () => groupHuangcePositions(servicePositions?.positions ?? []),
    [servicePositions?.positions],
  );

  async function refreshLocationPublicState(locationId: string) {
    const [ledger, treasury, tribute] = await Promise.all([
      runServerAction(
        'WORLD_SERVICE_POSITION_LEDGER_GET',
        () => postGameAction<WorldServicePositionLedgerView>('WORLD_SERVICE_POSITION_LEDGER_GET', {
          locationId,
          limit: LOCATION_LEDGER_LIMIT,
        }),
      ),
      runServerAction(
        'WORLD_LOCATION_TREASURY_GET',
        () => postGameAction<LocationTreasuryView>('WORLD_LOCATION_TREASURY_GET', { locationId }),
      ),
      runServerAction(
        'WORLD_OFFICE_TRIBUTE_GET',
        () => postGameAction<OfficeTributeListView>('WORLD_OFFICE_TRIBUTE_GET', {
          locationId,
          includeHistory: true,
        }),
      ),
    ]);
    setLocationLedgerEntries(ledger.entries);
    setLocationTreasury(treasury);
    setLocationTributes(tribute.terms);
  }

  async function handleFinanceReportOpen(locationId: string) {
    setLocationFinanceReportLoading(true);
    try {
      const report = await runServerAction(
        'WORLD_LOCATION_FINANCE_REPORT_GET',
        () => postGameAction<LocationFinanceReportView>('WORLD_LOCATION_FINANCE_REPORT_GET', {
          locationId,
          days: 7,
        }),
      );
      setLocationFinanceReport(report);
    } catch (error) {
      setLocationFinanceReport(null);
      setServiceMessage(toActionErrorMessage(error, '\u8d22\u52a1\u62a5\u8868\u8bfb\u53d6\u5931\u8d25\u3002'));
    } finally {
      setLocationFinanceReportLoading(false);
    }
  }

  async function handleChiefDashboardOpen(locationId: string) {
    setLocationChiefDashboardLoading(true);
    try {
      const dashboard = await runServerAction(
        'WORLD_LOCATION_CHIEF_DASHBOARD_GET',
        () => postGameAction<LocationChiefDashboardView>('WORLD_LOCATION_CHIEF_DASHBOARD_GET', {
          locationId,
        }),
      );
      setLocationChiefDashboard(dashboard);
    } catch (error) {
      setLocationChiefDashboard(null);
      setServiceMessage(toActionErrorMessage(error, '\u4e3b\u5b98\u7ba1\u4e8b\u9762\u677f\u8bfb\u53d6\u5931\u8d25\u3002'));
    } finally {
      setLocationChiefDashboardLoading(false);
    }
  }

  async function handleTributePay(locationId: string, tributeId: string, amountCopper: number) {
    if (amountCopper <= 0) {
      setServiceMessage('\u7f34\u7eb3\u6570\u989d\u5fc5\u987b\u5927\u4e8e 0\u3002');
      return;
    }

    setTributePayLoading(true);
    try {
      const result = await runServerAction(
        'WORLD_OFFICE_TRIBUTE_PAY',
        () => postGameAction<OfficeTributePayData>('WORLD_OFFICE_TRIBUTE_PAY', {
          tributeId,
          amountCopper,
        }),
      );
      await refreshCharacterInfo();
      await refreshLocationPublicState(locationId);
      await handleFinanceReportOpen(locationId);
      await handleChiefDashboardOpen(locationId);
      setServiceMessage(`\u5df2\u7f34\u7eb3\u672c\u5468\u8d21\u989d ${result.term.paidCopper}/${result.term.dueCopper}\u3002`);
    } catch (error) {
      setServiceMessage(toActionErrorMessage(error, '\u7f34\u7eb3\u671f\u8d21\u5931\u8d25\u3002'));
    } finally {
      setTributePayLoading(false);
    }
  }

  async function handleLocationService(
    node: SceneRegistryEntry,
    entry: LocationSceneServiceEntry,
  ) {
    const { service, sceneId } = entry;
    setServiceMessage(null);

    if (service === 'missions') {
      const source = buildRoleplaySource(node, entry, locations);
      setMissionSource({
        locationId: source.locationId,
        servicePositionId: source.servicePositionId,
        issuerActorId: source.issuerActorId,
        sourceLabel: source.sourceLabel,
      });
      return;
    }

    if (service === 'dungeon') {
      setDungeonSource(buildRoleplaySource(node, entry, locations));
      return;
    }

    if (service === 'arena') {
      setArenaSource(buildRoleplaySource(node, entry, locations));
      return;
    }

    if (service === 'shop') {
      const shopType = resolveShopType(node, sceneId);
      const source = buildRoleplaySource(node, entry, locations);
      setShopSource({
        shopType,
        ...source,
      });
      return;
    }

    if (service === 'stamina') {
      if (node.locationId === 'wine_house') {
        try {
          const nextTavern = await runServerAction(
            'TAVERN_DRINK',
            () => postGameAction<TavernInfoData>('TAVERN_DRINK'),
          );
          await refreshCharacterInfo();
          setServiceMessage(`酒楼添酒已办妥，当前体力剩余 ${Math.floor(nextTavern.tavern.thirstSecRemaining / 60)} 分钟。`);
        } catch (error) {
          setServiceMessage(toActionErrorMessage(error, '酒楼添酒失败，令牌或今日次数可能不足。'));
        }
        return;
      }

      if (node.locationId === 'bun_shop') {
        setServiceMessage('包子铺的铜钱限量补给还在等服务端规则接入，当前先作为地图场所占位。');
        return;
      }

      if (node.locationId === 'pleasure_quarter') {
        setServiceMessage('教司坊的人情补给与特殊情报还在等服务端规则接入，当前先作为地图场所占位。');
        return;
      }
    }

    if (service === 'office_registry') {
      void openHuangce();
      return;
    }

    if (service === 'tribute_registry') {
      void handleFinanceReportOpen(node.locationId);
      setServiceMessage('\u793c\u90e8\u8d21\u7eb3\u7c3f\u5df2\u8c03\u51fa\uff0c\u53ef\u5728\u573a\u6240\u8d22\u52a1\u62a5\u8868\u4e2d\u67e5\u770b\u672c\u5468\u4e0a\u7f34\u4e0e\u8d26\u9762\u53d8\u52a8\u3002');
      return;
    }

    if (service === 'appointment' || service === 'evaluation') {
      if (entry.sourcePositionId) {
        void handlePositionDetail(entry.sourcePositionId);
      } else {
        setServiceMessage('\u6b64\u804c\u8fd8\u6ca1\u6709\u767b\u8bb0\u5230\u540f\u90e8\u518c\u4e2d\u3002');
      }
      return;
    }

    if (sceneId) {
      onSceneChange(sceneId);
      return;
    }

    setServiceMessage('此处事务尚未开放，先认门，后续会接入具体玩法。');
  }

  async function handleActorDetail(actorId: string | undefined) {
    if (!actorId) {
      setServiceMessage('此角色暂未登记在黄册中，无法查看详细履历。');
      return;
    }

    setActorDetailError(null);
    try {
      const detail = await runServerAction(
        'WORLD_ACTOR_GET_DETAIL',
        () => postGameAction<WorldActorDetailView>('WORLD_ACTOR_GET_DETAIL', { actorId }),
      );
      const ledger = await runServerAction(
        'WORLD_SERVICE_POSITION_LEDGER_GET',
        () => postGameAction<WorldServicePositionLedgerView>('WORLD_SERVICE_POSITION_LEDGER_GET', { actorId, limit: 8 }),
      );
      setActorDetail(detail);
      setActorLedgerEntries(ledger.entries);
    } catch (error) {
      setActorDetailError(toActionErrorMessage(error, '角色详情读取失败。'));
    }
  }

  async function handlePositionDetail(positionId: string | undefined) {
    if (!positionId) {
      setServiceMessage('\u6b64\u804c\u8fd8\u6ca1\u6709\u767b\u8bb0\u5230\u540f\u90e8\u518c\u4e2d\u3002');
      return;
    }

    setActorDetailError(null);
    setPositionDetailLoading(true);
    setPositionCandidates(null);
    try {
      const detail = await runServerAction(
        'WORLD_SERVICE_POSITION_GET_DETAIL',
        () => postGameAction<WorldServicePositionDetailView>('WORLD_SERVICE_POSITION_GET_DETAIL', { positionId }),
      );
      setPositionDetail(detail);
    } catch (error) {
      setActorDetailError(toActionErrorMessage(error, '\u804c\u4f4d\u8be6\u60c5\u8bfb\u53d6\u5931\u8d25\u3002'));
    } finally {
      setPositionDetailLoading(false);
    }
  }

  async function handlePositionCandidates(positionId: string | undefined) {
    if (!positionId) {
      setServiceMessage('\u6b64\u804c\u8fd8\u6ca1\u6709\u767b\u8bb0\u5230\u540f\u90e8\u518c\u4e2d\u3002');
      return;
    }

    setActorDetailError(null);
    setPositionCandidatesLoading(true);
    try {
      const candidates = await runServerAction(
        'WORLD_SERVICE_POSITION_CANDIDATES_GET',
        () => postGameAction<WorldServicePositionCandidatesView>('WORLD_SERVICE_POSITION_CANDIDATES_GET', { positionId, limit: 8 }),
      );
      setPositionCandidates(candidates);
    } catch (error) {
      setActorDetailError(toActionErrorMessage(error, '\u4e0a\u7ea7\u53ef\u7528\u540d\u518c\u8bfb\u53d6\u5931\u8d25\u3002'));
    } finally {
      setPositionCandidatesLoading(false);
    }
  }

  async function handleLocationRaid(locationId: string) {
    setActorDetailError(null);
    setRaidSettleData(null);
    setRaidLoading(true);
    try {
      const raid = await runServerAction(
        'WORLD_LOCATION_RAID_START',
        () => postGameAction<LocationRaidStartData>('WORLD_LOCATION_RAID_START', { locationId }),
      );
      setRaidStartData(raid);
    } catch (error) {
      setServiceMessage(toActionErrorMessage(error, '\u591c\u95ef\u6b64\u5730\u5931\u8d25\u3002'));
    } finally {
      setRaidLoading(false);
    }
  }

  async function handleRaidSettle(choice: LocationRaidChoice) {
    if (!raidStartData) {
      return;
    }

    setRaidLoading(true);
    try {
      const settlement = await runServerAction(
        'WORLD_LOCATION_RAID_SETTLE',
        () => postGameAction<LocationRaidSettleData>('WORLD_LOCATION_RAID_SETTLE', {
          raidId: raidStartData.raidId,
          choice,
        }),
      );
      setRaidSettleData(settlement);
      setLocationTreasury(settlement.treasuryAfter);
      await refreshCharacterInfo();
      await refreshLocationPublicState(settlement.locationId);
    } catch (error) {
      setActorDetailError(toActionErrorMessage(error, '\u52ab\u63a0\u7ed3\u7b97\u5931\u8d25\u3002'));
    } finally {
      setRaidLoading(false);
    }
  }

  async function handleGuardJoin(locationId: string, durationMinutes: number) {
    setServiceMessage(null);
    setGuardActionLoading(`join:${durationMinutes}`);
    try {
      const treasury = await runServerAction(
        'WORLD_LOCATION_GUARD_JOIN',
        () => postGameAction<LocationTreasuryView>('WORLD_LOCATION_GUARD_JOIN', { locationId, durationMinutes }),
      );
      setLocationTreasury(treasury);
      await refreshLocationPublicState(locationId);
      setServiceMessage(`\u5df2\u5728${treasury.locationName}\u5e94\u4e0b\u5b88\u536b\u5dee\uff0c\u82e5\u672a\u6ee1\u65f6\u8fb0\u79bb\u5c97\uff0c\u9977\u94f6\u4f5c\u5e9f\u3002`);
    } catch (error) {
      setServiceMessage(toActionErrorMessage(error, '\u5e94\u4e0b\u5b88\u536b\u5931\u8d25\u3002'));
    } finally {
      setGuardActionLoading(null);
    }
  }

  async function handleGuardLeave(dutyId: string) {
    setServiceMessage(null);
    setGuardActionLoading(dutyId);
    try {
      const treasury = await runServerAction(
        'WORLD_LOCATION_GUARD_LEAVE',
        () => postGameAction<LocationTreasuryView>('WORLD_LOCATION_GUARD_LEAVE', { dutyId }),
      );
      setLocationTreasury(treasury);
      await refreshLocationPublicState(treasury.locationId);
      setServiceMessage('\u5df2\u64c5\u81ea\u79bb\u5c97\uff0c\u6b64\u6b21\u503c\u5b88\u4e0d\u53d1\u9977\u94f6\u3002');
    } catch (error) {
      setServiceMessage(toActionErrorMessage(error, '\u79bb\u5c97\u5931\u8d25\u3002'));
    } finally {
      setGuardActionLoading(null);
    }
  }

  async function handleGuardClaim(dutyId: string) {
    setServiceMessage(null);
    setGuardActionLoading(dutyId);
    try {
      const claim = await runServerAction(
        'WORLD_LOCATION_GUARD_CLAIM',
        () => postGameAction<LocationGuardClaimData>('WORLD_LOCATION_GUARD_CLAIM', { dutyId }),
      );
      setLocationTreasury(claim.treasuryAfter);
      await refreshCharacterInfo();
      await refreshLocationPublicState(claim.locationId);
      setServiceMessage(
        claim.shortfall > 0
          ? `\u516c\u8d26\u4e0d\u8db3\uff0c\u672c\u6b21\u53ea\u9886\u5230 ${claim.wagePaid} \u94dc\u94b1\uff0c\u77ed\u53d1 ${claim.shortfall}\u3002`
          : `\u503c\u5b88\u5df2\u6ee1\uff0c\u9886\u5f97\u9977\u94f6 ${claim.wagePaid} \u94dc\u94b1\u3002`,
      );
    } catch (error) {
      setServiceMessage(toActionErrorMessage(error, '\u9886\u53d6\u5b88\u536b\u9977\u94f6\u5931\u8d25\u3002'));
    } finally {
      setGuardActionLoading(null);
    }
  }

  async function openHuangce() {
    setHuangceOpen(true);
    setActorDetailError(null);
    if (servicePositions) {
      return;
    }

    try {
      const list = await runServerAction(
        'WORLD_SERVICE_POSITIONS_GET_LIST',
        () => postGameAction<WorldServicePositionsListView>('WORLD_SERVICE_POSITIONS_GET_LIST'),
      );
      setServicePositions(list);
    } catch (error) {
      setActorDetailError(toActionErrorMessage(error, '黄册读取失败。'));
    }
  }

  function dismissCityGuide() {
    setCityGuideDismissed(true);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(getCityGuideStorageKey(character?.player.displayName), 'dismissed');
    }
  }

  const actorDetailModal = actorDetail ? (
    <div className="character-detail-modal" role="dialog" aria-modal="true" aria-label="角色详情">
      <button className="character-detail-modal__close" type="button" onClick={() => setActorDetail(null)}>
        关闭
      </button>
      <div className="character-detail-modal__panel">
        <CharacterPanel
          character={actorDetail.character}
          ledgerEntries={actorLedgerEntries}
          pendingAction={null}
          positions={toPanelPositions(actorDetail.positions)}
          readOnly
        />
      </div>
    </div>
  ) : null;

  const positionDetailModal = positionDetail ? (
    <div className="office-detail-modal" role="dialog" aria-modal="true" aria-label="\u804c\u4f4d\u8be6\u60c5">
      <div className="office-detail-modal__panel">
        <button
          className="office-detail-modal__close"
          type="button"
          onClick={() => {
            setPositionDetail(null);
            setPositionCandidates(null);
          }}
        >
          {'\u5173\u95ed'}
        </button>
        <div className="office-detail-modal__head">
          <span>{positionDetail.location.name}</span>
          <h2>{positionDetail.position.title}</h2>
          <p>{positionDetail.position.service ? SERVICE_LABELS[positionDetail.position.service] : positionDetail.service}</p>
        </div>
        <div className="office-detail-modal__grid">
          <section>
            <h3>{'\u73b0\u4efb'}</h3>
            <CharacterPortraitCard
              avatarUrl={getAvatarUrl(positionDetail.occupant.avatarId)}
              level={positionDetail.occupant.level}
              name={positionDetail.occupant.displayName}
              rankText={`${POWER_FACTION_LABELS[positionDetail.occupant.faction]} Â· \u6743\u67c4${formatPowerShare(positionDetail.occupant.powerShare)}`}
              title={positionDetail.occupant.kind === 'player' ? '\u73a9\u5bb6\u4efb\u804c' : '\u51b7\u542f\u52a8\u540d\u518c'}
              xpProgress={0.42}
            />
          </section>
          <section>
            <h3>{'\u8003\u529f'}</h3>
            <div className="office-detail-modal__stat">
              <span>{'\u4efb\u671f'}</span>
              <strong>{formatOfficeDate(positionDetail.kpiProfile.termStartsAt)} - {formatOfficeDate(positionDetail.kpiProfile.termEndsAt)}</strong>
            </div>
            <div className="office-detail-modal__stat">
              <span>{'\u4ea4\u7a0e'}</span>
              <strong>{formatOfficeProgress(positionDetail.kpiProfile.taxDeliveredThisTerm, positionDetail.kpiProfile.taxDuePerTerm)}</strong>
            </div>
            <div className="office-detail-modal__stat">
              <span>{'\u4ea4\u6743\u67c4'}</span>
              <strong>{formatOfficeProgress(positionDetail.kpiProfile.powerDeliveredThisTerm, positionDetail.kpiProfile.powerDuePerTerm)}</strong>
            </div>
          </section>
          <section>
            <h3>{'\u4eba\u4e8b\u4e0e\u8d22\u6743'}</h3>
            <div className="office-detail-modal__stat">
              <span>{'\u4eba\u4e8b\u4e3b\u7ba1'}</span>
              <strong>{positionDetail.controlDetail.appointmentControllerDisplayName ?? getHuangceControlProfile(positionDetail.position).appointmentControllerLabel}</strong>
            </div>
            <div className="office-detail-modal__stat">
              <span>{'\u8d22\u6743\u4e3b\u7ba1'}</span>
              <strong>{positionDetail.controlDetail.financeControllerDisplayName ?? getHuangceControlProfile(positionDetail.position).financeControllerLabel}</strong>
            </div>
            <div className="office-detail-modal__split">
              <span>{'\u5185\u5e93'} {positionDetail.controlDetail.treasurySplit.imperialPrivatePct}%</span>
              <span>{'\u56fd\u5e93'} {positionDetail.controlDetail.treasurySplit.publicTreasuryPct}%</span>
              <span>{'\u4e0a\u53f8'} {positionDetail.controlDetail.treasurySplit.superiorPct}%</span>
              <span>{'\u5b9e\u5f97'} {positionDetail.controlDetail.treasurySplit.officeHolderPct}%</span>
            </div>
          </section>
          <section>
            <h3>{'\u4efb\u514d\u53e3\u5f84'}</h3>
            <strong className="office-detail-modal__eligibility">
              {positionDetail.eligibility.canBeConsidered ? '\u53ef\u88ab\u4e0a\u7ea7\u7eb3\u5165\u53ef\u7528\u540d\u518c' : '\u6682\u4e0d\u8db3\u4ee5\u5a01\u80c1\u73b0\u4efb'}
            </strong>
            <ul>
              {positionDetail.eligibility.reasons.map((reason) => (
                <li key={reason}>{reason}</li>
              ))}
            </ul>
            <p>{positionDetail.imperialOverrideHint}</p>
          </section>
          <section className="office-detail-modal__candidates">
            <h3>{'\u4e0a\u7ea7\u53ef\u7528\u540d\u518c'}</h3>
            <p>{'\u6b64\u5904\u53ea\u663e\u793a\u4e0a\u7ea7\u624b\u91cc\u53ef\u7528\u7684\u7b79\u7801\u3002\u662f\u5426\u6362\u4eba\uff0c\u4ecd\u770b\u638c\u4eba\u4e8b\u6743\u8005\u7684\u559c\u597d\u548c\u5229\u76ca\u3002'}</p>
            {positionDetail.candidatesPreview ? (
              <div className="office-detail-modal__candidate-summary">
                <div className="office-detail-modal__stat">
                  <span>{'\u4f60\u7684\u53ef\u7528\u987a\u4f4d'}</span>
                  <strong>
                    {typeof positionDetail.candidatesPreview.currentPlayerRank === 'number'
                      ? `\u7b2c ${positionDetail.candidatesPreview.currentPlayerRank} \u987a\u4f4d`
                      : '\u6682\u672a\u5165\u4e0a\u7ea7\u89c6\u91ce'}
                  </strong>
                </div>
                <div className="office-detail-modal__stat">
                  <span>{'\u6700\u5f3a\u53ef\u7528\u4eba'}</span>
                  <strong>
                    {positionDetail.candidatesPreview.topCandidate
                      ? `${positionDetail.candidatesPreview.topCandidate.displayName} ${formatCandidateScore(positionDetail.candidatesPreview.topCandidate.score)}`
                      : '\u6682\u65e0\u53ef\u7528\u4eba'}
                  </strong>
                </div>
                <ul>
                  {positionDetail.candidatesPreview.advice.map((advice) => (
                    <li key={advice}>{advice}</li>
                  ))}
                </ul>
              </div>
            ) : (
              <p>{'\u540f\u90e8\u5c1a\u672a\u7ed9\u6b64\u7f3a\u5217\u51fa\u53ef\u7528\u540d\u518c\u3002'}</p>
            )}
            <button
              className="office-detail-modal__candidate-button"
              type="button"
              disabled={positionCandidatesLoading}
              onClick={() => void handlePositionCandidates(positionDetail.position.positionId)}
            >
              {positionCandidatesLoading ? '\u540d\u518c\u540c\u6b65\u4e2d...' : '\u67e5\u770b\u4e0a\u7ea7\u53ef\u7528\u540d\u518c'}
            </button>
            {positionCandidates?.positionId === positionDetail.position.positionId ? (
              <div className="office-detail-modal__candidate-list">
                <OfficeCandidateCard
                  candidate={positionCandidates.incumbent}
                  label={'\u73b0\u4efb'}
                  onActorClick={(actorId) => void handleActorDetail(actorId)}
                />
                {positionCandidates.currentPlayer ? (
                  <OfficeCandidateCard
                    candidate={positionCandidates.currentPlayer}
                    label={typeof positionCandidates.currentPlayerRank === 'number'
                      ? `\u4f60\u00b7\u7b2c${positionCandidates.currentPlayerRank}\u987a\u4f4d`
                      : '\u4f60'}
                    onActorClick={(actorId) => void handleActorDetail(actorId)}
                  />
                ) : null}
                {positionCandidates.candidates.map((candidate, index) => (
                  <OfficeCandidateCard
                    key={candidate.actorId}
                    candidate={candidate}
                    label={`\u53ef\u7528\u7b2c${index + 1}\u987a\u4f4d`}
                    onActorClick={(actorId) => void handleActorDetail(actorId)}
                  />
                ))}
                <div className="office-detail-modal__plotting-advice">
                  <strong>{'\u540f\u90e8\u4efb\u514d\u53e3\u5f84'}</strong>
                  <ul>
                    {positionCandidates.plottingAdvice.map((advice) => (
                      <li key={advice}>{advice}</li>
                    ))}
                  </ul>
                </div>
              </div>
            ) : null}
          </section>
          <section className="office-detail-modal__ledger">
            <h3>{'\u8fd1\u671f\u8d26\u672c'}</h3>
            {positionDetail.ledgerPreview.length > 0 ? (
              <div className="office-detail-modal__ledger-list">
                {positionDetail.ledgerPreview.map((entry) => (
                  <article key={entry.entryId} className="office-detail-modal__ledger-entry">
                    <span>{formatLedgerTime(entry.createdAt)}</span>
                    <strong>{formatLedgerAmount(entry)}</strong>
                    <p>{entry.description}</p>
                  </article>
                ))}
              </div>
            ) : (
              <p>{'\u672c\u671f\u5c1a\u65e0\u53ef\u89c1\u8fdb\u8d26\u3002'}</p>
            )}
          </section>
        </div>
      </div>
    </div>
  ) : null;

  const raidModal = raidStartData ? (
    <div className="location-raid-modal" role="dialog" aria-modal="true" aria-label="\u573a\u6240\u52ab\u63a0">
      <BattleReplay
        battleResult={raidStartData.battleResult}
        heading={raidStartData.battleResult.playerWon ? '\u591c\u95ef\u5f97\u624b' : '\u591c\u95ef\u5931\u624b'}
        subheading={`${raidStartData.locationName} \u00b7 \u516c\u8d26\u52ab\u63a0`}
        contextLabel="RAID"
        resultBody={(
          <div className="location-raid-result">
            <div className="location-raid-result__defender">
              <span>{getRaidDefenderRole(raidStartData).label}</span>
              <strong>{raidStartData.defenderActor?.displayName ?? raidStartData.battleResult.enemy.name}</strong>
              <p>{getRaidDefenderRole(raidStartData).reason}</p>
              <small>{getRaidDefenderRole(raidStartData).detail}</small>
            </div>
            <div className="location-raid-result__treasury">
              <div><span>{'\u94dc\u94b1'}</span><strong>{raidSettleData?.treasuryAfter.copperBalance ?? raidStartData.treasuryBefore.copperBalance}</strong></div>
              <div><span>{'\u5b88\u536b'}</span><strong>{raidStartData.defenderActor?.displayName ?? raidStartData.battleResult.enemy.name}</strong></div>
            </div>
            {raidSettleData ? (
              <div className="location-raid-result__settled">
                <span>{getRaidChoiceLabel(raidSettleData.choice)}</span>
                <strong>{getRaidOutcomeTitle(raidSettleData.choice)}</strong>
                <p>{formatRaidReward(raidSettleData)}</p>
                <p>{formatRaidTreasuryDelta(raidStartData.treasuryBefore, raidSettleData.treasuryAfter)}</p>
                <p>{'\u6b64\u4e8b\u5df2\u5199\u5165\u672c\u5730\u8fd1\u65e5\u62a5\u544a\uff0c\u4ed6\u4eba\u8fdb\u573a\u4e5f\u80fd\u770b\u5230\u8fd9\u7b14\u6d41\u6c34\u3002'}</p>
              </div>
            ) : raidStartData.canChooseOutcome ? (
              <div className="location-raid-result__choice-copy">
                <strong>{'\u5b88\u536b\u5df2\u88ab\u538b\u4e0b\uff0c\u53ef\u4ee5\u52a8\u6b64\u5730\u516c\u8d26\u3002'}</strong>
                <p>{'\u7b2c\u4e00\u7248\u52ab\u63a0\u53ea\u5904\u7406\u516c\u8d26\u94dc\u94b1\uff0c\u5176\u4ed6\u573a\u6240\u7279\u8272\u6389\u843d\u7b49\u573a\u6240\u7c7b\u578b\u4e30\u5bcc\u540e\u518d\u63a5\u5165\u3002'}</p>
              </div>
            ) : (
              <div className="location-raid-result__choice-copy">
                <strong>{'\u5b88\u536b\u6321\u4e0b\u4e86\u4f60'}</strong>
                <p>{'\u6b64\u6b21\u4e0d\u52a8\u516c\u8d26\uff0c\u8fd1\u65e5\u62a5\u544a\u4f1a\u8bb0\u4e0b\u8fd9\u573a\u5931\u624b\u3002'}</p>
              </div>
            )}
          </div>
        )}
        actions={[
          ...(raidStartData.canChooseOutcome && !raidSettleData
            ? [
              { key: 'wealth', label: '\u52ab\u63a0\u516c\u8d26', onClick: () => void handleRaidSettle('wealth'), disabled: raidLoading },
            ]
            : []),
          { key: 'close', label: raidSettleData || !raidStartData.canChooseOutcome ? '\u56de\u5230\u573a\u6240' : '\u6682\u4e0d\u7ed3\u7b97', variant: 'quiet', onClick: () => {
            setRaidStartData(null);
            setRaidSettleData(null);
          } },
        ]}
      />
    </div>
  ) : null;

  const huangceModal = huangceOpen ? (
    <div className="huangce-modal" role="dialog" aria-modal="true" aria-label="皇宫黄册">
      <div className="huangce-modal__panel">
        <button className="huangce-modal__close" type="button" onClick={() => setHuangceOpen(false)}>
          关闭
        </button>
        <h2>皇宫黄册</h2>
        <p>各处衙门、商路与场所职务名册。点击任职者可查看角色详情，查看他现在坐着什么位置。</p>
        <div className="huangce-modal__summary">
          <div>
            <span>登记场所</span>
            <strong>{servicePositions ? huangceGroups.length : '--'}</strong>
          </div>
          <div>
            <span>登记职位</span>
            <strong>{servicePositions?.positions.length ?? '--'}</strong>
          </div>
          <div>
            <span>用途</span>
            <strong>看谁占位</strong>
          </div>
        </div>
        {actorDetailError ? <div className="huangce-modal__notice">{actorDetailError}</div> : null}
        {positionDetailLoading ? <div className="huangce-modal__notice">{'\u804c\u4f4d\u8be6\u60c5\u540c\u6b65\u4e2d...'}</div> : null}
        <div className="huangce-modal__body">
          {huangceGroups.map((group) => (
            <section key={group.locationId} className="huangce-modal__group">
              <div className="huangce-modal__group-head">
                <h3>{group.locationName}</h3>
                <span>{group.ownerLabel}</span>
              </div>
              <div className="huangce-modal__group-grid">
                {group.positions.map((position) => (
                  <article key={position.positionId} className="huangce-modal__entry">
                    <div className="huangce-modal__office">
                      <strong>{position.title}</strong>
                      <span>{position.serviceLabel} · {formatHuangceStatus(position.status)}</span>
                    </div>
                    <button
                      className="huangce-modal__office-detail"
                      type="button"
                      onClick={() => void handlePositionDetail(position.positionId)}
                    >
                      {'\u67e5\u770b\u804c\u4f4d\u8be6\u60c5'}
                    </button>
                    <button
                      className="huangce-modal__portrait-button"
                      type="button"
                      onClick={() => void handleActorDetail(position.occupant.actorId)}
                    >
                      <CharacterPortraitCard
                        avatarUrl={getAvatarUrl(position.occupant.avatarId)}
                        level={position.occupant.level}
                        name={position.occupant.displayName}
                        rankText={`${POWER_FACTION_LABELS[position.occupant.faction]} · 权柄${formatPowerShare(position.occupant.powerShare)}`}
                        title={position.occupant.kind === 'player' ? '玩家任职' : '冷启动名册'}
                        xpProgress={0.38}
                      />
                    </button>
                    <div className="huangce-modal__control-grid">
                      <div>
                        <span>人事权</span>
                        <strong>{getHuangceControlProfile(position).appointmentControllerLabel}</strong>
                      </div>
                      <div>
                        <span>财权</span>
                        <strong>{getHuangceControlProfile(position).financeControllerLabel}</strong>
                      </div>
                      <div>
                        <span>俸禄链</span>
                        <strong>{getHuangceControlProfile(position).paylineHint}</strong>
                      </div>
                    </div>
                    <div className="huangce-modal__entry-copy">
                      <div>
                        <span>收益</span>
                        <strong>{position.incomeHint}</strong>
                      </div>
                      <div>
                        <span>替代</span>
                        <strong>{position.replaceHint}</strong>
                      </div>
                      <div>
                        <span>忠诚代价</span>
                        <strong>{getHuangceControlProfile(position).loyaltyCostHint}</strong>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          ))}
          {!servicePositions ? <div className="huangce-modal__loading">黄册同步中...</div> : null}
          {servicePositions && huangceGroups.length === 0 ? (
            <div className="huangce-modal__loading">暂无职位登记。</div>
          ) : null}
        </div>
      </div>
    </div>
  ) : null;

  if (missionSource) {
    return (
      <TavernScene
        missionSource={missionSource}
        onBack={() => {
          void refreshLocationPublicState(missionSource.locationId);
          setMissionSource(null);
          setServiceMessage(null);
        }}
      />
    );
  }

  if (dungeonSource) {
    return (
      <DungeonScene
        dungeonSource={dungeonSource}
        onBack={() => {
          setDungeonSource(null);
          setServiceMessage(null);
        }}
      />
    );
  }

  if (arenaSource) {
    return (
      <ArenaScene
        arenaSource={arenaSource}
        onBack={() => {
          setArenaSource(null);
          setServiceMessage(null);
        }}
      />
    );
  }

  if (enteredLocationId) {
    const activeBaseNode =
      CITY_MAP_SCENE_ENTRIES.find((node) => node.locationId === enteredLocationId) ?? CITY_MAP_SCENE_ENTRIES[0]!;
    const activeNode = resolveSceneEntryForFaction(activeBaseNode, powerFaction);
    const location = getLocation(locations, activeNode.locationId);
    const ownerFaction = getNodeOwner(activeNode, location);
    const status = location?.status ?? 'open';
    const art = getLocationArt(activeNode.locationId);
    const services = getNodeServices(activeNode, location);
    const serviceEntries = services.map((service) => buildServiceEntry(activeNode, service));
    const npcCards: LocationSceneNpcCard[] = location?.servicePositions?.length
      ? location.servicePositions.map((position, index) => ({
        id: position.positionId,
        actorId: position.occupant.actorId,
        avatarUrl: getAvatarUrl(position.occupant.avatarId),
        name: position.occupant.displayName,
        title: position.title,
        level: position.occupant.level,
        rankText: `${POWER_FACTION_LABELS[position.occupant.faction]} · 权柄${formatPowerShare(position.occupant.powerShare)}`,
        xpProgress: 0.26 + (index % 4) * 0.12,
        services: [buildServiceEntry(activeNode, position.service, {
          sourceLocationId: position.locationId,
          sourcePositionId: position.positionId,
          issuerActorId: position.occupant.actorId,
          issuerDisplayName: position.occupant.displayName,
          issuerAvatarId: position.occupant.avatarId,
          issuerTitle: position.title,
          issuerLevel: position.occupant.level,
          issuerRankText: `${POWER_FACTION_LABELS[position.occupant.faction]} - 权柄${formatPowerShare(position.occupant.powerShare)}`,
        })],
        incomeHint: position.incomeHint,
        replaceHint: position.replaceHint,
        positionStatus: position.status,
        ownerLabel: POWER_FACTION_LABELS[position.ownerFaction],
        minLevel: position.minLevel,
      }))
      : location?.serviceActors?.length
      ? location.serviceActors.map((actor, index) => ({
        id: actor.actorId,
        actorId: actor.actorId,
        avatarUrl: getAvatarUrl(actor.avatarId),
        name: actor.displayName,
        title: actor.title,
        level: actor.level,
        rankText: `${POWER_FACTION_LABELS[actor.faction]} · 权柄${formatPowerShare(actor.powerShare)}`,
        xpProgress: 0.26 + (index % 4) * 0.12,
        services: actor.services.map((service) => buildServiceEntry(activeNode, service, {
          sourceLocationId: activeNode.locationId,
          issuerActorId: actor.actorId,
          issuerDisplayName: actor.displayName,
          issuerAvatarId: actor.avatarId,
          issuerTitle: actor.title,
          issuerLevel: actor.level,
          issuerRankText: `${POWER_FACTION_LABELS[actor.faction]} - 权柄${formatPowerShare(actor.powerShare)}`,
        })),
      }))
      : serviceEntries.map((entry, index) => ({
        id: `${activeNode.locationId}:${entry.service}:${index}`,
        avatarUrl: art.npcImage,
        name: index === 0 ? art.npcName : `${art.npcName}${index + 1}`,
        title: entry.label,
        level: Math.max(1, character?.player.level ?? 1),
        rankText: `${POWER_FACTION_LABELS[ownerFaction]}门路`,
        xpProgress: 0.26 + (index % 4) * 0.12,
        services: [{
          ...entry,
          sourceLocationId: activeNode.locationId,
        }],
      }));
    const canPayTribute = isCurrentPlayerActorByName(character, locationTreasury?.chiefActor);

    return (
      <>
      <LocationSceneView
        art={art}
        title={getNodeName(activeNode, location)}
        ownerLabel={POWER_FACTION_LABELS[ownerFaction]}
        status={status}
        statusLabel={STATUS_LABELS[status]}
        dialogue={getLocationDialogue(activeNode, location, status)}
        meta={[
          `当前门路：${activeNode.channelName}`,
          `地点权柄：${location ? formatPowerShare(location.powerShare) : '--'}`,
          `聚集角色：${location ? `${location.actorCount}人` : '--'}`,
        ]}
        npcCards={npcCards}
        treasury={locationTreasury}
        treasuryLoading={locationTreasuryLoading}
        raidLoading={raidLoading}
        guardActionLoading={guardActionLoading}
        ledgerEntries={locationLedgerEntries}
        ledgerLoading={locationLedgerLoading}
        tributeTerms={locationTributes}
        tributeLoading={locationTributesLoading}
        tributePayLoading={tributePayLoading}
        financeReport={locationFinanceReport}
        financeReportLoading={locationFinanceReportLoading}
        chiefDashboard={locationChiefDashboard}
        chiefDashboardLoading={locationChiefDashboardLoading}
        canPayTribute={canPayTribute}
        serviceMessage={serviceMessage}
        onBack={() => {
          setServiceMessage(null);
          setEnteredLocationId(null);
        }}
        onService={(entry) => void handleLocationService(activeNode, entry)}
        onNpcClick={(npc) => {
          if (npc.actorId) {
            void handleActorDetail(npc.actorId);
          } else {
            setServiceMessage(buildNpcClickMessage(npc));
          }
        }}
        onLedgerActorClick={(actorId) => void handleActorDetail(actorId)}
        onRaid={() => void handleLocationRaid(activeNode.locationId)}
        onGuardJoin={(durationMinutes) => void handleGuardJoin(activeNode.locationId, durationMinutes)}
        onGuardLeave={(dutyId) => void handleGuardLeave(dutyId)}
        onGuardClaim={(dutyId) => void handleGuardClaim(dutyId)}
        onFinanceReportOpen={() => void handleFinanceReportOpen(activeNode.locationId)}
        onChiefDashboardOpen={() => void handleChiefDashboardOpen(activeNode.locationId)}
        onTributePay={(tributeId, amountCopper) => void handleTributePay(activeNode.locationId, tributeId, amountCopper)}
      />
      {activeNode.locationId === 'imperial_palace' ? (
        <button className="city-scene__huangce-button" type="button" onClick={() => void openHuangce()}>
          查看黄册
        </button>
      ) : null}
      {shopSource ? (
        shopSource.shopType === 'weapon' ? (
          <WeaponShopScene
            shopSource={shopSource}
            onBack={() => {
              setShopSource(null);
              setServiceMessage(null);
            }}
          />
        ) : (
          <MagicShopScene
            shopSource={shopSource}
            onBack={() => {
              setShopSource(null);
              setServiceMessage(null);
            }}
          />
        )
      ) : null}
      {actorDetailError ? <div className="city-scene__floating-error">{actorDetailError}</div> : null}
      {huangceModal}
      {positionDetailModal}
      {actorDetailModal}
      {raidModal}
      </>
    );
  }

  if (!selectedCity) {
    const recommendedCity = getCityForLocation(recommendedLocationId);

    return (
      <div
        ref={mapScrollRef}
        className={`scene scene--city scene--ming-map${isMapDragging ? ' scene--ming-map-dragging' : ''}`}
        onPointerDown={handleMapPointerDown}
        onPointerMove={handleMapPointerMove}
        onPointerUp={handleMapPointerEnd}
        onPointerCancel={handleMapPointerEnd}
      >
        <div className="scene__banner scene__banner--left">大明版图</div>
        <div className="scene__banner scene__banner--center">
          {locations
            ? `天下名册 ${totals.actorCount}人 · 地点权柄 ${formatPowerShare(totals.powerShare)}`
            : locationsError ?? '先选城市，再入场所；场所里找任职角色办事。'}
        </div>

        <section className="ming-map" aria-label="大明主要城市入口">
          <div className="ming-map__panel">
            <span>天下门路</span>
            <h2>先选一座城</h2>
            <p>全国地图只负责城市地标。进入城市后，衙门、店铺、营房和街市统一显示在底部入口卡片中。</p>
          </div>

          {ALL_MING_CITY_ENTRIES.map((city) => {
            const stats = getCityLocationStats(city, locations);
            const isRecommended = city.cityId === recommendedCity.cityId;

            return (
              <button
                key={city.cityId}
                className={`ming-map__city ming-map__city--${city.cityId}${isRecommended ? ' ming-map__city--recommended' : ''}`}
                type="button"
                style={{ left: `${city.x}%`, top: `${city.y}%` }}
                onClick={() => {
                  setSelectedCityId(city.cityId);
                  setActiveLocationId(city.locationIds[0] ?? INITIAL_LOCATION_ID);
                  setServiceMessage(null);
                }}
              >
                <strong>{city.name}</strong>
                <span className="ming-map__city-tooltip">
                  <em>{city.region}</em>
                  <b>{city.summary}</b>
                  <small>{stats.actorCount ? `${stats.actorCount}人 · 权柄${formatPowerShare(stats.powerShare)}` : city.detail}</small>
                </span>
                <em>{stats.actorCount ? `${stats.actorCount}人 · 权柄${formatPowerShare(stats.powerShare)}` : city.summary}</em>
              </button>
            );
          })}
        </section>
        {actorDetailError ? <div className="city-scene__floating-error">{actorDetailError}</div> : null}
      </div>
    );
  }

  return (
    <div
      className="scene scene--city"
      style={selectedCity.background ? { backgroundImage: `url("${selectedCity.background}")` } : undefined}
    >
      <div className="scene__banner scene__banner--left scene__banner--city-current">{selectedCity.name}</div>
      <div className="scene__banner scene__banner--center scene__banner--city-current">
        {locations ? `${selectedCity.region} · ${selectedCity.summary}` : locationsError ?? selectedCity.detail}
      </div>
      <div className="scene__banner scene__banner--left">大明京城</div>
      <div className="scene__banner scene__banner--center">
        {locations
          ? `京城名册 ${totals.actorCount}人 · 地点权柄 ${formatPowerShare(totals.powerShare)}`
          : locationsError ?? '京城地图是权力空间；右侧腰牌只是已解锁门路的快捷入口。'}
      </div>

      <div className="city-scene">
        <button
          className="city-scene__world-back"
          type="button"
          onClick={() => {
            setSelectedCityId(null);
            setServiceMessage(null);
          }}
        >
          返回大明地图
        </button>

        {!cityGuideDismissed && selectedCity.cityId === getCityForLocation(recommendedLocationId).cityId ? (
          <section className="city-scene__guide" aria-label={CITY_GUIDE_COPY.ariaLabel}>
            <div className="city-scene__guide-kicker">{CITY_GUIDE_COPY.kicker}</div>
            <h2>{CITY_GUIDE_COPY.title}</h2>
            <p>{CITY_GUIDE_COPY.body}</p>
            <div className="city-scene__guide-actions">
              <button
                type="button"
                onClick={() => {
                  dismissCityGuide();
                  setServiceMessage(null);
                  setEnteredLocationId(recommendedLocationId);
                }}
              >
                {CITY_GUIDE_COPY.go}
              </button>
              <button type="button" onClick={dismissCityGuide}>
                {CITY_GUIDE_COPY.dismiss}
              </button>
            </div>
          </section>
        ) : null}

        <section className="city-scene__faction-board">
          <div className="city-scene__faction-board-title">京城权柄分布</div>
          <div className="city-scene__faction-grid">
            {getFactionRows(locations).map((entry) => (
              <div key={entry.faction} className="city-scene__faction-row">
                <span>{POWER_FACTION_LABELS[entry.faction]}</span>
                <strong>{formatPowerShare(entry.powerShare)}</strong>
                <em>{entry.actorCount}人</em>
              </div>
            ))}
            {!locations ? (
              <div className="city-scene__faction-row city-scene__faction-row--loading">
                <span>{locationsError ?? '名册同步中'}</span>
                <strong>--</strong>
                <em>--</em>
              </div>
            ) : null}
          </div>
        </section>

        <section className="city-scene__location-strip" aria-label="京城场所入口">
          {selectedCityEntries.map((node) => {
            const location = getLocation(locations, node.locationId);
            const ownerFaction = getNodeOwner(node, location);
            const status = location?.status ?? 'open';
            const art = getLocationArt(node.locationId);
            const isRecommended = !cityGuideDismissed && node.locationId === recommendedLocationId;

            return (
              <button
                key={node.locationId}
                className={`city-scene__location-card city-scene__location-card--status-${status}${isRecommended ? ' city-scene__location-card--recommended' : ''}`}
                type="button"
                onFocus={() => setActiveLocationId(node.locationId)}
                onMouseEnter={() => setActiveLocationId(node.locationId)}
                onClick={() => {
                  setServiceMessage(null);
                  setEnteredLocationId(node.locationId);
                }}
              >
                <span className="city-scene__location-art" style={{ backgroundImage: `url("${art.background}")` }} />
                <span className="city-scene__location-body">
                  <span className="city-scene__location-tags">
                    <em>{POWER_FACTION_LABELS[ownerFaction]}</em>
                    <em>{STATUS_LABELS[status]}</em>
                    {node.lifecycle !== 'active' ? <em>认门</em> : null}
                  </span>
                  <strong>{getNodeName(node, location)}</strong>
                  <span>{node.channelName}</span>
                  <small>
                    {location ? `${location.actorCount}人 · 权柄${formatPowerShare(location.powerShare)}` : node.channelSummary}
                  </small>
                </span>
              </button>
            );
          })}
          {selectedCityPlannedEntries.map((planned) => (
            <button
              key={planned.id}
              className="city-scene__location-card city-scene__location-card--planned"
              type="button"
              onClick={() => {
                setServiceMessage(`${selectedCity.name} · ${planned.name}：${planned.detail}`);
              }}
            >
              <span className="city-scene__location-art city-scene__location-art--planned" />
              <span className="city-scene__location-body">
                <span className="city-scene__location-tags">
                  <em>{planned.kind}</em>
                  <em>预告</em>
                </span>
                <strong>{planned.name}</strong>
                <span>{planned.summary}</span>
                <small>{selectedCity.name}地方门路，后续接入。</small>
              </span>
            </button>
          ))}
        </section>

        {serviceMessage ? <div className="city-scene__city-message">{serviceMessage}</div> : null}

        {selectedCityEntries.map((node) => {
          const location = getLocation(locations, node.locationId);
          const ownerFaction = getNodeOwner(node, location);
          const status = location?.status ?? 'open';
          const isDisabled = !node.sceneId || node.lifecycle !== 'active';
          const isGateRestricted = status === 'locked';

          return (
            <button
              key={node.locationId}
              className={`${node.className} city-scene__node--status-${status}${isDisabled || isGateRestricted ? ' city-scene__node--locked' : ''}${!cityGuideDismissed && node.locationId === recommendedLocationId ? ' city-scene__node--recommended' : ''}`}
              type="button"
              aria-disabled={false}
              onFocus={() => setActiveLocationId(node.locationId)}
              onMouseEnter={() => setActiveLocationId(node.locationId)}
              onClick={() => {
                setServiceMessage(null);
                setEnteredLocationId(node.locationId);
              }}
            >
              <span className="city-scene__node-faction">{POWER_FACTION_LABELS[ownerFaction]}</span>
              <span className="city-scene__node-status">{STATUS_LABELS[status]}</span>
              <span className="city-scene__node-title">{getNodeName(node, location)}</span>
              <span className="city-scene__node-flavor">{node.channelName}</span>
              <span className="city-scene__node-power">
                {location ? `${location.actorCount}人 · 权柄${formatPowerShare(location.powerShare)}` : node.channelSummary}
              </span>
            </button>
          );
        })}

        {selectedCityEntries.length > 0 ? (() => {
          const activeNode = selectedCityEntries.find((node) => node.locationId === activeLocationId) ?? selectedCityEntries[0]!;
          const location = getLocation(locations, activeNode.locationId);
          const ownerFaction = getNodeOwner(activeNode, location);
          const status = location?.status ?? 'open';

          return (
            <aside className="city-scene__detail">
              <span className="city-scene__detail-faction">{POWER_FACTION_LABELS[ownerFaction]}</span>
              <span className={`city-scene__detail-status city-scene__detail-status--${status}`}>{STATUS_LABELS[status]}</span>
              <h2>{getNodeName(activeNode, location)}</h2>
              <p>{location?.playerRelationHint ?? activeNode.fallbackDetail}</p>
              <div className="city-scene__detail-stats">
                <div>
                  <span>身份门路</span>
                  <strong>{activeNode.channelName}</strong>
                </div>
                <div>
                  <span>服务类型</span>
                  <strong>{formatServices(getNodeServices(activeNode, location))}</strong>
                </div>
                <div>
                  <span>维护状态</span>
                  <strong>{activeNode.lifecycle === 'active' ? '已开放' : '未开放'}</strong>
                </div>
                <div>
                  <span>聚集角色</span>
                  <strong>{location ? `${location.actorCount}人` : '同步中'}</strong>
                </div>
                <div>
                  <span>地点权柄</span>
                  <strong>{location ? formatPowerShare(location.powerShare) : '同步中'}</strong>
                </div>
                <div>
                  <span>通行耗时</span>
                  <strong>{location?.travelCostSecBase ? `${location.travelCostSecBase}秒` : '--'}</strong>
                </div>
              </div>
            </aside>
          );
        })() : (
          <aside className="city-scene__detail city-scene__detail--city">
            <span className="city-scene__detail-faction">{selectedCity.region}</span>
            <span className="city-scene__detail-status">预告</span>
            <h2>{selectedCity.name}</h2>
            <p>{selectedCity.detail}</p>
            <div className="city-scene__detail-stats">
              <div>
                <span>地方官署</span>
                <strong>三司署</strong>
              </div>
              <div>
                <span>军事门路</span>
                <strong>卫所营伍</strong>
              </div>
              <div>
                <span>市井门路</span>
                <strong>客栈</strong>
              </div>
              <div>
                <span>地方文化</span>
                <strong>名胜人情</strong>
              </div>
              <div>
                <span>开放状态</span>
                <strong>世界观预告</strong>
              </div>
              <div>
                <span>预留场所</span>
                <strong>{selectedCityPlannedEntries.length}处</strong>
              </div>
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}

