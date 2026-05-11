import React from 'react';
import type { EquipmentItem } from '../../types/character';
import { ATTRIBUTE_LABELS, RARITY_LABELS } from '../../types/character';

type SmartTooltipProps = {
  item: EquipmentItem;
  equippedItem: EquipmentItem | null;
  position: { x: number; y: number } | null;
};

export const SmartTooltip: React.FC<SmartTooltipProps> = ({ item, equippedItem, position }) => {
  if (!position) return null;

  // 综合强度差异
  let powerDiff = 0;

  const renderAttributeRow = (label: string, val: number, equippedVal: number) => {
    const diff = val - equippedVal;
    powerDiff += diff;
    
    let colorClass = 'text-stone-300';
    let prefix = '';
    
    if (diff > 0) {
      colorClass = 'text-green-400';
      prefix = '+';
    } else if (diff < 0) {
      colorClass = 'text-red-400';
    }

    return (
      <div className="flex justify-between items-center text-sm my-1" key={label}>
        <span className="text-stone-400">{label}</span>
        <div className="flex gap-2 text-right">
          <span className="w-8">{val}</span>
          {equippedItem && diff !== 0 && (
            <span className={`w-8 text-xs ${colorClass}`}>{prefix}{diff}</span>
          )}
        </div>
      </div>
    );
  };

  const attributesList = [];

  if (item.weaponDamage) {
    const minDmg = item.weaponDamage.min;
    const maxDmg = item.weaponDamage.max;
    const eqMinDmg = equippedItem?.weaponDamage?.min ?? 0;
    const eqMaxDmg = equippedItem?.weaponDamage?.max ?? 0;
    
    const avgDmg = (minDmg + maxDmg) / 2;
    const eqAvgDmg = (eqMinDmg + eqMaxDmg) / 2;
    const diff = avgDmg - eqAvgDmg;
    powerDiff += diff * 2; // Weight damage more
    
    let colorClass = 'text-stone-300';
    if (diff > 0) colorClass = 'text-green-400';
    else if (diff < 0) colorClass = 'text-red-400';

    attributesList.push(
      <div className="flex justify-between items-center text-sm my-1" key="damage">
        <span className="text-stone-400">武器伤害</span>
        <div className="flex gap-2 text-right">
          <span>{minDmg}-{maxDmg}</span>
          {equippedItem && diff !== 0 && (
            <span className={`text-xs ${colorClass}`}>
              {diff > 0 ? '+' : ''}{diff.toFixed(1)}
            </span>
          )}
        </div>
      </div>
    );
  }

  if (item.armor) {
    const eqArmor = equippedItem?.armor ?? 0;
    attributesList.push(renderAttributeRow('护甲', item.armor, eqArmor));
  }

  const allKeys = Object.keys(ATTRIBUTE_LABELS) as (keyof typeof ATTRIBUTE_LABELS)[];
  allKeys.forEach((key) => {
    const val = item.bonusAttributes[key];
    if (val !== undefined && val > 0) {
      const eqVal = equippedItem?.bonusAttributes?.[key] ?? 0;
      attributesList.push(renderAttributeRow(ATTRIBUTE_LABELS[key], val, eqVal));
    }
  });

  const rarityColors = ['text-stone-300', 'text-emerald-400', 'text-sky-400', 'text-fuchsia-400', 'text-amber-400'];

  return (
    <div 
      className="fixed z-50 pointer-events-none w-64 bg-stone-900/95 border border-stone-700/80 rounded-lg p-3 shadow-2xl backdrop-blur-sm"
      style={{ 
        left: position.x + 16, 
        top: position.y + 16,
        transform: 'translate(0, 0)',
      }}
    >
      <div className="flex justify-between items-start mb-2">
        <h4 className={`font-bold ${rarityColors[item.rarity]}`}>{item.name}</h4>
        <span className="text-xs px-1.5 py-0.5 rounded bg-stone-800 text-stone-400">{RARITY_LABELS[item.rarity]}</span>
      </div>
      
      <p className="text-xs text-stone-500 italic mb-3">{item.description}</p>
      
      <div className="border-t border-stone-800 pt-2 mb-2">
        {attributesList}
      </div>

      <div className="flex justify-between items-center border-t border-stone-800 pt-2 mt-2">
        <div className="flex flex-col gap-1">
          {item.price !== undefined && (
            <div className="text-amber-500 text-sm flex items-center gap-1">
              <img src="/assets/ui/icon_copper.png" alt="copper" className="w-4 h-4 object-contain" onError={(e) => e.currentTarget.style.display = 'none'} />
              {item.price}
            </div>
          )}
          {item.sellPrice !== undefined && (
            <div className="text-stone-400 text-xs flex items-center gap-1">
              Selling price: 
              <img src="/assets/ui/icon_copper.png" alt="copper" className="w-3 h-3 object-contain" onError={(e) => e.currentTarget.style.display = 'none'} />
              {item.sellPrice}
            </div>
          )}
        </div>
        
        {equippedItem && (
          <div className="flex items-center gap-1 font-bold">
            {powerDiff > 0 ? (
              <span className="text-green-500 flex items-center">▲ 提升</span>
            ) : powerDiff < 0 ? (
              <span className="text-red-500 flex items-center">▼ 下降</span>
            ) : (
              <span className="text-stone-500 flex items-center">- 持平</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
