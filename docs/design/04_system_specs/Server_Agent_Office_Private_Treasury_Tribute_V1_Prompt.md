# Server Agent Prompt: Office Private Treasury and Weekly Tribute V1

请基于当前服务端代码与 TDD 文档，实现“主官私人公账与每周上缴 V1”的服务端基础。当前阶段可以不兼容旧测试存档，但必须保持全局世界状态 `world_state` 的一致性和 10000 世界权柄守恒。

## 背景

目前游戏已有：

- 全局 `world_state`
- `WorldActor`
- `PowerLocation`
- `ServicePositionView`
- `WORLD_LOCATIONS_GET_STATUS`
- `WORLD_LOCATION_TREASURY_GET`
- `WORLD_LOCATION_RAID_START`
- `WORLD_LOCATION_RAID_SETTLE`
- `WORLD_LOCATION_GUARD_JOIN / LEAVE / CLAIM`
- `WORLD_SERVICE_POSITION_GET_DETAIL`
- `WORLD_SERVICE_POSITION_LEDGER_GET`
- 场所守卫、劫掠、近日报告

经过玩法收敛，场所公账 V1 不再解释为独立系统池，也不再前台展示财货、权势、防务等并列资源。

新的核心口径：

1. 场所可被劫掠的钱，就是该场所主官暴露出来的个人经营钱。
2. 劫掠场所，就是伤害该场所主官的个人资产和威望。
3. 任职主官每周需要向上级缴纳定额铜钱。
4. 上缴不是自动扣款，V1 设计为主官手动缴纳任意金额。
5. 到期前没交齐，本周产生差评/欠贡记录，后续可作为上级撤换理由。
6. 默认职位上下级先只分三层：
   - 顶层：皇帝，固定角色 `朱由校`，职务 `大明天启皇帝`
   - 第二层：司礼监秉笔太监，固定角色 `魏忠贤`
   - 第三层：所有普通场所主官/服务职位
7. `魏忠贤` 先作为皇宫实际主官和所有普通场所上缴目标。

## 阶段 A：固定顶层世界角色

在世界初始化时固定创建或确保存在两个 reserved bot/world actors：

```ts
{
  actorId: 'reserved:emperor_tianqi',
  kind: 'bot',
  displayName: '朱由校',
  title: '大明天启皇帝',
  faction: 'imperial',
  locationId: 'imperial_palace'
}

{
  actorId: 'reserved:wei_zhongxian',
  kind: 'bot',
  displayName: '魏忠贤',
  title: '司礼监秉笔太监',
  faction: 'imperial',
  locationId: 'imperial_palace'
}
```

要求：

1. 这两个角色加入全局 `world.actors`。
2. 不要破坏世界总权柄 10000。若需要给他们初始权柄，应从 bot 总池中分配或调整，不能凭空增加。
3. 皇宫/皇权相关接口能看到这两个角色。
4. 先不要创建 Supabase Auth 登录账号和明文密码。若以后需要让开发者登录皇帝/魏忠贤角色，再单独做“reserved actor 绑定真实账号”的管理接口。

## 阶段 B：场所主官映射

定义每个可劫掠场所的“主官 actor”。

V1 规则：

1. 如果地点有合适的 service position，优先使用该地点最核心服务职位的 occupant 作为主官。
   - `missions` 优先于 `shop`
   - `shop` 优先于 `stamina`
   - 其他服务按现有排序兜底
2. `imperial_palace` 的实际主官固定为 `reserved:wei_zhongxian`。
3. 如果找不到 occupant，则使用该地点 ownerFaction 中 powerShare 最高的 actor 兜底。

给 `LocationTreasuryView` 或新增派生视图增加主官信息：

```ts
chiefActor?: {
  actorId: string;
  displayName: string;
  avatarId: string;
  level: number;
  faction: PowerFactionId;
  title?: string;
  personalCopperExposed: number;
}
```

