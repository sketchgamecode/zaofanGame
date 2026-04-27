# Tavern Mission Hub - Classic SF 复刻正式实现规格 V3

**目标模块:** gameserver 酒馆任务系统  
**版本:** V3 Implementation Spec  
**适用对象:** Server Agent / Client Agent / QA Agent  
**开发目标:** 正式版经典 S&F 酒馆任务机制，不做 MVP 简化版  
**本地化题材:** 大宋造反模拟器  
**兼容架构:** 继续使用统一动作接口 `POST /api/action`

---

## 0. 最高优先级原则

本次开发不是临时 MVP，而是正式版酒馆任务底层。必须满足以下原则：

1. **服务端权威**  
   所有任务生成、精力消耗、倒计时、战斗、奖励发放、掉落、每日重置都由服务端计算和校验。

2. **经典 SF 机制优先**  
   酒馆任务采用经典 S&F 三选一任务逻辑：每日基础干粮/口渴值、买酒补充、坐骑缩短任务时间并等价减少消耗、任务结束后战斗结算、成功才发主奖励。

3. **秒级干粮系统**  
   旧的 `rations` 点数必须迁移为 `thirstSecRemaining` 秒数。  
   经典逻辑中，任务时间和干粮消耗强绑定，所以必须用秒数表示，不能继续用整数点数粗略表示。

4. **三选一任务不可被刷新刷收益**  
   `GENERATE_MISSIONS` 不是“刷新任务”按钮。  
   如果当前已经有 `missionOffers`，必须原样返回，禁止重抽。

5. **任务开始时锁定所有快照**  
   `START_MISSION` 时必须锁定：坐骑倍率、玩家战斗属性、敌人属性、奖励、掉落、随机种子、时长、消耗。  
   任务开始后，玩家换装备、升级属性、坐骑过期，都不影响当前任务。

6. **结算必须幂等**  
   同一个任务无论客户端重复点击、网络重试、`SKIP_MISSION` 和 `COMPLETE_MISSION` 竞争，都只能结算一次，奖励只能发一次。

7. **隐藏字段不得泄露给客户端**  
   `combatSeed`、完整 `rewardSnapshot`、完整 `playerCombatSnapshot`、隐藏掉落 roll，不得出现在 `TAVERN_GET_INFO` 或普通客户端响应里。

---

## 1. 当前 Action 架构兼容要求

继续使用统一动作接口：

```http
POST /api/action
Authorization: Bearer <token>
Content-Type: application/json
```

请求格式：

```json
{
  "action": "ACTION_NAME",
  "payload": {}
}
```

本次涉及动作：

```ts
type TavernAction =
  | "TAVERN_GET_INFO"
  | "GENERATE_MISSIONS"
  | "TAVERN_DRINK"
  | "START_MISSION"
  | "COMPLETE_MISSION"
  | "SKIP_MISSION";
```

已有动作不得破坏：

- `START_MISSION`
- `COMPLETE_MISSION`
- `SKIP_MISSION`
- `TAVERN_DRINK`
- `GENERATE_MISSIONS`

新增动作：

- `TAVERN_GET_INFO`

---

## 2. 文件改动范围

建议文件结构如下：

```txt
server/src/types/gameState.ts
server/src/engine/index.ts
server/src/engine/tavern.ts
server/src/engine/missions.ts
server/src/engine/mathCore.ts
server/src/engine/equipmentGenerator.ts
server/src/lib/rng.ts
server/src/config/classicTavernRules.ts
server/src/lib/time.ts
server/src/lib/playerLock.ts
```

其中：

- `gameState.ts`：状态类型、任务类型、酒馆类型、快照类型。
- `index.ts`：action dispatcher、normalize、daily reset、player lock。
- `tavern.ts`：酒馆信息、买酒、生成三选一。
- `missions.ts`：开始任务、完成任务、跳过任务。
- `mathCore.ts`：服务端战斗模拟，支持 seed。
- `equipmentGenerator.ts`：装备生成支持 rng 注入。
- `rng.ts`：确定性随机数。
- `classicTavernRules.ts`：经典酒馆规则配置。
- `time.ts`：Asia/Shanghai 日期计算。
- `playerLock.ts`：同一玩家 action 串行执行。

---

## 3. GameState 数据模型

### 3.1 GameState 顶层结构

```ts
export type GameState = {
  schemaVersion: number; // 当前为 4

  player: PlayerState;
  inventory: InventoryState;
  equipment: EquipmentState;

  tavern: TavernState;

  mount: MountState;

  blackMarket?: BlackMarketState;
  arena?: ArenaState;
  dungeon?: DungeonState;

  stateRevision?: number; // 可选：用于乐观锁
};
```

### 3.2 TavernState

```ts
export type TavernState = {
  /**
   * 游戏日，固定使用 Asia/Shanghai。
   * 格式：YYYY-MM-DD
   */
  lastDailyResetDate: string;

  /**
   * 当前剩余干粮/口渴值，单位：秒。
   * 每日基础重置为 6000 秒。
   * 买酒后可以超过 6000 秒。
   */
  thirstSecRemaining: number;

  /**
   * 今日已买酒次数。
   * 每日最多 10 次。
   */
  drinksUsedToday: number;

  /**
   * 今日首单奖励是否已经被锁定/消耗。
   * 注意：建议在 START_MISSION 时消耗，而不是 COMPLETE_MISSION 时消耗。
   */
  firstMissionBonusClaimed: boolean;

  /**
   * 今日已开始任务数。
   * 用于统计、任务成就、QA 调试。
   */
  dailyQuestCounter: number;

  /**
   * 三选一任务组序号。
   * 每生成一组三选一，offerSeq + 1。
   */
  offerSeq: number;

  /**
   * 当前三选一任务。
   * IDLE 状态下应该存在 3 个。
   * 进入任务后清空。
   */
  missionOffers: MissionOffer[];

  /**
   * 当前进行中的任务。
   */
  activeMission: ActiveMission | null;

  /**
   * 最近一次结算结果。
   * 用于 COMPLETE_MISSION / SKIP_MISSION 的幂等返回。
   */
  lastSettlement: MissionSettlement | null;
};
```

