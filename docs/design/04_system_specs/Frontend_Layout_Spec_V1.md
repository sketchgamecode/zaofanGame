# Frontend Layout Spec V1
Status: Draft
Designer Intent Source: User concept art + Codex implementation scaffold
Implementation Allowed: Yes
Current Version: V1.4

---

## 0. Version History

### V1.4 - 2026-05-28

本次版本按当前实现纠偏入口结构：

1. `CityScene` 是角色扮演玩法主入口。
2. 差事、商店、副本、竞技、补给、情报等从京城场所里的 `ServicePosition` / NPC 职务进入。
3. 右侧 `RightRail` 只保留个人随身功能，例如角色简报、资源、随身行囊、战报/邮件。
4. 场所内打开的玩法页面使用“返回场所”，不再依赖顶层退出账号按钮。
5. 商店、副本、竞技页面可显示来源场所和任职 NPC 角色卡。

### V1.3 - 2026-05-17

对比 `clients/web` 实际实现，纠偏以下信息：

1. **CharacterPanel 坐标蓝图**：从"基准 `594x886` 绝对像素"改为"百分比定位实现说明"。装备槽统一 `128×128px`，位置由百分比值定位。
2. **Shop 坐标蓝图**：纠正 `ShopCharacterPanel` (`655->755px` 宽，无外部偏移)、`ShopStage` (顶部 `y:42->0`)、`ShopInventoryDrawer` (高度 `518->626`) 的实际值。
3. **ItemSlot 原子化完成**：统一 `128×128px`，移除文字渲染，全局 tooltip store，droppable 封装。
4. **RootStage 缩放移除**：删除 CSS `transform: scale()` 自适应逻辑，修复历史拖拽坐标偏移。
5. **Section §7 Next Step** 更新为当前阶段目标。

### V1.2 - 2026-05-14

本次版本将顶层框架从“右栏 + 底栏”修正为“右栏常驻 + 左侧场景满高”：

1. 移除顶层 `BottomHud`，避免底部 100px 常驻栏影响 Shakes & Fidget 式系统界面坐标复刻。
2. `SceneViewport` 改为 `1534x1080`，左侧场景可吃满舞台高度。
3. 铜钱、令牌、沙漏、声望等全局资源改为显示在右侧 `PortraitCard` 角色简报区。
4. 场景内仍可按需要局部展示相关资源，例如商店背包抽屉上方显示铜钱和令牌。

### V1.1 - 2026-05-13

本次版本纠偏以下问题：

1. 将商店从单一 `BlackMarketScene` + tab 的 app 面板模式，修正为两个独立场景：`WeaponShopScene` 与 `MagicShopScene`。
2. 明确商店体验是“玩家角色走访不同 NPC 店铺”，不是商品管理后台。
3. 新增 `CharacterPanel` 坐标级蓝图，要求按 Shakes & Fidget 的角色面板语法实现。
4. 明确 `CityScene` 地标是角色扮演玩法入口；右侧导航栏只保留个人管理与随身功能，不再作为第二套玩法地图。

### V1.0 - 2026-05-10

初版定义固定 `1920x1080` 舞台、常驻右栏/底栏、`SceneViewport` 场景切换与基础复用组件方向。

---

## 1. Goal

本规格用于当前 `clients/web` 前端。

核心原则：

1. 使用固定逻辑画布 `1920x1080`。
2. 登录成功后，右侧导航面板永久常驻；不再保留顶层底部 HUD。
3. 系统切换只替换左侧场景区内容，不替换主框架。
4. 客户端只渲染服务端结果与发送 action，不本地裁定游戏规则。

服务端权威补充：

1. 客户端可以基于最近一次服务端快照做 UI 预提示，例如按钮置灰、背包满提醒、资源不足提示。
2. 任何会改变存档、资源、装备、任务、战斗、冷却或奖励的行为，都必须通过服务端 action 完成。
3. 如果客户端预提示与服务端返回冲突，以服务端返回为准，并刷新相关状态。

这套前端不是常规网页，而是“固定舞台 + 可替换场景层”。

---

## 2. Stage Partition

整屏按下列大区划分：

