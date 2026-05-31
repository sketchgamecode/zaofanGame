# Server Agent Prompt: Office Appointment and KPI V1

请基于当前服务端代码与 TDD 文档，实现“职位任免与考功系统 V1”的服务端基础。当前阶段不需要兼容旧存档。

## 背景

游戏已经有：

- `WorldActor`
- `PowerLocation`
- `ServicePositionView`
- `WORLD_LOCATIONS_GET_STATUS`
- `WORLD_SERVICE_POSITIONS_GET_LIST`
- `WORLD_ACTOR_GET_DETAIL`
- 任务目标角色化与任务发布人角色化
- 黄册中展示职位、任职者、人事权、财权、俸禄链

现在需要把“职位争夺”从直接挑战改为“上级任命 + 每周考功 + 财权/人事权 KPI”的结构。

核心原则：

1. 职位不是玩家直接抢来的，而是由上级指派、续任、调任或撤换。
2. 职位 KPI 只保留两种：交税与交权柄。
3. 交税体现财权，交权柄体现人事权。
4. 拉人下马也围绕两点：让其破财，或让其权柄下降。
5. 锦衣卫 / 北镇抚司任务是夺权柄机器：执行玩家拿经验和铜钱，夺得的权柄流向锦衣卫主官或其上级链。
6. 其他机构任务可以继续让执行玩家获得少量权柄，但金钱或税值流向机构职位持有人。
7. `suspicion` 不再作为玩家理解冲突的主叙事，前台解释优先用职位、财权、人事权、目标池、上级链。

## 阶段 A：新增吏部衙门地点

新增地点：

```ts
locationId: 'ministry_of_personnel'
name: '吏部衙门'
ownerFaction: 'censorate' 或 'imperial'，请根据现有 faction 语义选择更合理者
services: ['office_registry', 'appointment', 'evaluation']
```

如果当前 `PowerLocationService` 没有这些 service，请扩展类型。

建议职务：

- `吏部文选司郎中`：查看职位名册、任免链、候选资格。
- `吏部考功司郎中`：查看任期、交税、交权柄、考评。
- `内廷批红中使`：代表皇帝特旨调换。

要求：

1. `WORLD_LOCATIONS_GET_STATUS` 能返回新地点。
2. `WORLD_SERVICE_POSITIONS_GET_LIST` 能返回这些新职位。
3. 新地点参与 world actor 分布，但不能破坏世界权柄总量 10000。

## 阶段 B：职位详情数据结构

给 service position 派生或持久化以下详情。若当前架构更适合动态派生，请先动态派生；不要为了 V1 过度重构。

建议类型：

```ts
type OfficeKpiProfile = {
  termStartsAt: number;
  termEndsAt: number;
  taxDuePerTerm: number;
  taxDeliveredThisTerm: number;
  powerDuePerTerm: number;
  powerDeliveredThisTerm: number;
};

type OfficeControlDetail = {
  appointmentControllerActorId?: string;
  appointmentControllerDisplayName?: string;
  financeControllerActorId?: string;
  financeControllerDisplayName?: string;
  treasurySplit: {
    imperialPrivatePct: number;
    publicTreasuryPct: number;
    officeHolderPct: number;
    superiorPct: number;
  };
};
```

新增 API：

```ts
WORLD_SERVICE_POSITION_GET_DETAIL
```

入参：

```ts
{ positionId: string }
```

回包应包含：

- position 基础信息
- occupant
- location
- service
- incomeHint / replaceHint
- controlProfile
- `OfficeKpiProfile`
- `OfficeControlDetail`
- 是否可由当前玩家谋求：`eligibility`

`eligibility` 第一版只需要返回解释，不需要真正任命：

```ts
type OfficeEligibility = {
  canBeConsidered: boolean;
  reasons: string[];
};
```

## 阶段 C：任务结算资源流向调整

根据任务发布地点调整资源流向。

### 北镇抚司 / 锦衣卫任务

当 mission 的 `sourceLocationId === 'northern_bureau'`：

1. 执行玩家获得 XP 和铜钱。
2. 任务夺得的权柄不要给执行玩家。
3. 权柄优先从 `targetActor` 扣除。
4. 扣到的权柄流向该地点 `missions` 服务职位的 occupant。
5. 如果找不到 occupant，则流向 `imperial` 的合适 fallback actor，或暂时流向 player actor 之前的旧逻辑作为兜底，但必须在返回数据里标记 fallback。

### 其他地点任务

暂时保持当前玩家获得权柄的逻辑，但增加税值/铜钱流向字段，便于以后职位收益接入：

```ts
officeSettlement?: {
  sourcePositionId?: string;
  beneficiaryActorId?: string;
  beneficiaryDisplayName?: string;
  taxValueDelta?: number;
  powerValueDelta?: number;
  routingReason: string;
};
```

如果当前没有真实收益账本，可以先只返回派生视图，不入账。

## 阶段 D：皇帝特旨调换规则，只做数据判断

先不要实现完整 UI，也不要允许普通职位任命。

新增一个服务端 helper 或只读判断：

```ts
canImperialOverrideReplace(currentHolder, candidate): boolean
```

V1 规则：

1. 只有皇帝/皇权最高职位未来能执行这个操作。
2. 候选人的 `powerShare` 必须大于当前任职者。
3. 当前阶段只在职位详情中返回 `imperialOverrideHint`，不需要真正执行调换 API。

## 测试要求

新增或更新测试，覆盖：

1. 新地点 `ministry_of_personnel` 出现在地点状态 API。
2. 新地点 service positions 出现在黄册职位列表。
3. `WORLD_SERVICE_POSITION_GET_DETAIL` 返回任期、KPI、人事权、财权、拆账、任职者。
4. 北镇抚司任务结算时，权柄流向 missions 职位任职者，而不是执行玩家。
5. 其他地点任务仍可保持执行玩家获得权柄，但返回 `officeSettlement` 预览。
6. 世界总权柄仍恒等于 10000。
7. TypeScript 编译通过，全量 Vitest 通过。

## 文档要求

更新：

- `server/tdd/api_master_list.md`
- `server/tdd/player_save_schema.md`
- `server/tdd/error_code_dictionary.md`，如果新增错误码
- 如有全局限制，更新 `server/tdd/global_config_and_limits.md`

## 非目标

本阶段不要做：

1. 完整职位任命 API。
2. 玩家主动申请职位 UI 所需的复杂状态。
3. 任职者死亡、删除、永久伤残。
4. 真实每日发薪定时器。
5. 完整财政账本。
6. 游戏群/私聊/社交系统。

先把数据结构、地点、职位详情、KPI、任务资源流向打通。
