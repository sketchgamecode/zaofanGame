import { CLASS_META, getAvatarUrl, POWER_FACTION_BADGES } from '../config/characterCatalog';
import { getNextLevelXp } from '../config/xpTable';
import { PlayerResourcePanel } from '../components/ui/PlayerResourcePanel';
import { useGameState } from '../state/GameStateContext';
import type { SceneId } from '../types/game';
import { RightRailNav } from './RightRailNav';

type RightRailProps = {
  activeSceneId: SceneId;
  onSceneChange: (sceneId: SceneId) => void;
  onInventoryOpen: () => void;
};

export function RightRail({ activeSceneId, onSceneChange, onInventoryOpen }: RightRailProps) {
  const { character } = useGameState();

  if (!character) {
    return null;
  }

  const classMeta = CLASS_META[character.player.classId];
  const powerBadge = POWER_FACTION_BADGES[classMeta.powerFaction];
  const nextLevelXp = getNextLevelXp(character.player.level);
  const xpProgress = Math.min(1, Math.max(0, character.player.exp / Math.max(1, nextLevelXp)));

  return (
    <aside className="right-rail">
      <button className="right-rail__portrait-button" type="button" onClick={onInventoryOpen} title="打开角色与背包">
        <img alt={character.player.displayName || '角色'} src={getAvatarUrl(character.player.avatarId)} />
        <span>{character.player.level}</span>
      </button>

      <div className="right-rail__player-summary">
        <strong>{character.player.displayName || '无名好汉'}</strong>
        <span>{`${classMeta.name} · ${powerBadge} · ${character.combatPreview.combatRating}`}</span>
        <i style={{ width: `${xpProgress * 100}%` }} />
      </div>

      <PlayerResourcePanel resources={character.resources} />

      <RightRailNav activeSceneId={activeSceneId} onSceneChange={onSceneChange} />
    </aside>
  );
}
