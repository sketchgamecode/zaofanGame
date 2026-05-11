# 角色面板全局 UI/UX 设计规格书 (Character Panel UI Spec)
Status: Draft (待审批)
Designer: Antigravity
Implementation Allowed: Yes (基于 User 指示直接生效)

---

## 1. 核心定位 (Core Concept)

在《大宋造反模拟器》中，“角色面板”**绝不仅是一个静态展示区**，但它也**不是最顶层的常驻框架壳**。

最新 `clients/manual` 前端框架已经确定为：

1. `RightNavigationPanel`：右侧常驻导航面板。
2. `SceneViewport`：左侧系统场景面板。
3. `BottomResourceHud`：底部常驻资源条。

`<CharacterPanel />` 的正确定位是一个**跨系统复用的大型角色组件**：

1. 它会整体性出现在 `InventoryScene`、角色详情页、查看其他玩家角色页，以及后续部分系统页中。
2. 它在不同系统内可复用相同结构。
3. 它不是左侧全局常驻框架位。

Client Agent 应将其实现为独立可复用组件 `<CharacterPanel />`。

---

## 2. 界面区域拆解 (Layout Zones)

### 2.1 头部信息区 (Header Zone)
*   **角色标识**：玩家的昵称 (Name)。
*   **等级与经验**：醒目的等级数字 (Level)，下方紧贴一条真实的 XP 经验条，需能直观显示当前经验 / 升级所需经验 的比例。
*   **职业与立绘 (Avatar)**：中央大块区域展示角色大头像（未来不同职业/不同装扮可变化）。

### 2.2 装备与背包区 (Equipment & Inventory Zone)
*   **装备槽 (Equip Slots)**：围绕 Avatar 呈左右及下方分布，共 10 个槽位。
    *   左列：头盔(Head)、衣服(Body)、手套(Hands)、鞋靴(Feet)。
    *   右列：项链(Neck)、腰带(Belt)、戒指(Ring)、饰品(Trinket)。
    *   底部：武器(Weapon)、副手(OffHand)。
*   **背包区 (Backpack)**：
    *   `CharacterPanel` 本体不要求永久内嵌背包区。
    *   在 `InventoryScene` 中，背包应与 `CharacterPanel` 水平并排出现。
    *   推荐布局：左半 `CharacterPanel`，右半 `InventoryGrid`，参考 `system_inventroy.JPG`。

### 2.3 底部交互标签页 (Bottom Tabs Zone)
位于面板最下方，提供 4 个可切换的内部标签页：
*   **ATTRIBUTES (属性面板)**：核心战斗数值面板（默认激活）。
*   **DESCRIPTION (介绍)**：玩家公会或个人签名。
*   **INFO (详细信息)**：坐骑、相册等附加系统状态。
*   **INTERACTIONS (交互)**：荣誉勋章、成就等。

---

## 3. 核心交互机制 (P0 级重点)

### 3.1 属性加点与衍生计算 (Stats & Upgrades)
在 `ATTRIBUTES` 标签页下，必须完整复刻 S&F 的属性与衍生计算显示。

*   **五大基础属性**：力量(STR)、敏捷(DEX/AGI)、智力(INT)、体质(CON)、幸运(LCK)。
*   **一键加点 (+ 按钮)**：每个基础属性右侧必须跟一个金色的 `+` 按钮。点击时扣除对应的铜钱 (Copper) 成本并提升基础属性（调用后端的 `UPGRADE_ATTRIBUTE` Action）。
*   **衍生战斗参数 (Derived Stats)**：在每个基础属性名称的正下方（浅色/小字体），必须直观显示基于该属性折算出的战斗参数：
    *   力量 -> **Defense** (防御，对战士)
    *   敏捷 -> **Defense** (防御，对游侠)
    *   智力 -> **Damage** (伤害，对法师)
    *   体质 -> **Hit Points** (总血量)
    *   幸运 -> **Critical Hit %** (暴击率百分比)
    *   独立一栏 -> **Armor & Damage Red.** (护甲值及硬减伤百分比)

### 3.2 深度悬浮提示框 (Deep Tooltips)
*   **物品悬浮 (Item Tooltip)**：不管是装备槽、背包槽还是商店里，鼠标 Hover/点击 任意物品，必须弹出包含以下信息的详细面板：
    *   名称、属性加成、护甲/伤害。
    *   **Selling price (售卖价格)**：明确显示卖给商店能换多少钱。
    *   **属性对比 (红绿差异)**：与当前身上对应部位的装备进行红绿染色对比。
*   **属性悬浮 (Stat Tooltip)**：鼠标 Hover 任意基础属性（如幸运），必须弹出气泡框，**清晰拆解数值构成**：
    *   公式说明（如：Luck increases your chance of critical hits）。
    *   Basis（自身基础值，白字）。
    *   Equipment（装备附加值，绿字）。

### 3.3 泛用全局拖拽系统 (Universal DND)
这是游戏交互的灵魂，必须基于 `@dnd-kit/core` 实现以下任意两点间的丝滑拖拽：
*   **背包 ↔ 装备槽**：拖拽进行穿戴 (Equip) / 卸下 (Unequip)。这是当前 P0 必做部分。
*   **商店 ↔ 背包/装备槽**：直接拖入即触发购买并入包/穿戴。
*   **背包 ↔ 商店 (或空白处)**：将背包里的物品拖给商店 NPC（或直接拖到屏幕空白处释放），弹出二次确认框触发 **出售 (Sell)** 动作。

说明：

1. 当前 `manual` 前端优先落地 `InventoryScene` 的 `背包 ↔ 装备槽`。
2. 商店相关 DND 继续沿用同一语义后续扩展。

---

## 4. 角色创建流程 UI (Character Creation Screen)

当存档状态为 `PENDING_CREATION` 时，前端必须强制展示全屏创建界面。

### 4.1 Step 1: 职业选择 (Choose Class)
*   **布局**：卡片式网格。
*   **元素**：
    *   职业包装名称（如“绿林好汉”）。
    *   动态立绘预览。
    *   核心战斗特性标签（如“嗜血连击”）。
    *   主属性提示（力量/敏捷/智力图标）。

### 4.2 Step 2: 种族、头像与命名 (Appearance & Name)
*   **种族选择 (Race)**：展示 8 个种族的包装名与属性修正预览。
*   **头像切换 (Portrait)**：
    *   提供左右切换箭头，遍历 `clients/manual/public/assets/figure/portrait/` 下的 64 张头像。
    *   中央区域放大显示选中的头像。
*   **命名 (Nickname)**：
    *   输入框，限制 2-12 字符。
    *   随机名称按钮 (Dice Icon)：调用简单的随机组合逻辑（可选）。
*   **提交动作**：点击“开始造反”按钮，调用 `CREATE_CHARACTER` 动作。

---

## 5. 与最新 Manual Shell 的关系

为避免与旧版 Designer 文档混淆，补充以下规则：

1. `CharacterPanel` 不是左侧全局常驻框架。
2. 右侧常驻的是 `RightNavigationPanel`。
3. 右侧顶部区域仅显示**角色简信息卡**：
   * 头像
   * 角色名
   * 当前等级
   * 当前经验条
4. 点击这个简信息卡，应进入 `InventoryScene`。
5. `InventoryScene` 中再显示完整的 `CharacterPanel`。

这条规则优先级高于旧版“角色面板常驻左侧”的描述。

---
*Last Updated: 2026-05-10 (Manual Shell aligned)*
