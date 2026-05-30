# Power Structure and World Actor System V1

本文档定义“大明权柄结构”“世界角色池”“历史案件副本”和“离线角色对抗”的系统草案。它服务于新的核心题材：玩家在大明权力机器中求升迁、争站位、夺权柄。

---

## 1. 核心目标

本系统要把任务、副本、PVP、NPC、玩家离线数据和大明权力集团统一起来。

玩家不再只是刷抽象怪物，而是在一个总量有限的权力世界里与具体角色发生冲突。每个角色都属于某个权力集团，持有一定份额的权柄。任务和副本本质上是权力集团之间的打压、清洗、护送、追赃和夺利。

核心体验：

1. 世界权力总量有限，所有角色都在争夺。
2. 玩家必须站队，站队带来保护、门路和限制。
3. 权柄越高，收益越高，也越容易被围剿。
4. NPC 与真实玩家共享同一套世界角色池，冷启动阶段由 bot 填充，真实玩家变多后逐步替换。
5. 历史案件不是静态副本，而是从世界角色池中抽取目标，形成动态权力清洗。

---

## 2. 权柄：世界总权力资源

### 2.1 定义

`权柄` 是本游戏的核心世界资源，代表一个角色或集团在大明权力结构中“决定他人命运”的份额。

世界总权柄恒定为 `100%`。

实现上建议使用整数表示：

```ts
const WORLD_POWER_TOTAL = 10000; // 100.00%
```

显示时转为百分比：

```ts
powerShare = 137; // 1.37%
```

### 2.2 权柄不是普通货币

权柄不能像铜钱一样随意产出。它必须从其他角色或集团处转移而来。

允许的权柄变化来源：

1. 历史案件副本胜利。
2. 集团任务成功。
3. 离线对抗胜利。
4. 晋升节点站队。
5. 集团内部清洗或夺位事件。

不允许的权柄变化来源：

1. 普通登录奖励。
2. 常规商店购买。
3. 无代价日常任务。
4. 单纯等级提升。

---

## 3. 六大权力集团

世界权柄先归属于集团，再分配给集团内的角色。

| 集团 ID | 名称 | 权力来源 | 典型地点 | 典型角色 |
| :--- | :--- | :--- | :--- | :--- |
| `imperial` | 皇权 | 朱家宗室、内廷、密旨、厂卫 | 紫禁城、内务府、北镇抚司 | 宗室、太监、锦衣卫、内廷采办 |
| `noble` | 勋贵 | 开国功臣、国公府、世袭爵位 | 国公府、军功旧部 | 国公门客、勋贵家将 |
| `censorate` | 清流 | 科举、言官、士绅、名分 | 都察院、贡院、六科廊 | 御史、清流门生、乡绅 |
| `border` | 边镇 | 九边、总兵、卫所、家丁 | 辽东、宣府、大同、卫所屯田 | 总兵、把总、军户、家丁 |
| `silver` | 白银 | 商帮、盐引、牙行、军需、贡品流转 | 盐商会馆、牙行、织造局 | 盐商、账房、牙人、买办 |
| `underworld` | 失序民间 | 流民、逃户、香会、秘社 | 流民营、香会暗线、赃物铺 | 香头、流民首领、秘社信众 |

### 3.1 牵连值

除六大集团外，角色还应拥有一个全局风险值：

```ts
suspicion: number;
```

`牵连` 代表角色是否容易被清洗、查抄、弹劾或列入逆案。

牵连上升来源：

1. 权柄过高。
2. 频繁跳站位。
3. 参与黑货、贡品、逆案任务。
4. 被多个集团敌视。
5. 在历史案件中作为目标阵营成员。

牵连高的后果：

1. 更容易被副本抽为敌方目标。
2. 正统衙门接待变差。
3. 任务失败惩罚变重。
4. 暗线和白银集团可能更愿意接纳。

---

## 4. 世界角色池

### 4.1 世界角色定义

世界中所有可被任务、副本、竞技、离线对抗抽取的角色都进入统一池。

```ts
type WorldActorKind = 'bot' | 'player';

type PowerFaction =
  | 'imperial'
  | 'noble'
  | 'censorate'
  | 'border'
  | 'silver'
  | 'underworld';

type WorldActor = {
  id: string;
  kind: WorldActorKind;
  displayName: string;
  level: number;
  originId: RaceId;
  classId: PlayerClassId;
  faction: PowerFaction;
  locationId: MingLocationId;
  powerShare: number;
  suspicion: number;
  combatSnapshot: CombatSnapshot;
  status: 'active' | 'defeated' | 'protected' | 'promoted';
};
```

