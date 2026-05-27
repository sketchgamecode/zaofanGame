import { useEffect, useMemo, useState } from 'react';
import { postGameAction } from '../api/gameApi';
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
  WorldActorDetailView,
  WorldLocationsStatusView,
  WorldServicePositionsListView,
} from '../types/game';
import type { TavernInfoData } from '../types/tavern';

type CitySceneProps = {
  onSceneChange: (sceneId: SceneId) => void;
};

type FactionLocationRow = {
  faction: PowerFactionId;
  actorCount: number;
  powerShare: number;
};

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
    background: '/assets/backgrounds/bg_system_tavern_task_bg_05.png',
    npcImage: '/assets/figure/portrait/avatar_placeholder_021.png',
    npcName: '内廷门官',
  },
  northern_bureau: {
    background: '/assets/backgrounds/bg_system_tavern.png',
    npcImage: '/assets/foregrounds/tavern_guest_1.png',
    npcName: '北镇经历司吏',
  },
  divine_engine_camp: {
    background: '/assets/backgrounds/bg_system_weaponshop.jpg',
    npcImage: '/assets/figure/npc/npc_weaponshop_keeper.png',
    npcName: '神机营军需官',
  },
  censorate: {
    background: '/assets/backgrounds/bg_system_tavern_task_bg_02.png',
    npcImage: '/assets/foregrounds/tavern_guest_3.png',
    npcName: '都察院书吏',
  },
  noble_mansion: {
    background: '/assets/backgrounds/bg_system_pvp.png',
    npcImage: '/assets/foregrounds/tavern_guest_0.png',
    npcName: '国公府校尉',
  },
  border_command: {
    background: '/assets/backgrounds/bg_system_tavern_task_bg_03.png',
    npcImage: '/assets/foregrounds/tavern_guest_4.png',
    npcName: '九边塘报官',
  },
  salt_merchant_guild: {
    background: '/assets/backgrounds/bg_system_magicshop.png',
    npcImage: '/assets/figure/npc/npc_magicshop_keeper.png',
    npcName: '盐商会馆账房',
  },
  weaving_bureau: {
    background: '/assets/backgrounds/bg_system_tavern_task_bg_04.png',
    npcImage: '/assets/figure/portrait/avatar_placeholder_030.png',
    npcName: '织造局买办',
  },
  wine_house: {
    background: '/assets/backgrounds/bg_location_wine_house_placeholder.png',
    npcImage: '/assets/figure/npc/npc_wine_house_keeper_placeholder.png',
    npcName: '酒楼掌柜',
  },
  bun_shop: {
    background: '/assets/backgrounds/bg_location_bun_shop_placeholder.png',
    npcImage: '/assets/figure/npc/npc_bun_shop_keeper_placeholder.png',
    npcName: '包子铺老板',
  },
  pleasure_quarter: {
    background: '/assets/backgrounds/bg_location_pleasure_quarter_placeholder.png',
    npcImage: '/assets/figure/npc/npc_pleasure_quarter_madam_placeholder.png',
    npcName: '教司坊妈妈',
  },
};

