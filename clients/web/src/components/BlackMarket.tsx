import { ShoppingBag, Coins, Gem, RefreshCw } from 'lucide-react';
import type { GameState, Equipment } from '../core/gameState';
import { useAction } from '../hooks/useAction';

interface BlackMarketProps {
  gameState: GameState;
  setGameState: (state: GameState) => void;
}

export function BlackMarket({ gameState, setGameState }: BlackMarketProps) {
  const { dispatchAction } = useAction(setGameState as any);
  const { copper, tokens } = gameState.resources;
  const items = gameState.blackMarket.items;

  const handleRefresh = async () => {
    if (tokens < 1) return;
    await dispatchAction('BLACK_MARKET_REFRESH');
  };

  const handleBuy = async (item: Equipment, index: number) => {
    if (!item.price || copper < item.price) return;
    await dispatchAction('BLACK_MARKET_BUY', { itemIndex: index });
  };

  const QualityColors = {
    white: 'text-gray-300 border-gray-600/50 bg-gray-500/10',
    green: 'text-green-400 border-green-500/50 bg-green-500/10',
    blue: 'text-blue-400 border-blue-500/50 bg-blue-500/10',
  };

  const SlotNames: Record<string, string> = {
    head: '头部',
    chest: '身体',
    hands: '手部',
    feet: '脚部',
    neck: '项链',
    belt: '腰带',
    ring: '戒指',
    trinket: '饰品',
    mainHand: '主手',
    offHand: '副手',
  };

  return (
    <div className="w-full h-full flex flex-col p-8 bg-darkBg relative overflow-y-auto custom-scrollbar">
      {/* Header & Resources */}
      <div className="flex items-center justify-between mb-8 pb-4 border-b border-darkBorder">
        <div className="flex items-center gap-3">
          <div className="bg-primary/20 p-2 rounded-lg border border-primary/30">
            <ShoppingBag className="w-6 h-6 text-primary" />
          </div>
          <h2 className="text-2xl font-bold tracking-widest text-textMain">黑市商人</h2>
        </div>
        
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 bg-darkSurface px-4 py-2 rounded-lg border border-darkBorder">
            <Coins className="w-5 h-5 text-yellow-500" />
            <span className="text-lg font-medium text-yellow-500">{copper}</span>
          </div>
          <div className="flex items-center gap-2 bg-darkSurface px-4 py-2 rounded-lg border border-darkBorder">
            <Gem className="w-5 h-5 text-purple-400" />
            <span className="text-lg font-medium text-purple-400">{tokens}</span>
          </div>
        </div>
      </div>

      {/* Shop Grid */}
      <div className="flex-1 min-h-0 container mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((item, idx) => (
            <div key={idx} className={`relative flex flex-col p-5 rounded-xl border transition-all duration-300 ${
              item 
                ? QualityColors[item.quality] + ' hover:shadow-lg hover:shadow-current/10 hover:-translate-y-1'
                : 'border-darkBorder/50 bg-darkSurface/30 border-dashed'
            }`}>
              {item ? (
                <>
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-bold tracking-wide">{item.name}</h3>
                      <span className="text-xs text-textMuted">{SlotNames[item.slot]} | {item.description}</span>
                    </div>
                  </div>
                  
                  <div className="flex-1 space-y-2 mb-6">
                    {item.bonusAttributes.strength && <p className="text-sm">武力 +{item.bonusAttributes.strength}</p>}
                    {item.bonusAttributes.intelligence && <p className="text-sm">智谋 +{item.bonusAttributes.intelligence}</p>}
                    {item.bonusAttributes.agility && <p className="text-sm">身法 +{item.bonusAttributes.agility}</p>}
                    {item.bonusAttributes.constitution && <p className="text-sm">体质 +{item.bonusAttributes.constitution}</p>}
                  </div>

                  <button
                    onClick={() => handleBuy(item, idx)}
                    disabled={copper < (item.price || 0)}
                    className={`w-full py-3 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors ${
                      copper >= (item.price || 0)
                        ? 'bg-primary/20 text-textMain border border-primary/50 hover:bg-primary hover:text-darkBg hover:border-transparent'
                        : 'bg-darkSurface text-textMuted border border-darkBorder cursor-not-allowed'
                    }`}
                  >
                    购买
                    <div className="flex items-center gap-1 text-yellow-500">
                      <Coins className="w-4 h-4" />
                      <span>{item.price}</span>
                    </div>
                  </button>
                </>
              ) : (
                <div className="h-48 flex items-center justify-center text-textMuted opacity-50">
                  <span className="tracking-widest">已售出</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Refresh Footer */}
      <div className="mt-8 pt-6 border-t border-darkBorder flex justify-center pb-4">
        <button
          onClick={handleRefresh}
          disabled={tokens < 1}
          className={`px-8 py-3 rounded-xl font-medium flex items-center gap-2 tracking-widest transition-all ${
            tokens >= 1
              ? 'bg-purple-600/20 text-purple-400 border border-purple-500/50 hover:bg-purple-600 hover:text-white hover:border-transparent shadow-[0_0_15px_rgba(147,51,234,0.3)] hover:shadow-[0_0_25px_rgba(147,51,234,0.6)]'
              : 'bg-darkSurface text-textMuted border border-darkBorder cursor-not-allowed'
          }`}
        >
          <RefreshCw className="w-5 h-5" />
          <span>立即刷新</span>
          <span className="opacity-60 text-sm ml-2">(-1 通宝)</span>
        </button>
      </div>
    </div>
  );
}
