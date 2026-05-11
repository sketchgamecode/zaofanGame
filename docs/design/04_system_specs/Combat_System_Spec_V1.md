# 战斗系统设计规格 (Combat System Spec)
Status: Draft for Server/Client Implementation
Designer: Codex Designer Agent
Reference: Shakes & Fidget combat, arena, tavern reports and screenshots
Last Updated: 2026-05-11

---

## 1. 目标与边界

本规格用于把当前 placeholder 战斗替换为接近 Shakes & Fidget 的正式自动战斗系统。战斗由 server 即时结算，client 只播放 server 返回的回放数据。

战斗回放同时是一个可持久化对象。除酒馆任务允许玩家手动选择是否保存外，竞技场、地下城、要塞进攻、要塞防守等关键战斗都必须自动保存，并通过邮箱的“战斗回放”页签提供观看入口。

首版只覆盖当前已定义的 5 个职业：

| ID | 题材名 | S&F 原型 | 主属性 |
| :--- | :--- | :--- | :--- |
| `CLASS_A` | 猛将 | Warrior | `strength` |
| `CLASS_B` | 游侠 | Scout | `agility` |
| `CLASS_C` | 谋士 | Mage | `intelligence` |
| `CLASS_D` | 杀手 | Assassin | `agility` |
| `CLASS_E` | 绿林好汉 | Berserker | `strength` |

不在首版实现的 S&F 高级职业：Battle Mage、Demon Hunter、Druid、Bard、Necromancer、Paladin。它们的字段扩展点应预留，但不得混入首版平衡。

---

## 2. 参考结论

### 2.1 从 S&F 资料确认的核心规则

- 战斗全自动，玩家不能在战斗中输入指令。
- 战斗是回合制，双方轮流攻击。
- 伤害主要由武器伤害、职业武器系数、主属性对抗、护甲减伤、暴击和怒气倍率共同决定。
- 职业差异是系统核心：战士格挡、游侠闪避、法师绕甲必中、刺客双持、狂战士连击。
- 怒气倍率用于避免持久战无限拖延，回合越后伤害越高。
- 竞技场从候选对手中选择目标，战斗结果给 XP、荣誉和排名变化。
- 名人堂是竞技场匹配和玩家镜像查看的来源。

### 2.2 从截图确认的 client 表现需求

竞技场首页：

- 显示今日竞技场 XP 进度，例如 `1/10 XP`。
- 一次展示 3 个候选对手。
- 每个候选卡显示头像、等级、职业/武器小图标、荣誉值、五属性。

战斗播放：

- 左右双方大头像和名称等级。
- 双方 HP 条展示 `current / max`。
- 每次攻击在目标身上弹出伤害数字。
- 底部有播放/跳过按钮。

结算弹窗：

- 显示 `WIN` / `LOSE`。
- 显示 XP、荣誉变化、排名变化。
- 背景保持战斗画面并降低亮度。

名人堂：

- Heroes tab 按荣誉排名显示 `Rank / Name / Guild / Level / Honor`。
- 选中某行后右侧展示角色镜像：头像、装备槽、等级、属性、暴击率、护甲减伤等。
- 需要支持按排名/名称搜索定位。

邮箱战斗回放：

- 邮箱顶部有多个页签，其中交叉剑图标页签用于战斗回放。
- 列表每条显示战斗来源图标、对方/敌人名称、来源类型、日期和时间。
- 底部有 `SHOW COMBAT` 按钮，点击后播放已保存的战斗。
- 竞技场、要塞进攻、要塞防守来自其他玩家，右侧预览展示对方角色镜像，并保留查看玩家信息入口。
- 地下城回放右侧展示地下城章节、层数、怪物图、怪物等级、描述文本。
- 酒馆任务回放右侧展示任务标题和任务/敌人图片，不展示玩家详情入口。
- 要塞防守回放额外提供 `COUNTERATTACK` 入口，用于反击攻击者。

---

## 3. 战斗数值模型

### 3.1 战斗快照

战斗开始前必须冻结双方快照。战斗过程不得读取实时存档，避免装备/属性在回放期间变化。

