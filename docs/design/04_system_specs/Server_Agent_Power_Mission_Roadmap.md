# Server Agent Roadmap: Power Missions And World Actors

本文件给 server agent 使用。目标是把当前“大明体制内升迁 / 权力集团”包装逐步落到服务端玩法中。请分阶段实现，不要一次性重构全部系统。

## 总原则

1. 保持现有存档兼容。新增字段优先做 optional，并在创建新角色时初始化。
2. 不修改既有 `RaceId` / `PlayerClassId` / action 名称，避免破坏前端和老存档。
3. 新系统先服务现有玩法入口：差房任务、案牍副本、校场、角色信息。
4. 权力字段必须有单一数据源，避免前后端各自维护一套互相冲突的映射。
5. 每阶段完成后跑相关测试；若改动任务系统，至少覆盖任务生成、开始、结算、旧存档兼容。

## 阶段 1：权力集团差事

优先级最高。目标是把现有差房任务从普通任务升级成“各权力集团发布的差事”。

### 类型建议

在服务端共享类型中补充或复用：

```ts
type PowerFactionId =
  | 'imperial'
  | 'noble'
  | 'censorate'
  | 'border'
  | 'silver'
  | 'underworld';

type MissionPowerContext = {
  issuerFaction: PowerFactionId;
  targetFaction: PowerFactionId;
  caseType: 'raid' | 'audit' | 'escort' | 'arrest' | 'purge' | 'smuggle' | 'petition';
  powerDeltaPreview?: Partial<Record<PowerFactionId, number>>;
  suspicionDeltaPreview?: Partial<Record<PowerFactionId, number>>;
};
```

### MissionOffer 增量字段

给 `MissionOffer` 增加 optional 字段：

```ts
powerContext?: MissionPowerContext;
```

给 `ActiveMission` 也保存同样的 `powerContext`，避免开始任务后丢失发布方/目标方。

### 生成规则第一版

先不用复杂地图，只按玩家 `powerFaction` 生成 3 个任务：

1. 一个同阵营任务：更稳定，奖励普通，牵连较低。
2. 一个皇权/中枢任务：奖励较高，但容易增加目标阵营牵连。
3. 一个跨阵营任务：奖励有波动，牵连较明显。

任务标题示例：

- 皇权发布：`密旨清查盐引账册`、`奉旨拿问军功旧党`
- 边镇发布：`押送辽饷过关`、`夜剿边墙马匪`
- 清流发布：`查核贡院舞弊`、`递送弹劾底稿`
- 商税发布：`护送盐引账本`、`追讨织造亏空`
- 暗流发布：`香会暗线递信`、`替人灭口封账`

### 结算第一版

任务成功时：

- 正常发放已有奖励。
- 若 `powerContext.suspicionDeltaPreview` 存在，则把对应值加到 `state.player.suspicion`。
- `suspicion` 缺字段时自动补 0。
- 失败时可以先不改变牵连，或只加少量牵连。请在测试中明确。

暂时不要实现全世界权柄转移，只先让玩家身上的 `suspicion` 会变化。

### 返回给前端

`TavernInfoData` 中的 `missionOffers`、`activeMission` 需要返回 `powerContext`。

`CompleteMissionData` 可以增加：

```ts
powerResult?: {
  suspicionDelta: Partial<Record<PowerFactionId, number>>;
  suspicionAfter: Partial<Record<PowerFactionId, number>>;
};
```

## 阶段 2：蓝玉案副本原型

目标是把“副本 = 权力清洗案件”立起来。

第一版只做数据包装，不做世界角色池。

### 蓝玉案

- 案件 ID：`case_lanyu_purge`
- 发起方：`imperial`
- 目标方：`noble` / `border`
- 包装：皇权清洗军功集团，玩家参与查抄、拿问、追捕。
- 奖励：经验、铜钱、装备、皇权相关声望或后续权柄。
- 代价：`noble` / `border` 牵连上升。

### DungeonChapter 增量字段

```ts
powerCase?: {
  issuerFaction: PowerFactionId;
  targetFactions: PowerFactionId[];
  historicalHook: string;
  suspicionDeltaOnWin?: Partial<Record<PowerFactionId, number>>;
};
```