### 4.2 冷启动规模

冷启动阶段建议生成 `260` 个世界角色：

1. 真实玩家数量不足时，由 bot 补齐。
2. bot 必须有出身、职司、站位、地点、装备、等级和战斗快照。
3. bot 名称可混合史实影子、地方小吏、商帮账房、军户、香会人物。
4. bot 不应只是“怪物”，而是具有社会身份的具体人物。

### 4.3 真实玩家替换规则

真实玩家增长后，逐步降低 bot 抽取权重。

| 真实玩家数量 | bot 抽取权重 | player 抽取权重 |
| :--- | :--- | :--- |
| 0-49 | 90% | 10% |
| 50-99 | 60% | 40% |
| 100+ | 30% | 70% |

若某地点或集团真实玩家不足，bot 自动补位。

### 4.4 离线玩家保护

真实玩家可作为离线目标，但必须限制挫败感。

建议规则：

1. 使用最近一次 `combatSnapshot` 战斗，不直接读取实时可变状态。
2. 每日被影响次数有上限。
3. 不掉装备，不直接扣铜钱。
4. 影响权柄、官声、集团势运等长期资源。
5. 防守成功可获得少量官声或权柄保护。

---

## 5. 大明权力地图

地图不是单纯地理地图，而是“权力地理”。玩家在不同地点拜访不同集团，领取差事、购买装备、争夺权柄。

### 5.1 地图层级确认

V1 主舞台只做“京城权力地图”。这是玩家日常进入游戏后看到的核心地图，表达的是玩家在京城权力机器中走访衙门、站队、办差、置装、晋升和被牵连的过程。

V1 不做“大明版图上多座城市，每座城市再展开城内场所”的结构。该结构会快速膨胀内容量，并稀释“京城权力中枢”这一核心体验。

V2 可以增加“大明版图外派层”，但它的定位不是替代京城主地图，而是服务：

1. 外派案件目标地。
2. 任务距离和耗时计算。
3. 地方势力资源来源。
4. 特殊历史案件的地域包装。
5. 少数重点地点未来升级为二级地图，例如南京、辽东、两淮。

最终层级：

```text
主舞台：京城权力地图
外部世界：大明版图任务目标层
深挖对象：玩家在京城权力机器中的升迁、站队、牵连、清洗
```

### 5.2 V1 京城权力地点

| 地点 ID | 地点名 | 所属集团 | 当前可承载系统 |
| :--- | :--- | :--- | :--- |
| `imperial_palace` | 皇宫 | 皇权 | 黄册、晋升、密旨、后续内府资源 |
| `northern_bureau` | 北镇抚司 | 皇权 | 差事、情报 |
| `divine_engine_camp` | 神机营 | 边镇 / 军权 | 军械商店 |
| `censorate` | 都察院 | 清流 | 案卷副本、差事 |
| `noble_mansion` | 国公府 | 勋贵 | 校场竞技 |
| `border_command` | 九边总兵府 | 边镇 | 军粮、清剿、边镇对抗 |
| `salt_merchant_guild` | 盐商会馆 | 白银 | 奇珍商店 |
| `weaving_bureau` | 织造局 | 皇权 / 白银 | 贡品、宫中流出物 |
| `refugee_camp` | 流民营 / 香会暗线 | 暗流 | 情报、战报包装节点 |
| `wine_house` | 京城酒楼 | 白银 | 令牌补体力 |
| `bun_shop` | 城门包子铺 | 暗流 | 铜钱补给占位 |
| `pleasure_quarter` | 教司坊 | 白银 | 道具补给、情报占位 |
| `player_inventory` | 随身行囊 | 个人 | 装备、属性、角色面板；不属于京城场所 |

### 5.3 地点网络而非坐标网格

V1 地图应表现为“带坐标展示的地点网络”，而不是 100×100 网格。

服务端地点建议包含：

```ts
type PowerLocation = {
  locationId: MingLocationId;
  name: string;
  ownerFaction: PowerFaction;
  x: number; // 地图展示坐标，不是格子坐标
  y: number;
  unlockLevel: number;
  services: LocationService[];
  connectedLocationIds: MingLocationId[];
  travelCostSecBase: number;
  status: 'locked' | 'open' | 'favored' | 'hostile';
};
```

