import React from 'react';
import { useCharacter } from '../../hooks/useCharacter';
import type { AppTab } from '../../App';
import { Swords, ScrollText, Anvil, Sparkles } from 'lucide-react';

type SideMenuProps = {
  activeTab: AppTab;
  onTabChange: (tab: AppTab) => void;
};

export const SideMenu: React.FC<SideMenuProps> = ({ activeTab, onTabChange }) => {
  const { character } = useCharacter();

  const menuItems: { id: AppTab; label: string; icon: React.ReactNode }[] = [
    { id: 'tavern', label: 'Tavern', icon: <Swords size={18} /> },
    { id: 'character', label: 'Character', icon: <ScrollText size={18} /> },
    { id: 'weapon_shop', label: 'Weapon Shop', icon: <Anvil size={18} /> },
    { id: 'magic_shop', label: 'Magic Shop', icon: <Sparkles size={18} /> },
  ];

  return (
    <div className="w-[200px] shrink-0 h-full bg-[#0d0f12] border-r-2 border-[#b8860b] flex flex-col relative z-20 shadow-[10px_0_30px_rgba(0,0,0,0.5)]">
      {/* Background Texture Overlay */}
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/dark-wood.png')] bg-[#110a05] opacity-100 pointer-events-none z-0" />

      {/* Mini Profile Section */}
      <div className="p-4 border-b-2 border-[#b8860b] bg-[#1a0f08]/80 relative z-10 shadow-[0_5px_15px_rgba(0,0,0,0.5)]">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-12 h-12 rounded bg-sky-950 border-2 border-amber-600 overflow-hidden shrink-0 flex items-center justify-center shadow-inner">
            <img src="/assets/npcs/avatar_girl.png" alt="Avatar" className="w-full h-full object-cover" onError={e=>e.currentTarget.style.display='none'}/>
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-[#ffcc00] font-fantasy font-black text-lg truncate drop-shadow-[0_2px_2px_rgba(0,0,0,1)] stroke-black">
              {character?.player.displayName || 'Hero'}
            </h2>
            <p className="text-amber-200 font-bold text-xs drop-shadow-md">Level {character?.player.level || 1}</p>
          </div>
        </div>
        
        {/* Resources */}
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between bg-black/60 rounded px-2 py-1 border border-[#b8860b]/50 shadow-inner">
            <span className="text-[10px] text-amber-500 font-fantasy tracking-wider">COPPER</span>
            <div className="flex items-center gap-1 text-xs text-amber-400 font-mono font-bold">
              {character?.resources.copper.toLocaleString() || 0}
              <img src="/assets/ui/icon_copper.png" className="w-3 h-3" alt="c" onError={e=>e.currentTarget.style.display='none'}/>
            </div>
          </div>
          <div className="flex items-center justify-between bg-black/60 rounded px-2 py-1 border border-[#b8860b]/50 shadow-inner">
            <span className="text-[10px] text-amber-500 font-fantasy tracking-wider">TOKENS</span>
            <div className="flex items-center gap-1 text-xs text-red-400 font-mono font-bold">
              {character?.resources.tokens.toLocaleString() || 0}
              <img src="/assets/ui/icon_token.png" className="w-3 h-3" alt="t" onError={e=>e.currentTarget.style.display='none'}/>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Buttons */}
      <nav className="flex-1 p-2 flex flex-col gap-2 overflow-y-auto custom-scrollbar relative z-10 mt-2">
        {menuItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`
                group relative w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-fantasy tracking-widest transition-all duration-200 border-2
                ${isActive 
                  ? 'bg-gradient-to-r from-[#003366] to-[#004488] text-white border-[#8ab4f8] shadow-[0_4px_10px_rgba(0,0,0,0.5),inset_0_0_15px_rgba(255,255,255,0.2)]' 
                  : 'bg-gradient-to-r from-[#1a0f08] to-[#2a1a10] text-[#ffcc00] border-[#b8860b] hover:from-[#2a1a10] hover:to-[#3a2518] hover:text-white shadow-[0_2px_5px_rgba(0,0,0,0.5)]'
                }
              `}
            >
              <div className={`transition-colors drop-shadow-md ${isActive ? 'text-amber-300' : 'text-amber-500 group-hover:text-amber-300'}`}>
                {item.icon}
              </div>
              <span className="drop-shadow-[0_2px_2px_rgba(0,0,0,1)]">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Settings / Footer Area */}
      <div className="p-3 border-t-2 border-[#b8860b] bg-[#1a0f08]/80 relative z-10 flex justify-between items-center text-amber-600 shadow-[0_-5px_15px_rgba(0,0,0,0.5)]">
        <button className="p-2 hover:text-stone-300 transition-colors rounded hover:bg-stone-800">
          ⚙️
        </button>
        <div className="text-[10px] tracking-widest font-mono opacity-50 uppercase">
          Rebellion
        </div>
      </div>
    </div>
  );
};