```typescript
type CombatantSnapshot = {
  id: string;
  displayName: string;
  level: number;
  classId: PlayerClassId;
  attributes: BaseAttributeValues; // total attributes
  armor: number;
  weaponDamage: { min: number; max: number };
  honor?: number;
  rank?: number;
  avatarId?: string;
  equipmentSummary?: {
    weaponId?: string;
    offHandId?: string;
    itemPowerTotal: number;
  };
};
```

Server 可继续保留 `PlayerCombatSnapshot` / `EnemySnapshot`，但正式战斗引擎必须包含 `classId`、五属性、武器伤害、护甲、等级。仅传 `damageMin/damageMax` 的旧模型不够支持 S&F 公式。

### 3.2 职业常量

| ID | HP 倍率 | 武器系数 | 护甲减伤上限 | 特性 |
| :--- | ---: | ---: | ---: | :--- |
| `CLASS_A` | 5 | 2.0 | 50% | 25% 格挡 |
| `CLASS_B` | 4 | 2.5 | 25% | 50% 闪避 |
| `CLASS_C` | 2 | 4.5 | 10% | 绕甲、必中、不可被格挡/闪避 |
| `CLASS_D` | 4 | 2.0 | 25% | 每轮双持攻击 2 次，单次伤害系数 0.625 |
| `CLASS_E` | 4 | 2.0 | 25% | 50% 概率追加攻击，最多 15 连；有效护甲减半 |

说明：

- `CLASS_E` 在外部资料中写作最大减伤 50% 但护甲减半；当前项目已有 `armorCap=25` 且 `armorHalved=true`。正式版建议定为“有效上限 25% 且参与计算前护甲值 ×0.5”，表现更接近脆皮高爆发。
- `CLASS_D` 第二把武器当前存档只有 `offHand` 字段，首版若没有副手武器伤害，可用主武器伤害复制为副手，后续再允许高品质副手生成 `weaponDamage`。

### 3.3 HP

```text
MaxHP = ceil(Constitution_Total * ClassHPMultiplier * (Level + 1))
```

后续药水、宠物、符文、收藏册加成应作为乘法项追加，首版不实现。

### 3.4 暴击率

```text
CritChance = min(50%, Luck_Total * 2.5 / TargetLevel / 100)
```

实现建议：

```typescript
critChanceBp = min(5000, floor(luck * 2.5 / max(1, targetLevel)))
```

暴击倍率首版采用 S&F 基础值：

```text
CritMultiplier = 2.0
```

当前 server placeholder 使用 `1.75`，应替换为 `2.0`。竞技场荣誉差暴击倍率加成可作为 P1，不阻塞首版战斗。

### 3.5 主属性对抗因子

```text
AttrFactor = 1 + max(OwnMainStat / 2, OwnMainStat - EnemyMainStat / 2) / 10
```

这是 S&F 战斗的核心。它同时让主属性决定输出，也让提升对应副属性能降低对手打自己的伤害。

### 3.6 护甲减伤

```text
ArmorReduction = min(ClassArmorCap, EffectiveArmor / AttackerLevel)
```

百分比实现建议：

```typescript
armorReductionBp = min(classArmorCapBp, floor(effectiveArmor * 10000 / max(1, attackerLevel) / 100))
```

更直观的实现：

```typescript
armorReductionPercent = min(classArmorCapPercent, effectiveArmor / max(1, attackerLevel));
```

注意 `effectiveArmor / attackerLevel` 的单位是百分比值。例如护甲 1500、攻击者等级 50，结果为 30%，即 `0.30`。

特殊规则：

- `CLASS_C` 攻击时目标护甲减伤视为 0。
- `CLASS_C` 攻击不可被格挡或闪避。
- `CLASS_E` 防御时 `effectiveArmor = floor(rawArmor * 0.5)`。

### 3.7 怒气倍率

```text
RageMultiplier = 1 + RoundNumber / 6
```

首轮建议使用 `RoundNumber = 0`，即第一次行动为 1.0 倍。第 7 个完整回合附近开始接近 2.0 倍。

行动内追加攻击不增加完整回合数：

- `CLASS_D` 的双持两击属于同一行动。
- `CLASS_E` 的连击属于同一行动，连击期间不递增怒气。

