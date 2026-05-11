import type { SceneId } from '../types/game';

type CitySceneProps = {
  onSceneChange: (sceneId: SceneId) => void;
};

const CITY_NODES: Array<{ sceneId: SceneId; label: string; flavor: string; className: string }> = [
  { sceneId: 'tavern', label: '客栈', flavor: '接差事', className: 'city-scene__node city-scene__node--tavern' },
  { sceneId: 'blackmarket', label: '黑市', flavor: '淘兵刃', className: 'city-scene__node city-scene__node--market' },
  { sceneId: 'inventory', label: '行囊', flavor: '整装备', className: 'city-scene__node city-scene__node--inventory' },
  { sceneId: 'world', label: '江湖', flavor: '走动线', className: 'city-scene__node city-scene__node--world' },
];

export function CityScene({ onSceneChange }: CitySceneProps) {
  return (
    <div className="scene scene--city">
      <div className="scene__banner scene__banner--left">州城街巷</div>
      <div className="scene__banner scene__banner--center">右侧常驻导航可切系统，地标也可直接进入。</div>

      <div className="city-scene">
        {CITY_NODES.map((node) => (
          <button
            key={node.sceneId}
            className={node.className}
            type="button"
            onClick={() => onSceneChange(node.sceneId)}
          >
            <span className="city-scene__node-title">{node.label}</span>
            <span className="city-scene__node-flavor">{node.flavor}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
