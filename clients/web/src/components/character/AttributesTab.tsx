import React, { useState } from 'react';
import type { CharacterInfoView, AttributeKey } from '../../types/character';
import { StatTooltip } from './StatTooltip';
import { useCharacter } from '../../hooks/useCharacter';

type AttributesTabProps = {
  character: CharacterInfoView;
};

export const AttributesTab: React.FC<AttributesTabProps> = ({ character }) => {
  const { upgradeAttribute, pendingOperation } = useCharacter();
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null);
  const [hoveredStat, setHoveredStat] = useState<AttributeKey | null>(null);

  const getDerivedStat = (key: AttributeKey) => {
    const { combatPreview } = character;
    switch (key) {
      case 'strength':
      case 'agility':
        return { label: 'DEFENSE', value: combatPreview.armor };
      case 'intelligence':
        return { label: 'DAMAGE', value: `~${Math.floor((combatPreview.damageMin + combatPreview.damageMax) / 2)}` };
      case 'constitution':
        return { label: 'HIT POINTS', value: combatPreview.hp.toLocaleString() };
      case 'luck':
        return { label: 'CRITICAL HIT', value: `${(combatPreview.critChanceBp / 100).toFixed(2)}%` };
      default:
        return null;
    }
  };

  const handlePointerEnter = (e: React.PointerEvent, key: AttributeKey) => {
    setHoveredStat(key);
    setTooltipPos({ x: e.clientX, y: e.clientY });
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (hoveredStat) {
      setTooltipPos({ x: e.clientX, y: e.clientY });
    }
  };

  const handlePointerLeave = () => {
    setHoveredStat(null);
    setTooltipPos(null);
  };

  // Explicit pairs for the grid layout matching S&F
  const leftCol: AttributeKey[] = ['strength', 'agility', 'intelligence'];
  const rightCol: AttributeKey[] = ['constitution', 'luck']; // Armor is not a base attribute in our API, but S&F has it. We will render a fake armor block for the 6th spot if we want perfect match, or just leave it empty. Let's add a fake 'armor' block just for visuals to match S&F.
  
  const renderStatBlock = (key: AttributeKey) => {
    const totalVal = character.attributes.total[key];
    const derived = getDerivedStat(key);
    const cost = character.attributes.upgradeCosts[key];
    const canAfford = character.resources.copper >= cost;
    const isUpgrading = pendingOperation?.action === 'UPGRADE_ATTRIBUTE' && pendingOperation.attribute === key;
    
    // Label translations to match S&F English screenshot
    const labelMap: Record<string, string> = {
      strength: 'STRENGTH',
      agility: 'DEXTERITY',
      intelligence: 'INTELLIGENCE',
      constitution: 'CONSTITUTION',
      luck: 'LUCK'
    };

    return (
      <div key={key} className="flex items-center gap-1 group">
        {/* Left Side: Labels & Value */}
        <div 
          className="flex-1 cursor-help flex flex-col justify-center"
          onPointerEnter={(e) => handlePointerEnter(e, key)}
          onPointerMove={handlePointerMove}
          onPointerLeave={handlePointerLeave}
          onPointerCancel={handlePointerLeave}
        >
          <div className="flex justify-between items-baseline">
            <span className="font-bold text-white tracking-wide text-xs">{labelMap[key]}</span>
            <span className="font-bold text-white text-sm">{totalVal.toLocaleString()}</span>
          </div>
          {derived ? (
            <div className="flex justify-between items-baseline mt-0.5">
              <span className="text-[9px] text-sky-400 font-bold">{derived.label}</span>
              <span className="text-[10px] text-stone-300 font-semibold">{derived.value}</span>
            </div>
          ) : (
            <div className="h-3" /> // Placeholder to keep heights even
          )}
        </div>

        {/* Right Side: Big Yellow Plus */}
        <button
          disabled={!canAfford || isUpgrading || pendingOperation !== null}
          onClick={() => upgradeAttribute(key)}
          className={`shrink-0 w-6 h-6 flex items-center justify-center rounded border border-black shadow-[inset_0_1px_1px_rgba(255,255,255,0.5),0_1px_2px_rgba(0,0,0,0.8)] transition-all active:translate-y-[1px] active:shadow-[inset_0_2px_4px_rgba(0,0,0,0.5)] relative ${
            canAfford && !pendingOperation
              ? 'bg-gradient-to-b from-[#fcd34d] to-[#d97706] cursor-pointer'
              : 'bg-gradient-to-b from-stone-600 to-stone-800 cursor-not-allowed opacity-80'
          }`}
        >
          <div className={`w-3 h-3 ${isUpgrading ? 'animate-spin border-2 border-black border-t-transparent rounded-full' : 'bg-black'} ${!isUpgrading && 'clip-cross'}`} style={!isUpgrading ? { clipPath: 'polygon(35% 0, 65% 0, 65% 35%, 100% 35%, 100% 65%, 65% 65%, 65% 100%, 35% 100%, 35% 65%, 0 65%, 0 35%, 35% 35%)' } : {}} />
          
          {/* Hover Cost */}
          {canAfford && !pendingOperation && (
            <div className="absolute -top-6 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 bg-stone-900 border border-stone-700 rounded px-1.5 flex items-center gap-1 pointer-events-none z-10 shadow-lg">
              <span className="text-[10px] text-amber-500">{cost}</span>
            </div>
          )}
        </button>
      </div>
    );
  };

  const renderFakeArmorBlock = () => {
    return (
      <div className="flex items-center gap-1 opacity-90">
        <div className="flex-1 flex flex-col justify-center">
          <div className="flex justify-between items-baseline">
            <span className="font-bold text-white tracking-wide text-xs">ARMOR</span>
            <span className="font-bold text-white text-sm">{character.combatPreview.armor}</span>
          </div>
          <div className="flex justify-between items-baseline mt-0.5">
            <span className="text-[9px] text-sky-400 font-bold">DAMAGE RED.</span>
            <span className="text-[10px] text-stone-300 font-semibold">{Math.min(50, Math.floor(character.combatPreview.armor / character.player.level))}%</span>
          </div>
        </div>
        <div className="shrink-0 w-6 h-6" /> {/* Empty space for alignment */}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full justify-between pb-1">
      
      {/* Top: 2-Column Attributes Grid */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-3 px-1">
        {/* Left Column */}
        <div className="flex flex-col gap-3">
          {leftCol.map(key => renderStatBlock(key))}
        </div>
        {/* Right Column */}
        <div className="flex flex-col gap-3">
          {rightCol.map(key => renderStatBlock(key))}
          {renderFakeArmorBlock()}
        </div>
      </div>

      {/* Bottom: 3 Deep Blue Circular Slots (Potions/Mounts placeholders) */}
      <div className="flex gap-3 px-2 mt-4">
        {[0, 1, 2].map(i => (
          <div 
            key={i} 
            className="w-10 h-10 rounded-full bg-gradient-to-br from-sky-950 to-blue-950 border border-sky-800 shadow-[inset_0_4px_8px_rgba(0,0,0,0.8)] ring-1 ring-black flex items-center justify-center relative overflow-hidden"
          >
            {/* Highlight gleam */}
            <div className="absolute top-0 inset-x-0 h-1/3 bg-gradient-to-b from-white/10 to-transparent rounded-t-full" />
          </div>
        ))}
      </div>

      {hoveredStat && tooltipPos && (
        <StatTooltip 
          statKey={hoveredStat} 
          basis={character.attributes.base[hoveredStat]} 
          equipment={character.attributes.total[hoveredStat] - character.attributes.base[hoveredStat]} 
          position={tooltipPos}
          playerLevel={character.player.level}
        />
      )}
    </div>
  );
};