前端可以用这些字段展示“发起方 / 目标方 / 牵连代价”。

## 阶段 3：世界角色池冷启动

目标是生成 260 个假角色，用作任务目标、副本目标、地图地点填充、后续玩家离线对抗。

### WorldActor 建议

```ts
type WorldActorKind = 'bot' | 'player';

type WorldActor = {
  actorId: string;
  kind: WorldActorKind;
  displayName: string;
  raceId: RaceId;
  classId: PlayerClassId;
  faction: PowerFactionId;
  locationId: string;
  level: number;
  powerShare: number;
  combatSnapshot: PlayerCombatSnapshot;
  replacedByPlayerId?: string;
};
```

### 冷启动规则

- 初始生成 260 个 bot。
- 每个 faction 和 location 都要有角色分布。
- 当真实玩家数量上来后，任务目标抽取逐步提高真实玩家权重。
- 不要删除 bot，只降低抽中权重，避免地点空洞。

## 阶段 4：大明权力地图服务端状态

目标是给前端“京城权力地图”提供地点状态。

阶段 4 只做 V1 京城权力地图，不做大明版图多城池结构。大明版图保留为 V2 外派案件目标层，用于任务距离、地方案件来源和少数重点地点扩展。

V1 地图是“地点网络”，不是 100×100 坐标网格。`x/y` 如需提供，只用于前端展示；真实可达关系由地点连线和服务配置决定。

### LocationView 建议

```ts
type PowerLocationView = {
  locationId: string;
  name: string;
  ownerFaction: PowerFactionId;
  unlockLevel: number;
  status: 'locked' | 'open' | 'hostile' | 'favored';
  services?: Array<'missions' | 'shop' | 'dungeon' | 'arena' | 'promotion' | 'intel' | 'estate'>;
  connectedLocationIds?: string[];
  travelCostSecBase?: number;
  actorCount: number;
  powerShare?: number;
  playerRelationHint: string;
};
```

第一版只需要返回静态地点 + 玩家是否解锁 + 聚集角色数量。

## 阶段 5：权柄总量系统

目标是实现世界权力总量 100%。

内部建议用：

```ts
const WORLD_POWER_TOTAL = 10000;
```

每个 `WorldActor.powerShare` 占其中一部分。玩家通过任务、副本、竞技、事件夺取或丢失权柄。

阶段 1-4 已经具备第一版前置条件：任务有 `powerContext`，副本有 `powerCase`，世界角色池有 260 个 actor，京城地图能按地点聚合权柄。

阶段 5 第一版不做复杂政治模拟，只做最小可验证闭环：

1. 世界总权柄仍恒定为 `10000`。
2. 任务或副本胜利时，允许发生极小额权柄转移。
3. 权柄必须从目标集团或目标 actor 扣除，不能凭空产生。
4. 转移结果要返回给前端，让玩家在结算里看到“我替谁夺了多少权柄”。
5. 失败时第一版先不转移权柄，避免惩罚过重。
6. 旧存档必须兼容；如缺少 world，沿用现有 `ensureWorldInitialized`。

### 阶段 5 最小数据模型

建议复用现有 `powerResult` 字段并扩展，不要新增一套完全平行的结算结构。

```ts
type PowerTransferResult = {
  worldPowerTotal: number; // 恒定 10000
  actorPowerDelta?: number; // 玩家个人或玩家影子 actor 的权柄变化
  issuerFactionPowerDelta?: Partial<Record<PowerFactionId, number>>;
  targetFactionPowerDelta?: Partial<Record<PowerFactionId, number>>;
  targetActorIds?: string[];
  worldPowerAfter?: {
    byFaction: Array<{
      faction: PowerFactionId;
      actorCount: number;
      powerShare: number;
    }>;
  };
};
```

`MissionSettlement.powerResult` 和 `DungeonFightData.powerResult` 可以扩展为：

```ts
powerResult?: {
  suspicionDelta?: Partial<Record<PowerFactionId, number>>;
  suspicionAfter?: Partial<Record<PowerFactionId, number>>;
  powerTransfer?: PowerTransferResult;
};
```