`x/y` 仅服务前端绘制；真实可达关系由 `connectedLocationIds` 决定。任务耗时可由地点网络最短路径、玩家当前位置、目标地点和坐骑/通行特权共同计算。

### 5.4 地点服务

每个权力集团可以有自己的任务入口、商店、副本或晋升节点，但底层不应为每个集团重写一套系统。推荐地点挂载通用服务：

```ts
type LocationService =
  | 'missions'
  | 'shop'
  | 'dungeon'
  | 'arena'
  | 'promotion'
  | 'intel'
  | 'estate'
  | 'stamina';
```

示例：

1. 北镇抚司：`missions` / `intel` / 诏狱案件。
2. 神机营：`shop` / 军械任务。
3. 都察院：`dungeon` / 弹劾查账任务。
4. 国公府：`arena` / 军功旧案。
5. 盐商会馆：高铜钱任务 / 黑货商店。
6. 流民营：暗线任务 / 藏匿 / 低门槛脏活。
7. 紫禁城：`promotion` / 密旨 / 高级内府货源。

### 5.5 地点、服务与身份门路

地点不是平等菜单。地点代表权力空间，服务代表底层功能，门路代表玩家以当前身份能接触到的具体渠道。

三者关系：

```text
PowerLocation -> LocationService -> AccessChannel

地点：都察院
服务：missions / dungeon / intel
门路：正式案牍、门房递状、御史门生引荐、书吏私活
```

同一个 `LocationService` 可以由多个 `AccessChannel` 包装。前端可复用同一个组件，服务端可复用同一个 action，但展示给玩家的名称、NPC、开放条件、奖励倾向和风险提示必须由门路决定。

建议数据结构：

```ts
type AccessChannel = {
  channelId: string;
  locationId: MingLocationId;
  service: LocationService;
  ownerFaction: PowerFaction;
  displayName: string;
  npcTitle?: string;
  description: string;
  minLevel?: number;
  requiredFaction?: PowerFaction;
  requiredStanding?: Partial<Record<PowerFaction, number>>;
  maxSuspicion?: Partial<Record<PowerFaction, number>>;
  allowedOrigins?: RaceId[];
  deniedOrigins?: RaceId[];
  status: 'locked' | 'peripheral' | 'open' | 'favored' | 'hostile';
};
```

状态含义：

1. `locked`：身份、等级、站位或牵连不满足，不能使用。
2. `peripheral`：只能接外围差事，例如跑腿、递状、带路、告密、搬货。
3. `open`：可以正常使用该服务。
4. `favored`：同阵营、被引荐或 standing 足够，获得更好文案和可能的奖励倾向。
5. `hostile`：牵连过高或敌对集团，不一定完全锁死，但应有盘查、加价、低信任或更高风险。

示例：

| 玩家身份 | 地点 | 服务 | 玩家看到的渠道 |
| :--- | :--- | :--- | :--- |
| 流民秘社 | 都察院 | `missions` | 门外递状、替人告密、偷听案声 |
| 清流世家 | 都察院 | `missions` | 御史案牍、弹劾草稿、查账差事 |
| 军户边镇 | 神机营 | `shop` | 军需库、旧铳修配、火药账房 |
| 市井商贾 | 盐商会馆 | `shop` | 盐引暗柜、贡品折卖、账房私货 |
| 厂卫职司 | 北镇抚司 | `intel` | 密档、诏狱口供、暗查名册 |

当前入口规则：右侧导航不展示差事、商店、副本、竞技、补给、情报等门路快捷入口。它不是独立于京城地图的第二套入口系统，只保留随身行囊、战报/邮件、资源与角色简报等个人功能。

### 5.6 玩家府邸

玩家府邸应作为实体地点处理，但挂靠在某个京城或地方权力区域之下。

```ts
type PlayerEstate = {
  estateId: string;
  ownerPlayerId: string;
  parentLocationId: MingLocationId;
  x: number;
  y: number;
  level: number;
};
```

府邸挂靠位置可随出身、站队和晋升变化。例如清流玩家靠近都察院，商税玩家靠近盐商会馆，边镇玩家靠近九边都司。流民出身前期可以没有正式府邸，只有临时落脚点。

### 5.7 场所职务系统

场所不应只是背景图和固定 NPC。每个场所都应由若干“职务”组成，职务由世界角色池中的具体角色占据。玩家看到的 NPC，本质上是占据某个场所职务的 bot 或真实玩家离线角色。