1. `SceneViewport`
左侧主场景区，负责背景、NPC、交互热点、系统子组件。

2. `RightRail`
右侧常驻导航面板，负责：

1. 顶部角色简信息卡。
2. 玩家资源显示。
3. 个人管理入口，例如随身行囊、战报回放、邮件、设置。

右侧导航不负责差事、商店、副本、竞技、情报等角色扮演行为入口；这些入口必须落在 `CityScene` 的京城场所和场所任职 NPC 上。

3. `OverlayRoot`
全局覆盖层，负责全局 tooltip、阻断式弹窗、确认框、临时详情弹窗。

说明：

1. `InventoryScene` 是一个完整主场景，不属于 `OverlayRoot`。
2. `CharacterPanel` 是可复用场景组件，可出现在 `InventoryScene`、`WeaponShopScene`、`MagicShopScene` 等场景内，不默认作为全局覆盖层打开。
3. `OverlayRoot` 只承载跨场景的临时覆盖内容，避免把主玩法面板误做成弹窗系统。

---

## 3. Base Coordinates

当前骨架采用以下初始矩形：

| Zone | X | Y | W | H |
| :--- | ---: | ---: | ---: | ---: |
| `SceneViewport` | 0 | 0 | 1534 | 1080 |
| `RightRail` | 1534 | 0 | 386 | 1080 |

右栏内部：

| Zone | X | Y | W | H |
| :--- | ---: | ---: | ---: | ---: |
| `PortraitCard` | 1562 | 18 | 320 | 252 |
| `RightNav` | 1584 | 292 | 276 | auto |
| `SealButton` | 1810 | 928 | 82 | 128 |

这些数值已同步写入：

- `clients/web/src/config/layout.ts`

后续你如果想手工调位置，优先改这个文件，不要四处散改。

当前项目已使用右侧常驻导航栏。虽然 Shakes & Fidget 参考截图多为左侧导航栏，但本项目前端有意采用右侧导航作为换皮差异；除非 User 明确要求，不应仅因参考图而改回左侧导航。

---

## 4. Scene Design Rules

### 4.0 Global Scene Rule

所有系统场景面板必须遵守以下统一规则：

1. 默认进入 `CityScene`。
2. `CityScene` 内包含各系统的建筑地标入口。
3. 角色扮演行为必须从城市地标、场所 NPC 或场所职务进入。
4. 右侧导航只允许切换个人管理与随身功能，不允许新增差事、商店、副本、竞技等玩法场所入口。
5. 从场所内打开的子玩法（差事、商店、副本、竞技）必须提供“返回场所”按钮。
6. 顶层 `SceneViewport` 的关闭按钮只表示退出当前账号或关闭主场景，不应作为场所内返回按钮使用。
7. 场所内子玩法层级必须高于顶层关闭按钮，避免玩家误触退出账号。

### 4.1 Missions / TavernScene

`TavernScene` 当前作为差事系统承载页复用，不再被理解为唯一“酒馆任务入口”。它可以由北镇抚司、都察院、九边都司、织造局、流民暗线等不同场所职务打开。

差事场景应优先强调：

1. 发布人是谁。
2. 目标角色是谁。
3. 发布方与目标方分别属于哪个权力集团。
4. 完成后会获得什么奖励、增加什么牵连、转移什么权柄。

推荐结构：

1. 来源场所与职务。
2. 发布人 `CharacterPortraitCard`。
3. 目标角色 `CharacterPortraitCard`。
4. 三个差事选项。
5. 倒计时、战斗回放和结算反馈。

### 4.2 Shops: WeaponShopScene / MagicShopScene

商店不是一个 app 式操作面板，而是玩家角色走访不同 NPC 店铺的场景。

参考：

1. `docs/design/03_external_reports/s&f_screenshot/shops/system_weaponshop.JPG`
2. `docs/design/03_external_reports/s&f_screenshot/shops/system_magicshop.JPG`

场景拆分：

