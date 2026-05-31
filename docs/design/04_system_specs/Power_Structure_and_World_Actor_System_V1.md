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

## Patronage, Ritual Submission, and Controlled Dependence

This section records the long-term design direction for feudal control relationships under the Ming power theme. It should guide future Huangce, office, faction, and outer-map systems.

### Design Goal

The game should not treat faction reputation as a flat modern relationship meter. It should represent a pyramid of control:

1. A low-status actor needs a patron to survive and grow.
2. A patron grants access, protection, office nomination, equipment, and mission channels.
3. The cost is tribute, loyalty, obedience, risk sharing, and reduced freedom.
4. The higher the patron, the more valuable the resources and the heavier the ritual and political cost.

Player-facing language should favor Ming-flavored terms:

| System idea | Preferred in-game wording |
| :--- | :--- |
| Ultimate controller | 共主 / 上意 / 实控后台 |
| Beneficial owner | 最终得利者 / 幕后门路 |
| Patron | 恩主 / 靠山 / 提携人 / 座师 / 义父 |
| Dependency | 投附 / 投献 / 挂靠 / 认门路 |
| Loyalty | 表忠 / 递投名状 / 纳贡 / 听差 |
| Rent extraction | 贡纳 / 抽成 / 租课 / 份例 |
| Downline labor | 佃户 / 苦力 / 矿丁 / 脚夫 / 外役 |

### Faction Common Representatives

Each power faction should eventually expose one or more representative figures. These figures do not need to own all power personally. They are the visible actor through whom many holders coordinate, similar to an actual controller or一致行动人.

| Faction | Common representative direction | Control fantasy |
| :--- | :--- | :--- |
| 皇权 | 皇帝、宗室、司礼监秉笔、受宠近侍 | 唯上意是从，资源来自圣眷，也随时可能被清算 |
| 勋贵 | 国公、世袭武勋、开国旧门第 | 门第、家将、旧功、军功旧账 |
| 清流 | 座师、士林盟主、都察院言官 | 名分、公论、师门、门生故旧 |
| 边镇 | 总兵、家丁头目、军粮经手人 | 私兵、军粮、边功、兵权尾大 |
| 商税 | 盐商首总、织造买办、牙行总揽 | 银路、账本、贡品、供应链 |
| 暗流 | 香头、流民首领、脚夫帮主、秘社头目 | 活命、藏匿、脏活、底层动员 |

### Ritual and Submission

Ritual is not decoration. It is the UI language of hierarchy.

Important Ming-flavored control images:

1. **叩拜**: Publicly, the highest ritual submission should point toward imperial authority. Privately, kneeling to patrons, teachers, eunuchs, generals, or adoptive fathers can exist as gray social behavior.
2. **认义父 / 拜门**: A strong patronage action. It grants protection and route access, but creates loyalty obligations and betrayal cost.
3. **座师门生**: A literati version of patronage. Less violent in surface wording, but equally binding through exam lineage, recommendation, and public reputation.
4. **投献 / 挂靠**: A commercial or local-power version. A weak actor offers resources, labor, name, or land under a stronger name to survive.
5. **自阉入内廷**: This should be treated as an extreme identity and body-right surrender to the imperial machine. It can exist as NPC background, rare route, or historical event flavor, but should not be a casual joke button.

Implementation principle:

1. Use these relationships to explain access, protection, tribute, suspicion, and office nomination.
2. Avoid making humiliation itself the reward. The reward is access to power; humiliation or submission is the cost and flavor of the hierarchy.
3. Always preserve player choice between taking protection, staying peripheral, betraying a patron, or seeking another patron.

### Patronage Fields for Future Data

Future actor or position data can add:

```ts
type PatronageProfile = {
  nominalSuperiorActorId?: string;
  actualControllerActorId?: string;
  patronActorId?: string;
  ritualLevel: 'none' | 'bow' | 'kneel' | 'kowtow' | 'private_submission';
  loyaltyRequirement: number;
  tributeRequirement?: {
    copperPct?: number;
    resourcePct?: number;
    serviceCount?: number;
  };
  betrayalCost?: {
    suspicionDelta?: Partial<Record<PowerFaction, number>>;
    standingDelta?: Partial<Record<PowerFaction, number>>;
    powerShareLoss?: number;
  };
};
```

These fields are not required for current V1 implementation. They exist to keep future systems coherent.

### Appointment Power, Financial Power, and Payline

Actual control in this game should primarily mean two practical powers:

1. **Appointment power**: who can recommend, nominate, appoint, remove, protect, or suppress a position holder.
2. **Financial power**: who controls salary, stipend, tribute return, office funds, supply grants, and downstream resource distribution.

In many cases, the visible office holder is not the actual controller. A position can be nominally owned by one faction, appointed by another patron, and paid through a third account chain. This creates the core "manage upward" gameplay.

Recommended position fields for future versions:

