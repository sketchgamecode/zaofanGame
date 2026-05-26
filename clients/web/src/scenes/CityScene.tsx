import { useEffect, useState } from 'react';
import { postGameAction } from '../api/gameApi';
import { POWER_FACTION_LABELS } from '../config/characterCatalog';
import { toActionErrorMessage } from '../lib/manualErrors';
import { useGameState } from '../state/GameStateContext';
import type { PowerFactionId, SceneId, WorldActorsOverview, WorldLocationOverview } from '../types/game';

type CitySceneProps = {
  onSceneChange: (sceneId: SceneId) => void;
};

type CityPowerNode = {
  sceneId?: SceneId;
  locationId: string;
  fallbackOwner: PowerFactionId;
  label: string;
  flavor: string;
  detail: string;
  className: string;
};

const CITY_NODES: CityPowerNode[] = [
  { locationId: 'imperial_palace', fallbackOwner: 'imperial', label: '紫禁城', flavor: '皇权中枢', detail: '诏令、内廷、宗室和厂卫都绕不开这里。当前只是权力地图节点，后续承接皇权主线。', className: 'city-scene__node city-scene__node--palace' },
  { sceneId: 'tavern', locationId: 'northern_bureau', fallbackOwner: 'imperial', label: '北镇抚司', flavor: '领密差', detail: '差房任务的权力包装入口，发布密旨、清查、缉拿等差事。', className: 'city-scene__node city-scene__node--tavern' },
  { sceneId: 'weaponshop', locationId: 'divine_engine_camp', fallbackOwner: 'noble', label: '神机营', flavor: '买军械', detail: '军械采买和火器装备入口，后续可承接神机营军功线。', className: 'city-scene__node city-scene__node--market' },
  { sceneId: 'dungeon', locationId: 'censorate', fallbackOwner: 'censorate', label: '都察院', flavor: '办案卷', detail: '案牍房入口，蓝玉案等权力案件会从这里接办。', className: 'city-scene__node city-scene__node--dungeon' },
  { sceneId: 'arena', locationId: 'noble_mansion', fallbackOwner: 'noble', label: '国公府', flavor: '争考绩', detail: '校场与考绩入口，后续可承接勋贵门第、军功旧部的对抗。', className: 'city-scene__node city-scene__node--arena' },
  { locationId: 'border_command', fallbackOwner: 'border', label: '九边都司', flavor: '边镇军权', detail: '边镇总兵、家丁私兵和军粮账册聚集之地。当前为地图节点，后续承接边镇任务。', className: 'city-scene__node city-scene__node--border' },
  { sceneId: 'magicshop', locationId: 'salt_merchant_guild', fallbackOwner: 'silver', label: '盐商会馆', flavor: '通银路', detail: '内务府/特殊商店入口，包装为盐引、织造、宫中旧物的灰色流通。', className: 'city-scene__node city-scene__node--magicshop' },
  { locationId: 'weaving_bureau', fallbackOwner: 'silver', label: '织造局', flavor: '内库采买', detail: '内库采买、织造贡品和商税关系的节点。当前为地图节点，后续承接商税线。', className: 'city-scene__node city-scene__node--weaving' },
  { sceneId: 'mail', locationId: 'refugee_camp', fallbackOwner: 'underworld', label: '流民营', flavor: '阅回报', detail: '战报与回放入口，包装为民间消息、暗线回报和流民传闻。', className: 'city-scene__node city-scene__node--mail' },
  { sceneId: 'inventory', locationId: 'player_inventory', fallbackOwner: 'underworld', label: '随身行囊', flavor: '整资装', detail: '行囊与装备整理入口，表示玩家自身携带的资装和暗格。', className: 'city-scene__node city-scene__node--inventory' },
];

function formatPowerShare(value = 0) {
  return `${(value / 100).toFixed(2)}%`;
}

function getLocationOverview(overview: WorldActorsOverview | null, locationId: string): WorldLocationOverview | null {
  return overview?.byLocation.find((location) => location.locationId === locationId) ?? null;
}

function getFactionRows(overview: WorldActorsOverview | null) {
  return [...(overview?.byFaction ?? [])]
    .sort((left, right) => right.powerShare - left.powerShare);
}