### 3.3 MountState

```ts
export type MountState = {
  /**
   * 坐骑时间倍率，万分比。
   * 10000 = 无坐骑
   * 9000 = -10%
   * 8000 = -20%
   * 7000 = -30%
   * 5000 = -50%
   */
  timeMultiplierBp: 10000 | 9000 | 8000 | 7000 | 5000;

  /**
   * 坐骑过期时间，Unix ms。
   * null 表示无过期或默认无坐骑。
   */
  expiresAt: number | null;

  name?: string;
  tier?: string;
};
```

---

## 4. 任务相关类型

### 4.1 TavernStatus

`TavernStatus` 不一定需要持久化，可运行时计算：

```ts
export type TavernStatus =
  | "IDLE"
  | "IN_PROGRESS"
  | "READY_TO_COMPLETE";
```

计算规则：

```ts
export function getTavernStatus(state: GameState, now: number): TavernStatus {
  const active = state.tavern.activeMission;

  if (!active) return "IDLE";

  if (now < active.endTime) return "IN_PROGRESS";

  return "READY_TO_COMPLETE";
}
```

### 4.2 MissionOffer

```ts
export type MissionOffer = {
  /**
   * 当前三选一任务组 ID。
   * 同一组三个任务的 offerSetId 相同。
   */
  offerSetId: string;

  /**
   * 单个任务 ID。
   */
  missionId: string;

  /**
   * 当前任务组序号。
   */
  offerSeq: number;

  /**
   * 三选一位置：0 / 1 / 2
   */
  slotIndex: 0 | 1 | 2;

  title: string;
  description: string;
  locationName?: string;

  /**
   * 未受坐骑影响的基础任务时间，单位秒。
   * 经典档位：5 / 10 / 15 / 20 分钟。
   */
  baseDurationSec: number;

  /**
   * 应用坐骑后的实际任务时间。
   * 也是干粮消耗。
   */
  actualDurationSec: number;

  /**
   * 实际干粮消耗，单位秒。
   * 正式规则：thirstCostSec = actualDurationSec。
   */
  thirstCostSec: number;

  /**
   * 客户端可见奖励。
   * 注意：这里只给玩家可见预览，不包含隐藏 roll。
   */
  visibleReward: VisibleReward;

  /**
   * 客户端可见敌人信息。
   */
  enemyPreview: EnemyPreview;

  /**
   * 任务生成时间，Unix ms。
   */
  generatedAt: number;
};
```

### 4.3 VisibleReward

```ts
export type VisibleReward = {
  xp: number;
  copper: number;

  /**
   * 是否显示可能获得装备。
   * 如果任务确定奖励一件装备，则为 true。
   */
  hasEquipment: boolean;

  equipmentPreview?: {
    slot: string;
    rarity: number;
    name?: string;
  };

  /**
   * 是否显示可能获得钥匙。
   */
  hasDungeonKey: boolean;

  dungeonKeyPreview?: {
    dungeonId: string;
    name: string;
  };

  /**
   * 是否显示沙漏奖励。
   */
  hasHourglass?: boolean;
};
```

### 4.4 ActiveMission

```ts
export type ActiveMission = {
  missionId: string;
  offerSetId: string;
  offerSeq: number;
  slotIndex: 0 | 1 | 2;

  title: string;
  description: string;
  locationName?: string;

  startedAt: number;
  endTime: number;

  baseDurationSec: number;
  actualDurationSec: number;
  thirstCostSec: number;

  /**
   * 任务开始时锁定的坐骑快照。
   */
  mountSnapshot: {
    timeMultiplierBp: number;
    name?: string;
    tier?: string;
    capturedAt: number;
  };

  /**
   * 任务开始时锁定的玩家战斗快照。
   * 任务期间玩家换装备/升级不影响当前任务。
   */
  playerCombatSnapshot: PlayerCombatSnapshot;

  /**
   * 敌人属性快照。
   */
  enemySnapshot: EnemySnapshot;

  /**
   * 完整奖励快照，服务端私有。
   * 不得在 TAVERN_GET_INFO 中泄露。
   */
  rewardSnapshot: RewardSnapshot;

  /**
   * 战斗随机种子，服务端私有。
   * 不得提前泄露给客户端。
   */
  combatSeed: string;

  /**
   * 掉落随机种子，服务端私有。
   */
  rewardSeed: string;

  /**
   * 结算状态。
   * 注意：失败任务也必须 SETTLED。
   */
  settlementStatus: "UNSETTLED" | "SETTLED";

  /**
   * 是否实际发放主奖励。
   * 成功为 true。
   * 失败为 false。
   */
  rewardGranted: boolean;
};
```

### 4.5 PlayerCombatSnapshot

```ts
export type PlayerCombatSnapshot = {
  level: number;
  classId?: string;

  attributes: {
    strength: number;
    intelligence: number;
    agility: number;
    constitution: number;
    luck: number;
  };

  combatStats: {
    hp: number;
    armor: number;
    damageMin: number;
    damageMax: number;
    critChanceBp: number;
    dodgeChanceBp?: number;
    blockChanceBp?: number;
  };

  equipmentSummary: {
    weaponId?: string;
    offHandId?: string;
    itemPowerTotal: number;
  };
};
```