### 3.8 单次伤害公式

```text
Damage =
  random(WeaponMin, WeaponMax)
  * ClassWeaponFactor
  * ClassAttackFactor
  * AttrFactor
  * (1 - ArmorReduction)
  * CritMultiplier(if crit)
  * RageMultiplier
```

取整规则：

- 所有中间值保留浮点。
- 最终伤害 `floor` 后至少为 1。
- 若被格挡/闪避，伤害为 0，不触发暴击。

`ClassAttackFactor` 首版：

| ID | 数值 | 说明 |
| :--- | ---: | :--- |
| `CLASS_A` | 1.0 | 标准 |
| `CLASS_B` | 1.0 | 标准 |
| `CLASS_C` | 1.0 | 高武器系数已补偿 |
| `CLASS_D` | 0.625 | 每次攻击系数，行动内攻击两次 |
| `CLASS_E` | 1.0 | 爆发来自连击，暂不额外给 1.25 |

---

## 4. 回合流程

### 4.1 初始化

1. 生成 deterministic seed。
2. 冻结双方 `CombatantSnapshot`。
3. 计算双方 `maxHp/currentHp`。
4. 判断先攻：
   - 酒馆/地下城：玩家先攻。
   - 竞技场：荣誉高者先攻；荣誉相同则用 seed 随机。
5. 初始化 `roundNumber = 0`、`actionIndex = 0`。

### 4.2 行动流程

一次行动由当前攻击者执行，可能包含一次或多次 hit。

```text
Action Start
  -> 确定 hit 列表
     CLASS_D: 2 hits
     CLASS_E: 1 hit, 每次命中后 50% 判定是否追加，最多 15 hits
     其他职业: 1 hit
  -> 对每个 hit:
     1. 若攻击者不是 CLASS_C，先判定目标格挡/闪避
     2. 未格挡/闪避时计算基础伤害、暴击、护甲、怒气
     3. 扣减目标 HP
     4. 记录 hit 事件
     5. 若目标 HP <= 0，战斗结束
  -> 攻守交换
  -> 若双方各行动过一次，roundNumber += 1
```

### 4.3 防御判定顺序

1. 如果攻击者是 `CLASS_C`，跳过全部防御判定。
2. 若目标是 `CLASS_A`，按 25% 判定格挡。
3. 若目标是 `CLASS_B`，按 50% 判定闪避。
4. 当前首版 `CLASS_D` 不提供闪避，避免与 S&F 刺客规则混淆。

格挡和闪避都完全取消本 hit 伤害。

### 4.4 战斗结束保护

- 最大行动数：`200`。
- 达到上限仍未死亡时，HP 高者胜；HP 相同则后手方失败。
- 正式环境中 200 行动应极少触达，若触达需在日志中记录 `endedBy: 'ROUND_LIMIT'`。

---

## 5. BattleResult 数据契约

`BattleResultV2` 是当前正式战斗播放与回放归档的唯一契约。旧 `BattleResult.rounds` / `BattleRound` 不再保留兼容映射；项目遵循清档升级原则，详见 `server/tdd/server_agent_common_rules.md`。

```typescript
type BattleHitEvent = {
  hitIndex: number;
  attacker: 'player' | 'enemy';
  defender: 'player' | 'enemy';
  attackerClassId: PlayerClassId;
  defenderClassId: PlayerClassId;
  rawWeaponRoll: number;
  damage: number;
  targetHpAfter: number;
  wasCrit: boolean;
  wasBlocked: boolean;
  wasDodged: boolean;
  armorReductionBp: number;
  rageMultiplierBp: number;
};

type BattleActionEvent = {
  actionIndex: number;
  roundNumber: number;
  attacker: 'player' | 'enemy';
  hits: BattleHitEvent[];
};

type BattleResultV2 = {
  schemaVersion: 2;
  context: BattleContext;
  seedPublicHash: string;
  winner: 'player' | 'enemy';
  playerWon: boolean;
  player: {
    id: string;
    name: string;
    level: number;
    classId: PlayerClassId;
    hpMax: number;
    hpEnd: number;
  };
  enemy: {
    id: string;
    name: string;
    level: number;
    classId: PlayerClassId;
    hpMax: number;
    hpEnd: number;
  };
  actions: BattleActionEvent[];
  totalActions: number;
  totalRounds: number;
  endedBy: 'KNOCKOUT' | 'ROUND_LIMIT';
};
```