```ts
type OfficeControlProfile = {
  positionId: string;
  nominalOwnerFaction: PowerFaction;
  appointmentControllerActorId?: string;
  appointmentControllerFaction?: PowerFaction;
  financeControllerActorId?: string;
  financeControllerFaction?: PowerFaction;
  paylineControllerActorId?: string;
  expectedPayPerCycle: number;
  actualPayPerCycle?: number;
  payCycleSec: number;
  arrears: number;
  skimmedAmount?: number;
};
```

Player-facing interpretation:

1. A player does not seize an office only by defeating the current occupant. They must make the appointment controller willing to recommend or appoint them.
2. A superior can promise salary or protection but fail to pay if their own account is empty.
3. A finance controller can set how much actually reaches subordinates.
4. A subordinate may only see the final received amount, not the full upstream deductions.
5. Overpaying builds loyalty; underpaying creates resentment, betrayal risk, petitions, or defection.

Payline examples:

1. A middle official receives central allocation and automatically distributes salary to several lower actors on a cooldown.
2. The middle official can set the payout amount. Keeping more increases personal resources but reduces subordinate loyalty.
3. If the middle official has misused funds and their account lacks money, the scheduled payout fails and becomes arrears.
4. Rural dependents submit grain, ore, transport service, or rent. Their return copper or ration is decided by the patron's payout settings.
5. Low-status actors feel the hierarchy as delayed, uncertain payment: they wait for the payout cycle and discover whether they were paid in full, underpaid, rewarded, or ignored.

This system should make "loyalty" concrete. A subordinate is loyal not because a number says so, but because access, salary, survival, and future appointment depend on a superior's controlled resources.

### Bottom Pyramid: Outer Labor and Rent

The world should eventually include a large base of low-status roles outside the central Beijing office network. They are not only background population; they form the production base of the pyramid.

Possible outer-map roles:

1. Tenant farmers and military colony households.
2. Salt workers, miners, kiln workers, and transport laborers.
3. Porters, runners, boatmen, and city gate labor.
4. Refugees, escape households, and secret-society dependents.
5. Shop apprentices, account-room clerks, and household servants.

Gameplay direction:

1. Low-status actors pay rent, quota, tax, or tribute to survive.
2. Patrons can extract from their dependent base and redistribute a small amount as protection, equipment, or permissions.
3. High-spending or high-power players can become visible patrons, but their pyramid creates more enemies and more cleaning risk.
4. The bottom layer should have limited growth but many routes of dependency, making "find a backer" a real strategic choice.

This supports the long-term social pyramid: many actors provide labor and tribute; fewer actors control posts and channels; very few actors coordinate faction-level power.

---

## Office Appointment, KPI, and Centralization V1

This section supersedes the earlier loose idea of "challenge the current office holder directly". V1 office competition should be appointment-driven, not arena-driven.

### Core Decision

Offices are not won by clicking a duel button. They are granted, renewed, removed, or reassigned through superior appointment power.

The player-facing fantasy:

1. A player sees offices in the Huangce and the Ministry of Personnel registry.
2. Each office has a current holder, a superior who controls appointment, and a finance/payline controller.
3. A player can try to become eligible, cultivate a superior, weaken the incumbent, or wait for weekly review.
4. The final change of office is an appointment decision, not a direct loot drop.

### New Location: Ministry of Personnel

Add a Beijing location:

```ts
locationId: 'ministry_of_personnel'
name: '吏部衙门'
ownerFaction: 'censorate' | 'imperial'
services: ['office_registry', 'appointment', 'evaluation']
```

Suggested NPC/position roles:

1. `吏部文选司郎中`: shows office list, requirements, appointment chain, and eligible candidates.
2. `吏部考功司郎中`: shows weekly KPI, term result, tax delivery, power delivery, and review risk.
3. `内廷批红中使`: represents imperial override authority when the emperor seat intervenes.

If client scope needs to stay small, V1 can place these three service positions inside `imperial_palace` first, then split them into a standalone `ministry_of_personnel` location later.

### Office KPI Is Only Two Numbers

Do not make V1 KPI complex. Every office tracks at most two weekly obligations:

1. **Tax delivery**: how much copper/silver/resources the office sends upward per cycle.
2. **Power delivery**: how much world power the office transfers upward per cycle.

Interpretation:

1. Tax delivery is the concrete basis of financial power.
2. Power delivery is the concrete basis of appointment power.
3. Offices can differ by which KPI matters more, but the model remains the same.

Example fields:

```ts
type OfficeKpiProfile = {
  termStartsAt: number;
  termEndsAt: number; // one week in V1
  taxDuePerTerm: number;
  taxDeliveredThisTerm: number;
  powerDuePerTerm: number;
  powerDeliveredThisTerm: number;
};
```

### Term Rule

V1 term length: one week.

At term end:

1. If KPI is met, the office holder becomes eligible for renewal.
2. If KPI is missed, the office holder becomes easier to remove or replace.
3. A superior may still protect a failed office holder, but this should cost power, money, or political risk in later versions.

### Unseating an Incumbent

Pulling someone down should attack the two foundations of office:

1. **Break their finance**: make the office holder fail tax delivery, lose money, or accumulate arrears.
2. **Reduce their power**: make the office holder lose `powerShare`, lowering their appointment value and protection.