### 4.6 EnemySnapshot

```ts
export type EnemySnapshot = {
  enemyId: string;
  name: string;
  level: number;

  attributes: {
    strength: number;
    intelligence: number;
    agility: number;
    constitution: number;
    luck: number;
  };

  combatStats: {
    hp: number;
    armor: number;
    damageMin: number;
    damageMax: number;
    critChanceBp: number;
    dodgeChanceBp?: number;
  };

  enemyPowerRatioBp: number;
};
```

### 4.7 RewardSnapshot

```ts
export type RewardSnapshot = {
  xp: number;
  copper: number;

  /**
   * 通宝/蘑菇类稀缺货币。
   */
  tokens: number;

  equipment: Equipment | null;

  dungeonKey: DungeonKey | null;

  hourglass: number;

  /**
   * 今日首单奖励是否已锁入本任务。
   */
  firstMissionBonusApplied: boolean;

  /**
   * 仅服务端用于调试或复现。
   * 不给客户端。
   */
  hiddenRolls: {
    rewardSeed: string;
    equipmentRollSeed?: string;
    dungeonKeyRollSeed?: string;
  };
};
```

### 4.8 MissionSettlement

```ts
export type MissionSettlement = {
  missionId: string;
  offerSetId: string;
  settledAt: number;

  result: "SUCCESS" | "FAILED";

  rewardGranted: boolean;

  rewardSnapshot: RewardSnapshot;

  grantedReward: GrantedReward;

  battleResult: BattleResult;

  playerDelta: PlayerDelta;
};
```

---

## 5. 经典酒馆规则配置

新增：

```txt
server/src/config/classicTavernRules.ts
```

内容示例：

```ts
export const CLASSIC_TAVERN_RULES = {
  schemaVersion: 4,

  timezone: "Asia/Shanghai",

  baseThirstSec: 100 * 60,

  drinkRestoreSec: 20 * 60,

  maxDrinksPerDay: 10,

  /**
   * 坐骑倍率，万分比。
   */
  mountMultiplierBp: {
    none: 10000,
    tier1: 9000,
    tier2: 8000,
    tier3: 7000,
    tier4: 5000,
  },

  /**
   * 16 级后经典档位。
   */
  defaultDurationMin: [5, 10, 15, 20],

  /**
   * 1-15 级新手期可逐步靠近经典档位。
   * 如果暂时没有精确采样数据，可以先用配置占位，后续只改表不改代码。
   */
  lowLevelDurationMinByLevel: {
    1: [1, 2, 3, 4],
    2: [1, 2, 3, 5],
    3: [2, 3, 4, 5],
    4: [2, 4, 5, 6],
    5: [3, 5, 6, 8],
    6: [3, 5, 8, 10],
    7: [4, 6, 8, 10],
    8: [4, 8, 10, 12],
    9: [5, 8, 10, 15],
    10: [5, 10, 12, 15],
    11: [5, 10, 15, 18],
    12: [5, 10, 15, 20],
    13: [5, 10, 15, 20],
    14: [5, 10, 15, 20],
    15: [5, 10, 15, 20],
  },

  /**
   * 任务奖励类型软约束。
   * 不要强制固定 1 个经验、1 个铜钱、1 个均衡。
   * 但三选一应保证至少存在选择差异。
   */
  rewardProfileWeights: {
    xpFocused: { xpMulBp: 15000, copperMulBp: 5000 },
    copperFocused: { xpMulBp: 5000, copperMulBp: 15000 },
    balanced: { xpMulBp: 10000, copperMulBp: 10000 },
  },

  /**
   * 掉落率，万分比。
   * 700 = 7%
   */
  itemDropChanceBp: 700,

  dungeonKeyDropChanceBp: 0,

  hourglassDropChanceBp: 0,

  /**
   * 每日第一趟任务锁定 1 个通宝。
   */
  firstMissionBonusTokens: 1,

  /**
   * 普通任务目标胜率。
   * 9700 = 97%
   */
  battleTuning: {
    normalQuestTargetWinRateBp: 9700,
    hardQuestTargetWinRateBp: 9000,
    minQuestWinRateBp: 9000,
    maxQuestWinRateBp: 9950,
  },
} as const;
```

注意：

- 真实 S&F 具体 XP/Gold 曲线可以后续采样替换。
- 但所有规则必须配置化，不能硬编码散落在函数里。
- 后续只允许调 `classicTavernRules.ts`，不要每次改核心逻辑。

---

## 6. 迁移逻辑 normalizeGameState

### 6.1 目标

必须兼容旧存档。

旧结构中可能存在：

```ts
state.rations
state.availableMissions
state.activeMission
state.drinksUsedToday
```

新结构统一迁移到：

```ts
state.tavern.thirstSecRemaining
state.tavern.missionOffers
state.tavern.activeMission
```

### 6.2 迁移函数

```ts
export function normalizeGameState(raw: any, now: number): GameState {
  const today = getGameDateString(now, "Asia/Shanghai");

  const state = raw ?? {};

  if (!state.schemaVersion || state.schemaVersion < 4) {
    const oldRations = typeof state.rations === "number" ? state.rations : 100;

    state.tavern = {
      lastDailyResetDate: state.lastDailyResetDate ?? today,
      thirstSecRemaining: Math.max(0, Math.floor(oldRations * 60)),
      drinksUsedToday: state.drinksUsedToday ?? 0,
      firstMissionBonusClaimed: state.firstMissionBonusClaimed ?? false,
      dailyQuestCounter: state.dailyQuestCounter ?? 0,
      offerSeq: state.offerSeq ?? 0,
      missionOffers: state.availableMissions ?? [],
      activeMission: migrateOldActiveMission(state.activeMission),
      lastSettlement: null,
    };

    state.mount = state.mount ?? {
      timeMultiplierBp: 10000,
      expiresAt: null,
    };

    delete state.rations;
    delete state.availableMissions;
    delete state.activeMission;
    delete state.drinksUsedToday;

    state.schemaVersion = 4;
  }

  if (!state.tavern) {
    state.tavern = createInitialTavernState(today);
  }

  if (!state.mount) {
    state.mount = {
      timeMultiplierBp: 10000,
      expiresAt: null,
    };
  }

  state.schemaVersion = 4;

  return state as GameState;
}
```