正式关系为：

```text
PowerLocation -> ServicePosition -> WorldActor -> LocationService

地点：北镇抚司
职务：经历司吏
任职角色：某个 bot 或玩家离线角色
服务：missions
```

这样可以让玩家自然理解：

1. 场所里的 NPC 不是装饰，而是占着位置的人。
2. 一个职务只负责一个主要服务，避免一个 NPC 承担多个入口造成现代菜单感。
3. 玩家后续可以争夺、替代或任职这些位置。
4. 职务可以产生抽成、声望、情报、保护、牵连等长期收益和风险。
5. 冷启动阶段由 bot 占位，真实玩家成长后逐步替代 bot。

建议数据结构：

```ts
type ServicePosition = {
  positionId: string;
  locationId: MingLocationId;
  title: string;
  service: LocationService;
  ownerFaction: PowerFaction;
  minLevel: number;
  occupantActorId: string;
  incomeHint: string;
  replaceHint: string;
  status: 'bot_held' | 'player_held' | 'vacant' | 'locked';
};
```

前端展示时，每个 `ServicePosition` 应渲染为一张角色卡：

1. 角色卡使用统一的 `CharacterPortraitCard`。
2. 角色卡显示任职者姓名、头像、等级、派系、权柄和职务名。
3. 角色卡下方只显示该职务负责的一个服务按钮。
4. 点击角色卡打开任职者详情，而不是直接触发服务。
5. 点击服务按钮才进入 shop / missions / dungeon / arena / stamina / intel 等具体功能。

短期 API 可以从当前 `serviceActors` 过渡到更准确的 `servicePositions`：

```ts
servicePositions: Array<{
  positionId: string;
  title: string;
  service: LocationService;
  ownerFaction: PowerFaction;
  minLevel: number;
  incomeHint: string;
  replaceHint: string;
  occupant: {
    actorId: string;
    kind: 'bot' | 'player';
    displayName: string;
    avatarId: string;
    faction: PowerFaction;
    level: number;
    powerShare: number;
  };
}>
```

V1 不需要立刻实现职位争夺，只需要先让所有地点服务都由职务承载。职位详情面板可以先展示“任职中 / 后续可替代 / 收益规则待开放”等提示。

### 5.8 场所职务收益与替代方向

职务系统的长期价值在于“权力寻租”。不同服务职务可以有不同收益：

| 服务类型 | 职务收益方向 | 替代方式方向 |
| :--- | :--- | :--- |
| `shop` | 从交易额中抽取少量铜钱、声望或商税权柄 | 交易贡献、商税 standing、挑战原任职者 |
| `missions` | 从玩家完成差事中获得官声、派系 standing 或少量权柄 | 完成该地点差事、获得上级举荐 |
| `dungeon` | 从案件推进中获得案牍功劳和清洗收益 | 参与历史案件、提高相关派系信任 |
| `arena` | 从挑战和排名中获得威名与赌注抽成 | 战力挑战、排名超过任职者 |
| `stamina` | 从补给消费中抽成，获得市井声望或银路关系 | 生活场所投资、特殊道具、人情 |
| `intel` | 获得情报流和他人行动痕迹 | 站队、密探任务、低牵连维持 |

职位替代不应只看战力。不同位置可以看不同条件：

1. 等级和战力。
2. 所属派系和 standing。
3. 对该地点的贡献。
4. 当前牵连是否过高。
5. 是否完成投名状。
6. 是否击败或清洗原任职者。

这能把商店、任务、副本、PVP 和权柄系统统一到同一个长期目标：玩家不是只在菜单里消费，而是在京城权力机器里争夺具体职位。

---

## 6. 历史案件副本

### 6.1 定义

历史案件副本是权力集团发起的结构性清洗或打压。副本目标从世界角色池中筛选，而不是固定怪物。

```ts
type HistoricalCaseDungeon = {
  id: string;
  name: string;
  initiatorFaction: PowerFaction;
  targetFactions: PowerFaction[];
  unlockLevel: number;
  requiredStanding?: Partial<Record<PowerFaction, number>>;
  suspicionGainOnJoin: number;
  powerTransfer: {
    from: PowerFaction[];
    to: PowerFaction;
  };
};
```

### 6.2 目标抽取规则

副本敌人从 `WorldActor` 中抽取：

