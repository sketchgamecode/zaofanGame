import React from 'react';
import type { AttributeKey } from '../../types/character';

type StatTooltipProps = {
  statKey: AttributeKey;
  basis: number;
  equipment: number;
  position: { x: number; y: number } | null;
  playerLevel: number;
};

const STAT_INFO: Record<AttributeKey, { title: string; desc: string }> = {
  strength: {
    title: '力量 (Strength)',
    desc: '力量决定了战士类职业的基础伤害，并提供对战士的防御力。',
  },
  agility: {
    title: '敏捷 (Dexterity)',
    desc: '敏捷决定了游侠类职业的基础伤害，并提供对游侠的防御力。',
  },
  intelligence: {
    title: '智力 (Intelligence)',
    desc: '智力决定了法师类职业的基础伤害，并提供对法师的防御力。',
  },
  constitution: {
    title: '体质 (Constitution)',
    desc: '体质决定了你的最大生命值 (Hit Points)。\n生命值 = 体质 * (等级 + 1) * 职业系数',
  },
  luck: {
    title: '幸运 (Luck)',
    desc: '幸运决定了你的暴击几率。\n暴击率 = 幸运 * 5 / (敌方等级 * 2) ; 最大 50%',
  },
};

export const StatTooltip: React.FC<StatTooltipProps> = ({ statKey, basis, equipment, position, playerLevel }) => {
  if (!position) return null;

  const info = STAT_INFO[statKey];

  return (
    <div 
      className="fixed z-[100] pointer-events-none w-64 bg-stone-900/95 border border-amber-700/80 rounded-lg p-3 shadow-2xl backdrop-blur-sm"
      style={{ 
        left: position.x + 16, 
        top: position.y + 16,
        transform: 'translate(0, 0)',
      }}
    >
      <h4 className="font-bold text-amber-500 mb-2">{info.title}</h4>
      <p className="text-xs text-stone-300 mb-4 whitespace-pre-line leading-relaxed">{info.desc}</p>
      
      <div className="border-t border-stone-800 pt-3">
        <div className="flex justify-between items-center text-sm mb-1">
          <span className="text-stone-400">Basis</span>
          <span className="font-mono text-stone-200">{basis}</span>
        </div>
        <div className="flex justify-between items-center text-sm">
          <span className="text-stone-400">Equipment</span>
          <span className={`font-mono ${equipment >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {equipment >= 0 ? '+' : ''}{equipment}
          </span>
        </div>
      </div>
    </div>
  );
};