### 6.3 迁移原则

1. 不要丢旧用户数据。
2. 旧 `rations` 按 `rations * 60` 转成秒。
3. 旧 `availableMissions` 尽量迁移；如果字段不完整，则丢弃并让 `TAVERN_GET_INFO` 重新生成。
4. 旧 `activeMission` 如果不能安全迁移，则返回清晰日志，不要崩服。
5. 迁移后必须写回存档。

---

## 7. 每日重置 applyDailyReset

### 7.1 规则

每日 0 点，固定使用 `Asia/Shanghai`。

重置内容：

```txt
thirstSecRemaining = 6000
drinksUsedToday = 0
firstMissionBonusClaimed = false
dailyQuestCounter = 0
lastDailyResetDate = today
```

绝对不能重置：

```txt
activeMission
missionOffers
lastSettlement
```

特别注意：

```txt
玩家 23:55 开始 20 分钟任务
00:00 每日重置
00:15 任务完成
当前 activeMission 必须仍然存在
```

### 7.2 跨多日登录

如果玩家多日未登录：

```txt
lastDailyResetDate = 2026-04-20
today = 2026-04-26
```

只做一次今日初始化，不做离线累计。

```ts
export function applyDailyReset(state: GameState, now: number): void {
  const today = getGameDateString(now, CLASSIC_TAVERN_RULES.timezone);

  if (state.tavern.lastDailyResetDate === today) {
    return;
  }

  state.tavern.thirstSecRemaining = CLASSIC_TAVERN_RULES.baseThirstSec;
  state.tavern.drinksUsedToday = 0;
  state.tavern.firstMissionBonusClaimed = false;
  state.tavern.dailyQuestCounter = 0;
  state.tavern.lastDailyResetDate = today;
}
```

---

## 8. 并发控制

正式版必须防止同一玩家多个 action 并发执行。

必须实现二选一：

### 方案 A：Player-level mutex

```ts
await withPlayerLock(playerId, async () => {
  const state = normalizeGameState(loadState(playerId), now);
  applyDailyReset(state, now);
  const result = dispatchAction(state, action, payload, now);
  saveState(playerId, state);
  return result;
});
```

### 方案 B：stateRevision 乐观锁

保存时检查：

```txt
where playerId = ? and stateRevision = oldRevision
```

失败则重试或返回冲突。

当前阶段建议先做方案 A。

必须覆盖这些并发场景：

```txt
两个 START_MISSION 同时到达，只能一个成功。
两个 COMPLETE_MISSION 同时到达，只能发一次奖。
SKIP_MISSION 和 COMPLETE_MISSION 同时到达，只能结算一次。
TAVERN_DRINK 连点时，drinksUsedToday 不得超过 10。
```

---

## 9. SeededRandom

新增：

```txt
server/src/lib/rng.ts
```

要求：

```ts
export class SeededRandom {
  constructor(seed: string | number);

  next(): number; // [0, 1)

  int(minInclusive: number, maxInclusive: number): number;

  range(minInclusive: number, maxExclusive: number): number;

  chanceBp(bp: number): boolean;

  pick<T>(items: T[]): T;
}
```

注意：

- 可以用 Mulberry32 / xmur3 / LCG。
- 同一个 seed 必须稳定生成同样结果。
- 任务生成、装备生成、敌人生成、战斗模拟都支持 seed。
- seed 不得提前返回给客户端。

---

## 10. 任务生成 generateMissionOffers

### 10.1 触发时机

以下情况可以生成三选一：

```txt
TAVERN_GET_INFO 时，状态 IDLE 且 missionOffers 为空。
GENERATE_MISSIONS 时，状态 IDLE 且 missionOffers 为空。
COMPLETE_MISSION 结算完成后，自动生成下一组三选一。
SKIP_MISSION 结算完成后，自动生成下一组三选一。
```

禁止生成：

```txt
已有 missionOffers 时禁止重抽。
activeMission 不为空时禁止生成。
IN_PROGRESS / READY_TO_COMPLETE 状态禁止生成。
```

### 10.2 生成流程

```ts
export function generateMissionOffers(state: GameState, now: number): MissionOffer[] {
  const status = getTavernStatus(state, now);

  if (status !== "IDLE") {
    return state.tavern.missionOffers;
  }

  if (state.tavern.missionOffers.length > 0) {
    return state.tavern.missionOffers;
  }

  state.tavern.offerSeq += 1;

  const offerSetId = createOfferSetId(state.player.id, state.tavern.offerSeq, now);

  const seed = createSeed("tavern-offers", state.player.id, state.tavern.offerSeq, now);
  const rng = new SeededRandom(seed);

  const offers = [0, 1, 2].map((slotIndex) => {
    return createMissionOffer(state, {
      now,
      rng,
      offerSetId,
      offerSeq: state.tavern.offerSeq,
      slotIndex: slotIndex as 0 | 1 | 2,
    });
  });

  state.tavern.missionOffers = offers;
  return offers;
}
```

### 10.3 时长计算

