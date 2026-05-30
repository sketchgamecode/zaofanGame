# Server Agent Prompt: Service Positions V1

请实现“场所职务系统”第一版，把当前 `WORLD_LOCATIONS_GET_STATUS` 返回的 `serviceActors` 升级为更明确的 `servicePositions`。

## 背景

前端已经把京城地点内页改成：

```text
地点背景 + 地点说明 + 底部横向 NPC 角色卡列表
```

玩家反馈更容易理解，但我们需要把这些 NPC 正式定义为“占据场所职务的世界角色”，而不是单纯服务演员。

核心模型：

```text
PowerLocation -> ServicePosition -> WorldActor -> LocationService
```

每个场所服务由一个职位承担。一个职位只对应一个主要服务。一个 NPC 卡下只显示一个服务按钮。

## 重要约束

1. 本阶段不需要兼容旧存档。
2. 不要实现职位争夺、收益结算或替代玩法，只做数据模型和返回结构。
3. 不要删除当前 `serviceActors`，可以短期保留以避免前端联调断裂；但新增正式字段 `servicePositions`。
4. 世界权柄总量仍必须守恒为 `10000`。
5. 每个地点的每个 service 至少应有一个对应 position。

## 类型建议

新增或等价实现：

```ts
type ServicePositionStatus = 'bot_held' | 'player_held' | 'vacant' | 'locked';

type ServicePositionView = {
  positionId: string;
  locationId: string;
  title: string;
  service: PowerLocationService;
  ownerFaction: PowerFactionId;
  minLevel: number;
  incomeHint: string;
  replaceHint: string;
  status: ServicePositionStatus;
  occupant: {
    actorId: string;
    kind: 'bot' | 'player';
    displayName: string;
    avatarId: string;
    faction: PowerFactionId;
    level: number;
    powerShare: number;
  };
};
```

在 `PowerLocationView` 增加：

```ts
servicePositions: ServicePositionView[];
```

## 职务生成规则

对每个 `PowerLocation.services` 生成一个 position。

示例：

```text
northern_bureau services: ['missions', 'intel']
=> 北镇经历司吏 / missions
=> 密档书办 / intel

divine_engine_camp services: ['shop']
=> 神机营军需官 / shop

wine_house services: ['stamina']
=> 酒楼掌柜 / stamina

pleasure_quarter services: ['stamina', 'intel']
=> 教司坊妈妈 / stamina
=> 坊中消息人 / intel
```

职务标题可以先用静态映射：

```ts
const POSITION_TITLE_BY_SERVICE = {
  missions: '差事承办',
  shop: '账房掌柜',
  dungeon: '案牍书办',
  arena: '校场执事',
  promotion: '门房引见',
  intel: '消息书办',
  estate: '府邸管事',
  stamina: '补给掌柜',
};
```

更好的版本是按 locationId + service 定制标题。

## 任职者选择规则

为每个 position 选择一个 occupant：

1. 优先从同 locationId 的 world actors 中选择。
2. 其次从同 ownerFaction 的 world actors 中选择。
3. 最后从所有 world actors 中兜底。
4. 同一个地点内尽量不要让同一个 actor 占据多个 position。
5. 如果真实玩家 actor 符合条件，可以被选为 occupant，但第一版不需要复杂权重。
6. occupant 的 `avatarId` 沿用你已实现的稳定头像逻辑。

## incomeHint / replaceHint 文案方向

第一版只返回提示，不产生实际收益：

```text
shop: 此职可从本处交易中抽取少量商税，收益规则待开放。
missions: 此职可从差事承办中获得官声与派系关系，收益规则待开放。
dungeon: 此职可从案牍推进中获得清洗功劳，收益规则待开放。
arena: 此职可从考绩挑战中获得威名，收益规则待开放。
stamina: 此职可从补给消费中抽取人情与银路收益，收益规则待开放。
intel: 此职可掌握本处消息流，收益规则待开放。
```

替代提示：

```text
达到等级、派系关系和地点贡献要求后，后续可争夺此职。
```

## 测试要求

请覆盖：

1. `WORLD_LOCATIONS_GET_STATUS` 每个有 services 的地点都返回 `servicePositions`。
2. `servicePositions.length >= services.length`。
3. 每个 service 至少有一个对应 position。
4. 每个 position 都有 occupant。
5. occupant 的 actorId、displayName、avatarId、faction、level、powerShare 均有效。
6. 同一地点多服务时，优先使用不同 occupant。
7. 权柄总量仍为 `10000`。
8. 现有 `serviceActors` 如保留，应和 `servicePositions` 不冲突。
9. 全量测试通过。

## 文档更新

请同步更新：

1. `server/tdd/api_master_list.md`
2. `server/tdd/player_save_schema.md`
3. 如有新增常量，更新 `server/tdd/global_config_and_limits.md`

## 汇报格式

完成后请汇报：

1. 修改文件。
2. `servicePositions` 的最终字段结构。
3. 职务标题映射规则。
4. 任职者选择规则。
5. 是否保留 `serviceActors`。
6. 测试数量和结果。
