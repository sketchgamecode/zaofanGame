import React from 'react';
import { ShopItemCard } from './ShopItemCard';
import type { EquipmentItem } from '../../types/character';

type ShopPanelProps = {
  shopType: 'weapon' | 'magic';
  items: EquipmentItem[];
  tokens: number;
  copper: number;
  onRefresh: () => void;
  isRefreshing: boolean;
  onHoverStart: (item: EquipmentItem, element: HTMLElement) => void;
  onHoverEnd: () => void;
  onDoubleClickItem: (item: EquipmentItem) => void;
  nextAutoRefreshMs: number;
};

export const ShopPanel: React.FC<ShopPanelProps> = ({
  shopType,
  items,
  tokens,
  copper,
  onRefresh,
  isRefreshing,
  onHoverStart,
  onHoverEnd,
  onDoubleClickItem,
  nextAutoRefreshMs
}) => {
  const npcName = shopType === 'weapon' ? '【铁瞎子】' : '【半仙】';
  const npcIcon = shopType === 'weapon' ? '/assets/npcs/npc_blacksmith.png' : '/assets/npcs/avatar_girl.png';
  const chatBubble = shopType === 'weapon' 
    ? '“这刀杀过人，你要是怕鬼就别买。”' 
    : '“你印堂发黑，买这个能让你晚死两天。”';
  const shopName = shopType === 'weapon' ? 'WEAPON SHOP' : 'MAGIC SHOP';

  // Format countdown
  const seconds = Math.floor(nextAutoRefreshMs / 1000);
  const mm = Math.floor(seconds / 60).toString().padStart(2, '0');
  const ss = (seconds % 60).toString().padStart(2, '0');

  return (
    <div className="flex flex-col h-full bg-[#08152e] rounded-t-xl border-2 border-[#b8860b] overflow-hidden relative shadow-[0_0_20px_rgba(0,0,0,0.8)]">
      {/* Top section: Shop Info (Fixed Height) */}
      <div className="relative h-[80px] bg-[url('https://www.transparenttextures.com/patterns/wood-pattern.png')] bg-[#22150a] border-b-2 border-[#b8860b] shrink-0 shadow-[inset_0_-10px_20px_rgba(0,0,0,0.8)]">
        <div className="absolute inset-0 opacity-40 bg-gradient-to-t from-black to-transparent" />
        
        {/* Info & Chat */}
        <div className="relative p-3 h-full flex justify-between items-center z-20">
          <div>
            <h2 className="text-2xl font-fantasy font-black text-[#ffcc00] tracking-wider drop-shadow-[0_2px_2px_rgba(0,0,0,1)] stroke-black">{shopName}</h2>
            <p className="text-xs font-bold text-amber-100 drop-shadow-md">{npcName}</p>
          </div>
          
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-2 max-w-[50%] shadow-xl">
            <p className="text-[11px] text-white font-bold drop-shadow-md italic">"{chatBubble}"</p>
          </div>
        </div>
      </div>

      {/* Middle section: Item Grid (Left) + NPC (Right) */}
      <div className="flex-1 flex min-h-0 bg-[#041124] shadow-[inset_0_0_50px_rgba(0,0,0,0.8)] relative overflow-hidden">
        
        {/* Left Side: 2x3 Item Grid */}
        <div className="w-[60%] p-3 flex flex-col justify-center border-r-2 border-[#b8860b] z-20 bg-black/20">
           <div className="grid grid-cols-2 grid-rows-3 gap-2 w-full h-full">
            {Array.from({ length: 6 }).map((_, i) => {
              const item = items[i];
              // Responsive size shop slots to fit the 2x3 grid
              return (
                <div key={i} className="w-full h-full min-h-[80px] bg-slate-900/60 rounded-lg border-2 border-slate-700 shadow-inner flex items-center justify-center relative group">
                  <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none rounded-lg" />
                  {item ? (
                    <ShopItemCard 
                      item={item} 
                      onHoverStart={onHoverStart}
                      onHoverEnd={onHoverEnd}
                      onDoubleClick={onDoubleClickItem}
                    />
                  ) : (
                    <span className="text-[10px] text-slate-700 uppercase tracking-widest font-fantasy select-none">Sold</span>
                  )}
                </div>
              );
            })}
           </div>
        </div>

        {/* Right Side: Full Body NPC */}
        <div className="w-[40%] relative flex items-end justify-center z-10">
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent z-10 pointer-events-none" />
          <img 
            src={npcIcon} 
            alt={npcName} 
            className="w-[180%] max-w-none object-contain origin-bottom object-bottom drop-shadow-[-10px_10px_15px_rgba(0,0,0,0.8)] relative z-0 translate-x-4"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
        </div>
      </div>

      {/* Bottom section: Action Bar (Fixed Height) */}
      <div className="p-3 bg-[#0a1a3a] border-t-2 border-[#b8860b] shrink-0 h-[100px] flex flex-col justify-center relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-30 mix-blend-overlay pointer-events-none" />
        
        <div className="flex justify-between items-center mb-2 z-10">
          <div className="flex gap-2">
            <div className="flex items-center gap-1.5 text-amber-200 font-bold bg-black/40 px-2 py-1 rounded border border-amber-900/50 text-sm shadow-inner">
              <img src="/assets/ui/icon_copper.png" alt="c" className="w-4 h-4" onError={e => e.currentTarget.style.display='none'} />
              {copper}
            </div>
            <div className="flex items-center gap-1.5 text-amber-200 font-bold bg-black/40 px-2 py-1 rounded border border-amber-900/50 text-sm shadow-inner">
              <img src="/assets/ui/icon_token.png" alt="t" className="w-4 h-4" onError={e => e.currentTarget.style.display='none'} />
              {tokens}
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={onRefresh}
          disabled={isRefreshing}
          className={`
            w-full py-2.5 rounded-lg font-fantasy text-sm tracking-widest flex items-center justify-center gap-2 z-10
            transition-all duration-200 active:scale-95 border-2 shadow-[0_4px_10px_rgba(0,0,0,0.5)]
            ${isRefreshing 
              ? 'bg-slate-800 text-slate-500 border-slate-700 cursor-not-allowed' 
              : 'bg-gradient-to-b from-[#4a90e2] to-[#003366] text-white hover:from-[#5aa0f2] hover:to-[#004488] border-[#8ab4f8]'}
          `}
        >
          {isRefreshing ? (
            <div className="w-4 h-4 border-2 border-slate-500 border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              NEW GOODS
              <div className="flex items-center gap-1 text-[10px] font-bold bg-black/30 px-1.5 py-0.5 rounded shadow-inner">
                1 <img src="/assets/ui/icon_token.png" alt="t" className="w-3 h-3" onError={e => e.currentTarget.style.display='none'} />
              </div>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