## 阶段 C：把场所公账绑定为主官暴露铜钱

当前 `locationTreasuries[locationId].copperBalance` 可以继续存在，但其含义改为：

> 该地点主官暴露在该场所中的经营铜钱。

V1 可用两种实现之一：

方案 1，低风险：
- 继续存 `locationTreasuries[locationId].copperBalance`
- 但在所有返回文案和字段说明中解释为主官暴露资金
- 劫掠和守卫工资仍从这个字段扣

方案 2，更强关联：
- 如果当前 `WorldActor` 或 player save 有个人铜钱字段可安全同步，则把该字段与主官个人资产联动
- 但不要为了 V1 进行大规模资产迁移

建议先采用方案 1，确保稳定。字段名可以后续再迁移。

所有场所页面和报告需要能看出：

1. 谁是该场所主官。
2. 当前暴露铜钱是多少。
3. 最近变多还是变少。
4. 劫掠和守卫工资都在动这笔钱。

## 阶段 D：每周上缴债务

在全局 world 状态中新增每周上缴状态，建议结构：

```ts
type OfficeTributeTerm = {
  tributeId: string;
  positionId: string;
  locationId: string;
  officeHolderActorId: string;
  superiorActorId: string; // V1 默认 reserved:wei_zhongxian
  dueCopper: number;
  paidCopper: number;
  termStartsAt: number;
  termEndsAt: number;
  status: 'active' | 'passed' | 'failed';
  reviewLabel: string; // 如 本周未考 / 已足额 / 欠贡
  lastPaidAt?: number;
}
```

V1 规则：

1. 每个普通场所主官每周有一条 active tribute term。
2. 普通场所的 `superiorActorId` 默认是 `reserved:wei_zhongxian`。
3. `reserved:wei_zhongxian` 的上级可显示为 `reserved:emperor_tianqi`，但 V1 不必实现第二级缴纳。
4. `dueCopper` 可按地点等级、服务数量、主官等级或固定表生成，先保持简单。
5. 到期前可以多次手动缴纳任意金额。
6. 到期后：
   - `paidCopper >= dueCopper` => `passed`
   - 否则 `failed`，`reviewLabel = '欠贡'`
7. 到期后不能补缴该 term。
8. 新的一周生成下一条 term。

新增 action：

```ts
WORLD_OFFICE_TRIBUTE_GET
WORLD_OFFICE_TRIBUTE_PAY
```

`WORLD_OFFICE_TRIBUTE_GET` 入参：

```ts
{
  locationId?: string;
  positionId?: string;
  actorId?: string;
  includeHistory?: boolean;
}
```

返回：

```ts
{
  terms: OfficeTributeTermView[];
}
```

`WORLD_OFFICE_TRIBUTE_PAY` 入参：

```ts
{
  tributeId: string;
  amountCopper: number;
}
```

V1 权限：

1. 只有当前玩家 actor 是该 term 的 `officeHolderActorId` 时可以缴纳。
2. 如果 holder 是 bot，则玩家不能代缴。
3. 如果玩家铜钱不足，抛错。
4. 支付后扣玩家铜钱，增加 `reserved:wei_zhongxian` 或 superior 的可记录收入。
5. 若当前没有 actor 个人资产账本，至少写入 office ledger，并在响应中返回结果；不要凭空减少/增加玩家铜钱字段失败。

需要新增错误码：

```ts
OFFICE_TRIBUTE_NOT_FOUND
OFFICE_TRIBUTE_FORBIDDEN
OFFICE_TRIBUTE_CLOSED
OFFICE_TRIBUTE_INVALID_AMOUNT
OFFICE_TRIBUTE_INSUFFICIENT_COPPER
```

## 阶段 E：场所财务报表

新增只读 action：

```ts
WORLD_LOCATION_FINANCE_REPORT_GET
```

入参：

```ts
{
  locationId: string;
  days?: number; // default 7, max 30
}
```