```ts
const baseDurationMin = pickDurationByLevel(player.level, rng);
const baseDurationSec = baseDurationMin * 60;

const timeMultiplierBp = getCurrentMountMultiplierBp(state.mount, now);

const actualDurationSec = Math.floor(baseDurationSec * timeMultiplierBp / 10000);

const thirstCostSec = actualDurationSec;
```

正式规则：

```txt
坐骑缩短任务时间，也同步减少干粮消耗。
thirstCostSec 必须等于 actualDurationSec。
```

例如：

```txt
20 分钟任务，无坐骑：1200 秒，消耗 1200 干粮秒。
20 分钟任务，-50% 坐骑：600 秒，消耗 600 干粮秒。
5 分钟任务，-50% 坐骑：150 秒，消耗 150 干粮秒。
```

### 10.4 奖励生成

奖励必须分成两层：

```txt
visibleReward: 给客户端看的奖励预览。
rewardSnapshot: 接任务后锁定的完整奖励。
```

任务 offer 阶段只保存 `visibleReward`。  
完整 `rewardSnapshot` 在 `START_MISSION` 时生成并锁定。

奖励公式先配置化，不要写死散落在代码里。

建议初始公式：

```ts
function calcBaseXp(level: number, durationSec: number, rng: SeededRandom): number {
  const durationMin = durationSec / 60;
  return Math.floor(durationMin * (level * 10 + rng.int(5, 15)));
}

function calcBaseCopper(level: number, durationSec: number, rng: SeededRandom): number {
  const durationMin = durationSec / 60;
  return Math.floor(durationMin * (level * 5 + rng.int(2, 8)));
}
```

奖励倾向：

```ts
const profiles = ["xpFocused", "copperFocused", "balanced"];
```

但不要永远固定 slot 0 = 经验、slot 1 = 铜钱、slot 2 = 均衡。  
应该随机分配，并做软约束。

---

## 11. TAVERN_GET_INFO

### 11.1 行为

```txt
1. normalizeGameState
2. applyDailyReset
3. 计算 TavernStatus
4. 如果 IDLE 且 missionOffers 为空，则 generateMissionOffers
5. 返回客户端可见酒馆状态
6. 不泄露 combatSeed / rewardSnapshot / playerCombatSnapshot
```

### 11.2 请求

```json
{
  "action": "TAVERN_GET_INFO",
  "payload": {}
}
```

### 11.3 响应类型

```ts
export type TavernGetInfoResponse = {
  serverTime: number;

  tavern: {
    status: TavernStatus;

    lastDailyResetDate: string;

    thirstSecRemaining: number;
    baseThirstSec: number;

    drinksUsedToday: number;
    maxDrinksPerDay: number;
    drinkRestoreSec: number;

    firstMissionBonusAvailable: boolean;

    missionOffers: MissionOfferView[];

    activeMission: ActiveMissionView | null;

    lastSettlement: MissionSettlementView | null;
  };

  mount: {
    timeMultiplierBp: number;
    expiresAt: number | null;
    isActive: boolean;
    name?: string;
    tier?: string;
  };
};
```

### 11.4 MissionOfferView

```ts
export type MissionOfferView = {
  missionId: string;
  offerSetId: string;
  slotIndex: number;

  title: string;
  description: string;
  locationName?: string;

  baseDurationSec: number;
  actualDurationSec: number;
  thirstCostSec: number;

  rewardPreview: {
    xp: number;
    copper: number;

    hasEquipment: boolean;
    equipmentPreview?: {
      slot: string;
      rarity: number;
      name?: string;
    };

    hasDungeonKey: boolean;
    dungeonKeyPreview?: {
      dungeonId: string;
      name: string;
    };

    hasHourglass?: boolean;
  };

  enemyPreview: {
    name: string;
    level: number;
  };
};
```

### 11.5 ActiveMissionView

```ts
export type ActiveMissionView = {
  missionId: string;
  offerSetId: string;

  title: string;
  description: string;
  locationName?: string;

  startedAt: number;
  endTime: number;

  baseDurationSec: number;
  actualDurationSec: number;
  thirstCostSec: number;

  remainingSec: number;

  rewardPreview: {
    xp: number;
    copper: number;
    hasEquipment: boolean;
    hasDungeonKey: boolean;
    hasHourglass?: boolean;
  };
};
```

### 11.6 不允许出现在响应里的字段

以下字段不得返回给客户端：

```txt
combatSeed
rewardSeed
rewardSnapshot
hiddenRolls
playerCombatSnapshot
enemySnapshot 完整战斗属性
settlementStatus 内部值
```

---

## 12. GENERATE_MISSIONS

### 12.1 行为

`GENERATE_MISSIONS` 是兼容旧动作的“确保任务存在”接口，不是刷新接口。

```txt
如果 IDLE 且 missionOffers 为空：生成三选一。
如果 IDLE 且 missionOffers 已存在：原样返回。
如果 activeMission 存在：返回当前 activeMission，不生成。
```

### 12.2 请求

```json
{
  "action": "GENERATE_MISSIONS",
  "payload": {}
}
```

### 12.3 响应

可以复用 `TAVERN_GET_INFO` 响应。

---

## 13. TAVERN_DRINK

### 13.1 行为

```txt
消耗 1 枚通宝。
thirstSecRemaining += 1200。
drinksUsedToday += 1。
每日最多 10 次。
不封顶到 6000 秒。
```

### 13.2 校验

```txt
drinksUsedToday < 10
player.tokens >= 1
```

### 13.3 错误

```ts
"TAVERN_DRINK_LIMIT_REACHED"
"NOT_ENOUGH_TOKENS"
```

### 13.4 重要规则

