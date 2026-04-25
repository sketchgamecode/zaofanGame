import { type GameState, type PlayerAttributes, saveGameState, getTotalAttributes, getTotalArmor } from '../core/gameState';
import { MathCore, CLASS_CONFIG } from '../core/mathCore';

interface AttributeUpgradeProps {
  gameState: GameState;
  setGameState: (state: GameState) => void;
}

export function AttributeUpgrade({ gameState, setGameState }: AttributeUpgradeProps) {
  const { base, total } = getTotalAttributes(gameState);
  const { resources, playerLevel, classId } = gameState;
  const totalArmor = getTotalArmor(gameState);

  const handleUpgrade = (statKey: keyof PlayerAttributes) => {
    const currentVal = base[statKey];
    const cost = MathCore.getUpgradeCost(currentVal);

    if (resources.copper >= cost) {
      const newState: GameState = {
        ...gameState,
        attributes: {
          ...base,
          [statKey]: currentVal + 1
        },
        resources: {
          ...resources,
          copper: resources.copper - cost
        }
      };
      setGameState(newState);
      saveGameState(newState);
    }
  };

  const getDmgStr = (isMainStat: boolean, statVal: number) => {
    if (!isMainStat) {
      return { label: 'DEFENSE', val: statVal, tip: '基础防御数值。提升对该系职业发起攻击的防御效率。' };
    }
    const mainHandDmg = gameState.equipped.mainHand?.weaponDamage || { min: playerLevel*2, max: playerLevel*4 };
    
    if (classId === 'CLASS_D') {
      const offHandDmg = (gameState.equipped.offHand?.subType === 'weapon'
        ? (gameState.equipped.offHand.weaponDamage ?? { min: 0, max: 0 })
        : { min: 0, max: 0 });
      const d1Min = MathCore.getSingleHitDamage(mainHandDmg.min, statVal, true);
      const d1Max = MathCore.getSingleHitDamage(mainHandDmg.max, statVal, true);
      const d2Min = MathCore.getSingleHitDamage(offHandDmg.min, statVal, true);
      const d2Max = MathCore.getSingleHitDamage(offHandDmg.max, statVal, true);
      return { 
        label: 'DAMAGE', 
        val: `${d1Min}-${d1Max} | ${d2Min}-${d2Max}`, 
        tip: `计算公式: =(主手或副手伤害) * 0.625 * (1 + ${statVal} / 10)` 
      };
    } else {
      const dMin = MathCore.getSingleHitDamage(mainHandDmg.min, statVal, false);
      const dMax = MathCore.getSingleHitDamage(mainHandDmg.max, statVal, false);
      return { 
        label: 'DAMAGE', 
        val: `${dMin}-${dMax}`, 
        tip: `计算公式: =(武器伤害) * (1 + ${statVal} / 10)` 
      };
    }
  };

  const blocks = [
    {
      key: 'strength' as keyof PlayerAttributes,
      name: '武力',
      primaryVal: total.strength,
      isUpgradable: true,
      sec: getDmgStr(CLASS_CONFIG[classId].mainStat === 'strength', total.strength)
    },
    {
      key: 'agility' as keyof PlayerAttributes,
      name: '身法',
      primaryVal: total.agility,
      isUpgradable: true,
      sec: getDmgStr(CLASS_CONFIG[classId].mainStat === 'agility', total.agility)
    },
    {
      key: 'intelligence' as keyof PlayerAttributes,
      name: '智谋',
      primaryVal: total.intelligence,
      isUpgradable: true,
      sec: getDmgStr(CLASS_CONFIG[classId].mainStat === 'intelligence', total.intelligence)
    },
    {
      key: 'constitution' as keyof PlayerAttributes,
      name: '体质',
      primaryVal: total.constitution,
      isUpgradable: true,
      sec: { 
        label: 'HIT POINTS', 
        val: MathCore.getMaxHP(total.constitution, playerLevel, classId), 
        tip: `计算公式: =${total.constitution} (体质) * ${playerLevel} (等级) * ${CLASS_CONFIG[classId].hpMultiplier} (职业系数)`
      }
    },
    {
      key: 'luck' as keyof PlayerAttributes,
      name: '福缘',
      primaryVal: total.luck,
      isUpgradable: true,
      sec: { 
        label: 'CRITICAL HIT', 
        val: (MathCore.getCritChance(total.luck, playerLevel) * 100).toFixed(2) + '%', 
        tip: `计算公式: =min(50%, (${total.luck} * 5) / (${playerLevel} * 2))`
      }
    },
    {
      key: 'armor' as any,
      name: '护甲',
      primaryVal: totalArmor,
      isUpgradable: false,
      sec: { 
        label: 'DAMAGE RED.', 
        val: (MathCore.getArmorDamageReduction(totalArmor, playerLevel, CLASS_CONFIG[classId].armorCap) * 100).toFixed(2) + '%', 
        tip: `计算公式: =min(${CLASS_CONFIG[classId].armorCap}%(上限), (${totalArmor} / ${playerLevel}) * 100%)`
      }
    }
  ];

  return (
    <div className="mt-8 bg-[#0a0a0e] rounded-lg p-5 border border-darkBorder shadow-inner font-mono">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-3">
        {/* Left Column */}
        <div className="space-y-3">
          {blocks.slice(0, 3).map((b) => renderBlock(b))}
        </div>
        {/* Right Column */}
        <div className="space-y-3">
          {blocks.slice(3, 6).map((b) => renderBlock(b))}
        </div>
      </div>
    </div>
  );

  function renderBlock(b: any) {
    const cost = b.isUpgradable ? MathCore.getUpgradeCost(base[b.key as keyof typeof base] ?? 0) : 0;
    const canUpgrade = resources.copper >= cost;

    return (
      <div key={b.key} className="flex items-center justify-between border-b border-darkBorder/30 pb-2 relative group hover:bg-white/5 transition-colors px-2 rounded">
        <div className="flex-1 relative cursor-help">
          {/* Tooltip */}
          <div className="absolute top-full left-0 mt-2 hidden group-hover:block w-max max-w-xs bg-black text-blue-200 text-xs p-3 rounded shadow-[0_0_15px_rgba(0,0,0,0.8)] border border-blue-500/30 z-20 break-words leading-loose">
            {b.sec.tip}
          </div>

          <div className="flex justify-between items-baseline pr-4">
            <span className="font-black text-textMain tracking-widest uppercase">{b.name}</span>
            <span className="font-bold text-lg text-white">{b.primaryVal}</span>
          </div>
          
          <div className="flex justify-between items-baseline pr-4 mt-1">
            <span className="font-bold text-blue-400 tracking-wider text-[11px]">{b.sec.label}</span>
            <span className="font-medium text-blue-200 text-xs">{b.sec.val}</span>
          </div>
        </div>
        
        {b.isUpgradable ? (
          <button 
            onClick={() => handleUpgrade(b.key)}
            disabled={!canUpgrade}
            className="flex items-center justify-center w-10 h-10 rounded border border-amber-600/50 bg-gradient-to-b from-amber-600/20 to-amber-900/40 hover:from-amber-500/40 hover:to-amber-700/60 disabled:opacity-30 disabled:grayscale transition-all shadow-md group/btn relative shrink-0 ml-2"
          >
            <span className="text-xl font-black text-amber-500 group-hover/btn:scale-110 transition-transform drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]">+</span>
            <div className="absolute top-full mt-2 hidden group-hover/btn:block w-max bg-black text-white text-[10px] p-2 rounded shadow-xl border border-amber-500/30 z-20 whitespace-nowrap">
              升阶所需: <span className="text-amber-500 font-bold">{cost}</span> 铜钱
            </div>
          </button>
        ) : (
          <div className="w-10 h-10 ml-2 border border-transparent" />
        )}
      </div>
    );
  }
}