返回建议：

```ts
type LocationFinanceReportView = {
  locationId: string;
  locationName: string;
  chiefActor: {
    actorId: string;
    displayName: string;
    title?: string;
    avatarId: string;
  };
  currentExposedCopper: number;
  nextTribute?: OfficeTributeTermView;
  dailyRows: Array<{
    dayKey: string; // YYYY-MM-DD
    peakCopper: number;
    netCopperDelta: number;
    incomeCopper: number;
    expenseCopper: number;
    raidLossCopper: number;
    guardWageCopper: number;
    tributePaidCopper: number;
  }>;
}
```

数据来源：

1. 可基于 `officeLedger` 聚合。
2. 如果缺少历史峰值，可以 V1 先用当日 ledger 和当前 exposed copper 近似。
3. 后续再新增 daily snapshot，不要为了 V1 过度重构。

## 阶段 F：礼部衙门设计预留

新增地点建议：

```ts
locationId: 'ministry_of_rites'
name: '礼部衙门'
ownerFaction: 'imperial'
services: ['tribute_registry', 'evaluation']
```

V1 可以先只加入地点和职位，不必实现完整编辑权限。

建议职位：

1. `礼部仪制司郎中`：查看各场所上缴规矩。
2. `礼部祠祭司郎中`：查看周贡考评和欠贡名单。

权限方向：

1. 礼部主官未来可编辑各职位的 weekly dueCopper。
2. V1 先做只读，不要让玩家编辑。

## 阶段 G：日志和文案

所有相关行为写入 `officeLedger`：

1. 主官收入增加。
2. 劫掠导致主官暴露资金减少。
3. 守卫领工资。
4. 主官缴纳周贡。
5. 周贡到期通过/失败。

建议新增 ledger type：

```ts
'tribute_pay'
'tribute_passed'
'tribute_failed'
'chief_exposed_copper_change'
```

文案方向：

1. “北镇抚司主官某某本周向司礼监缴纳铜钱 1200。”
2. “某某欠贡未足，礼部记为差评。”
3. “某地公账被劫，主官某某暴露铜钱折损 300。”

## 测试要求

新增/更新测试覆盖：

1. 世界初始化后存在 `朱由校` 和 `魏忠贤` 两个 reserved actors。
2. 世界权柄总量仍为 10000。
3. 皇宫实际主官为 `魏忠贤`。
4. 普通场所可解析出主官。
5. `WORLD_LOCATION_TREASURY_GET` 返回 chiefActor。
6. `WORLD_OFFICE_TRIBUTE_GET` 返回普通场所的 active weekly term。
7. 当前玩家如果不是 holder，不能缴纳别人的 tribute。
8. holder 缴纳 tribute 会扣铜钱并更新 paidCopper。
9. 到期未足额时标记 failed/欠贡。
10. `WORLD_LOCATION_FINANCE_REPORT_GET` 能返回 7 天聚合行。
11. 劫掠后报表 netCopperDelta / raidLossCopper 可见。
12. 全量 TypeScript 编译通过，全量 Vitest 通过。

## 文档要求

更新：

- `server/tdd/api_master_list.md`
- `server/tdd/player_save_schema.md`
- `server/tdd/error_code_dictionary.md`
- `server/tdd/global_config_and_limits.md`

如涉及数据库字段或全局 world schema，请同步更新相关 DDL / global world state 文档。

## 非目标

本阶段不要做：

1. 真正创建 Supabase Auth 皇帝/魏忠贤账号和密码。
2. 完整皇帝/礼部编辑任免后台。
3. 多级复杂上下级树。
4. 自动大规模职位撤换。
5. 真实玩家府邸、外地城市、生产配方。
6. 场所特色掉落表。
7. 前端图表组件的复杂实现。

先把“主官暴露铜钱、每周上缴债务、固定顶层角色、财务报表 API”打通。
