# Server Agent Prompt: Location Treasury and Raid V1

## 2026-06-02 Scope Correction

After playtesting, the V1 direction is simplified:

1. Player-facing location treasury means public-account copper first.
2. Do not expand `goodsValue`, `powerValue`, or `defenseRating` into equal player-facing resources until they have real production and consumption loops.
3. The client should present raids as "raid the public account", not as a three-resource choice between wealth, power, and fame.
4. Future location identity should come from services, office holders, shops, mission flavor, and later location-specific loot tables.
5. Existing server fields can remain as internal/transitional data, but future UI should not build around them without a fresh design pass.

请基于当前服务端代码与 TDD 文档，实现“场所公账与劫掠系统 V1”的服务端基础。当前阶段不需要兼容旧存档。

## 背景

游戏已经有：

- `WorldActor`
- `PowerLocation`
- `ServicePositionView`
- `WORLD_LOCATIONS_GET_STATUS`
- `WORLD_SERVICE_POSITION_LEDGER_GET`
- `OfficeLedgerEntry`
- Bot 离线模拟账本
- 任务发布人 / 任务目标角色化
- 职位详情、考功、候选/上级可用名册

现在职位任免暂时不作为大众高频玩法。职位是少数上级玩家赏赐和控制的稀缺资产。

更适合大众参与的玩法是“场所公账可被劫掠”：

1. 场所通过商店、任务、体力消费、Bot 模拟等产生收入。
2. 收入先进入场所公账。
3. 每日分配之前，场所公账可以被其他玩家攻击和抢夺。
4. 玩家通过战斗参与场所利益争夺，而不是人人都去抢职位。

## 核心目标

实现一个最小可玩的场所公账与劫掠服务端闭环：

1. 每个可劫掠场所有公账余额。
2. 前端可以查询场所公账。
3. 玩家可以对场所发起一次劫掠战斗。
4. 战斗胜利后，玩家在结算阶段选择：夺财 / 夺权 / 扬名。
5. 结算写入账本，并保持世界权柄总量不破坏。

## 阶段 A：新增场所公账状态

在 `GameState.world` 下新增或挂载 location treasury 状态。

建议结构：

```ts
type LocationTreasury = {
  locationId: string;
  copperBalance: number;
  goodsValue: number;
  powerValue: number;
  nextDistributionAt: number;
  guardSlotsUsed: number;
  guardSlotsMax: number;
  defenseRating: number;
  updatedAt: number;
};
```

读取视图：

```ts
type LocationTreasuryView = LocationTreasury & {
  locationName: string;
  ownerFaction: PowerFactionId;
  ownerLabel: string;
  raidRiskHint: string;
  carryHint: string;
};
```

初始化规则：

1. 为所有 active roleplay locations 初始化 treasury。
2. `copperBalance / goodsValue / powerValue` 可以基于 location ownerFaction 和 actorCount 派生初值。
3. `nextDistributionAt` 先设为下一个自然日固定时间，或者当前时间 + 24h。
4. `guardSlotsMax` V1 可固定为 1-3。
5. `defenseRating` 可由当前地点 servicePositions occupant 战力或 actor 聚合派生。

## 阶段 B：公账收入接入

把现有部分收益流入 location treasury。

V1 最小接入：

1. Bot 离线模拟产生 `bot_tax / bot_power / shop_tax / stamina_tax` 时，同步增加对应 location treasury。
2. 玩家任务结算产生 `officeSettlement.taxValueDelta` 时，同步增加或记录到对应 location treasury。
3. 北镇抚司夺权相关收益可增加 `powerValue`，其他金钱类收益增加 `copperBalance` 或 `goodsValue`。

不需要做完整每日分配，只需要让公账余额会增长。

## 阶段 C：新增 API：WORLD_LOCATION_TREASURY_GET

入参：

```ts
{
  locationId: string;
}
```

回包：

```ts
LocationTreasuryView
```

要求：

1. 如果 locationId 不存在，抛出明确错误码，例如 `WORLD_LOCATION_NOT_FOUND`。
2. 查询时可以沿用现有 bot simulation cooldown 触发逻辑。
3. 返回数据要足够给前端展示：公账、待分配时间、守卫槽、风险提示。

## 阶段 D：新增劫掠流程

V1 使用两步或三步均可，但建议三步，便于前端战斗后选择结果。

### 1. WORLD_LOCATION_RAID_START

入参：

```ts
{
  locationId: string;
}
```

行为：

1. 校验 location treasury 是否存在。
2. 选择一个防守者：
   - 优先 location servicePositions occupant。
   - 再选 location actors。
   - 再选同 faction bot。
   - 最后生成 fallback guard snapshot。
