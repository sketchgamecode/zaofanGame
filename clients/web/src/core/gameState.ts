/**
 * Game State Management
 * Agent 1: æž¶æž„ä¸Žæ•°æ® (Data & Architecture)
 * Handles player entity, inventory entity, and data persistence via localStorage.
 */

export type EquipmentSlot = 'head' | 'chest' | 'hands' | 'feet' | 'neck' | 'belt' | 'ring' | 'trinket' | 'mainHand' | 'offHand';
export type ItemQuality = 'white' | 'green' | 'blue'; // ç™½, ç»¿, è“
export type MissionType = 'A' | 'B' | 'C';

export interface ActiveMission {
  id: string;
  type: MissionType;
  name: string;
  durationSec: number;
  foodCost: number;
  expReward: number;
  coinReward: number;
  dropRate: number;
  endTime: number; // æ¯«ç§’çº§æ—¶é—´æˆ³
}

export interface Equipment {
  id: string;
  name: string; // åç§°
  description: string; // æè¿°æ–‡æ¡ˆ
  slot: EquipmentSlot; // éƒ¨ä½
  quality: ItemQuality; // å“è´¨
  subType?: 'weapon' | 'shield' | 'none'; // å‰¯æ‰‹æ­¦å™¨ç±»åž‹é™åˆ¶
  armor?: number; // åŸºç¡€æŠ¤ç”²
  weaponDamage?: { min: number; max: number }; // æ­¦å™¨æ”»å‡»åŠ›åŒºé—´
  price?: number; // ä»·æ ¼ (å•†åº—ä¸“ç”¨)
  bonusAttributes: { // åŠ æˆå±žæ€§
    strength?: number;      // æ­¦åŠ›
    intelligence?: number;  // æ™ºè°‹
    agility?: number;       // èº«æ³•
    constitution?: number;  // ä½“è´¨
    luck?: number;          // ç¦ç¼˜
  };
}

export interface PlayerAttributes {
  strength: number;     // æ­¦åŠ›
  intelligence: number; // æ™ºè°‹
  agility: number;      // èº«æ³•
  constitution: number; // ä½“è´¨
  luck: number;         // ç¦ ç¼˜
}

export interface PlayerResources {
  copper: number;      // é“œé’±
  prestige: number;    // å£°æœ›
  rations: number;     // å¹²ç²®
  tokens: number;      // é€šå®  (é«˜çº§ä»£å¸ )
  hourglasses: number; // ç»´å¼¥æ²™æ¼ 
}

export type ClassId = 'CLASS_A' | 'CLASS_B' | 'CLASS_C' | 'CLASS_D';

export interface GameState {
  playerLevel: number;
  classId: ClassId;
  exp: number;               // å½“å‰ç´¯è®¡ç»éªŒå€¼
  attributes: PlayerAttributes;
  resources: PlayerResources;
  equipped: Record<EquipmentSlot, Equipment | null>;
  inventory: Equipment[];
  activeMission: ActiveMission | null;
  blackMarket: {
    items: (Equipment | null)[];
    lastRefresh: number;
  };
  /** Key: chapter id (e.g. 'chapter_1'), Value: å½“å‰å·²å‡»è´¥çš„ boss æ•°é‡ (0 = æœªå¼€å§‹) */
  dungeonProgress: Record<string, number>;
  /** S&F 每日副本次数限制，date 格式为 'YYYY-MM-DD' */
  dungeonDailyAttempt: { date: string; used: number };
  /** 干粮上次恢复时间戳（ms），用于离线恢复计算 */
  lastRationsRefill: number;
  /** 竞技场总胜场数 */
  arenaWins: number;
  /** S&F 每日竞技场XP奖励限额 (前10次胜利) */
  arenaDailyXP: { date: string; wins: number };
  /** 竞技场10分钟冷却时间截止戳 */
  arenaCooldownEndTime: number;
  /** 客栈：今日已购买烈酒次数（掌柜每日限10次）*/
  tavernDailyDrinks: { date: string; count: number };
  /** 客栈：更夫离线打工状态 */
  activeGuardWork: { endTime: number; coinReward: number } | null;
  lastUpdated: number;
}

const STORAGE_KEY = 'zaofan_game_state_v1';

/**
 * åˆå§‹åŒ–åŸºç¡€æ•°æ®
 */
export function getInitialGameState(): GameState {
  return {
    playerLevel: 1,
    classId: 'CLASS_A',
    exp: 0,
    attributes: {
      strength: 10,
      intelligence: 10,
      agility: 10,
      constitution: 10,
      luck: 10,
    },
    resources: {
      copper: 0,
      prestige: 0,
      rations: 100,
      tokens: 50,
      hourglasses: 50,
    },
    equipped: {
      head: null, chest: null, hands: null, feet: null,
      neck: null, belt: null, ring: null, trinket: null,
      mainHand: null, offHand: null,
    },
    inventory: [],
    activeMission: null,
    blackMarket: { items: Array(6).fill(null), lastRefresh: 0 },
    dungeonProgress: { chapter_1: 0 },
    dungeonDailyAttempt: { date: '', used: 0 },
    lastRationsRefill: Date.now(),
    arenaWins: 0,
    arenaDailyXP: { date: '', wins: 0 },
    arenaCooldownEndTime: 0,
    tavernDailyDrinks: { date: '', count: 0 },
    activeGuardWork: null,
    lastUpdated: Date.now(),
  };
}

/**
 * ä»Ž localStorage åŠ è½½æ•°æ®ï¼Œç¡®ä¿åˆ·æ–°ä¸ä¸¢å¤±
 * æ­¤å¤„å…¼é¡¾äº†æ—§ç‰ˆæ•°æ®ç»“æž„çš„ç ´åæ€§æ´—ç›˜å‡çº§ (Wiping broken inventories)
 */