```typescript
type BattleContext =
  | 'MISSION'
  | 'ARENA'
  | 'DUNGEON'
  | 'FORTRESS_ATTACK'
  | 'FORTRESS_DEFENSE';
```

Client 回放最低需要：

- `hpMax/hpEnd`
- 每个 hit 的 `attacker/defender/damage/targetHpAfter`
- `wasCrit/wasBlocked/wasDodged`
- `roundNumber` 和 `hitIndex` 用于节奏控制

---

## 6. 战斗回放归档与邮箱入口

### 6.1 保存规则

| 来源 | 是否自动保存 | 邮箱列表类型 | 备注 |
| :--- | :--- | :--- | :--- |
| 酒馆任务 `MISSION` | 否，玩家手动选择 | `Quests` | 完成/跳过结算后提供“保存回放”按钮 |
| 竞技场 `ARENA` | 是 | `Arena` | 挑战其他玩家后自动进入战斗回放页签 |
| 地下城 `DUNGEON` | 是 | `Dungeon` | 每次地下城战斗自动保存 |
| 要塞进攻 `FORTRESS_ATTACK` | 是 | `Fortress attack` | 主动攻击其他玩家要塞后保存 |
| 要塞防守 `FORTRESS_DEFENSE` | 是 | `Fortress defense` | 被其他玩家攻击后保存，支持反击入口 |

酒馆任务之所以手动保存，是因为任务战斗量大、价值低，默认保存会快速污染邮箱。其他系统战斗有 PvP/进度/复盘价值，必须默认保存。

### 6.2 BattleReplayRecord

`BattleResultV2` 是战斗播放数据；`BattleReplayRecord` 是邮箱系统可索引、可预览、可打开的持久化记录。

```typescript
type BattleReplayRecord = {
  replayId: string; // battle_{context}_{time36}_{rand16}
  ownerPlayerId: string;
  context: BattleContext;
  createdAt: number;
  expiresAt?: number | null;
  isRead: boolean;
  isPinned?: boolean;
  listItem: BattleReplayListItem;
  preview: BattleReplayPreview;
  battleResult: BattleResultV2;
};

type BattleReplayListItem = {
  title: string; // opponent/enemy/quest display name
  subtitle: 'Arena' | 'Dungeon' | 'Fortress attack' | 'Fortress defense' | 'Quests';
  iconType: 'arena' | 'dungeon' | 'fortressAttack' | 'fortressDefense' | 'quest';
  occurredAt: number;
  outcome: 'WIN' | 'LOSE';
  canShowCombat: boolean;
  canCounterattack?: boolean;
  relatedPlayerId?: string;
};
```

### 6.3 Preview 数据

不同来源的右侧信息面板不同，不应强行复用同一个角色面板。

```typescript
type BattleReplayPreview =
  | {
      type: 'PLAYER';
      playerId: string;
      displayName: string;
      guildName?: string;
      avatarId?: string;
      level: number;
      classId: PlayerClassId;
      raceId?: RaceId;
      equipment: EquipmentState['equipped'];
      attributes: BaseAttributeValues;
      combatPreview: CombatPreviewView;
      actions: {
        canViewProfile: boolean;
        canChallengeArena?: boolean;
        canCounterattackFortress?: boolean;
      };
    }
  | {
      type: 'DUNGEON';
      dungeonId: string;
      dungeonName: string;
      floorIndex: number;
      floorCount: number;
      enemyId: string;
      enemyName: string;
      enemyLevel: number;
      enemyImageId: string;
      description: string;
    }
  | {
      type: 'QUEST';
      missionId: string;
      title: string;
      imageId: string;
      description?: string;
    };
```

Mapping:

- `ARENA` -> `PLAYER` preview，展示对手角色镜像。
- `FORTRESS_ATTACK` -> `PLAYER` preview，展示被攻击玩家镜像。
- `FORTRESS_DEFENSE` -> `PLAYER` preview，展示攻击者镜像，并 `canCounterattackFortress=true`。
- `DUNGEON` -> `DUNGEON` preview。
- `MISSION` -> `QUEST` preview。