如果为了兼容前端已有逻辑，也可以先保留 `suspicionDelta` 和 `suspicionAfter` 为必填或原样结构，只额外增加 `powerTransfer?`。

### 阶段 5 权柄转移规则第一版

第一版建议把转移数值压得很小：

1. 普通集团差事成功：转移 `1` 点权柄。
2. 高风险跨阵营差事成功：转移 `2` 点权柄。
3. 历史案件副本胜利：转移 `3` 点权柄。
4. 非权力包装内容不触发权柄转移。

转移来源：

1. 优先从 `targetFaction` 下的 bot actor 中扣。
2. 若有多个目标集团，按目标集团顺序或平均扣除。
3. 不允许把某 actor 扣到负数。
4. 如果目标集团可扣权柄不足，则扣到可用上限，本次转移可以小于预期。

转移去向：

1. 第一版先转给 `issuerFaction` 下一个代表性 actor，或转给玩家所属阵营的“玩家影子 actor”。
2. 如果当前还没有真实玩家进入 world actor 池，可以先创建/同步一个 `kind: 'player'` 的 actor，代表当前玩家在世界池里的席位。
3. 玩家 actor 的 `actorId` 建议稳定，例如 `player:${playerId}` 或存档内可推导的稳定 ID。

必须保证：

1. 所有 `WorldActor.powerShare` 之和始终等于 `WORLD_POWER_TOTAL`。
2. 任意转移后 `WORLD_ACTORS_GET_OVERVIEW` 和 `WORLD_LOCATIONS_GET_STATUS` 聚合结果一致。
3. 转移失败或无可扣权柄时，不应破坏任务/副本原有奖励和结算。

### 阶段 5 测试重点

请至少覆盖：

1. 初始世界权柄总和为 `10000`。
2. 普通任务成功后，总和仍为 `10000`。
3. 历史案件副本胜利后，总和仍为 `10000`。
4. 目标集团权柄减少，发起集团或玩家 actor 权柄增加。
5. 失败任务/失败副本不发生权柄转移。
6. 旧存档无 world 时仍可初始化并完成权柄转移。
7. actor 不会被扣成负数。
8. `WORLD_ACTORS_GET_OVERVIEW` 与 `WORLD_LOCATIONS_GET_STATUS` 的聚合口径一致。
9. `powerResult.powerTransfer` 能返回给前端。

### 阶段 5 前端展示预期

前端后续会在任务/副本结算里显示：

1. `权柄变化：皇权 +0.03%，勋贵 -0.03%`
2. `本次目标：蓝党旧部 / 边镇旧将`
3. `世界总权柄：100.00%`

因此服务端返回值请保持整数点数，前端负责格式化为百分比。

## 当前推荐执行顺序

1. 阶段 1：权力集团差事。
2. 阶段 2：蓝玉案副本原型。
3. 阶段 3：世界角色池冷启动。
4. 阶段 4：大明权力地图状态。
5. 阶段 5：权柄总量系统。

## 本次 server agent 可先完成的最小任务

阶段 1-4 已完成第一版。下一轮请实现阶段 5：权柄总量系统第一版。

1. 保持 `WORLD_POWER_TOTAL = 10000`，并抽出统一校验/聚合方法。
2. 新增权柄转移 helper，例如 `applyWorldPowerTransfer`。
3. 任务成功时，根据 `MissionPowerContext` 从目标集团扣 `1-2` 点权柄，转给发起集团或玩家 actor。
4. 蓝玉案等权力副本胜利时，根据 `powerCase` 从目标集团扣 `3` 点权柄，转给发起集团或玩家 actor。
5. 失败任务/失败副本不转移权柄。
6. 扩展 `powerResult`，返回 `powerTransfer`。
7. 保证旧存档兼容，缺 world 时自动初始化。
8. 更新 TDD 文档：`player_save_schema.md`、`api_master_list.md`、必要时更新 `global_config_and_limits.md`。
9. 补测试，确保任意操作后 world actors 权柄总和仍为 `10000`。