export function CityScene({ onSceneChange }: CitySceneProps) {
  const { runServerAction } = useGameState();
  const [worldOverview, setWorldOverview] = useState<WorldActorsOverview | null>(null);
  const [worldOverviewError, setWorldOverviewError] = useState<string | null>(null);
  const [activeLocationId, setActiveLocationId] = useState(CITY_NODES[0]?.locationId ?? 'imperial_palace');

  useEffect(() => {
    let cancelled = false;

    async function loadWorldOverview() {
      try {
        const overview = await runServerAction(
          'WORLD_ACTORS_GET_OVERVIEW',
          () => postGameAction<WorldActorsOverview>('WORLD_ACTORS_GET_OVERVIEW'),
        );
        if (!cancelled) {
          setWorldOverview(overview);
          setWorldOverviewError(null);
        }
      } catch (error) {
        if (!cancelled) {
          setWorldOverviewError(toActionErrorMessage(error, '大明权力地图读取失败。'));
        }
      }
    }

    void loadWorldOverview();

    return () => {
      cancelled = true;
    };
  }, [runServerAction]);

  return (
    <div className="scene scene--city">
      <div className="scene__banner scene__banner--left">大明府城</div>
      <div className="scene__banner scene__banner--center">
        {worldOverview
          ? `权力名册 ${worldOverview.totalActors}人 · 世界权柄 ${formatPowerShare(worldOverview.totalPowerShare)}`
          : worldOverviewError ?? '各衙门口可领差、置装、考绩，也可从右侧腰牌直达。'}
      </div>

      <div className="city-scene">
        <section className="city-scene__faction-board">
          <div className="city-scene__faction-board-title">权柄分布</div>
          <div className="city-scene__faction-grid">
            {getFactionRows(worldOverview).map((entry) => (
              <div key={entry.faction} className="city-scene__faction-row">
                <span>{POWER_FACTION_LABELS[entry.faction]}</span>
                <strong>{formatPowerShare(entry.powerShare)}</strong>
                <em>{entry.actorCount}人</em>
              </div>
            ))}
            {!worldOverview ? (
              <div className="city-scene__faction-row city-scene__faction-row--loading">
                <span>名册同步中</span>
                <strong>--</strong>
                <em>--</em>
              </div>
            ) : null}
          </div>
        </section>

        {CITY_NODES.map((node) => {
          const location = getLocationOverview(worldOverview, node.locationId);
          const ownerFaction = location?.ownerFaction ?? node.fallbackOwner;

          return (
            <button
              key={node.locationId}
              className={`${node.className}${node.sceneId ? '' : ' city-scene__node--locked'}`}
              type="button"
              aria-disabled={!node.sceneId}
              onFocus={() => setActiveLocationId(node.locationId)}
              onMouseEnter={() => setActiveLocationId(node.locationId)}
              onClick={() => {
                if (node.sceneId) {
                  onSceneChange(node.sceneId);
                }
              }}
            >
              <span className="city-scene__node-faction">{POWER_FACTION_LABELS[ownerFaction]}</span>
              <span className="city-scene__node-title">{node.label}</span>
              <span className="city-scene__node-flavor">{node.flavor}</span>
              <span className="city-scene__node-power">
                {location ? `${location.actorCount}人 · 权柄${formatPowerShare(location.powerShare)}` : '名册同步中'}
              </span>
            </button>
          );
        })}
        {(() => {
          const activeNode = CITY_NODES.find((node) => node.locationId === activeLocationId) ?? CITY_NODES[0]!;
          const location = getLocationOverview(worldOverview, activeNode.locationId);
          const ownerFaction = location?.ownerFaction ?? activeNode.fallbackOwner;

          return (
            <aside className="city-scene__detail">
              <span className="city-scene__detail-faction">{POWER_FACTION_LABELS[ownerFaction]}</span>
              <h2>{activeNode.label}</h2>
              <p>{activeNode.detail}</p>
              <div className="city-scene__detail-stats">
                <div>
                  <span>聚集角色</span>
                  <strong>{location ? `${location.actorCount}人` : '同步中'}</strong>
                </div>
                <div>
                  <span>地点权柄</span>
                  <strong>{location ? formatPowerShare(location.powerShare) : '同步中'}</strong>
                </div>
                <div>
                  <span>当前功能</span>
                  <strong>{activeNode.sceneId ? '可进入' : '未开放'}</strong>
                </div>
              </div>
            </aside>
          );
        })()}
      </div>
    </div>
  );
}
