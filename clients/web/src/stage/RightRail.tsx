import { layout } from '../config/layout';
import { CLASS_META, getAvatarUrl } from '../config/characterCatalog';
import { getNextLevelXp } from '../config/xpTable';
import { CharacterPortraitCard } from '../components/character/CharacterPortraitCard';
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
  const nextLevelXp = getNextLevelXp(character.player.level);
  const xpProgress = Math.min(1, Math.max(0, character.player.exp / Math.max(1, nextLevelXp)));

  return (
    <aside
      className="right-rail"
      style={{
        left: `${layout.rightRail.x}px`,
        top: `${layout.rightRail.y}px`,
        width: `${layout.rightRail.width}px`,
        height: `${layout.rightRail.height}px`,
      }}
    >
      <button className="right-rail__portrait-button" type="button" onClick={onInventoryOpen}>
        <CharacterPortraitCard
          avatarUrl={getAvatarUrl(character.player.avatarId)}
          level={character.player.level}
          name={character.player.displayName || '无名好汉'}
          rankText={`江湖排名 ${character.combatPreview.combatRating}`}
          title={classMeta.name}
          xpProgress={xpProgress}
        />
      </button>

      <PlayerResourcePanel resources={character.resources} />

      <RightRailNav activeSceneId={activeSceneId} onSceneChange={onSceneChange} />

      <button className="seal-button" type="button" onClick={onInventoryOpen}>
        人物
      </button>
    </aside>
  );
}
