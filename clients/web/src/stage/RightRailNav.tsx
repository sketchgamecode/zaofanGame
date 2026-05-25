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
  { id: 'tavern', sceneId: 'tavern', label: '客栈', subtitle: '接任务' },
  { id: 'weaponshop', sceneId: 'weaponshop', label: '兵器铺', subtitle: '刀枪甲胄' },
  { id: 'magicshop', sceneId: 'magicshop', label: '奇珍阁', subtitle: '符器饰物' },
  { id: 'inventory', sceneId: 'inventory', label: '行囊', subtitle: '属性装备' },
  { id: 'dungeon', sceneId: 'dungeon', label: '江湖', subtitle: '地界历练' },
  { id: 'arena', sceneId: 'arena', label: '校场', subtitle: '挑战排名' },
  { id: 'mail', sceneId: 'mail', label: '邮件', subtitle: '战报回看' },
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
