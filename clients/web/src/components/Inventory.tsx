import { type EquipmentSlot, type GameState, type Equipment } from '../core/gameState';
import { useAction } from '../hooks/useAction';

const SLOTS: { id: EquipmentSlot; label: string }[] = [
  { id: 'head', label: '头部' },
  { id: 'chest', label: '身体' },
  { id: 'hands', label: '手部' },
  { id: 'feet', label: '脚部' },
  { id: 'neck', label: '项链' },
  { id: 'belt', label: '腰带' },
  { id: 'ring', label: '戒指' },
  { id: 'trinket', label: '饰品' },
  { id: 'mainHand', label: '主手' },
  { id: 'offHand', label: '副手' },
];

interface InventoryProps {
  gameState: GameState;
  setGameState: React.Dispatch<React.SetStateAction<GameState>>;
}

export function Inventory({ gameState, setGameState }: InventoryProps) {
  const { dispatchAction } = useAction(setGameState as any);

  const handleEquip = async (itemToEquip: Equipment, itemIndex: number) => {
    // 职业对副手的限制逻辑可以在前端保留一份以快速反馈
    if (itemToEquip.slot === 'offHand') {
      if (gameState.classId === 'CLASS_A' && itemToEquip.subType !== 'shield') {
        alert('猛将的副手只能装备盾牌！');
        return;
      }
      if (gameState.classId === 'CLASS_D' && itemToEquip.subType !== 'weapon') {
        alert('刺客的副手只能装备武器短剑！');
        return;
      }
      if ((gameState.classId === 'CLASS_B' || gameState.classId === 'CLASS_C') && itemToEquip.subType !== 'none') {
        alert('游侠与谋士使用双手武器，无法装备副手盾牌或武器！');
        return;
      }
    }

    await dispatchAction('EQUIP_ITEM', { slot: itemToEquip.slot, itemIndex });
  };

  const handleUnequip = async (slot: EquipmentSlot) => {
    await dispatchAction('UNEQUIP_ITEM', { slot });
  };

  return (
    <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* 装备栏 */}
      <div className="bg-black/20 rounded-lg p-5 border border-darkBorder">
        <h3 className="text-lg font-semibold mb-4 text-textMain border-b border-darkBorder pb-2">已装备</h3>
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {SLOTS.map((slot) => {
            const equipped = gameState.equipped[slot.id];
            
            if (equipped) {
              return (
                <div key={slot.id} onClick={() => handleUnequip(slot.id)} className={`flex flex-col p-3 bg-darkSurface border rounded-md cursor-pointer transition-all shadow-sm group ${equipped.quality === 'blue' ? 'border-blue-500/50 hover:bg-blue-500/10' : equipped.quality === 'green' ? 'border-emerald-500/50 hover:bg-emerald-500/10' : 'border-darkBorder hover:bg-white/5'}`}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-bold text-textMain truncate pr-1" title={equipped.name}>{equipped.name}</span>
                    <span className="text-[10px] text-textMuted bg-darkBg px-1.5 py-0.5 rounded whitespace-nowrap shrink-0">{slot.label}</span>
                  </div>
                  <div className="text-[10px] text-textMuted space-y-0.5 leading-tight">
                    {equipped.weaponDamage && <div className="text-red-400">伤害 {equipped.weaponDamage.min}-{equipped.weaponDamage.max}</div>}
                    {equipped.armor && <div className="text-blue-300">护甲 {equipped.armor}</div>}
                    {equipped.bonusAttributes.strength && <div>武力 +{equipped.bonusAttributes.strength}</div>}
                    {equipped.bonusAttributes.intelligence && <div>智谋 +{equipped.bonusAttributes.intelligence}</div>}
                    {equipped.bonusAttributes.agility && <div>身法 +{equipped.bonusAttributes.agility}</div>}
                    {equipped.bonusAttributes.constitution && <div>体质 +{equipped.bonusAttributes.constitution}</div>}
                    {equipped.bonusAttributes.luck && <div>福缘 +{equipped.bonusAttributes.luck}</div>}
                  </div>
                </div>
              );
            }

            return (
              <div key={slot.id} className="flex flex-col items-center justify-center p-4 bg-darkSurface border border-darkBorder border-dashed rounded-md opacity-50 min-h-[80px]">
                <span className="text-xs font-medium text-textMuted tracking-wider">{slot.label}空</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Backpack栏 */}
      <div className="bg-black/20 rounded-lg p-5 border border-darkBorder">
        <h3 className="text-lg font-semibold mb-4 text-textMain border-b border-darkBorder pb-2 flex justify-between items-center">
          <span>行囊</span>
          <span className="text-sm font-normal text-textMuted">{gameState.inventory.length} 件</span>
        </h3>
        {gameState.inventory.length === 0 ? (
          <div className="text-sm text-textMuted text-center py-10 opacity-50">行囊空空如也</div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar items-start">
            {gameState.inventory.map((item, idx) => (
              <div key={item.id} onClick={() => handleEquip(item, idx)} className={`flex flex-col p-3 bg-darkSurface border rounded-md cursor-pointer transition-all shadow-sm group ${item.quality === 'blue' ? 'border-blue-500/50 hover:bg-blue-500/10' : item.quality === 'green' ? 'border-emerald-500/50 hover:bg-emerald-500/10' : 'border-darkBorder hover:bg-white/5'}`}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-textMain truncate pr-1" title={item.name}>{item.name}</span>
                  <span className="text-[10px] text-textMuted bg-darkBg px-1.5 py-0.5 rounded whitespace-nowrap shrink-0">
                    {SLOTS.find(s => s.id === item.slot)?.label}
                  </span>
                </div>
                <div className="text-[10px] text-textMuted space-y-0.5 leading-tight">
                  {item.weaponDamage && <div className="text-red-400">伤害 {item.weaponDamage.min}-{item.weaponDamage.max}</div>}
                  {item.armor && <div className="text-blue-300">护甲 {item.armor}</div>}
                  {item.bonusAttributes.strength && <div>武力 +{item.bonusAttributes.strength}</div>}
                  {item.bonusAttributes.intelligence && <div>智谋 +{item.bonusAttributes.intelligence}</div>}
                  {item.bonusAttributes.agility && <div>身法 +{item.bonusAttributes.agility}</div>}
                  {item.bonusAttributes.constitution && <div>体质 +{item.bonusAttributes.constitution}</div>}
                  {item.bonusAttributes.luck && <div>福缘 +{item.bonusAttributes.luck}</div>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