1. `WeaponShopScene`：兵器铺，出售武器、副手、头、衣、手、靴等战斗装备。
2. `MagicShopScene`：奇珍阁，出售项链、腰带、戒指、饰品等奇珍法器。
3. 两者可以共用同一个内部 `ShopScene` 实现，但对玩家必须表现为两个不同店铺、不同 NPC、不同背景的拜访场景。
4. `CityScene` 地标入口和场所 NPC 职务按钮负责承接商店入口；右侧 `RightRail` 不再新增商店快捷入口。
5. 从场所进入商店时，商店应显示经手 NPC 的 `CharacterPortraitCard`，并在购买、出售、换货后给出角色化反馈。

Shop Scene 坐标蓝图（V1.3 实际 CSS 值，基于 `SceneViewport 1534x1080`）：

| Zone | X | Y | W | H | 说明 |
| :--- | ---: | ---: | ---: | ---: | :--- |
| `ShopCharacterPanel` | 0 | 0 | 755 | 1080 | 左侧角色面板，紧贴左上，无外部偏移，占满全高 |
| `ShopStage` | 755 | 0 | 779 | 454 | 右上店铺舞台，紧贴顶部，无偏移 |
| `ShopTitle` | 1006 | 58 | 300 | 44 | 店铺标题 |
| `ShopInfoButton` | 1434 | 62 | 44 | 44 | 信息按钮，占位 |
| `ShopNpc` | 1230 | 152 | 210 | 294 | NPC 立绘区域 |
| `ShopGoodsGrid` | +214 | +58 | 3x128 | 2x128 | 3列2行商品格，单格 `128x128` |
| `ShopRefreshButton` | 1014 | 412 | 292 | 66 | “换批货 · 1 令牌” |
| `ShopInventoryDrawer` | 755 | 520 | 808 | 626 | 右下背包抽屉，高度向下延展至底部 |
| `ShopInventoryGrid` | — | — | 6x128 | — | 6列背包格，单格 `128x128` |
| `ShopSellDropZone` | 728 | 866 | 704 | 44 | 出售拖拽区域，临时保留在商店舞台和背包抽屉交界处 |

数据契约：

1. 服务端 `REFRESH_BLACKMARKET` 当前返回 `BlackMarketView.items` 共 12 件商品，约定为“兵器铺 6 件 + 奇珍阁 6 件”。
2. `WeaponShopScene` 过滤 `weapon/offHand/head/body/hands/feet`。
3. `MagicShopScene` 过滤 `neck/belt/ring/trinket` 等非兵器铺装备。
4. 前端不得使用 tab 把两个店铺合并成一个 app 页面。
5. 免费自动刷新倒计时读取服务端 `nextAutoRefreshMs`，不要在本地推断。
6. 客户端预检查只用于体验优化，最终购买、出售、穿戴、背包容量判断必须来自服务端 action。

### 4.3 Inventory

`InventoryScene` 是当前角色系统的首个完整场景版本。

建议布局：

1. 左半：`CharacterPanel`
2. 右半：`InventoryGrid`
3. 二者水平并排，参考 `system_inventroy.JPG`

说明：

1. `CharacterPanel` 是跨系统复用的大型组件，不是顶层常驻框架。
2. 点击右侧导航顶部的角色简信息卡，应进入 `InventoryScene`。

---

## 5. Editing Workflow

对当前项目，推荐你用下面的工作流：

1. 先在 Figma 画 `1920x1080` 的完整静态图。
2. 用 Figma 标注每个区域的 `x/y/width/height`。
3. 把这些数值抄进 `layout.ts`。
4. 前端先用占位框复原层级和位置。
5. 等位置稳定后，再逐步换成正式 PNG 资源。

不要一开始就做复杂组件抽象，也不要先接后端再调布局。

正确顺序是：

1. 版式
2. 资源
3. 交互
4. 数据

---

## 6. Figma Use Boundary

Figma 在这个项目中的正确定位是：

1. 版面蓝图
2. 切图源文件
3. 坐标与尺寸标注工具

Figma 不是运行时 UI 编辑器，也不应被当作工程双向同步源。

工程中的真实实现，以 `clients/web` 源码和本规格为准。

---

## 7. Immediate Next Step (V1.3 当前阶段)

### V1.0~V1.2 阶段已完成