1. `actor.faction` 属于 `targetFactions`。
2. `actor.level` 接近副本等级段。
3. `actor.status === 'active'`。
4. 高 `powerShare` 和高 `suspicion` 提高被抽中概率。
5. bot 和 player 使用同一套抽取逻辑。

### 6.3 案件示例

#### 蓝玉案

```ts
{
  id: 'lanyu_case',
  name: '蓝玉案',
  initiatorFaction: 'imperial',
  targetFactions: ['noble', 'border'],
  unlockLevel: 50,
  suspicionGainOnJoin: 2,
  powerTransfer: {
    from: ['noble', 'border'],
    to: 'imperial'
  }
}
```

包装方向：

皇权清洗军功集团和边镇武力。敌人来自勋贵、边镇和蓝案牵连角色。可混入史实影子 bot 与站队勋贵/边镇的真实玩家。

#### 胡惟庸案

发起方：皇权  
目标：清流、官僚旧党、地方士绅  
主题：废相、削弱官僚中枢、集中皇权。

#### 盐税追赃

发起方：皇权或清流  
目标：白银集团、盐商、牙行、地方官  
主题：白银网络与官僚勾连。

#### 贡院舞弊案

发起方：清流  
目标：世家、地方士绅、买题门路  
主题：科举名分战争。

#### 诏狱清查

发起方：皇权 / 厂卫  
目标：高牵连角色  
主题：密旨、诏狱、恐怖统治与站队惩罚。

---

## 7. 权柄转移

### 7.1 基础规则

任务或副本成功后，权柄从目标集团或目标角色流向发起集团和执行者。

示例：

```ts
result = {
  actorPowerDelta: +3,
  targetActorPowerDelta: -2,
  initiatorFactionPowerDelta: +5,
  targetFactionPowerDelta: -5,
  suspicionDelta: +1
}
```

### 7.2 玩家收益

玩家作为执行者获得：

1. 少量个人权柄。
2. 发起集团 standing。
3. 官声或铜钱。
4. 对立集团恶感。
5. 牵连风险。

### 7.3 高权柄反制

权柄高的角色必须自然暴露风险。

建议反制：

1. 更容易被历史案件抽为目标。
2. 其他集团发布针对任务。
3. 同集团内部出现夺位任务。
4. 牵连自然上升。
5. 晋升收益更高，但失败损失更重。

---

## 8. 站位与忠诚

### 8.1 站位

角色可以与多个集团保持关系，但必须有一个当前主要站位：

```ts
primaryFaction: PowerFaction;
standing: Record<PowerFaction, number>;
```

站位影响：

1. 哪些地点接待玩家。
2. 哪些任务可见。
3. 任务奖励倍率。
4. NPC 口吻和称呼。
5. 是否被敌对集团列入目标池。

### 8.2 投名状

`投名状` 代表玩家真正押注某个集团。

```ts
pledges: PowerFaction[];
```

投名状带来：

1. 高级任务开放。
2. 特殊商店货源。
3. 更强保护。
4. 对立集团惩罚。
5. 反悔成本。

投名状不应轻易取消。取消应触发权柄损失、牵连上升或对立任务。

---

## 9. 任务发布场所

任务不再只有一个通用发布池。每个权力集团有自己的任务入口。

| 发布场所 | 所属集团 | 任务类型 | 好处 | 风险 |
| :--- | :--- | :--- | :--- | :--- |
| 内廷密旨 | 皇权 | 查抄、密捕、清洗名单 | 令牌、稀有货源、皇权 standing | 牵连高，清流恶感 |
| 北镇抚司 | 皇权 | 缉拿、盯梢、诏狱审讯 | 官声快，战斗奖励直接 | 民间和清流关系下降 |
| 都察院 | 清流 | 弹劾、查账、纠察 | 阅历稳定，牵连较低 | 铜钱少，得罪皇权/勋贵 |
| 神机营 / 国公府 | 边镇 / 勋贵 | 军械押运、清剿、军粮案 | 军械、护甲、战斗资源 | 卷入军功旧案 |
| 盐商会馆 / 牙行 | 白银 | 送银、买路、贡品流转 | 铜钱多、折扣 | 清流恶感、牵连上升 |
| 香会暗线 / 流民营 | 失序民间 | 劫粮、藏匿、暗杀 | 黑货、奇遇、爆发资源 | 皇权和厂卫敌意 |

### 9.1 接待态度

每个任务入口根据 standing 显示态度：