V1 should not implement murder, deletion, permanent injury, or equipment loss.

Possible unseating channels:

1. Mission targeting: a service position holder can influence a location's mission target pool.
2. Censorate impeachment: future channel, mainly reduces finance score or adds review pressure.
3. Northern Bureau investigation: future channel, mainly reduces target power.
4. Imperial override: emperor-only power to reassign posts if candidate power exceeds incumbent power.

### Mission Output Depends on Issuer Location

Missions should not all produce the same strategic resource.

Recommended V1 rule:

1. **Northern Bureau / Jinyiwei missions**: power taken from the target flows upward to the Northern Bureau chief or their superior chain. The executing player receives XP and copper, not the power.
2. **Other institution missions**: the executing player can receive a small amount of power, while money or tax value flows to the institution's office holder.
3. **Shop and stamina services**: money/tax value flows to the service position holder or finance controller.

This gives each location a clear identity:

1. Jinyiwei is a power-stripping machine.
2. Commercial locations are money/tax machines.
3. Personnel and palace locations decide who can sit in offices.

### Mission Target Control

Some office holders can influence their location's mission target pool.

For example:

1. The Northern Bureau mission office holder can designate or bias mission targets.
2. Other players taking Northern Bureau missions naturally weaken those targets.
3. The power stripped by those missions flows to the Northern Bureau chief or imperial chain.
4. This allows real player politics outside the server: a powerful emperor player can pressure the Northern Bureau chief to list a disliked player as a target.

This is intentional. The game should support social standing, loyalty, pressure, betrayal, and private negotiation.

### Emperor-Only Override

The emperor seat is the only position that may directly reassign any office by decree.

V1 rule:

1. Emperor can replace an office holder only if the incoming candidate's `powerShare` is greater than the current holder's `powerShare`.
2. This expresses that even imperial will needs a usable power base.
3. The replaced holder loses the office but does not lose equipment, level, or character existence.
4. This creates a centralization loop: loyal players can be empowered by the emperor, then used to take over more offices.

This should be a rare, highly visible action in UI, not a hidden admin operation.

### Suspicion Direction

The earlier `suspicion` concept is useful as a server-side risk meter, but it should not dominate player-facing office politics.

Current direction:

1. Player-facing conflict should be explained through office, finance, power, patronage, and target lists.
2. Suspicion can remain as a hidden or secondary risk term for legacy mission/faction logic.
3. Do not make suspicion the main reason a player understands why they were attacked.

Players should feel: "someone with office power listed me as a target", not "the server's suspicion number selected me".

### First Implementation Scope

Server V1 should implement data and read APIs before heavy interaction:

1. Add `ministry_of_personnel` location or equivalent palace service positions.
2. Add office detail fields: term, KPI, appointment controller, finance controller, treasury split, and incumbent.
3. Add read API: `WORLD_SERVICE_POSITION_GET_DETAIL`.
4. Add read API or extension for office registry filtering by location, faction, service, and replace eligibility.
5. Add mission settlement routing by issuer location:
   - Jinyiwei power flows to issuer office chain.
   - non-Jinyiwei power can still flow to executing player.
   - money/tax values flow to relevant office holder or finance controller.

Do not implement full appointment UI until the office detail and settlement routing are stable.

### Office Candidates and Plotting V1

After office detail and ledger are visible, the next step is still read-only. The game should explain how a player could enter the nomination pool before allowing any actual appointment action.

Add a candidate view for each office:

```ts
type OfficeCandidateView = {
  actorId: string;
  kind: 'player' | 'bot';
  displayName: string;
  avatarId: string;
  level: number;
  faction: PowerFaction;
  powerShare: number;
  combatRating?: number;
  isCurrentPlayer: boolean;
  score: number;
  scoreBreakdown: Array<{
    label: string;
    value: number;
    passed: boolean;
    hint: string;
  }>;
  recommendation: string;
};
```

The office detail UI should eventually answer four player questions:

1. Can I be considered for this office?
2. If not, what exactly blocks me?
3. Who currently looks more qualified than me?
4. What should I do next to improve my chance?

V1 should not appoint, remove, or transfer office ownership. It should only expose:

1. Eligibility details.
2. Candidate list.
3. Recommended next action.
4. Whether the incumbent is vulnerable due to KPI failure, lower power, or weak faction fit.

Suggested API:

```ts
WORLD_SERVICE_POSITION_CANDIDATES_GET
```

Request:

```ts
{
  positionId: string;
  limit?: number;
}
```

Response:

```ts
{
  positionId: string;
  incumbent: OfficeCandidateView;
  currentPlayer?: OfficeCandidateView;
  candidates: OfficeCandidateView[];
  plottingAdvice: string[];
}
```

Candidate scoring should remain simple:

1. Level fit.
2. Power share.
3. Same faction or accepted faction.
4. Current office vacancy or incumbent KPI weakness.
5. Whether the appointment controller is aligned with the candidate.

This makes the Ministry of Personnel useful before real appointment controls exist.

*Last Updated: 2026-06-01*