1. 按 S&F 蓝图重构 `CharacterPanel`，装备槽围绕中央头像布局。
2. 将 `BlackMarketScene` 拆分为 `WeaponShopScene` 与 `MagicShopScene` 两个独立场景。
3. 曾为 `RightRail` 与 `CityScene` 新增两个店铺入口；当前已纠偏为仅由 `CityScene` 场所职务承接店铺入口，`RightRail` 不再承载店铺。
4. `ItemSlot` 原子化重构：`128x128px` 统一尺寸，移除文字渲染，全局 tooltip store，droppable 封装。
5. 移除 CSS `transform: scale()` 自适应缩放，修复历史拖拽坐标偏移。

### V1.4+ 当前阶段目标

1. **京城场所首屏指引**：新玩家进入京城时能理解“地图进场所，场所找任职者办事；右侧只管随身功能”。
2. **场所服务牌统一**：NPC 下方服务按钮应表现为职务牌，而不是现代 app 菜单按钮。
3. **角色详情统一**：所有 `CharacterPortraitCard` 点击都优先打开同一套 `CharacterPanel` 详情。
4. **子玩法来源统一**：差事、商店、副本、竞技从场所进入时都显示来源场所和任职者。
5. **美术资源接入**：正式 PNG 替换地点、NPC、商店、案牍、校场等 placeholder。

---


## 8. 复用性组件 (Reusable Components)
遵循“原子化设计”原则，由底层积木向高级复合面板构建。这些组件贯穿游戏各个子系统，需保持高度统一的外观和交互逻辑。

### 8.0 模块化 UI 的 CSS 同源规则

本项目中的“模块化 UI 组件”不是只指 React 组件复用，也包括视觉样式和交互表现复用。凡被列为可复用模块的 UI 部件，其内部 DOM 与 CSS 必须同源，避免同一个玩家感知组件在不同场景里出现多套局部样式。

1. 模块内部样式只能由模块自己的基础 class 与 variant class 控制，例如 `.character-portrait-card*`、`.resource-chip*`、`.item-slot*`、`.item-icon-layer*`、`.right-nav*`。
2. 场景或面板可以控制模块外层布局，例如位置、宽高、间距、排列方向，也可以通过组件 props 选择模块已经提供的变体，例如 `ResourceBadge size="compact"` 或 `width={184}`。
3. 禁止用场景选择器覆写模块内部元素，例如 `.right-rail .character-portrait-card__name`、`.player-resource-panel .resource-chip__icon`、`.blackmarket-scene .item-slot__icon`。
4. 如果某个场景确实需要不同视觉表现，先把差异沉淀成模块自己的 props 或 variant class，再由场景调用，不要在场景 CSS 里临时覆盖。
5. 当前纳入 CSS 同源约束的模块包括：`CharacterPortraitCard`、`ResourceBadge` / `PlayerResourcePanel`、`ItemSlot` / `DraggableItemSlot` / `ItemDragPreview`、`RightRailNav`。后续新增 token、resource、panel 类复用模块默认也遵守此规则。

1. 通用物品格 (ItemSlot)
组件定位
游戏内核心的、高度复用的基础交互组件。不仅存在于 CharacterPanel（角色已穿戴装备），同样广泛应用于 Inventory（背包）、各类商店（Shop）货架以及战利品结算界面。

当前实现说明：

1. `clients/web` 已有 `CharacterPanel` 与 `InventoryScene` 的拖拽雏形，但物品格仍是文本卡片式表现。
2. 后续应把装备格、背包格、商店格收敛为同一个 `ItemSlot`，再由不同场景传入 `item`、`slotType`、`disabledReason`、`dragSource` 等参数。
3. `ItemSlot` 只负责表现和交互事件派发，不直接修改角色状态；穿戴、购买、出售等结果必须来自服务端 action 响应。

UI 布局与层级
作为一个支持绝对定位挂件的相对定位容器，自底向上应包含：

    1. 背景底纹层：区分物品类别（如武器专属底纹、防具底纹）或品阶光效。

    2. 物品 Icon 层：核心图片资源，尺寸需在所有系统中保持统一。

    3. 挂件层 (Badges)：预留右下角的宝石孔/已镶嵌宝石图标，左下角的附魔/符文标识。

    4. 交互遮罩层 (Event Target)：用于接收鼠标 Hover、Drag 拖拽等交互事件的透明顶层。