1. `亲信`：高级任务开放，奖励更好。
2. `可用`：正常接待。
3. `存疑`：只给脏活，奖励变差。
4. `闭门`：不给任务，可能触发刁难。

---

## 10. 冷启动实现建议

第一阶段不需要完整实现所有系统。推荐最小落地路径：

1. 服务端生成 bot world actors。
2. 地图和任务先显示地点/集团包装。
3. 任务目标从 bot 池抽取。
4. 真实玩家只用于竞技场，暂不进入案件池。
5. 权柄只做展示和简单增减，不做复杂重新分配。

第二阶段：

1. 真实玩家进入 world actor 池。
2. 副本目标从 bot/player 混合抽取。
3. 加入 standing 和 suspicion。
4. 历史案件开始转移集团权柄。

第三阶段：

1. 加入投名状。
2. 加入高权柄反制任务。
3. 加入集团势运和地图地点状态变化。

---

## 11. 设计边界

1. 本系统服务“大明体制内升迁”，不服务泛 RPG 怪物刷图。
2. 历史人物和案件应作为权力结构影子使用，不要求严格复刻史实。
3. 玩家可以参与历史案件的余波和清洗逻辑，但不应轻易改写史实大事件。
4. 离线玩家可以被抽为目标，但必须限制损失，避免挫败。
5. 权柄总量必须稀缺，不能无限产出。
6. 站队必须有代价，不能让玩家无成本左右逢源。

---

## Mission Target Actor V1

Mission targets should become concrete world actors, not temporary anonymous enemies. The first implementation must stay intentionally small: it makes the target visible and uses an actor combat snapshot, but does not introduce death, permanent injury, position seizure, revenge mail, or online PvP consequences.

### Goal

For every mission offer, the player should understand:

1. Who issued the mission.
2. Which faction benefits.
3. Which faction is targeted.
4. Which concrete actor is being handled.
5. What risk and power consequence may follow.

The player-facing feeling is: "I am not fighting a random monster. I am carrying out one faction's business against a named person in the world power pool."

### Target Selection

When generating a mission offer, the server selects a `targetActor` from `world.actors`.

Recommended first-pass filtering:

1. `actor.faction === mission.powerContext.targetFaction`.
2. Actor level is near the player's level.
3. Prefer actors located in locations owned by, or related to, the target faction.
4. Prefer actors with `powerShare > 0`.
5. Prefer actors occupying a `servicePosition` when available.
6. Fallback to any actor in the target faction if the stricter pool is empty.

The target selection should be stable for a generated offer set: once the offer is generated, its target actor snapshot must remain stable through start and settlement.

### Mission Offer Data

Add an optional target preview to mission offers and active missions:

```ts
type MissionTargetActorPreview = {
  actorId: string;
  kind: 'bot' | 'player';
  displayName: string;
  avatarId: string;
  level: number;
  classId: PlayerClassId;
  raceId?: RaceId;
  faction: PowerFactionId;
  locationId: string;
  locationName?: string;
  powerShare: number;
  title?: string;
  positionId?: string;
  reason: string;
};
```

`reason` is player-facing case text, for example "salt ledger suspect", "old military retainer", "censorate petition runner", or the localized Chinese equivalent.

### Combat Snapshot Rule

Mission combat should use the selected target actor's `combatSnapshot`, copied into the mission offer or active mission when the mission is generated or started.

First version rules:

1. Do not recompute the target from current world state during settlement.
2. Do not mutate the target's combat stats after losing.
3. Do not remove the actor from the world.
4. Do not remove or transfer service positions.
5. The target can be used again by future offers unless later balancing decides otherwise.

### Settlement Impact

Player victory:

1. Normal XP/copper rewards.
2. Existing suspicion logic applies to the target faction.
3. Existing power transfer logic transfers a small amount from the target faction or target actor pool to the player actor.
4. Settlement response includes `targetActor` and power result for display.

Player defeat:

1. No power transfer.
2. No permanent target mutation.
3. No position change.
4. Optional first-pass stats such as `targetDefendedCount` should be deferred.

### Explicit Non-Goals

Do not implement these in V1:

1. Killing or deleting target actors.
2. Directly seizing the target's service position.
3. Permanent injuries or stat degradation.
4. Revenge messages or personal enemy lists.
5. Online player notifications.
6. Complex faction AI retaliation.

These are later systems and should not block the first roleplay clarity pass.

---

*Last Updated: 2026-05-27*