3. 使用现有战斗引擎进行一次 battle。
4. 保存一份 pending raid settlement 到 state，或在回包中返回 raidId 与 battleResult。

建议回包：

```ts
type LocationRaidStartData = {
  raidId: string;
  locationId: string;
  locationName: string;
  defenderActor?: MissionTargetActorPreview | WorldActor preview equivalent;
  battleResult: BattleResultV2;
  canChooseOutcome: boolean;
  treasuryBefore: LocationTreasuryView;
};
```

如果玩家失败：

1. 不允许 outcome choice。
2. 不修改 treasury。
3. 可写一条 raid_failed 账本，或先不写。

### 2. WORLD_LOCATION_RAID_SETTLE

入参：

```ts
{
  raidId: string;
  choice: 'wealth' | 'power' | 'fame';
}
```

行为：

1. 必须存在 pending raid。
2. 必须 battleResult 是攻击者胜利。
3. 根据 choice 结算。

#### choice = wealth / 夺财

1. 从 location treasury 扣 `copperBalance` 或 `goodsValue`。
2. 给玩家铜钱奖励。
3. 数量受坐骑影响。

坐骑 V1 可先使用简单倍率：

- 无坐骑：1.0
- donkey / 驴：1.4
- ox / 牛：2.0
- horse / 马：1.6
- 未识别：1.0

如果当前服务端 mount 数据不方便读取，先用无坐骑倍率，并在 TODO 注明后续接入。

#### choice = power / 夺权

1. 不给或少给铜钱。
2. 从 location treasury 的 `powerValue` 扣除。
3. 可减少该 location 主任职者或 ownerFaction 的权柄压力。
4. V1 可以先把 `powerValue` 转为玩家 `powerShare` 或写为 office ledger 的 `powerValueDelta`。
5. 必须保持世界总权柄 10000 不破坏。

如果完整权柄转移复杂，V1 可先只扣 treasury.powerValue 并写 ledger，不动 world.actors powerShare。但需要在文档中明确这是“公账权势值”，不是世界总权柄。

#### choice = fame / 扬名

1. 少量或不拿钱。
2. 给玩家 prestige / honor / reputation 中已有最合适字段。
3. 如果没有合适字段，先返回 preview，不入账，并 TODO 后续接声望。

## 阶段 E：账本记录

扩展 `OfficeLedgerEntryType` 或新增 location treasury ledger 类型。

建议新增：

```ts
| 'raid_wealth'
| 'raid_power'
| 'raid_fame'
| 'raid_failed'
```

结算后写入 `world.officeLedger`，字段应尽量包含：

- locationId
- sourceActorId / sourceActorDisplayName：劫掠玩家
- targetActorId / targetActorDisplayName：防守者或场所任职者
- beneficiaryActorId / beneficiaryDisplayName：若有受益者
- taxValueDelta 或 powerValueDelta
- description：中文文案

这样前端现有“场所近日报告”可以直接显示劫掠记录。

## 阶段 F：测试要求

新增或更新测试，覆盖：

1. 新角色 / 新世界初始化后，active locations 有 treasury。
2. `WORLD_LOCATION_TREASURY_GET` 返回正确 location treasury。
3. Bot 模拟或任务分账会增加 location treasury。
4. `WORLD_LOCATION_RAID_START` 返回 battleResult 与 treasuryBefore。
5. 玩家失败时不能结算 choice，treasury 不变。
6. 玩家胜利后选择 wealth，会减少 treasury 并增加玩家铜钱。
7. 玩家胜利后选择 power，会减少 treasury powerValue，并写账本。
8. 玩家胜利后选择 fame，会返回声望/官声收益或 preview。
9. 重复 settle 同一 raidId 不可重复领奖。
10. 结算写入 officeLedger，且 `WORLD_SERVICE_POSITION_LEDGER_GET({ locationId })` 能查到。
11. 世界总权柄仍等于 10000。
12. TypeScript 编译通过，全量 Vitest 通过。

## 文档要求

更新：

- `server/tdd/api_master_list.md`
- `server/tdd/player_save_schema.md`
- `server/tdd/error_code_dictionary.md`，如果新增错误码
- `server/tdd/global_config_and_limits.md`，记录 raid carry multiplier / treasury limits

## 非目标

本阶段不要做：

1. 完整守卫招聘市场。
2. 多守卫车轮战。
3. 代币扩展守卫槽。
4. 真实每日自动分账定时器。
5. 内应离职机制。
6. 复杂坐骑货运装备。
7. 前端 UI。

先把场所公账、单次劫掠、三选一结算、账本记录打通。