2. 物品信息浮窗 (Item Tooltip)

组件定位
全局唯一的浮层组件，悬停于 ItemSlot 时触发，跟随鼠标显示。

实现边界：

1. Tooltip 推荐由 `OverlayRoot` 或全局 overlay store 管理，避免被 `SceneViewport` 的 `overflow: hidden` 裁剪。
2. 场景组件只上报 hover/drag 状态，不直接持有复杂 tooltip 布局。
3. 拖拽开始时必须关闭 tooltip，并在拖拽结束后恢复 hover 触发。
UI 布局

标题区（根据稀有度变色）及风味描述。

基础面板区（防御/伤害数值）。

附加属性区（力量、敏捷等数值加成）。

扩展状态区（宝石镶嵌状态）。

底部交易价值区（售卖价格）。
交互规则

联动高亮：Hover 背包内物品时，CharacterPanel 上对应的目标可穿戴槽位必须高亮，提供视觉引导。

动态对比：Hover 未装备物品时，属性区新增一列“差异对比值”。绿色 + 号表示提升，红色 - 号表示下降。

拖拽避让：当玩家按下鼠标开始拖拽（dragstart）时，立刻强制销毁 Tooltip。拖拽移动期间（dragging）屏蔽所有 Hover 触发，直到释放（drop/dragend）才恢复。


3. 通用动作按钮 (ActionButton)
组件定位
游戏中执行主要交互的按钮，贯穿所有系统（如酒馆接取任务、竞技场发起挑战、铁匠铺确认升级、商店购买等）。

UI 布局与视态

基础样式：带有厚重奇幻风格（如木质或金属质感）的宽体按钮，包含居中的动作文本。

内嵌消耗/产出：S&F 按钮的一个大特色是资源整合。按钮内部往往直接整合了前置条件，比如在文本右侧附带“消耗 1 个蘑菇 (Token)”的小图标；或者在酒馆任务按钮上直接显示“获得 XX 经验 / XX 金币”。

交互规则

状态提示 (State Hint)：在渲染阶段可以基于最近一次服务端快照提示玩家资源是否足够。如果资源不足，或者处于冷却时间（CD），按钮可以置灰进入 Disabled 状态，并可能在上方附带红色提示文字。但这只是 UI 预提示，不能替代服务端 action 的最终校验。

点击反馈：按下时有明显的 Z 轴下沉效果和音效反馈。

4. 通用进度条 (ProgressBar)
组件定位
用于展示数值消耗、时间流逝或经验积累的条状组件。

UI 布局

背景槽 (Track) + 填充条 (Fill)。

颜色语义化：根据业务逻辑改变填充色。例如：生命值（红色）、经验值（黄色/绿色）、任务倒计时/远征时间（蓝色）。

文本叠层 (Overlay Text)：进度条中央通常叠层显示绝对数值（如 150 / 300）或百分比，鼠标悬停时（Hover）通常会显示更精确的数值计算说明。

交互规则

支持平滑的宽度补间动画（Tween Animation），特别是在战斗扣血或任务结束经验增长时，视觉效果必须平滑，避免突变。

宽度变化时必须带有平滑的补间动画（Tween），避免数值突变带来的生硬感。

5. 资源/标签块 (ResourceBadge)
组件定位
用于在各处标识货币、资源数量或物品价值的微型组件。

UI 布局

极简结构：[资源Icon] + [数值文本]。

变体使用场景：

在右侧 `PortraitCard` 角色简报区作为资产总览展示。

在 Tooltip 底部作为售卖价格展示。

在商店面板顶部作为玩家当前可用余额展示。

交互规则

当数值发生变化时（尤其是扣除或增加时），数值文本需要有放大闪烁或颜色跳变（绿涨红跌）的短暂动效，强化玩家的“获得感”或“失去感”。