function formatPowerShare(value = 0) {
  return `${(value / 100).toFixed(2)}%`;
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

function buildServiceEntry(node: SceneRegistryEntry, service: PowerLocationService): LocationSceneServiceEntry {
  return {
    service,
    sceneId: getServiceScene(node, service),
    label: SERVICE_ACTION_LABELS[service] ?? SERVICE_LABELS[service] ?? service,
    summary: node.channelSummary,
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

const INITIAL_LOCATION_ID =
  CITY_MAP_SCENE_ENTRIES.find((entry) => entry.sceneId && entry.lifecycle === 'active')?.locationId
  ?? CITY_MAP_SCENE_ENTRIES[0]?.locationId
  ?? 'imperial_palace';

export function CityScene({ onSceneChange }: CitySceneProps) {
  const { character, refreshCharacterInfo, runServerAction } = useGameState();
  const powerFaction = getClassPowerFaction(character?.player.classId);
  const [locationsStatus, setLocationsStatus] = useState<WorldLocationsStatusView | null>(null);
  const [locationsError, setLocationsError] = useState<string | null>(null);
  const [activeLocationId, setActiveLocationId] = useState(INITIAL_LOCATION_ID);
  const [enteredLocationId, setEnteredLocationId] = useState<string | null>(null);
  const [serviceMessage, setServiceMessage] = useState<string | null>(null);
  const [actorDetail, setActorDetail] = useState<WorldActorDetailView | null>(null);
  const [actorDetailError, setActorDetailError] = useState<string | null>(null);
  const [servicePositions, setServicePositions] = useState<WorldServicePositionsListView | null>(null);
  const [huangceOpen, setHuangceOpen] = useState(false);

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

  async function handleLocationService(
    node: SceneRegistryEntry,
    service: PowerLocationService,
    sceneId: SceneId | null,
  ) {
    setServiceMessage(null);

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
      setActorDetail(detail);
    } catch (error) {
      setActorDetailError(toActionErrorMessage(error, '角色详情读取失败。'));
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

  const actorDetailModal = actorDetail ? (
    <div className="character-detail-modal" role="dialog" aria-modal="true" aria-label="角色详情">
      <button className="character-detail-modal__close" type="button" onClick={() => setActorDetail(null)}>
        关闭
      </button>
      <div className="character-detail-modal__panel">
        <CharacterPanel
          character={actorDetail.character}
          pendingAction={null}
          positions={toPanelPositions(actorDetail.positions)}
          readOnly
        />
      </div>
    </div>
  ) : null;

  const huangceModal = huangceOpen ? (
    <div className="huangce-modal" role="dialog" aria-modal="true" aria-label="皇宫黄册">
      <div className="huangce-modal__panel">
        <button className="huangce-modal__close" type="button" onClick={() => setHuangceOpen(false)}>
          关闭
        </button>
        <h2>皇宫黄册</h2>
        <p>各处衙门、商路与场所职务名册。点击任职者可查看角色详情。</p>
        {actorDetailError ? <div className="huangce-modal__notice">{actorDetailError}</div> : null}
        <div className="huangce-modal__grid">
          {(servicePositions?.positions ?? []).map((position) => (
            <article key={position.positionId} className="huangce-modal__entry">
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
                  title={position.title}
                  xpProgress={0.38}
                />
              </button>
              <div className="huangce-modal__entry-copy">
                <strong>{position.locationName}</strong>
                <span>{position.serviceLabel}</span>
              </div>
            </article>
          ))}
          {!servicePositions ? <div className="huangce-modal__loading">黄册同步中...</div> : null}
        </div>
      </div>
    </div>
  ) : null;

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
        services: [buildServiceEntry(activeNode, position.service)],
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
        services: actor.services.map((service) => buildServiceEntry(activeNode, service)),
      }))
      : serviceEntries.map((entry, index) => ({
        id: `${activeNode.locationId}:${entry.service}:${index}`,
        avatarUrl: art.npcImage,
        name: index === 0 ? art.npcName : `${art.npcName}${index + 1}`,
        title: entry.label,
        level: Math.max(1, character?.player.level ?? 1),
        rankText: `${POWER_FACTION_LABELS[ownerFaction]}门路`,
        xpProgress: 0.26 + (index % 4) * 0.12,
        services: [entry],
      }));

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
        serviceMessage={serviceMessage}
        onBack={() => {
          setServiceMessage(null);
          setEnteredLocationId(null);
        }}
        onService={(entry) => void handleLocationService(activeNode, entry.service, entry.sceneId)}
        onNpcClick={(npc) => {
          if (npc.actorId) {
            void handleActorDetail(npc.actorId);
          } else {
            setServiceMessage(buildNpcClickMessage(npc));
          }
        }}
      />
      {activeNode.locationId === 'imperial_palace' ? (
        <button className="city-scene__huangce-button" type="button" onClick={() => void openHuangce()}>
          查看黄册
        </button>
      ) : null}
      {actorDetailError ? <div className="city-scene__floating-error">{actorDetailError}</div> : null}
      {huangceModal}
      {actorDetailModal}
      </>
    );
  }

  return (
    <div className="scene scene--city">
      <div className="scene__banner scene__banner--left">大明京城</div>
      <div className="scene__banner scene__banner--center">
        {locations
          ? `京城名册 ${totals.actorCount}人 · 地点权柄 ${formatPowerShare(totals.powerShare)}`
          : locationsError ?? '京城地图是权力空间；右侧腰牌只是已解锁门路的快捷入口。'}
      </div>

      <div className="city-scene">
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

        {CITY_MAP_SCENE_ENTRIES.map((baseNode) => {
          const node = resolveSceneEntryForFaction(baseNode, powerFaction);
          const location = getLocation(locations, node.locationId);
          const ownerFaction = getNodeOwner(node, location);
          const status = location?.status ?? 'open';
          const isDisabled = !node.sceneId || node.lifecycle !== 'active';
          const isGateRestricted = status === 'locked';

          return (
            <button
              key={node.locationId}
              className={`${node.className} city-scene__node--status-${status}${isDisabled || isGateRestricted ? ' city-scene__node--locked' : ''}`}
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

        {(() => {
          const activeBaseNode = CITY_MAP_SCENE_ENTRIES.find((node) => node.locationId === activeLocationId) ?? CITY_MAP_SCENE_ENTRIES[0]!;
          const activeNode = resolveSceneEntryForFaction(activeBaseNode, powerFaction);
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
        })()}
      </div>
    </div>
  );
}
