import type { PowerFactionId, PowerLocationService, SceneId } from '../types/game';

export type SceneChannelCopy = {
  channelName: string;
  channelSummary: string;
  fallbackDetail?: string;
};

export type SceneRegistryEntry = {
  sceneId?: SceneId;
  locationId: string;
  fallbackOwner: PowerFactionId;
  fallbackName: string;
  fallbackFlavor: string;
  fallbackDetail: string;
  className: string;
  services: PowerLocationService[];
  channelName: string;
  channelSummary: string;
  channelByFaction?: Partial<Record<PowerFactionId, SceneChannelCopy>>;
  showOnCityMap: boolean;
  showInRightRail: boolean;
  lifecycle: 'active' | 'planned' | 'deprecated';
};

export const SERVICE_LABELS: Record<PowerLocationService, string> = {
  missions: '差事',
  shop: '采买',
  dungeon: '案卷',
  arena: '考绩',
  promotion: '升迁',
  intel: '情报',
  estate: '府邸',
  stamina: '补给',
};

export const SCENE_REGISTRY: SceneRegistryEntry[] = [
  {
    locationId: 'imperial_palace',
    fallbackOwner: 'imperial',
    fallbackName: '紫禁城',
    fallbackFlavor: '皇权中枢',
    fallbackDetail: '诏令、内廷、宗室和厂卫都绕不开这里。当前只是权力地图节点，后续承接皇权主线。',
    className: 'city-scene__node city-scene__node--palace',
    services: ['promotion', 'intel'],
    channelName: '内廷门路',
    channelSummary: '密旨、升迁、内府资源',
    showOnCityMap: true,
    showInRightRail: false,
    lifecycle: 'planned',
  },
  {
    sceneId: 'tavern',
    locationId: 'northern_bureau',
    fallbackOwner: 'imperial',
    fallbackName: '北镇抚司',
    fallbackFlavor: '领密差',
    fallbackDetail: '差房任务的权力包装入口，发布密旨、清查、缉拿等差事。',
    className: 'city-scene__node city-scene__node--tavern',
    services: ['missions', 'intel'],
    channelName: '北镇密差',
    channelSummary: '领办差事',
    channelByFaction: {
      imperial: { channelName: '北镇密差', channelSummary: '密旨缉拿', fallbackDetail: '厂卫门路在此领密差、查逆案，能进内堂，也更容易惹上牵连。' },
      censorate: { channelName: '门房递状', channelSummary: '呈递案声', fallbackDetail: '清流门生在北镇抚司外递状、转文、听风声，未必能进诏狱内堂。' },
      border: { channelName: '军情塘报', channelSummary: '边镇线报', fallbackDetail: '边镇出身多从塘报和军情入手，替厂卫核查军中旧案。' },
      silver: { channelName: '会馆账差', channelSummary: '账目牵线', fallbackDetail: '商税门路多从账册、保人和银路入手，替人递消息，也替人遮消息。' },
      underworld: { channelName: '香会暗活', channelSummary: '门外脏活', fallbackDetail: '流民暗线只能在门外接低门槛差事：带路、告密、放风、递口供。' },
    },
    showOnCityMap: true,
    showInRightRail: false,
    lifecycle: 'active',
  },
  {
    sceneId: 'weaponshop',
    locationId: 'divine_engine_camp',
    fallbackOwner: 'border',
    fallbackName: '神机营',
    fallbackFlavor: '买军械',
    fallbackDetail: '军械采买和火器装备入口，后续可承接神机营军功线。',
    className: 'city-scene__node city-scene__node--market',
    services: ['shop'],
    channelName: '军需库',
    channelSummary: '军械甲胄',
    channelByFaction: {
      imperial: { channelName: '神机营军械', channelSummary: '火器甲械' },
      censorate: { channelName: '查抄物库', channelSummary: '案没器械', fallbackDetail: '清流门路拿到的是查抄入库的器械，名分清楚，但未必趁手。' },
      border: { channelName: '军需库', channelSummary: '旧铳甲胄', fallbackDetail: '边镇军户从军需库挑旧铳旧甲，实用优先，账面另算。' },
      silver: { channelName: '私贩火器', channelSummary: '银路器械', fallbackDetail: '商帮可从银路私贩火器甲胄，价格漂亮，来路也漂亮得可疑。' },
      underworld: { channelName: '赃械摊', channelSummary: '拼装旧货', fallbackDetail: '流民暗线能买到拼装赃械，便宜、凶险，也没人给你担保。' },
    },
    showOnCityMap: true,
    showInRightRail: false,
    lifecycle: 'active',
  },
  {
    sceneId: 'dungeon',
    locationId: 'censorate',
    fallbackOwner: 'censorate',
    fallbackName: '都察院',
    fallbackFlavor: '办案卷',
    fallbackDetail: '案牍房入口，蓝玉案等权力案件会从这里接办。',
    className: 'city-scene__node city-scene__node--dungeon',
    services: ['dungeon', 'missions'],
    channelName: '案牍房',
    channelSummary: '接办大案',
    channelByFaction: {
      imperial: { channelName: '诏狱清查', channelSummary: '密案清洗', fallbackDetail: '皇权门路在此接密案，查办逆党、清洗旧部，收获大，牵连也重。' },
      censorate: { channelName: '御史案牍', channelSummary: '弹劾查账', fallbackDetail: '清流门路从案牍入手，查账、弹劾、翻旧案，讲名分也讲刀口。' },
      border: { channelName: '边镇旧案', channelSummary: '军功牵连', fallbackDetail: '边镇出身多被卷入军功旧案，既可翻案，也可能替人背锅。' },
      silver: { channelName: '查税追赃', channelSummary: '银路案卷', fallbackDetail: '商税门路看到的是盐税、贡品、账房和地方官的银路案卷。' },
      underworld: { channelName: '门外递状', channelSummary: '告密带路', fallbackDetail: '流民暗线只能在都察院门外递状、告密、带路，先从外围案声求门路。' },
    },
    showOnCityMap: true,
    showInRightRail: false,
    lifecycle: 'active',
  },
  {
    sceneId: 'arena',
    locationId: 'noble_mansion',
    fallbackOwner: 'noble',
    fallbackName: '国公府',
    fallbackFlavor: '争考绩',
    fallbackDetail: '校场与考绩入口，后续可承接勋贵门第、军功旧部的对抗。',
    className: 'city-scene__node city-scene__node--arena',
    services: ['arena'],
    channelName: '校场考绩',
    channelSummary: '比试争名',
    channelByFaction: {
      imperial: { channelName: '厂卫较艺', channelSummary: '威名考校' },
      noble: { channelName: '校场考绩', channelSummary: '门第争名' },
      censorate: { channelName: '名士论战', channelSummary: '官声相争', fallbackDetail: '清流不一定亲自上擂，也会用名声、门生和弹章争胜。' },
      border: { channelName: '军功比试', channelSummary: '武勋排位' },
      silver: { channelName: '会馆赌斗', channelSummary: '银钱押名' },
      underworld: { channelName: '私斗擂', channelSummary: '拳脚争命' },
    },
    showOnCityMap: true,
    showInRightRail: false,
    lifecycle: 'active',
  },
  {
    locationId: 'border_command',
    fallbackOwner: 'border',
    fallbackName: '九边都司',
    fallbackFlavor: '边镇军权',
    fallbackDetail: '边镇总兵、家丁私兵和军粮账册聚集之地。当前为地图节点，后续承接边镇任务。',
    className: 'city-scene__node city-scene__node--border',
    services: ['missions', 'shop'],
    channelName: '边镇军令',
    channelSummary: '军令、塘报、军需',
    showOnCityMap: true,
    showInRightRail: false,
    lifecycle: 'planned',
  },
  {
    sceneId: 'magicshop',
    locationId: 'salt_merchant_guild',
    fallbackOwner: 'silver',
    fallbackName: '盐商会馆',
    fallbackFlavor: '通银路',
    fallbackDetail: '特殊商店入口，包装为盐引、织造、宫中旧物的灰色流通。',
    className: 'city-scene__node city-scene__node--magicshop',
    services: ['shop'],
    channelName: '盐引暗柜',
    channelSummary: '贡品旧物',
    channelByFaction: {
      imperial: { channelName: '内府旧物', channelSummary: '宫中流出', fallbackDetail: '皇权门路能碰到更体面的内府旧物，但也更容易被问来路。' },
      noble: { channelName: '赏赐旧藏', channelSummary: '门第旧物' },
      censorate: { channelName: '御史人情', channelSummary: '清贵门路', fallbackDetail: '清流门路不明说买卖，只说人情往来和案没旧物。' },
      border: { channelName: '军功赏物', channelSummary: '边镇旧赏' },
      silver: { channelName: '盐引暗柜', channelSummary: '贡品旧物' },
      underworld: { channelName: '秘社符物', channelSummary: '暗线杂货', fallbackDetail: '流民暗线买的是符物、赃物和说不清来路的保命东西。' },
    },
    showOnCityMap: true,
    showInRightRail: false,
    lifecycle: 'active',
  },
  {
    locationId: 'wine_house',
    fallbackOwner: 'silver',
    fallbackName: '京城酒楼',
    fallbackFlavor: '宴饮补给',
    fallbackDetail: '三教九流都在此处吃酒听风声。当前先承接令牌补满体力的入口，后续可扩展为酒楼任务与人情渠道。',
    className: 'city-scene__node city-scene__node--wine-house',
    services: ['stamina'],
    channelName: '酒楼宴席',
    channelSummary: '花令牌补满体力',
    showOnCityMap: true,
    showInRightRail: false,
    lifecycle: 'active',
  },
  {
    locationId: 'bun_shop',
    fallbackOwner: 'underworld',
    fallbackName: '城门包子铺',
    fallbackFlavor: '市井补给',
    fallbackDetail: '城门口热笼不歇，脚夫、军汉、番役都在这里垫肚子。后续承接铜钱限量补体力。',
    className: 'city-scene__node city-scene__node--bun-shop',
    services: ['stamina'],
    channelName: '热笼包子',
    channelSummary: '铜钱限量补给',
    showOnCityMap: true,
    showInRightRail: false,
    lifecycle: 'active',
  },
  {
    locationId: 'pleasure_quarter',
    fallbackOwner: 'silver',
    fallbackName: '教司坊',
    fallbackFlavor: '销金人情',
    fallbackDetail: '声色场里消息最杂，银钱、人情、把柄都能换路子。后续承接稀有道具补体力与特殊情报。',
    className: 'city-scene__node city-scene__node--pleasure-quarter',
    services: ['stamina', 'intel'],
    channelName: '教司坊人情',
    channelSummary: '稀有道具补给',
    showOnCityMap: true,
    showInRightRail: false,
    lifecycle: 'active',
  },
  {
    locationId: 'weaving_bureau',
    fallbackOwner: 'silver',
    fallbackName: '织造局',
    fallbackFlavor: '内库采买',
    fallbackDetail: '内库采买、织造贡品和商税关系的节点。当前为地图节点，后续承接商税线。',
    className: 'city-scene__node city-scene__node--weaving',
    services: ['shop', 'missions'],
    channelName: '织造采办',
    channelSummary: '贡品、内库、商税',
    showOnCityMap: true,
    showInRightRail: false,
    lifecycle: 'planned',
  },
  {
    sceneId: 'mail',
    locationId: 'refugee_camp',
    fallbackOwner: 'underworld',
    fallbackName: '流民营',
    fallbackFlavor: '阅回报',
    fallbackDetail: '战报与回放入口，包装为民间消息、暗线回报和流民传闻。',
    className: 'city-scene__node city-scene__node--mail',
    services: ['intel'],
    channelName: '暗线回报',
    channelSummary: '战报案卷',
    channelByFaction: {
      imperial: { channelName: '密档回报', channelSummary: '厂卫文书' },
      censorate: { channelName: '言官奏报', channelSummary: '弹章回看' },
      border: { channelName: '塘报军情', channelSummary: '战报回看' },
      silver: { channelName: '账房消息', channelSummary: '银路回报' },
      underworld: { channelName: '民间传闻', channelSummary: '暗线回报' },
    },
    showOnCityMap: false,
    showInRightRail: true,
    lifecycle: 'active',
  },
  {
    sceneId: 'inventory',
    locationId: 'player_inventory',
    fallbackOwner: 'underworld',
    fallbackName: '随身行囊',
    fallbackFlavor: '整资装',
    fallbackDetail: '行囊与装备整理入口，表示玩家自身携带的资装和暗格。',
    className: 'city-scene__node city-scene__node--inventory',
    services: [],
    channelName: '随身行囊',
    channelSummary: '整理资装',
    showOnCityMap: false,
    showInRightRail: true,
    lifecycle: 'active',
  },
];