如果当前 `thirstSecRemaining = 6000`，喝酒后应为：

```txt
7200
```

不是：

```txt
6000
```

---

## 14. START_MISSION

### 14.1 请求

兼容旧客户端：

```json
{
  "action": "START_MISSION",
  "payload": {
    "missionId": "mission_xxx"
  }
}
```

建议新客户端增加：

```json
{
  "action": "START_MISSION",
  "payload": {
    "missionId": "mission_xxx",
    "offerSetId": "offer_xxx"
  }
}
```

### 14.2 校验

必须校验：

```txt
1. 当前状态必须是 IDLE。
2. activeMission 必须为空。
3. missionOffers 必须存在。
4. missionId 必须属于当前 missionOffers。
5. 如果 payload 带 offerSetId，则必须匹配。
6. thirstSecRemaining >= selectedMission.thirstCostSec。
```

错误码：

```ts
"MISSION_ALREADY_IN_PROGRESS"
"MISSION_NOT_FOUND"
"OFFER_SET_MISMATCH"
"NOT_ENOUGH_THIRST"
```

### 14.3 开始任务流程

```ts
export function startMission(state: GameState, payload: StartMissionPayload, now: number) {
  const offer = findMissionOffer(state.tavern.missionOffers, payload);

  assertCanStartMission(state, offer);

  const playerCombatSnapshot = buildPlayerCombatSnapshot(state);
  const enemySnapshot = buildEnemySnapshot(state, offer);

  const rewardSeed = createSeed("mission-reward", state.player.id, offer.missionId, now);
  const combatSeed = createSeed("mission-combat", state.player.id, offer.missionId, now);

  const rewardSnapshot = buildRewardSnapshot(state, offer, rewardSeed);

  const activeMission: ActiveMission = {
    missionId: offer.missionId,
    offerSetId: offer.offerSetId,
    offerSeq: offer.offerSeq,
    slotIndex: offer.slotIndex,

    title: offer.title,
    description: offer.description,
    locationName: offer.locationName,

    startedAt: now,
    endTime: now + offer.actualDurationSec * 1000,

    baseDurationSec: offer.baseDurationSec,
    actualDurationSec: offer.actualDurationSec,
    thirstCostSec: offer.thirstCostSec,

    mountSnapshot: {
      timeMultiplierBp: getCurrentMountMultiplierBp(state.mount, now),
      name: state.mount.name,
      tier: state.mount.tier,
      capturedAt: now,
    },

    playerCombatSnapshot,
    enemySnapshot,
    rewardSnapshot,

    combatSeed,
    rewardSeed,

    settlementStatus: "UNSETTLED",
    rewardGranted: false,
  };

  state.tavern.thirstSecRemaining -= offer.thirstCostSec;
  state.tavern.dailyQuestCounter += 1;

  state.tavern.activeMission = activeMission;
  state.tavern.missionOffers = [];

  return buildStartMissionResponse(state, activeMission, now);
}
```

### 14.4 每日首单奖励规则

建议采用：

```txt
在 START_MISSION 时锁定每日首单奖励。
```

规则：

```txt
如果 firstMissionBonusClaimed = false：
  rewardSnapshot.tokens += 1
  rewardSnapshot.firstMissionBonusApplied = true
  firstMissionBonusClaimed = true

如果任务失败：
  不发这个 token。
  但今日首单机会已经消耗。
```

这样可以防止失败刷首单，也可以防止客户端反复找任务。

---

## 15. COMPLETE_MISSION

### 15.1 请求

```json
{
  "action": "COMPLETE_MISSION",
  "payload": {}
}
```

### 15.2 校验

```txt
如果 activeMission 存在：
  now >= activeMission.endTime 才能结算。

如果 activeMission 不存在：
  如果 lastSettlement 存在，返回 lastSettlement 作为幂等响应。
  否则返回 NO_ACTIVE_MISSION。
```

错误码：

```ts
"MISSION_NOT_FINISHED"
"NO_ACTIVE_MISSION"
```

### 15.3 结算流程

```ts
export function completeMission(state: GameState, now: number): CompleteMissionResponse {
  const active = state.tavern.activeMission;

  if (!active) {
    if (state.tavern.lastSettlement) {
      return buildAlreadySettledResponse(state.tavern.lastSettlement, now);
    }

    throw new GameError("NO_ACTIVE_MISSION");
  }

  if (now < active.endTime) {
    throw new GameError("MISSION_NOT_FINISHED");
  }

  if (active.settlementStatus === "SETTLED") {
    return buildAlreadySettledResponse(state.tavern.lastSettlement, now);
  }

  const battleResult = serverSimulateBattle({
    player: active.playerCombatSnapshot,
    enemy: active.enemySnapshot,
    seed: active.combatSeed,
  });

  const before = capturePlayerResourceSnapshot(state);

  let grantedReward: GrantedReward = emptyGrantedReward();
  let rewardGranted = false;

  if (battleResult.playerWon) {
    grantedReward = grantRewardSnapshot(state, active.rewardSnapshot);
    rewardGranted = true;
  }

  const after = capturePlayerResourceSnapshot(state);

  const settlement: MissionSettlement = {
    missionId: active.missionId,
    offerSetId: active.offerSetId,
    settledAt: now,
    result: battleResult.playerWon ? "SUCCESS" : "FAILED",
    rewardGranted,
    rewardSnapshot: active.rewardSnapshot,
    grantedReward,
    battleResult,
    playerDelta: buildPlayerDelta(before, after),
  };

  active.settlementStatus = "SETTLED";
  active.rewardGranted = rewardGranted;

  state.tavern.lastSettlement = settlement;
  state.tavern.activeMission = null;

  generateMissionOffers(state, now);

  return buildCompleteMissionResponse(state, settlement, now);
}
```