### 6.4 Mail Actions

邮箱系统可独立实现，但战斗系统必须输出可被这些 actions 消费的数据。

#### `MAIL_GET_BATTLE_REPLAYS`

Payload:

```typescript
{
  cursor?: string;
  limit?: number;
  context?: BattleContext;
}
```

返回：

```typescript
{
  items: Array<{
    replayId: string;
    listItem: BattleReplayListItem;
    preview: BattleReplayPreview;
  }>;
  nextCursor?: string;
  unreadCount: number;
  capacity: number; // 默认 100
}
```

#### `MAIL_GET_BATTLE_REPLAY`

Payload:

```typescript
{ replayId: string }
```

返回：

```typescript
{
  replay: BattleReplayRecord;
}
```

#### `MAIL_SAVE_MISSION_REPLAY`

Payload:

```typescript
{ missionId: string; settlementId?: string }
```

规则：

- 仅能保存当前玩家自己的最近一次酒馆任务结算。
- 若已保存，返回已有 `replayId`，不得重复创建。
- 任务结算记录必须保留足够时间让玩家在结算界面点击保存；建议至少保留在 `tavern.lastSettlement` 中，直到下一次结算覆盖。

#### `MAIL_DELETE_BATTLE_REPLAY`

Payload:

```typescript
{ replayId: string }
```

用于玩家清理邮箱战斗回放。

### 6.5 存储策略

推荐存储位置：

- 短期 MVP：Supabase 独立表 `battle_replays`，不要塞进 `GameState`，避免存档膨胀。
- 单条记录保存完整 `BattleReplayRecord` JSON。
- `ownerPlayerId + createdAt` 建索引，邮箱列表倒序分页。
- 默认容量 `100` 条；超过容量时自动删除最旧的未置顶记录。
- `battleResult.seedPublicHash` 可以给 client 展示/调试，原始 seed 不下发。

要塞防守保存双份记录：

- 攻击者 owner 下保存 `FORTRESS_ATTACK`。
- 防守者 owner 下保存 `FORTRESS_DEFENSE`。
- 两条记录可共享同一个 `battleResult`，但 `preview/listItem/context/actions` 不同。

### 6.6 对战斗系统的影响

这项需求改变了原先“战斗结果只服务当前响应”的设计：

- `BattleResultV2` 必须是长期可播放的完整数据，不能依赖当前玩家存档再计算。
- 双方头像、名称、职业、等级、最大 HP 等展示所需字段必须写入 `BattleResultV2` 或 `BattleReplayPreview`。
- 生成战斗的系统必须同时决定是否创建 `BattleReplayRecord`。
- 来自其他玩家的回放必须保留 `relatedPlayerId` 和玩家快照入口。
- Client 的通用战斗回放组件不能假设“左侧永远是当前玩家、右侧永远是敌人”；邮箱打开要塞防守时，当前玩家可能是防守方。

---

## 7. 竞技场接入规格

### 7.1 ArenaState 建议扩展

```typescript
type ArenaState = {
  status: 'UNINITIALIZED' | 'DISABLED' | 'ACTIVE';
  honor: number;
  rank: number | null;
  dailyXpWins: number;
  maxDailyXpWins: number; // 默认 10
  fightsToday: number;
  lastDailyResetDate: string;
  cooldownEndTime: number | null;
  candidateSetId: string | null;
  candidates: ArenaOpponentPreview[];
};
```

`dailyWins` 建议改名为 `dailyXpWins` 或保留旧字段但语义固定为“今日竞技场 XP 奖励次数”，因为截图中 `1/10 XP` 不等于所有可发起战斗次数。

### 7.2 OpponentPreview

```typescript
type ArenaOpponentPreview = {
  candidateId: string;
  playerId: string;
  displayName: string;
  avatarId?: string;
  level: number;
  classId: PlayerClassId;
  raceId?: RaceId;
  honor: number;
  rank: number;
  guildName?: string;
  attributes: BaseAttributeValues;
  combatPreview: {
    hp: number;
    armor: number;
    damageMin: number;
    damageMax: number;
    critChanceBp: number;
    blockChanceBp?: number;
    dodgeChanceBp?: number;
  };
};
```