export function loadGameState(): GameState {
  if (typeof window === 'undefined') {
    return getInitialGameState();
  }
  try {
    const serializedState = localStorage.getItem(STORAGE_KEY);
    if (serializedState === null) {
      const state = getInitialGameState();
      saveGameState(state);
      return state;
    }
    const parsedState = JSON.parse(serializedState) as any;
    const initialState = getInitialGameState();
    
    // å¦‚æžœå‘çŽ°æ˜¯æ—§ç‰ˆç»“æž„ (å­˜åœ¨ equipment å¯¹è±¡)ï¼Œå¼ºåˆ¶æ´—ç›˜ inventory å’Œ equipped é˜²æ­¢æŠ¥é”™
    const needsWipe = !!parsedState.equipment;

    const state: GameState = {
      ...initialState,
      ...parsedState,
      classId: parsedState.classId || initialState.classId,
      exp: parsedState.exp ?? 0,
      attributes: {
        ...initialState.attributes,
        ...parsedState.attributes,
        luck: parsedState.attributes?.luck ?? 10,
      },
      resources: {
        ...initialState.resources,
        ...(parsedState.resources || {}),
        tokens: parsedState.resources?.tokens ?? 50,
        hourglasses: parsedState.resources?.hourglasses ?? 50,
      },
      equipped: needsWipe ? initialState.equipped : (parsedState.equipped || initialState.equipped),
      inventory: needsWipe ? [] : (parsedState.inventory || []),
      blackMarket: parsedState.blackMarket || initialState.blackMarket,
      // è¿ç§»æ—§çš„ dungeonLevel å­—æ®µ
      dungeonProgress: parsedState.dungeonProgress || {
        chapter_1: parsedState.dungeonLevel ? parsedState.dungeonLevel - 1 : 0,
      },
      dungeonDailyAttempt: parsedState.dungeonDailyAttempt || initialState.dungeonDailyAttempt,
      lastRationsRefill: parsedState.lastRationsRefill ?? Date.now(),
      arenaWins: parsedState.arenaWins ?? 0,
      arenaDailyXP: parsedState.arenaDailyXP || parsedState.arenaDailyAttempt || initialState.arenaDailyXP,
      arenaCooldownEndTime: parsedState.arenaCooldownEndTime ?? 0,
      tavernDailyDrinks: parsedState.tavernDailyDrinks || initialState.tavernDailyDrinks,
      activeGuardWork: parsedState.activeGuardWork ?? null,
    };

    // Note: To be fully safe against old BlackMarket structures as well, wipe its items if needsWipe
    if (needsWipe) {
      state.blackMarket.items = Array(6).fill(null);
    }

    // ä¸¢å¼ƒæ—§ç‰ˆçš„ equipment å­—æ®µï¼Œå¦‚æžœ TS æŠ¥é”™ï¼Œå› ä¸ºæˆ‘ä»¬åœ¨è§£æž„
    // æˆ‘ä»¬å¼ºåˆ¶ delete state.equipment ä»¥é˜²å¹²æ‰°ã€‚
    if ((state as any).equipment) {
       delete (state as any).equipment;
    }

    return state;
  } catch (err) {
    console.warn("Failed to load game state from localStorage, returning initial state.", err);
    return getInitialGameState();
  }
}

/**
 * ä¿å­˜æ•°æ®åˆ° localStorage
 */
export function saveGameState(state: GameState): void {
  if (typeof window === 'undefined') return;
  try {
    state.lastUpdated = Date.now();
    const serializedState = JSON.stringify(state);
    localStorage.setItem(STORAGE_KEY, serializedState);
  } catch (err) {
    console.error("Failed to save game state to localStorage.", err);
  }
}

/**
 * æ¸…é™¤æœ¬åœ°å­˜æ¡£å¹¶æ¢å¤ä¸ºåˆå§‹çŠ¶æ€
 */
export function resetGameState(): GameState {
  const initialState = getInitialGameState();
  saveGameState(initialState);
  return initialState;
}

/**
 * ç»“ç®—æ€»å±žæ€§ï¼šåŸºç¡€å±žæ€§ + è£…å¤‡é™„åŠ å±žæ€§
 */
export function getTotalAttributes(state: GameState): { base: PlayerAttributes, bonus: PlayerAttributes, total: PlayerAttributes } {
  const base = { ...state.attributes };
  const bonus: PlayerAttributes = { strength: 0, intelligence: 0, agility: 0, constitution: 0, luck: 0 };

  const equipped = state.equipped || {};
  Object.values(equipped).forEach((equip) => {
    if (equip && equip.bonusAttributes) {
      if (equip.bonusAttributes.strength) bonus.strength += equip.bonusAttributes.strength;
      if (equip.bonusAttributes.intelligence) bonus.intelligence += equip.bonusAttributes.intelligence;
      if (equip.bonusAttributes.agility) bonus.agility += equip.bonusAttributes.agility;
      if (equip.bonusAttributes.constitution) bonus.constitution += equip.bonusAttributes.constitution;
      if (equip.bonusAttributes.luck) bonus.luck += equip.bonusAttributes.luck;
    }
  });

  const total = {
    strength: base.strength + bonus.strength,
    intelligence: base.intelligence + bonus.intelligence,
    agility: base.agility + bonus.agility,
    constitution: base.constitution + bonus.constitution,
    luck: base.luck + bonus.luck,
  };

  return { base, bonus, total };
}

export function getTotalArmor(state: GameState): number {
  let armor = 0;
  const equipped = state.equipped || {};
  Object.values(equipped).forEach((equip) => {
    if (equip && equip.armor) {
      armor += equip.armor;
    }
  });
  return armor;
}
