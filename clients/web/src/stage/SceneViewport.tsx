import { layout } from '../config/layout';
import { ArenaScene } from '../scenes/ArenaScene';
import { BlackMarketScene } from '../scenes/BlackMarketScene';
import { CityScene } from '../scenes/CityScene';
import { DungeonScene } from '../scenes/DungeonScene';
import { InventoryScene } from '../scenes/InventoryScene';
import { MailScene } from '../scenes/MailScene';
import { TavernScene } from '../scenes/TavernScene';
import type { ItemTooltipState } from '../components/ui/ItemTooltip';
import type { SceneId } from '../types/game';

type SceneViewportProps = {
  sceneId: SceneId;
  onSceneChange: (sceneId: SceneId) => void;
  onRequestClose: () => void;
  onItemTooltipChange: (nextValue: ItemTooltipState | null) => void;
};

function renderScene(
  sceneId: SceneId,
  onSceneChange: (sceneId: SceneId) => void,
  onItemTooltipChange: (nextValue: ItemTooltipState | null) => void,
) {
  switch (sceneId) {
    case 'city':
      return <CityScene onSceneChange={onSceneChange} />;
    case 'blackmarket':
      return <BlackMarketScene />;
    case 'inventory':
      return <InventoryScene onItemTooltipChange={onItemTooltipChange} />;
    case 'dungeon':
      return <DungeonScene />;
    case 'arena':
      return <ArenaScene />;
    case 'mail':
      return <MailScene />;
    case 'tavern':
    default:
      return <TavernScene />;
  }
}

export function SceneViewport({
  sceneId,
  onItemTooltipChange,
  onRequestClose,
  onSceneChange,
}: SceneViewportProps) {
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
      {renderScene(sceneId, onSceneChange, onItemTooltipChange)}
      <button className="scene-close-button" type="button" onClick={onRequestClose}>
        ×
      </button>
    </section>
  );
}
