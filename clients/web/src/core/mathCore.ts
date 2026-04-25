import { type ClassId } from './gameState';
import { XP_TABLE, MAX_LEVEL } from '../data/xpTable';

export const CLASS_CONFIG: Record<ClassId, { name: string; mainStat: 'strength' | 'agility' | 'intelligence'; hpMultiplier: number; armorCap: number }> = {
  CLASS_A: { name: '猛将', mainStat: 'strength', hpMultiplier: 5, armorCap: 50 },
  CLASS_B: { name: '游侠', mainStat: 'agility',  hpMultiplier: 4, armorCap: 25 },
  CLASS_C: { name: '谋士', mainStat: 'intelligence', hpMultiplier: 2, armorCap: 10 },
  CLASS_D: { name: '刺客', mainStat: 'agility',  hpMultiplier: 4, armorCap: 25 },
};

export const MathCore = {
  getMaxHP: (constitution: number, level: number, classId: ClassId): number => {
    const mult = CLASS_CONFIG[classId].hpMultiplier;
    return constitution * level * mult;
  },

  getSingleHitDamage: (
    weaponDamage: number,
    mainAttribute: number,
    isAssassinDualWield: boolean
  ): number => {
    let finalDmg = weaponDamage * (1 + mainAttribute / 10);
    if (isAssassinDualWield) finalDmg = finalDmg * 0.625;
    return Math.floor(finalDmg);
  },

  getCritChance: (luck: number, enemyLevel: number): number => {
    const safeEnemyLevel = Math.max(1, enemyLevel);
    const chance = (luck * 5) / (safeEnemyLevel * 2);
    return Math.min(0.5, chance / 100);
  },

  getArmorDamageReduction: (totalArmor: number, enemyLevel: number, rootCap: number): number => {
    const safeEnemyLevel = Math.max(1, enemyLevel);
    const reductionPercent = totalArmor / safeEnemyLevel;
    const capFraction = rootCap / 100;
    return Math.min(capFraction, reductionPercent);
  },

  getUpgradeCost: (currentValue: number): number => {
    return Math.floor(10 * Math.pow(1.1, currentValue));
  },
};

/** 读 XP_TABLE 判断是否升级，支持连续升级 */
export function checkLevelUp(
  currentLevel: number,
  currentExp: number
): { newLevel: number; newExp: number; didLevelUp: boolean } {
  let level = currentLevel;
  let exp = currentExp;
  let didLevelUp = false;
  while (level < MAX_LEVEL) {
    const required = XP_TABLE[level];
    if (required === undefined || exp < required) break;
    exp -= required;
    level++;
    didLevelUp = true;
  }
  return { newLevel: level, newExp: exp, didLevelUp };
}