### 15.4 失败规则

任务失败时：

```txt
干粮不返还。
时间不返还。
不发 XP。
不发铜钱。
不发装备。
不发钥匙。
不发首单 token。
任务结束。
生成下一组三选一。
```

失败也必须写入 `lastSettlement`，防止重复结算。

---

## 16. SKIP_MISSION

### 16.1 请求

```json
{
  "action": "SKIP_MISSION",
  "payload": {}
}
```

### 16.2 行为

`SKIP_MISSION` 必须直接完成并结算，而不是只把 `endTime` 改成当前时间。

优先消耗：

```txt
1. hourglass
2. tokens
```

如果当前项目暂时没有沙漏字段，则先消耗 1 枚通宝。

### 16.3 流程

```ts
export function skipMission(state: GameState, now: number): CompleteMissionResponse {
  const active = state.tavern.activeMission;

  if (!active) {
    if (state.tavern.lastSettlement) {
      return buildAlreadySettledResponse(state.tavern.lastSettlement, now);
    }

    throw new GameError("NO_ACTIVE_MISSION");
  }

  consumeSkipCost(state);

  active.endTime = now;

  return completeMission(state, now);
}
```

### 16.4 校验

```txt
必须有 activeMission。
必须有足够沙漏或通宝。
如果任务已经结算，不得重复扣费。
```

错误码：

```ts
"NO_ACTIVE_MISSION"
"NOT_ENOUGH_SKIP_RESOURCE"
```

---

## 17. CompleteMissionResponse

`COMPLETE_MISSION` 和 `SKIP_MISSION` 都返回这个结构。

```ts
export type CompleteMissionResponse = {
  serverTime: number;

  result: "SUCCESS" | "FAILED" | "ALREADY_SETTLED";

  missionId: string;
  offerSetId: string;

  battleResult: BattleResultView;

  rewardGranted: boolean;

  grantedReward: {
    xp: number;
    copper: number;
    tokens: number;
    hourglass: number;

    equipment?: EquipmentView;

    dungeonKey?: DungeonKeyView;
  };

  playerDelta: {
    levelBefore: number;
    levelAfter: number;

    xpBefore: number;
    xpAfter: number;

    copperBefore: number;
    copperAfter: number;

    tokensBefore: number;
    tokensAfter: number;
  };

  nextMissionOffers: MissionOfferView[];

  tavern: {
    status: TavernStatus;
    thirstSecRemaining: number;
    drinksUsedToday: number;
    firstMissionBonusAvailable: boolean;
  };
};
```

---

## 18. 战斗模拟 serverSimulateBattle

### 18.1 要求

`serverSimulateBattle` 必须支持 seed。

```ts
export function serverSimulateBattle(input: {
  player: PlayerCombatSnapshot;
  enemy: EnemySnapshot;
  seed: string;
}): BattleResult;
```

### 18.2 返回

```ts
export type BattleResult = {
  playerWon: boolean;
  rounds: BattleRound[];
  playerHpEnd: number;
  enemyHpEnd: number;
  totalRounds: number;
};
```

### 18.3 客户端可见 BattleResultView

```ts
export type BattleResultView = {
  playerWon: boolean;
  rounds: BattleRoundView[];
  playerHpEnd: number;
  enemyHpEnd: number;
  totalRounds: number;
};
```

### 18.4 失败率要求

普通任务前期目标胜率建议：

```txt
95%+
```

失败是为了保留经典味道，不应让玩家频繁挫败。

战斗难度必须可配置，例如：

```ts
enemyPowerRatioBp = rng.int(8500, 11500);
```

或通过 `battleTuning.normalQuestTargetWinRateBp` 调整。

---

## 19. 装备生成 equipmentGenerator

`generateEquipment` 必须支持 rng 注入。

```ts
export function generateEquipment(input: {
  playerLevel: number;
  slot?: string;
  rarity?: number;
  rng?: SeededRandom;
}): Equipment;
```

任务奖励中生成装备必须使用 `rewardSeed`，保证可复现。

---

## 20. 响应脱敏规则

以下字段是服务端私有字段，任何客户端响应中不得出现：

```txt
combatSeed
rewardSeed
rewardSnapshot
hiddenRolls
playerCombatSnapshot
enemySnapshot.combatStats
enemySnapshot.attributes
settlementStatus
```

QA 必须做 JSON 字符串搜索，确保响应里没有这些字段。

---

## 21. 错误码

建议统一：

```ts
type TavernErrorCode =
  | "MISSION_ALREADY_IN_PROGRESS"
  | "MISSION_NOT_FOUND"
  | "OFFER_SET_MISMATCH"
  | "NOT_ENOUGH_THIRST"
  | "MISSION_NOT_FINISHED"
  | "NO_ACTIVE_MISSION"
  | "NOT_ENOUGH_TOKENS"
  | "NOT_ENOUGH_SKIP_RESOURCE"
  | "TAVERN_DRINK_LIMIT_REACHED"
  | "INVALID_TAVERN_STATE";
```

错误响应：

```ts
type ActionErrorResponse = {
  ok: false;
  errorCode: TavernErrorCode;
  message: string;
  serverTime: number;
};
```

---

## 22. Debug 兼容

现有 `DEBUG_CHEAT` 的 `food` preset 必须兼容。

```ts
case "food":
case "thirst":
  state.tavern.thirstSecRemaining += 100 * 60;
  break;
```

不要因为 `rations` 删除导致旧 debug 脚本失效。

---

## 23. 自动化测试要求

必须新增以下测试。

### 23.1 旧存档迁移