6. 通用确认弹窗 (StandardModal)
阻断式的全局层（基于 OverlayRoot），带有全屏半透明遮罩。用于处理“背包已满拦截”、“资产高危变动确认”等核心提示流。
组件定位
阻断式的前景弹窗，处理涉及资产变动、重要警告或系统确认的交互。这是支撑“背包满时阻断并提示”规则的底层组件。

UI 布局

背景遮罩 (Overlay)：全屏半透明黑色遮罩，点击遮罩区域不可取消（或者视作点击取消，需统一规定）。

主体面板：包含带标题的羊皮纸/石板风格面板。

核心内容区：支持纯文本说明，或附带相关物品 Icon。

底部操作区：固定排布的 ActionButton（确认 / 取消）。

交互规则

弹出时屏蔽底层 SceneViewport 的所有点击事件。



7. 角色信息主面板(CharacterPanel)

组件定位
角色信息主面板，用于展示角色的核心外观、装备状态、核心数值以及系统功能扩展入口。作为跨系统复用的通用组件，必须保持高度统一，可常驻出现在背包（Inventory）、各类商店（Shop）等场景的左侧半屏。该组件需具备随玩家等级和系统解锁“渐进式展示”的能力。

UI 布局 (Layout)
整个面板采用固定窗口设计，必须按 Shakes & Fidget 的构图语法实现。参考图片见：

1. `docs/design/03_external_reports/s&f_screenshot/common/charaterPanel/lowlevelcharacter.jfif`
2. `docs/design/03_external_reports/s&f_screenshot/common/charaterPanel/highlevelcharacter.jfif`

CharacterPanel 定位说明（V1.3 实现，百分比定位）：

| Zone | X | Y | W | H | 说明 |
| :--- | ---: | ---: | ---: | ---: | :--- |
| `PanelFrame` | 0 | 0 | 594 | 886 | 外框 |
| `PortraitFrame` | 150 | 20 | 292 | 282 | 中央大头像 |
| `InfoButton` | 396 | 34 | 38 | 48 | 头像右上信息按钮 |
| `NameLine` | 150 | 232 | 292 | 36 | 名字/帮会名叠在头像下部 |
| `LevelBar` | 150 | 310 | 292 | 34 | 等级条 |
| `SlotHead` | 18 | 24 | 112 | 112 | 左上装备槽 |
| `SlotBody` | 18 | 148 | 112 | 112 | 左中装备槽 |
| `SlotHands` | 18 | 272 | 112 | 112 | 左中下装备槽 |
| `SlotFeet` | 18 | 396 | 112 | 112 | 左下装备槽 |
| `SlotNeck` | 464 | 24 | 112 | 112 | 右上装备槽 |
| `SlotBelt` | 464 | 148 | 112 | 112 | 右中装备槽 |
| `SlotRing` | 464 | 272 | 112 | 112 | 右中下装备槽 |
| `SlotTrinket` | 464 | 396 | 112 | 112 | 右下装备槽 |
| `SlotWeapon` | 206 | 372 | 112 | 112 | 中下主手 |
| `SlotOffHand` | 326 | 372 | 112 | 112 | 中下副手 |
| `Tabs` | 18 | 520 | 558 | 56 | ATTRIBUTES/DESCRIPTION/INFO/INTERACTIONS |
| `StatsGrid` | 18 | 590 | 558 | 188 | 两列属性区 |
| `BottomSlots` | 18 | 800 | 256 | 68 | 3 个药水槽 |
| `SpecialSlot` | 430 | 784 | 96 | 82 | 高级特殊道具槽，占位 |

实现纪律：

1. `CharacterPanel` 不使用普通 app 左右分栏布局。
2. 装备槽必须围绕中央头像分布。
3. 属性区必须位于 tabs 下方，并保持 2 列块状展示。
4. 当前美术资源不足时，可使用占位图和边框，但坐标比例不得自由重排。

头部与身份区 (Header & Avatar)

角色头像 (Portrait)：居中大面积展示当前角色的形象。【高级特性】背景图可随特殊系统（如截图中的六芒星背景）发生替换。

头像挂件锚点 (Avatar Badges)：

左上角：VIP标识或特殊身份标签（如红黄相间的 VIP 缎带）。

右上角：信息说明按钮（i icon）。

