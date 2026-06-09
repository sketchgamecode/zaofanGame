# Server Agent Prompt: Location Guard Duty V1

请基于当前服务端代码与 TDD 文档，实现“场所守卫值守系统 V1”的服务端基础。当前阶段不需要兼容旧存档。

## 背景

游戏已经有：

- `WorldActor`
- `PowerLocation`
- `LocationTreasury`
- `LocationTreasuryView`
- `WORLD_LOCATION_TREASURY_GET`
- `WORLD_LOCATION_RAID_START`
- `WORLD_LOCATION_RAID_SETTLE`
- `OfficeLedgerEntry`
- `WORLD_SERVICE_POSITION_LEDGER_GET`
- 场所公账、劫掠、夺财 / 夺权 / 扬名结算

现在需要给场所公账补上第一版“守卫”机制。

核心目标：

1. 场所不再只是被动挨抢，而是有可见守卫席位。
2. 玩家可以报名站岗，完成时长后领取工钱。
3. 玩家提前离岗则没有工钱。
4. 劫掠时优先选择当前地点的有效守卫作为防守者。
5. 所有守卫行为写入场所近日报告，让玩家感觉世界在运转。

## 阶段 A：新增守卫值守状态

在 `GameState.world` 下新增守卫值守集合。建议字段名：

```ts
locationGuardDuties?: LocationGuardDuty[];
```

建议类型：

```ts
type LocationGuardDutyStatus = 'active' | 'completed' | 'abandoned';

type LocationGuardDuty = {
  dutyId: string;
  locationId: string;
  actorId: string;
  actorDisplayName: string;
  actorAvatarId: string;
  actorKind: 'player' | 'bot';
  faction: PowerFactionId;
  level: number;
  combatRating: number;
  startsAt: number;
  endsAt: number;
  wageCopper: number;
  status: LocationGuardDutyStatus;
};
```

对外视图：

```ts
type LocationGuardDutyView = LocationGuardDuty & {
  remainingSeconds: number;
  canClaimWage: boolean;
  canLeave: boolean;
};
```

把 `LocationTreasuryView` 扩展为：

```ts
type LocationTreasuryView = LocationTreasury & {
  locationName: string;
  ownerFaction: PowerFactionId;
  ownerLabel: string;
  raidRiskHint: string;
  carryHint: string;
  guards: LocationGuardDutyView[];
  guardHint: string;
};
```

要求：

1. `ensureWorldInitialized` 或对应初始化流程要初始化 `locationGuardDuties`。
2. `WORLD_LOCATION_TREASURY_GET` 返回该地点守卫列表。
3. 已完成但未领取工钱的 duty 仍可见。
4. 已放弃的 duty 可以保留一小段时间或在视图中过滤掉，请在文档说明。

## 阶段 B：新增守卫 API

新增三个 API：

```ts
WORLD_LOCATION_GUARD_JOIN
WORLD_LOCATION_GUARD_LEAVE
WORLD_LOCATION_GUARD_CLAIM
```

### WORLD_LOCATION_GUARD_JOIN

入参：

```ts
{
  locationId: string;
  durationMinutes?: number;
}
```

行为：

1. 校验 location 和 treasury 存在。
2. 校验该地点未满守卫槽。
3. 校验当前玩家没有在该地点已有 active duty。
4. 将 `durationMinutes` clamp 到固定档位：30 / 60 / 120。未传默认 60。
5. 计算 `wageCopper`。V1 可简单按时长和地点防务压力派生，例如：
   - 30 分钟：基础 20
   - 60 分钟：基础 45
   - 120 分钟：基础 100
   - 可根据 `treasury.copperBalance` 或 `defenseRating` 做轻微加成，但不要复杂。
6. 创建一条 active duty。
7. 写入 ledger：`guard_join`。
8. 返回更新后的 `LocationTreasuryView` 或专用结果结构。

### WORLD_LOCATION_GUARD_LEAVE

入参：

```ts
{
  dutyId: string;
}
```

行为：