### 7.3 Actions

#### `ARENA_GET_INFO`

Payload:

```json
{}
```

返回：

```typescript
{
  arena: ArenaState;
  playerSummary: {
    honor: number;
    rank: number | null;
    dailyXpWins: number;
    maxDailyXpWins: number;
    cooldownRemainingMs: number;
  };
}
```

#### `ARENA_REFRESH_CANDIDATES`

Payload:

```json
{}
```

规则：

- 生成 3 个候选。
- 候选来源为名人堂玩家镜像 + bot。
- 优先选择玩家荣誉 `0.8x ~ 1.3x` 区间。
- 若池不足，逐步扩大到 `0.5x ~ 1.8x`。

#### `ARENA_FIGHT`

Payload:

```typescript
{ targetPlayerId: string; candidateSetId?: string }
```

校验：

- 角色必须 `ACTIVE`。
- 目标不能是自己。
- 若 `cooldownEndTime > now`，返回 `ARENA_COOLDOWN_ACTIVE`。
- 若候选集存在，目标必须属于当前候选；从名人堂直接挑战可不要求候选集。

返回：

```typescript
{
  result: 'WIN' | 'LOSE';
  battleResult: BattleResultV2;
  replayId: string;
  honorDelta: number;
  honorBefore: number;
  honorAfter: number;
  rankBefore: number | null;
  rankAfter: number | null;
  rankDelta: number | null;
  grantedReward: {
    xp: number;
    copper: number;
  };
  dailyXpWinsAfter: number;
  cooldownEndTime: number;
  nextCandidates?: ArenaOpponentPreview[];
}
```

#### `ARENA_SKIP_COOLDOWN`

规则：

- 优先消耗 `hourglasses` 1 个。
- 无沙漏时可消耗 `tokens` 1 个。
- 两者都不足返回 `INSUFFICIENT_PREMIUM_RESOURCE`。

### 7.4 荣誉与奖励

首版建议用可解释的 Elo 变体：

```text
expected = 1 / (1 + 10 ^ ((targetHonor - playerHonor) / 400))
honorDeltaWin = round(32 * (1 - expected))
honorDeltaLose = -round(32 * expected)
```

约束：

- 胜利至少 +5。
- 失败最多扣到 0。
- 挑战低荣誉目标，胜利收益最低可压到 +1。

竞技场 XP：

- 每日前 10 场胜利给 XP。
- 截图表现为 `current/10 XP`。
- 第 11 场以后仍可打荣誉，但不给 XP。

---

## 8. 酒馆、地下城与要塞接入

### 8.1 酒馆任务

当前 `COMPLETE_MISSION` 已返回 `battleResult`。正式版改造点：

- `ActiveMission.playerCombatSnapshot` 必须保存完整职业、属性、装备快照。
- `enemySnapshot` 应补 `classId` 和 `attributes`，不要只保存 `damageMin/damageMax`。
- 任务敌人难度仍可用 `enemyPowerRatioBp` 生成，但最终需落到完整快照。
- 成功才发放 `rewardSnapshot`，失败不发奖励，这一点保持不变。
- 结算响应应包含 `canSaveReplay: true` 和可用于 `MAIL_SAVE_MISSION_REPLAY` 的 `settlementId` 或 `missionId`。
- 不自动创建 `BattleReplayRecord`，除非玩家点击保存。

酒馆战斗先攻：玩家先攻。

### 8.2 地下城

`DUNGEON_FIGHT` 使用同一战斗引擎：

- `context = 'DUNGEON'`
- 玩家先攻。
- 胜利推进 `dungeon.progress[chapterId]`。
- 失败不推进进度。
- 每次战斗自动创建 `BattleReplayRecord`，并在响应中返回 `replayId`。

### 8.3 要塞

要塞战斗可先复用同一 `BattleResultV2` 播放结构，后续如果单位战斗与角色战斗差异过大，再扩展 `CombatantSnapshot` 类型。

必须满足：

