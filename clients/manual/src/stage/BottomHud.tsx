import { layout } from '../config/layout';
import { getNextLevelXp } from '../config/xpTable';
import { useGameState } from '../state/GameStateContext';

export function BottomHud() {
  const { character } = useGameState();

  if (!character) {
    return null;
  }

  const resources = [
    { label: '铜钱', value: character.resources.copper },
    { label: '令牌', value: character.resources.tokens },
    { label: '沙漏', value: character.resources.hourglasses },
    { label: '声望', value: character.resources.prestige },
  ];
  const nextLevelXp = getNextLevelXp(character.player.level);
  const xpProgress = Math.min(1, Math.max(0, character.player.exp / Math.max(1, nextLevelXp)));

  return (
    <footer
      className="bottom-hud"
      style={{
        left: `${layout.bottomHud.x}px`,
        top: `${layout.bottomHud.y}px`,
        width: `${layout.bottomHud.width}px`,
        height: `${layout.bottomHud.height}px`,
      }}
    >
      <div
        className="bottom-hud__resources"
        style={{
          left: `${layout.bottomResourceRow.x}px`,
          top: `${layout.bottomResourceRow.y - layout.bottomHud.y}px`,
          width: `${layout.bottomResourceRow.width}px`,
          height: `${layout.bottomResourceRow.height}px`,
        }}
      >
        {resources.map((resource) => (
          <div
            key={resource.label}
            className="resource-chip"
            style={{ width: `${layout.bottomResourceRow.chipWidth}px` }}
          >
            <div className="resource-chip__icon" />
            <div className="resource-chip__text">
              <div className="resource-chip__label">{resource.label}</div>
              <div className="resource-chip__value">{resource.value}</div>
            </div>
          </div>
        ))}
      </div>

      <section
        className="xp-panel"
        style={{
          left: `${layout.xpPanel.x}px`,
          top: `${layout.xpPanel.y - layout.bottomHud.y}px`,
          width: `${layout.xpPanel.width}px`,
          height: `${layout.xpPanel.height}px`,
        }}
      >
        <div className="xp-panel__level">{character.player.level}</div>
        <div className="xp-panel__bar">
          <div className="xp-panel__fill" style={{ width: `${xpProgress * 100}%` }} />
        </div>
        <div className="xp-panel__text">XP: {character.player.exp} / {nextLevelXp}</div>
      </section>
    </footer>
  );
}