1. 只能当前玩家离开自己的 active duty。
2. 设置 status 为 `abandoned`。
3. 不发工钱。
4. 写入 ledger：`guard_leave`。
5. 返回更新后的 `LocationTreasuryView`。

### WORLD_LOCATION_GUARD_CLAIM

入参：

```ts
{
  dutyId: string;
}
```

行为：

1. 只能当前玩家领取自己的 duty。
2. duty 必须 active 且当前时间 >= endsAt。
3. 从对应 location treasury 的 `copperBalance` 支付工钱。
4. 如果 treasury 足额，支付完整 `wageCopper`。
5. 如果 treasury 不足，支付剩余全部铜钱，并写短发记录。
6. 给玩家增加实际获得的铜钱。
7. 设置 status 为 `completed`。
8. 写入 ledger：
   - 足额：`guard_wage`
   - 不足额：`guard_wage_shortfall`
9. 返回结果结构：

```ts
type LocationGuardClaimData = {
  dutyId: string;
  locationId: string;
  wageExpected: number;
  wagePaid: number;
  shortfall: number;
  treasuryAfter: LocationTreasuryView;
};
```

## 阶段 C：劫掠防守者选择接入守卫

修改 `WORLD_LOCATION_RAID_START` 的防守者选择逻辑：

1. 优先选择该 location 下 `status === 'active'` 且 `endsAt > now` 的守卫。
2. 如果有多个守卫，V1 选择 `combatRating` 最高者。
3. 如果没有有效守卫，再走现有逻辑：service position occupant / location actors / same faction bot / fallback。
4. `LocationRaidStartData.defenderActor` 应能体现这个守卫角色。
5. 战斗仍只打一场，暂不做多守卫车轮战。

这一步必须保持现有劫掠接口前端兼容。

## 阶段 D：账本类型扩展

扩展 `OfficeLedgerEntryType`：

```ts
| 'guard_join'
| 'guard_leave'
| 'guard_wage'
| 'guard_wage_shortfall'
```

账本文案要直接可读，例如：

- `赵三刀在北镇抚司应下守夜，约定一更后领饷。`
- `李某未满时辰便离岗，饷银作废。`
- `王某守满时辰，领得铜钱 45。`
- `某地公账不足，只给了守卫铜钱 12，短发 33。`

## 阶段 E：错误码

如有需要，新增明确错误码：

```ts
LOCATION_GUARD_SLOT_FULL
LOCATION_GUARD_ALREADY_ACTIVE
LOCATION_GUARD_NOT_FOUND
LOCATION_GUARD_NOT_OWNED
LOCATION_GUARD_NOT_READY
```

错误码文案要能给前端直接展示或转译。

## 测试要求

新增或更新测试，覆盖：

1. `WORLD_LOCATION_TREASURY_GET` 返回 guards 和 guardHint。
2. 玩家可以加入守卫，守卫槽数量增加。
3. 满槽时加入失败。
4. 同一玩家不能在同一地点重复 active duty。
5. 玩家提前离岗不发工钱，并写 `guard_leave`。
6. 到时领取工钱，扣 location treasury 铜钱，增加玩家铜钱，并写 `guard_wage`。
7. 公账不足时短发，写 `guard_wage_shortfall`。
8. 有 active guard 时，`WORLD_LOCATION_RAID_START` 优先选该 guard 为 defender。
9. 无 active guard 时，保留现有 defender fallback 行为。
10. 世界总权柄仍恒等于 10000。
11. TypeScript 编译通过，全量 Vitest 通过。

## 文档要求

更新：

- `server/tdd/api_master_list.md`
- `server/tdd/player_save_schema.md`
- `server/tdd/error_code_dictionary.md`
- `server/tdd/global_config_and_limits.md`

如果有 walkthrough / task 记录，也请同步更新。

## 非目标

本阶段不要做：

1. 多守卫车轮战。
2. 守卫槽代币扩容。
3. 场所主管设置战力门槛。
4. 手动设置工资。
5. 守卫之间的分赃或社交协议。
6. 内应、叛变、密约等复杂机制。
7. 真正的每日分账定时器。

先把守卫席位、报名、离岗、领取工钱、劫掠优先打守卫这条闭环打通。