- 主动进攻其他玩家要塞：攻击者邮箱保存 `FORTRESS_ATTACK`。
- 被其他玩家进攻：防守者邮箱保存 `FORTRESS_DEFENSE`。
- 防守记录必须带 `canCounterattackFortress=true` 和 `relatedPlayerId`。
- 要塞战斗右侧预览展示对方玩家镜像，而不是地下城/任务面板。

---

## 9. Server 实现清单

### P0: 替换 placeholder 战斗核心

- 新增 `server/src/engine/combatSimulator.ts` 或重构 `mathCore.ts` 中的 `serverSimulateBattle`。
- 引擎输入使用完整 `CombatantSnapshot`。
- 实现 HP、暴击率、主属性因子、护甲减伤、怒气、格挡、闪避、法师绕甲、刺客双持、狂战士连击。
- 使用现有 `createSeededRandom` 保证可复现。
- 输出 `BattleResultV2`；不提供旧 `BattleResult` 兼容映射。
- 输出必须完整到可长期回放，不得依赖当前存档重新计算。

### P0: 角色战斗预览

- `buildPlayerBattleSide` 当前公式 `damage = weaponAverage * (1 + mainAttr / 10)` 不符合正式公式。
- 预览应展示：
  - `hp`
  - `armor`
  - `armorReductionBpVsSameLevel`
  - `damageMin/damageMax`：可用同级同主属性目标估算
  - `critChanceBpVsSameLevel`
  - `blockChanceBp/dodgeChanceBp`

### P1: 竞技场

- 实现 `ARENA_GET_INFO`、`ARENA_REFRESH_CANDIDATES`、`ARENA_FIGHT`。
- 扩展 `ArenaState`，新增 honor/rank/candidates/daily XP wins。
- 当前 server 交接范围仅包含竞技场挑战页 API；英雄谱 / Hall of Fame 查询 API 不在本轮实现范围内。
- 增加 bot fallback。
- 荣誉更新后刷新排名。
- 每次 `ARENA_FIGHT` 自动创建邮箱战斗回放，并返回 `replayId`。

### P1: 邮箱战斗回放

- 新增持久化表或等价存储 `battle_replays`。
- 实现 `MAIL_GET_BATTLE_REPLAYS`、`MAIL_GET_BATTLE_REPLAY`、`MAIL_SAVE_MISSION_REPLAY`、`MAIL_DELETE_BATTLE_REPLAY`。
- 酒馆任务只在玩家手动保存时创建记录。
- 地下城、竞技场、要塞进攻、要塞防守自动创建记录。
- 要塞防守记录生成给防守者，并保留反击所需 `relatedPlayerId`。

### P1: API 与错误码

新增错误码：

| code | 场景 |
| :--- | :--- |
| `ARENA_COOLDOWN_ACTIVE` | 冷却未结束 |
| `ARENA_TARGET_NOT_FOUND` | 目标不存在或候选过期 |
| `ARENA_SELF_TARGET` | 不能挑战自己 |
| `ARENA_DISABLED` | 系统未开放 |
| `INSUFFICIENT_PREMIUM_RESOURCE` | 跳过冷却资源不足 |

### P2: 名人堂

- Heroes 排行榜按 honor 降序。
- 支持 rank/name 搜索。
- 行选中返回角色镜像、属性、装备、combatPreview。

---

## 10. Client 实现清单

### P0: 通用战斗回放组件

组件应只依赖 `BattleResultV2`，可复用于酒馆、竞技场、地下城。

必须表现：

- 左右双方角色卡。
- HP 条按 hit 更新。
- 普通伤害、暴击、格挡、闪避的不同文字/动效。
- `Skip` 直接跳到最终 HP 和结算。
- 结算弹窗展示 context-specific 奖励。
- 支持从邮箱打开历史回放。
- 不能假设当前玩家总在左侧；根据 `BattleResultV2` 的 player/enemy 与 context 决定左右展示。

### P1: 竞技场页面

- 展示 `dailyXpWins/maxDailyXpWins`。
- 展示 3 个候选卡：头像、等级、荣誉、五属性、职业图标。
- hover/click 显示更完整的 combatPreview。
- 冷却中禁用挑战，显示剩余时间和跳过按钮。