```txt
输入 v3 state:
  rations = 100
  availableMissions = [...]
  activeMission = null

期望:
  schemaVersion = 4
  tavern.thirstSecRemaining = 6000
  tavern.missionOffers 迁移成功
  state.rations 被移除
```

### 23.2 喝酒不封顶

```txt
初始:
  thirstSecRemaining = 6000
  drinksUsedToday = 0
  tokens = 1

执行:
  TAVERN_DRINK

期望:
  thirstSecRemaining = 7200
  drinksUsedToday = 1
  tokens -1
```

### 23.3 买酒次数上限

```txt
drinksUsedToday = 10
执行 TAVERN_DRINK
期望 TAVERN_DRINK_LIMIT_REACHED
```

### 23.4 三选一不重抽

```txt
连续调用 TAVERN_GET_INFO 10 次
期望 missionOffers 完全一致
```

### 23.5 GENERATE_MISSIONS 防刷新

```txt
已有 missionOffers
调用 GENERATE_MISSIONS
期望 missionOffers 不变
```

### 23.6 坐骑 BP 计算

```txt
baseDurationSec = 1200
timeMultiplierBp = 5000

期望:
actualDurationSec = 600
thirstCostSec = 600
```

### 23.7 坐骑过期不影响进行中任务

```txt
开始任务时 timeMultiplierBp = 5000
任务进行中坐骑 expiresAt 过期
期望 activeMission.actualDurationSec 不变
```

### 23.8 午夜跨天任务保留

```txt
23:55 开始 20 分钟任务
00:00 applyDailyReset
期望:
  activeMission 不丢失
  thirstSecRemaining 重置为 6000
  drinksUsedToday = 0
```

### 23.9 SKIP_MISSION 幂等

```txt
执行 SKIP_MISSION 成功结算
再次执行 COMPLETE_MISSION
期望:
  返回 ALREADY_SETTLED 或 lastSettlement
  不重复发 XP / 铜钱 / 装备 / 通宝
```

### 23.10 COMPLETE_MISSION 幂等

```txt
任务到期
同时发两个 COMPLETE_MISSION
期望:
  只发一次奖励
```

### 23.11 失败不发奖

```txt
强制 battleResult.playerWon = false

期望:
  rewardGranted = false
  XP 不变
  copper 不变
  equipment 不增加
  activeMission 清空
  nextMissionOffers 生成
```

### 23.12 响应脱敏

```txt
调用 TAVERN_GET_INFO
JSON.stringify(response) 不得包含:
  combatSeed
  rewardSeed
  rewardSnapshot
  playerCombatSnapshot
  hiddenRolls
```

### 23.13 START_MISSION 并发

```txt
两个 START_MISSION 同时到达
期望:
  一个成功
  一个返回 MISSION_ALREADY_IN_PROGRESS 或 INVALID_TAVERN_STATE
```

### 23.14 SKIP + COMPLETE 并发

```txt
任务接近完成
同时发 SKIP_MISSION 和 COMPLETE_MISSION
期望:
  只结算一次
  最多扣一次 skip 费用
```

### 23.15 响应结构 snapshot

对以下响应做结构快照测试：

```txt
TAVERN_GET_INFO
START_MISSION
COMPLETE_MISSION
SKIP_MISSION
TAVERN_DRINK
```

防止字段随意漂移，影响 Client Agent 对接。

---

## 24. Client Agent 对接要求

Client Agent 只依赖以下字段：

```txt
TAVERN_GET_INFO.tavern.status
TAVERN_GET_INFO.tavern.thirstSecRemaining
TAVERN_GET_INFO.tavern.missionOffers
TAVERN_GET_INFO.tavern.activeMission
TAVERN_GET_INFO.mount
```

客户端倒计时必须基于：

```txt
serverTime
activeMission.endTime
```

不要使用本地时间直接判断任务是否完成。

客户端可以本地展示倒计时，但最终能否完成由服务端 `COMPLETE_MISSION` 决定。

---

## 25. Done Definition

本任务完成必须满足：

1. 旧存档不会崩。
2. `rations` 已迁移为 `thirstSecRemaining`。
3. 每日重置正确。
4. 买酒可超过 6000 秒。
5. 三选一任务不会被刷新刷收益。
6. 坐骑减少实际时间和干粮消耗。
7. 任务开始时锁定所有快照。
8. 完成任务由服务端战斗决定胜负。
9. 失败不发主奖励。
10. `SKIP_MISSION` 直接结算。
11. `COMPLETE_MISSION` / `SKIP_MISSION` 幂等。
12. 响应中不泄露 seed 和隐藏快照。
13. 自动化测试全部通过。
14. Client Agent 可以只根据响应类型完成 UI 对接。

---

## 26. 实施顺序建议

建议按以下顺序开发：

1. `classicTavernRules.ts`
2. `rng.ts`
3. `gameState.ts` 类型更新
4. `normalizeGameState`
5. `applyDailyReset`
6. `generateMissionOffers`
7. `TAVERN_GET_INFO`
8. `TAVERN_DRINK`
9. `START_MISSION`
10. `serverSimulateBattle(seed)`
11. `COMPLETE_MISSION`
12. `SKIP_MISSION`
13. `equipmentGenerator rng 注入`
14. Debug 兼容
15. 自动化测试
16. 响应脱敏测试
17. Client 对接联调

---

## 27. 特别提醒

不要把本次任务实现成“能跑就行”的酒馆原型。

本模块以后会承载：

```txt
每日留存
付费买酒
坐骑价值
装备掉落
钥匙解锁
战斗成长反馈
客户端任务 UI
```

所以服务端状态、幂等、seed、快照、响应结构必须一次打稳。
