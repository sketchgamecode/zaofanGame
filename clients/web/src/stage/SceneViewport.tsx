/**
 * SceneViewport.tsx
 *
 * 场景容器。不再传递 onItemTooltipChange，tooltip 由全局 store 驱动。
 */

import { layout } from '../config/layout';
import { ArenaScene } from '../scenes/ArenaScene';
import { BlackMarketScene, MagicShopScene, WeaponShopScene } from '../scenes/BlackMarketScene';
import { CityScene } from '../scenes/CityScene';
import { DungeonScene } from '../scenes/DungeonScene';
import { InventoryScene } from '../scenes/InventoryScene';
import { MailScene } from '../scenes/MailScene';
import { TavernScene } from '../scenes/TavernScene';
import type { SceneId } from '../types/game';

type SceneViewportProps = {
  sceneId: SceneId;
  onSceneChange: (sceneId: SceneId) => void;
  onRequestClose: () => void;
};

function renderScene(sceneId: SceneId, onSceneChange: (sceneId: SceneId) => void) {
  switch (sceneId) {
    case 'city':        return <CityScene onSceneChange={onSceneChange} />;
    case 'weaponshop':  return <WeaponShopScene />;
    case 'magicshop':   return <MagicShopScene />;
    case 'blackmarket': return <BlackMarketScene />;
    case 'inventory':   return <InventoryScene />;
    case 'dungeon':     return <DungeonScene />;
    case 'arena':       return <ArenaScene />;
    case 'mail':        return <MailScene />;
    case 'tavern':
    default:            return <TavernScene />;
  }
}

export function SceneViewport({ sceneId, onRequestClose, onSceneChange }: SceneViewportProps) {
  return (
    <section
      className="scene-viewport"
      style={{
        left:   `${layout.sceneViewport.x}px`,
        top:    `${layout.sceneViewport.y}px`,
        width:  `${layout.sceneViewport.width}px`,
        height: `${layout.sceneViewport.height}px`,
      }}
    >
      {renderScene(sceneId, onSceneChange)}
      <button className="scene-close-button" type="button" onClick={onRequestClose}>×</button>
    </section>
  );
}
