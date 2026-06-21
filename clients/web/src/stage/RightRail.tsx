import { CLASS_META, getAvatarUrl, POWER_FACTION_BADGES } from '../config/characterCatalog';
import { getNextLevelXp } from '../config/xpTable';
import { PlayerResourcePanel } from '../components/ui/PlayerResourcePanel';
import { useGameState } from '../state/GameStateContext';
import type { SceneId } from '../types/game';

type RightRailProps = {
  onSceneChange: (sceneId: SceneId) => void;
  onInventoryOpen: () => void;
};

export function RightRail({ onSceneChange, onInventoryOpen }: RightRailProps) {
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
      </button>

      <div className="right-rail__player-summary">
        <div className="right-rail__player-name">
          <strong>{character.player.displayName || '无名好汉'}</strong>
          <span>{`${classMeta.name} · ${powerBadge}`}</span>
        </div>

        <div className="right-rail__xp-track" aria-label={`等级 ${character.player.level}，经验 ${character.player.exp}/${nextLevelXp}`}>
          <i style={{ width: `${xpProgress * 100}%` }} />
          <b>{`${character.player.level}级`}</b>
          <em>{`${character.player.exp}/${nextLevelXp}`}</em>
        </div>
      </div>

      <PlayerResourcePanel resources={character.resources} />

      <div className="right-rail__actions">
        <button className="right-rail__icon-button" type="button" onClick={() => onSceneChange('mail')} title="战报与邮件">
          <span aria-hidden="true">✉</span>
        </button>
      </div>
    </aside>
  );
}
