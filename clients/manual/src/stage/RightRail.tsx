import { layout } from '../config/layout';
import { CLASS_META, getAvatarUrl } from '../config/characterCatalog';
import { getNextLevelXp } from '../config/xpTable';
import { useGameState } from '../state/GameStateContext';
import type { SceneId } from '../types/game';

type RightRailProps = {
  activeSceneId: SceneId;
  onSceneChange: (sceneId: SceneId) => void;
  onInventoryOpen: () => void;
};

const menuItems: Array<{ id: string; sceneId?: SceneId; label: string; subtitle: string }> = [
  { id: 'city', sceneId: 'city', label: '州城', subtitle: '主场景' },
  { id: 'tavern', sceneId: 'tavern', label: '客栈', subtitle: '接任务' },
  { id: 'blackmarket', sceneId: 'blackmarket', label: '黑市', subtitle: '兵器奇珍' },
  { id: 'inventory', sceneId: 'inventory', label: '行囊', subtitle: '属性装备' },
  { id: 'world', sceneId: 'world', label: '江湖', subtitle: '地图外出' },
  { id: 'arena', label: '校场', subtitle: '后续系统' },
  { id: 'home', label: '住处', subtitle: '后续系统' },
];

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
      <section
        className="portrait-card"
        style={{
          left: `${layout.portraitCard.x - layout.rightRail.x}px`,
          top: `${layout.portraitCard.y - layout.rightRail.y}px`,
          width: `${layout.portraitCard.width}px`,
          height: `${layout.portraitCard.height}px`,
        }}
      >
        <button className="portrait-summary" type="button" onClick={onInventoryOpen}>
          <div className="portrait-summary__avatar-frame">
            <img alt={character.player.displayName || '角色头像'} className="portrait-summary__avatar" src={getAvatarUrl(character.player.avatarId)} />
          </div>
          <div className="portrait-summary__content">
            <div className="portrait-summary__name">{character.player.displayName || '无名好汉'}</div>
            <div className="portrait-summary__class">{classMeta.name}</div>
            <div className="portrait-summary__level-row">
              <span>Lv.{character.player.level}</span>
              <span>{character.player.exp} / {nextLevelXp}</span>
            </div>
            <div className="portrait-summary__xp-bar">
              <div className="portrait-summary__xp-fill" style={{ width: `${xpProgress * 100}%` }} />
            </div>
          </div>
        </button>
      </section>

      <nav
        className="right-nav"
        style={{
          left: `${layout.rightNav.x - layout.rightRail.x}px`,
          top: `${layout.rightNav.y - layout.rightRail.y}px`,
          width: `${layout.rightNav.width}px`,
        }}
      >
        {menuItems.map((item, index) => {
          const buttonRect = layout.rightNavButtons[index];
          if (!buttonRect) {
            return null;
          }

          const isActive = item.sceneId === activeSceneId;
          return (
            <button
              key={item.id}
              className={`right-nav__button${isActive ? ' right-nav__button--active' : ''}${item.sceneId ? '' : ' right-nav__button--disabled'}`}
              style={{
                left: `${buttonRect.x - layout.rightNav.x}px`,
                top: `${buttonRect.y - layout.rightNav.y}px`,
                width: `${buttonRect.width}px`,
                height: `${buttonRect.height}px`,
              }}
              type="button"
              onClick={() => {
                if (item.sceneId) {
                  onSceneChange(item.sceneId);
                }
              }}
            >
              <span className="right-nav__title">{item.label}</span>
              <span className="right-nav__subtitle">{item.subtitle}</span>
            </button>
          );
        })}
      </nav>

      <button className="seal-button" type="button" onClick={onInventoryOpen}>
        人物
      </button>
    </aside>
  );
}
