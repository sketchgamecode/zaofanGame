import { type ClassId } from './gameState';
import { MathCore, CLASS_CONFIG } from './mathCore';

export interface Combatant {
  name: string;
  level: number;
  classId: ClassId;
  attributes: {
    strength: number;
    intelligence: number;
    agility: number;
    constitution: number;
    luck: number;
  };
  armor: number;
  weaponDamage: { min: number; max: number };
  offHandWeaponDamage?: { min: number; max: number };
  hasShield?: boolean;
}

export type ActionType =
  | 'attack'        // 普通攻击 (主手)
  | 'attack_offhand'// 副手攻击 (刺客)
  | 'spell'         // 法术攻击 (谋士)
  | 'dodge'         // 闪避
  | 'block'         // 格挡
  | 'miss_offhand'; // 刺客副手为空

export interface TurnEvent {
  round: number;
  attackerId: 'player' | 'enemy';
  defenderId: 'player' | 'enemy';
  actionType: ActionType;
  damage: number;
  isCrit: boolean;
  // HP snapshots AFTER this event applies
  playerHP: number;
  enemyHP: number;
}

export interface BattleResult {
  events: TurnEvent[];
  pWin: boolean;
  finalPlayerHP: number;
  finalEnemyHP: number;
  maxPlayerHP: number;
  maxEnemyHP: number;
}

export function simulateBattle(player: Combatant, enemy: Combatant): BattleResult {
  const events: TurnEvent[] = [];

  let pHP = MathCore.getMaxHP(player.attributes.constitution, player.level, player.classId);
  let eHP = MathCore.getMaxHP(enemy.attributes.constitution, enemy.level, enemy.classId);
  const maxPlayerHP = pHP;
  const maxEnemyHP  = eHP;

  const pReduction = MathCore.getArmorDamageReduction(player.armor, enemy.level, CLASS_CONFIG[player.classId].armorCap);
  const eReduction = MathCore.getArmorDamageReduction(enemy.armor, player.level, CLASS_CONFIG[enemy.classId].armorCap);
  const pCrit = MathCore.getCritChance(player.attributes.luck, enemy.level);
  const eCrit = MathCore.getCritChance(enemy.attributes.luck, player.level);

  const attack = (
    attacker: Combatant,
    defender: Combatant,
    attackerId: 'player' | 'enemy',
    aCrit: number,
    dReduction: number,
    round: number,
    isOffhand = false
  ): TurnEvent => {
    const defenderId = attackerId === 'player' ? 'enemy' : 'player';

    // ——— Dodge / Block check (non-mage only) ———
    if (attacker.classId !== 'CLASS_C') {
      if (defender.classId === 'CLASS_B' && Math.random() < 0.5) {
        return { round, attackerId, defenderId, actionType: 'dodge', damage: 0, isCrit: false, playerHP: pHP, enemyHP: eHP };
      }
      if (defender.classId === 'CLASS_A' && defender.hasShield && Math.random() < 0.25) {
        return { round, attackerId, defenderId, actionType: 'block', damage: 0, isCrit: false, playerHP: pHP, enemyHP: eHP };
      }
    }

    // ——— Damage calculation ———
    const wDmg = isOffhand ? attacker.offHandWeaponDamage : attacker.weaponDamage;
    const baseWDmg = wDmg
      ? Math.floor(Math.random() * (wDmg.max - wDmg.min + 1)) + wDmg.min
      : 0;

    const mainStat = attacker.attributes[CLASS_CONFIG[attacker.classId].mainStat];
    const isDual = attacker.classId === 'CLASS_D';
    let rawDmg = MathCore.getSingleHitDamage(baseWDmg, mainStat, isDual);

    // Mage ignores armor
    const effectiveReduction = attacker.classId === 'CLASS_C' ? 0 : dReduction;

    let isCrit = false;
    if (Math.random() < aCrit) { isCrit = true; rawDmg *= 2; }

    const baseFinalDmg = Math.max(1, Math.floor(rawDmg * (1 - effectiveReduction)));
    
    // Rage Mechanic: Damage increases steadily after round 1 to prevent endless battles
    // Increase by 10% per round over 1
    const rageMulti = 1 + (round - 1) * 0.1;
    const finalDmg = Math.floor(baseFinalDmg * rageMulti);

    const actionType: ActionType =
      attacker.classId === 'CLASS_C' ? 'spell' :
      isOffhand ? 'attack_offhand' : 'attack';

    return { round, attackerId, defenderId, actionType, damage: finalDmg, isCrit, playerHP: pHP, enemyHP: eHP };
  };

  let round = 1;
  while (pHP > 0 && eHP > 0 && round <= 100) {
    // ——— Player turn ———
    if (player.classId === 'CLASS_D') {
      const ev1 = attack(player, enemy, 'player', pCrit, eReduction, round, false);
      eHP = Math.max(0, eHP - ev1.damage);
      ev1.playerHP = pHP; ev1.enemyHP = eHP;
      events.push(ev1);

      if (eHP > 0) {
        if (player.offHandWeaponDamage) {
          const ev2 = attack(player, enemy, 'player', pCrit, eReduction, round, true);
          eHP = Math.max(0, eHP - ev2.damage);
          ev2.playerHP = pHP; ev2.enemyHP = eHP;
          events.push(ev2);
        } else {
          events.push({ round, attackerId: 'player', defenderId: 'enemy', actionType: 'miss_offhand', damage: 0, isCrit: false, playerHP: pHP, enemyHP: eHP });
        }
      }
    } else {
      const ev = attack(player, enemy, 'player', pCrit, eReduction, round, false);
      eHP = Math.max(0, eHP - ev.damage);
      ev.playerHP = pHP; ev.enemyHP = eHP;
      events.push(ev);
    }

    if (eHP <= 0) break;

    // ——— Enemy turn ———
    if (enemy.classId === 'CLASS_D') {
      const ev1 = attack(enemy, player, 'enemy', eCrit, pReduction, round, false);
      pHP = Math.max(0, pHP - ev1.damage);
      ev1.playerHP = pHP; ev1.enemyHP = eHP;
      events.push(ev1);

      if (pHP > 0 && enemy.offHandWeaponDamage) {
        const ev2 = attack(enemy, player, 'enemy', eCrit, pReduction, round, true);
        pHP = Math.max(0, pHP - ev2.damage);
        ev2.playerHP = pHP; ev2.enemyHP = eHP;
        events.push(ev2);
      }
    } else {
      const ev = attack(enemy, player, 'enemy', eCrit, pReduction, round, false);
      pHP = Math.max(0, pHP - ev.damage);
      ev.playerHP = pHP; ev.enemyHP = eHP;
      events.push(ev);
    }

    round++;
  }

  return {
    events,
    pWin: pHP > 0 && eHP <= 0,
    finalPlayerHP: pHP,
    finalEnemyHP: eHP,
    maxPlayerHP,
    maxEnemyHP,
  };
}
