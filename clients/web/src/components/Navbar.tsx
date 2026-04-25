import { User, Map, Swords, Castle, Users, ShoppingBag, Sparkles } from 'lucide-react';

const navItems = [
  { id: 'character', label: '人物', icon: <User size={20} /> },
  { id: 'hideout', label: '密谋据点', icon: <Map size={20} /> },
  { id: 'arena', label: '演武场', icon: <Swords size={20} /> },
  { id: 'siege', label: '攻打州府', icon: <Castle size={20} /> },
  { id: 'guild', label: '聚义厅', icon: <Users size={20} /> },
  { id: 'market', label: '黑市', icon: <ShoppingBag size={20} /> },
];

interface NavbarProps {
  active: string;
  setActive: (id: string) => void;
  onCheat: () => void;
  onWipeSave: () => void;
  onLogout?: () => void;
}

export function Navbar({ active, setActive, onCheat, onWipeSave, onLogout }: NavbarProps) {
  return (
    <nav className="w-64 h-full bg-darkSurface border-r border-darkBorder flex flex-col pt-8 relative">
      <div className="px-6 mb-10">
        <h1 className="text-2xl font-bold text-primary tracking-widest bg-clip-text">大宋造反模拟器</h1>
        <p className="text-xs text-textMuted mt-1">v0.1 起事潜伏之时</p>
      </div>

      <ul className="flex flex-col gap-2 px-4 flex-1">
        {navItems.map((item) => (
          <li key={item.id}>
            <button
              onClick={() => setActive(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-md transition-colors duration-200 ${
                active === item.id 
                  ? 'bg-primary/20 text-primary border border-primary/30' 
                  : 'text-textMuted hover:bg-white/5 hover:text-textMain'
              }`}
            >
              <span className={active === item.id ? 'text-primary' : 'text-textMuted'}>{item.icon}</span>
              <span className="font-medium">{item.label}</span>
            </button>
          </li>
        ))}
      </ul>

      {/* Developer Cheat Button */}
      <div className="p-4 border-t border-darkBorder/50 mt-auto flex flex-col gap-2">
        <button 
          onClick={onCheat}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded text-xs text-amber-500/50 hover:text-amber-500 hover:bg-amber-500/10 transition-colors border border-transparent hover:border-amber-500/30"
        >
          <Sparkles size={14} />
          天降横财(测试)
        </button>
        <button 
          onClick={onWipeSave}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded text-xs text-red-500/50 hover:text-red-500 hover:bg-red-500/10 transition-colors border border-transparent hover:border-red-500/30"
        >
          销毁存档，重新来过
        </button>
        {onLogout && (
          <button
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded text-xs text-gray-500/50 hover:text-gray-300 hover:bg-white/5 transition-colors"
          >
            退出登录
          </button>
        )}
      </div>
    </nav>
  );
}
