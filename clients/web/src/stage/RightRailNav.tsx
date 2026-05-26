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

const menuItems: Array<{ id: string; sceneId: SceneId; label: string; subtitle: string }> = [
  { id: 'tavern', sceneId: 'tavern', label: '差房', subtitle: '领办差事' },
  { id: 'weaponshop', sceneId: 'weaponshop', label: '神机营', subtitle: '军械甲胄' },
  { id: 'magicshop', sceneId: 'magicshop', label: '内务府', subtitle: '宫中旧物' },
  { id: 'inventory', sceneId: 'inventory', label: '行囊', subtitle: '整备资装' },
  { id: 'dungeon', sceneId: 'dungeon', label: '案牍', subtitle: '办差清剿' },
  { id: 'arena', sceneId: 'arena', label: '校场', subtitle: '考绩争名' },
  { id: 'mail', sceneId: 'mail', label: '战报匣', subtitle: '回看案卷' },
];

export function RightRailNav({ activeSceneId, onSceneChange }: RightRailNavProps) {
  return (
    <nav className="right-nav">
      {menuItems.map((item) => {
        const isActive = item.sceneId === activeSceneId;
        return (
          <button
            key={item.id}
            className={`right-nav__button${isActive ? ' right-nav__button--active' : ''}`}
            type="button"
            onClick={() => onSceneChange(item.sceneId)}
          >
            <span className="right-nav__title">{item.label}</span>
            <span className="right-nav__subtitle">{item.subtitle}</span>
          </button>
        );
      })}
    </nav>
  );
}