### P1: 名人堂页面

- Heroes/Guilds/Fortresses/Pets/Glory tabs 先做 Heroes，其余可 disabled。
- 列表字段必须支持截图中的 `Rank / Name / Guild / Level / Honor`。
- 右侧角色镜像展示属性、装备槽和 combatPreview。

### P1: 邮箱战斗回放页签

- 顶部提供战斗回放 tab，列表显示图标、名称、来源类型、日期时间。
- 选中记录后右侧按 `preview.type` 渲染 `PLAYER` / `DUNGEON` / `QUEST` 三种面板。
- `SHOW COMBAT` 打开通用战斗回放组件。
- 要塞防守记录显示 `COUNTERATTACK`。
- 酒馆任务结算页提供“保存回放”入口，保存成功后可跳转邮箱记录。

---

## 11. 当前实现差异

历史说明：本节原本记录正式版战斗系统实现前的差异清单。2026-05-11 的 server 实现已经完成 BattleResultV2、职业规则、竞技场挑战页与战斗回放 API；client 对接应以 `server/tdd/api_master_list.md` 第 7/8 节和 `server/tdd/player_save_schema.md` 为准。

以下清单仅保留为实现前问题追踪记录，不再代表当前 server 行为：

| 位置 | 当前行为 | 正式版要求 |
| :--- | :--- | :--- |
| `server/src/engine/mathCore.ts` | 玩家固定先攻，敌人后攻 | 根据 context 判断先攻 |
| `rollDamage` | `rawDamage - armor * 0.25` | S&F 护甲百分比减伤 |
| `rollDamage` | 暴击倍率 1.75 | 暴击倍率 2.0 |
| `rollDamage` | 无主属性对抗 | 必须实现 `AttrFactor` |
| `rollDamage` | 无怒气 | 必须实现 `RageMultiplier` |
| `BattleSide` | 缺 `classId/attributes/mainStat` | 快照必须包含完整战斗字段 |
| `CLASS_A` | 配了 block 但未在战斗用 | 必须判定格挡 |
| `CLASS_C` | 配了 bypass 但未在战斗用 | 必须绕甲必中 |
| `CLASS_D/E` | 配了 dual/frenzy 但未在战斗用 | 必须支持多 hit |
| `ArenaState` | 只有 disabled/cooldown/dailyWins | 需 honor/rank/candidates/daily XP wins |
| 邮箱/回放 | 无持久化战斗记录 | 非酒馆关键战斗自动保存，酒馆手动保存 |

---

## 12. 验收标准

Server:

- 同一 seed、同一快照，多次运行结果完全一致。
- `CLASS_C` 攻击不会被格挡/闪避，且护甲减伤为 0。
- `CLASS_A` 被非法师攻击时约 25% hit 记录 `wasBlocked=true`。
- `CLASS_B` 被非法师攻击时约 50% hit 记录 `wasDodged=true`。
- `CLASS_D` 每个行动固定 2 个 hit。
- `CLASS_E` 有概率追加 hit，且每个行动最多 15 hit。
- 200 行动保护能稳定结束战斗。

Client:

- 任意 `BattleResultV2` 可完整播放，不自行重新计算胜负。
- 跳过播放后 HP 与 `hpEnd` 一致。
- 竞技场结算能显示 XP、荣誉、排名变化。
- 冷却和每日 XP 次数与 server 返回一致。
- 邮箱战斗回放列表可打开竞技场、地下城、要塞进攻、要塞防守、已保存酒馆任务回放。
- 要塞防守回放提供反击入口，地下城/任务回放不显示玩家详情入口。

---

## 13. 设计决策

- 首版只做当前 5 职业，避免高级职业公式污染基础平衡。
- 战斗引擎统一服务酒馆、竞技场、地下城，避免三套不同逻辑。
- 快照必须完整，不能只保存派生 damage 字段。
- Client 不计算战斗结果，只播放 server hit events。
- 与 S&F 有来源冲突或版本差异的内容，优先选择当前项目已有职业 ID 和早期系统规模。
- 战斗回放归档属于战斗系统输出契约，不应只作为邮箱 UI 本地状态实现。
