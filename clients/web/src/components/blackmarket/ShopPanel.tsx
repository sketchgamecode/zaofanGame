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
  const npcIcon = shopType === 'weapon' ? '/assets/npcs/npc_blacksmith.png' : '/assets/npcs/npc_wizard.png';
  const chatBubble = shopType === 'weapon' 
    ? '“这刀杀过人，你要是怕鬼就别买。”' 
    : '“你印堂发黑，买这个能让你晚死两天。”';
  const shopName = shopType === 'weapon' ? '兵器铺' : '奇珍阁';

  // Format countdown
  const seconds = Math.floor(nextAutoRefreshMs / 1000);
  const mm = Math.floor(seconds / 60).toString().padStart(2, '0');
  const ss = (seconds % 60).toString().padStart(2, '0');

  return (
    <div className="flex flex-col h-full bg-stone-900/60 rounded-3xl border border-stone-800 overflow-hidden relative">
      {/* Top section: NPC & Shop Info */}
      <div className="relative h-48 bg-stone-950 border-b border-stone-800 shrink-0">
        <div className="absolute inset-0 opacity-40 bg-gradient-to-t from-stone-900 to-transparent" />
        
        {/* NPC Graphic */}
        <div className="absolute right-0 bottom-0 w-48 h-48 flex items-end justify-end overflow-hidden">
          <img 
            src={npcIcon} 
            alt={npcName} 
            className="h-[120%] object-contain origin-bottom object-right-bottom mix-blend-screen opacity-90"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
              if (e.currentTarget.parentElement) {
                e.currentTarget.parentElement.innerHTML = `<div class="p-4 text-xs text-stone-500 font-mono">${npcIcon.split('/').pop()}</div>`;
              }
            }}
          />
        </div>

        {/* Info & Chat */}
        <div className="relative p-4 h-full flex flex-col justify-between pointer-events-none z-10">
          <div>
            <h2 className="text-xl font-black text-stone-100 tracking-wider drop-shadow-md">{shopName}</h2>
            <p className="text-sm font-bold text-stone-400">{npcName}</p>
          </div>
          
          <div className="bg-stone-900/80 backdrop-blur-md border border-stone-700 rounded-2xl rounded-br-none p-3 max-w-[75%] shadow-xl">
            <p className="text-xs text-stone-300 italic">"{chatBubble}"</p>
          </div>
        </div>
      </div>

      {/* Middle section: Item Grid */}
      <div className="flex-1 p-4 grid grid-cols-3 grid-rows-2 gap-3 min-h-0 place-content-center">
        {Array.from({ length: 6 }).map((_, i) => {
          const item = items[i];
          return (
            <div key={i} className="aspect-square bg-black/40 rounded-xl border border-stone-800/60 shadow-inner flex items-center justify-center">
              {item ? (
                <ShopItemCard 
                  item={item} 
                  onHoverStart={onHoverStart}
                  onHoverEnd={onHoverEnd}
                  onDoubleClick={onDoubleClickItem}
                />
              ) : (
                <span className="text-xs text-stone-700 uppercase tracking-widest font-mono select-none">Sold</span>
              )}
            </div>
          );
        })}
      </div>

      {/* Bottom section: Action Bar */}
      <div className="p-4 bg-black/40 border-t border-stone-800/80 backdrop-blur shrink-0">
        <div className="flex justify-between items-center mb-3">
          <div className="flex gap-4">
            <div className="flex items-center gap-1.5 text-stone-300 font-bold bg-stone-900/80 px-2 py-1 rounded-lg border border-stone-800">
              <img src="/assets/ui/icon_copper.png" alt="c" className="w-5 h-5" onError={e => e.currentTarget.style.display='none'} />
              {copper}
            </div>
            <div className="flex items-center gap-1.5 text-stone-300 font-bold bg-stone-900/80 px-2 py-1 rounded-lg border border-stone-800">
              <img src="/assets/ui/icon_token.png" alt="t" className="w-5 h-5" onError={e => e.currentTarget.style.display='none'} />
              {tokens}
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={onRefresh}
          disabled={isRefreshing}
          className={`
            w-full py-3 rounded-xl font-black text-sm tracking-widest flex items-center justify-center gap-2
            transition-all duration-200 active:scale-95
            ${isRefreshing 
              ? 'bg-stone-800 text-stone-500 cursor-not-allowed' 
              : 'bg-indigo-900/60 text-indigo-100 hover:bg-indigo-800 border border-indigo-700/50 shadow-lg shadow-indigo-900/20'}
          `}
        >
          {isRefreshing ? (
            <div className="w-5 h-5 border-2 border-stone-500 border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              刷新商品
              <div className="flex items-center gap-1 text-xs font-bold bg-black/30 px-1.5 py-0.5 rounded">
                -1 <img src="/assets/ui/icon_token.png" alt="t" className="w-3 h-3" onError={e => e.currentTarget.style.display='none'} />
              </div>
            </>
          )}
        </button>
        <div className="text-center mt-2 text-[10px] text-stone-500">
          {nextAutoRefreshMs > 0 ? `下次自动刷新: ${mm}:${ss}` : '可以免费刷新'}
        </div>
      </div>
    </div>
  );
};
