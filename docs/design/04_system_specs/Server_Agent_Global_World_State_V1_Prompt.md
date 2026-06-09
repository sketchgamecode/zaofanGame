# Server Agent Prompt: Global World State V1

请基于当前服务端代码与 TDD 文档，修复“世界状态被错误放在每个玩家存档里”的架构问题。当前阶段不需要兼容旧存档，可以 clean wipe。

## 问题复现

现在玩家测试发现：

1. A 账号在北镇抚司报名守卫后，A 能看到守卫人数变成 1。
2. 切到新注册的 B 账号，去北镇抚司看到守卫人数仍然是 0。
3. B 劫掠北镇抚司时，也不会打到 A 的守卫。
4. 连续新建多个账号后，京城人数一直显示 261。

根因判断：

当前 `GameState.world` 存在于每个玩家自己的 `player_saves.game_state` 中。每个账号都有一份私有世界：

- 260 个 bot
- 当前玩家自己的 `player:<playerId>` 影子 actor
- 自己的 `locationTreasuries`
- 自己的 `locationGuardDuties`
- 自己的 `officeLedger`

这会导致所谓“全局 NPC / 离线玩家角色 / 场所守卫 / 公账 / 黄册”全部变成单机幻觉。

## 目标

把世界状态改成真正的服务器全局状态。

核心要求：

1. 所有玩家看到同一份京城世界。
2. A 挂守卫后，B 能在同一地点看到 A。
3. B 劫掠该地点时，优先打到 A 的守卫。
4. 新玩家创建角色后，要被同步到全局 `world.actors`，京城人数随真实玩家增长。
5. Bot 仍然作为冷启动基础存在，但不应每个玩家各自复制一份。
6. 世界权柄总量仍保持 10000。

## 建议实现

### 阶段 A：新增全局世界存储

新增一张 Supabase 表或等效存储：

```sql
world_state (
  id text primary key,
  world_state jsonb not null,
  updated_at timestamptz not null default now()
)
```

固定使用一条记录：

```ts
id = 'default_world'
```

如果当前项目已有 migrations / SQL 管理方式，请按现有风格添加。

### 阶段 B：新增 worldStateStore

新增类似 `gameStateStore.ts` 的模块，例如：

```ts
loadOrCreateWorldState(now): Promise<WorldState>
saveWorldState(world: WorldState, now): Promise<WorldState>
```

要求：

1. 如果 `default_world` 不存在，则创建全局世界。
2. 只生成一次 260 个 bot。
3. 后续所有玩家共享这 260 个 bot 和同一份地点状态。
4. `locationTreasuries / locationGuardDuties / officeLedger / botSimulation / pendingRaids` 都属于全局 world。

### 阶段 C：调整 action 路由上下文

当前 action route 大致流程是：

1. 读当前玩家 save。
2. 生成 `ActionContext`。
3. 执行 action。
4. 如果 dirty 保存玩家 save。

需要扩展为：

1. 读当前玩家 save。
2. 读全局 world state。
3. 把 `ctx.state.world` 指向全局 world state，或在 context 中新增 `ctx.world`。
4. 执行 action。
5. 如果玩家数据变了，保存玩家 save。
6. 如果世界数据变了，保存全局 world state。

为了最小改动，可以先采用：

```ts
ctx.state.world = loadedGlobalWorld;
```

执行后：

```ts
if (ctx.worldDirty || ctx.dirty) saveWorldState(ctx.state.world)
```

但请注意：玩家 save 不应继续持久化这份全局 world。保存 player save 前可以去掉或只保存轻量占位 world，避免每个玩家存一份巨大的全局状态。

### 阶段 D：同步真实玩家 actor

`syncPlayerActor(ctx)` 应写入全局 world：

1. 如果 `player:<playerId>` 不存在，新增。
2. 如果已存在，更新 displayName / avatarId / level / classId / raceId / faction / combatSnapshot。
3. 新玩家 actor 初始 `powerShare = 0`，不破坏总量 10000。
4. 京城人数应变成 `260 + 已创建角色真实玩家数`。

### 阶段 E：迁移 world-facing API

以下 API 必须基于全局 world：

- `WORLD_ACTORS_GET_OVERVIEW`
- `WORLD_LOCATIONS_GET_STATUS`
- `WORLD_ACTOR_GET_DETAIL`
- `WORLD_SERVICE_POSITIONS_GET_LIST`
- `WORLD_SERVICE_POSITION_GET_DETAIL`
- `WORLD_SERVICE_POSITION_LEDGER_GET`
- `WORLD_SERVICE_POSITION_CANDIDATES_GET`
- `WORLD_LOCATION_TREASURY_GET`
- `WORLD_LOCATION_RAID_START`
- `WORLD_LOCATION_RAID_SETTLE`
- `WORLD_LOCATION_GUARD_JOIN`
- `WORLD_LOCATION_GUARD_LEAVE`
- `WORLD_LOCATION_GUARD_CLAIM`

任务系统中依赖 world 的部分也必须使用全局 world：

- mission target actor selection
- issuer actor preview
- power transfer
- officeSettlement
- 北镇抚司权柄流向

### 阶段 F：并发与锁

V1 可以使用简单方式：

1. 复用现有 player lock 思路，新增 world lock。
2. 所有会写 world 的 action 在同一个 `default_world` lock 中执行。
3. 读 world 的 action 可不锁，或者为了简单全部世界 action 先锁。

不要在 V1 过度设计分布式锁。先保证单实例开发环境和当前测试通过。

### 阶段 G：清理文档误导

更新文档：

- `server/tdd/player_save_schema.md`
  - 明确 `GameState.world` 不再是玩家私有持久字段。
  - 如果代码里仍保留 `GameState.world` 类型，只说明它是运行时挂载的全局 world view。
- `server/tdd/api_master_list.md`
  - 说明 world API 读取的是全局世界。
- `server/tdd/global_config_and_limits.md`
  - 说明 `default_world`、260 bot 冷启动、真实玩家 actor 同步。

## 测试要求

新增或更新测试，至少覆盖：

1. 两个不同 playerId 读取 `WORLD_LOCATIONS_GET_STATUS` 时看到同一份 world actors。
2. A 调用 `WORLD_LOCATION_GUARD_JOIN` 后，B 调用 `WORLD_LOCATION_TREASURY_GET` 能看到 A 的 guard。
3. A 挂守卫后，B 调用 `WORLD_LOCATION_RAID_START` 时 defender 优先是 A。
4. 新建/同步多个真实玩家 actor 后，`WORLD_ACTORS_GET_OVERVIEW.totalActors` 增长，不再固定 261。
5. 全局 world 的 260 bot 只初始化一次，不因新账号重复追加 260 个 bot。
6. 世界总权柄仍恒等于 10000。
7. 玩家个人资源、装备、任务进度仍保存在个人 save，不被其他玩家覆盖。
8. TypeScript 编译通过，全量 Vitest 通过。

## 非目标

本阶段不要做：

1. 多世界 / 多服务器分线。
2. 跨服世界。
3. 复杂数据库迁移保留旧 world。
4. 分布式锁。
5. 完整职位任命 API。
6. 多守卫车轮战。

先把“所有玩家共享同一份京城世界”修正到位。