左下角/右下角：随着游戏后期系统解锁（如爬塔、公会传送门等），此处会常驻显示圆形的全局状态/增益徽章（如截图中的火焰脸和紫色爬山小人）。

身份信息：头像正下方依次排列角色名和公会名。

经验与等级条 (Level Bar)：公会名下方为横向进度条，中间居中文本显示当前等级（如：Level 637）。

装备插槽区 (Equipment Slots)
围绕角色头像与经验条，固定分布着 10 个装备槽。

基础排布：左侧4个（头、胸、手、脚），右侧4个（项链、腰带、戒指、饰品），中央2个（主副手）。

物品挂件层 (Item Overlays)【高级扩展】：装备槽本身是一个支持多图层叠加的容器。除了基础的物品Icon外，还需要预留以下角标位置：

右下角：宝石镶嵌孔（空置或显示已镶嵌的宝石，如橙色菱形宝石）。

左下角：附魔/符文标识（如截图中的绿色心形、灰色手套/鞋子等小图标，代表该装备经过了铁匠铺改造或附带特殊符文）。

页签与属性扩展区 (Tabs & Stats Panel)

页签导航栏 (Tabs)：包含 ATTRIBUTES、DESCRIPTION、INFO、INTERACTIONS。

属性面板区 (Attributes Grid)：

包含5种基础属性（力量、敏捷、智力、体质、幸运）和1个衍生属性（护甲）。

动态数值颜色【高级特性】：除了主属性会有发光边框高亮外，属性的数值文本颜色会根据当前受到的增益状态改变（如截图中 STRENGTH 变为蓝色，CONSTITUTION 变为粉紫色，对应底部药水或系统Buff的颜色）。

底部插槽区 (Bottom Slots)：

左侧槽位：3 个临时增益/药水槽（Potion Slots），高级状态下填满各色药剂。

右侧槽位【高级扩展】：预留给后期解锁的全局特殊道具或系统入口（如截图中右下角的“圣杯/图鉴”独立插槽）。

边缘扩展区 (Edge Extensions)【补充】

右侧边缘折叠按钮：在面板右侧边缘中央预留一个向左的黄色小箭头 <。这通常用于呼出伴随面板（如：二套装备配置 / 随从面板 / 宠物面板），点击后向右侧展开新内容。

交互规则 (Interaction Rules)

装备拖拽与状态判定 (Drag & Drop)：

支持与外部面板（背包、商店）双向拖拽。拖入即穿戴/替换，拖出至商店即售卖。

组合镶嵌逻辑：不仅宝石可以拖入装备孔，后期的附魔材料/符文也可以通过拖拽至装备格来激活左下角的附加属性徽章。

视态差异与权限 (Tab Context & Permissions)：

自视态（看自己）：显示基础属性右侧的 + 升级按钮（除非属性已达系统绝对上限）。允许拖拽更换装备、替换药水。

他视态（看别人）：如当前高级截图所示，隐藏所有属性的 + 升级按钮，锁定所有拖拽操作。底部药水槽和右侧特殊插槽仅供查看（Hover显示Tooltip），不可交互。

信息提示框 (Tooltip Hover)：

鼠标悬停在带有“挂件”的装备上时，Tooltip 必须分块显示：基础属性、宝石加成（带图标）、符文/附魔加成（带对应角标图标）。

悬停在头像角落的状态徽章（如火焰脸）上，需显示该全局系统的解锁状态或提供的永久增益说明。

属性升级 (Attribute Upgrade)：

单点升级消耗金币，长按 + 按钮支持连续快速加点。

给您的开发建议：
在实现前端时，ItemSlot（物品格）和 AvatarFrame（头像框）这两个子组件一定要做成支持绝对定位（absolute）子元素的相对定位（relative）容器。
例如 ItemSlot，底层是物品图片，上层绝对定位四个角落的 div 作为挂件槽（SlotBadge），这样在接入后端数据时，只要判断该物品 has_gem: true 就在右下角渲染宝石，rune_type: 'health' 就在左下角渲染心形符文，能极大提高组件的复用性和应对后期系统扩展的能力。

*Last Updated: 2026-05-10*
