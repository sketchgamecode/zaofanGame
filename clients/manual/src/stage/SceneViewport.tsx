import { layout } from '../config/layout';
import { CityScene } from '../scenes/CityScene';
import { BlackMarketScene } from '../scenes/BlackMarketScene';
import { InventoryScene } from '../scenes/InventoryScene';
import { TavernScene } from '../scenes/TavernScene';
import { WorldScene } from '../scenes/WorldScene';
import type { SceneId } from '../types/game';

type SceneViewportProps = {
  sceneId: SceneId;
  onSceneChange: (sceneId: SceneId) => void;
  onRequestClose: () => void;
};

function renderScene(sceneId: SceneId, onSceneChange: (sceneId: SceneId) => void) {
  switch (sceneId) {
    case 'city':
      return <CityScene onSceneChange={onSceneChange} />;
    case 'blackmarket':
      return <BlackMarketScene />;
    case 'inventory':
      return <InventoryScene />;
    case 'world':
      return <WorldScene />;
    case 'tavern':
    default:
      return <TavernScene />;
  }
}

export function SceneViewport({ sceneId, onRequestClose, onSceneChange }: SceneViewportProps) {
  return (
    <section
      className="scene-viewport"
      style={{
        left: `${layout.sceneViewport.x}px`,
        top: `${layout.sceneViewport.y}px`,
        width: `${layout.sceneViewport.width}px`,
        height: `${layout.sceneViewport.height}px`,
      }}
    >
      {renderScene(sceneId, onSceneChange)}
      <button className="scene-close-button" type="button" onClick={onRequestClose}>
        ×
      </button>
    </section>
  );
}