export const DEPRECATED_SCENE_ENTRIES: SceneRegistryEntry[] = [
  {
    sceneId: 'blackmarket',
    locationId: 'legacy_blackmarket',
    fallbackOwner: 'underworld',
    fallbackName: '旧黑市',
    fallbackFlavor: '旧入口',
    fallbackDetail: '旧黑市入口已不作为玩家主路径维护，后续应合并到具体集团渠道。',
    className: 'city-scene__node',
    services: ['shop'],
    channelName: '旧黑市',
    channelSummary: '待合并',
    showOnCityMap: false,
    showInRightRail: false,
    lifecycle: 'deprecated',
  },
];

export const CITY_MAP_SCENE_ENTRIES = SCENE_REGISTRY.filter((entry) => entry.showOnCityMap);
export const RIGHT_RAIL_SCENE_ENTRIES = SCENE_REGISTRY.filter((entry) => entry.sceneId && entry.showInRightRail);

export function getSceneRegistryEntry(sceneId: SceneId) {
  return [...SCENE_REGISTRY, ...DEPRECATED_SCENE_ENTRIES].find((entry) => entry.sceneId === sceneId);
}

export function resolveSceneEntryForFaction<TEntry extends SceneRegistryEntry>(
  entry: TEntry,
  faction?: PowerFactionId,
): TEntry {
  const channel = faction ? entry.channelByFaction?.[faction] : undefined;

  if (!channel) {
    return entry;
  }

  return {
    ...entry,
    channelName: channel.channelName,
    channelSummary: channel.channelSummary,
    fallbackDetail: channel.fallbackDetail ?? entry.fallbackDetail,
  };
}

export function getSceneRegistryEntryForFaction(sceneId: SceneId, faction?: PowerFactionId) {
  const entry = getSceneRegistryEntry(sceneId);
  return entry ? resolveSceneEntryForFaction(entry, faction) : undefined;
}
