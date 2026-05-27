import { RIGHT_RAIL_SCENE_ENTRIES, resolveSceneEntryForFaction } from '../config/sceneRegistry';
import { getClassPowerFaction } from '../config/characterCatalog';
import { useGameState } from '../state/GameStateContext';
import type { SceneId } from '../types/game';

/**
 * Modular UI component.
 * Navigation button internals are controlled by `.right-nav*` CSS only.
 * RightRail decides placement; scenes should not override button descendants.
 */
type RightRailNavProps = {
  activeSceneId: SceneId;
  onSceneChange: (sceneId: SceneId) => void;
};

export function RightRailNav({ activeSceneId, onSceneChange }: RightRailNavProps) {
  const { character } = useGameState();
  const powerFaction = getClassPowerFaction(character?.player.classId);

  return (
    <nav className="right-nav">
      {RIGHT_RAIL_SCENE_ENTRIES.map((baseItem) => {
        const item = resolveSceneEntryForFaction(baseItem, powerFaction);
        const sceneId = item.sceneId!;
        const isActive = sceneId === activeSceneId;
        return (
          <button
            key={item.locationId}
            className={`right-nav__button${isActive ? ' right-nav__button--active' : ''}`}
            type="button"
            title={`${item.fallbackName}：${item.fallbackDetail}`}
            onClick={() => onSceneChange(sceneId)}
          >
            <span className="right-nav__title">{item.channelName}</span>
            <span className="right-nav__subtitle">{item.channelSummary}</span>
          </button>
        );
      })}
    </nav>
  );
}
