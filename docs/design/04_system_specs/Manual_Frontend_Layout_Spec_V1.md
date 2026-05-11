# Manual Frontend Layout Spec V1
Status: Draft
Designer Intent Source: User concept art + Codex implementation scaffold
Implementation Allowed: Yes

---

## 1. Goal

本规格用于 `clients/manual` 新前端。

核心原则：

1. 使用固定逻辑画布 `1920x1080`。
2. 登录成功后，右侧导航面板与底部 HUD 永久常驻。
3. 系统切换只替换左侧场景区内容，不替换主框架。
4. 客户端只渲染服务端结果与发送 action，不本地裁定游戏规则。

这套前端不是常规网页，而是“固定舞台 + 可替换场景层”。

---

## 2. Stage Partition

整屏按下列大区划分：

1. `SceneViewport`
左侧主场景区，负责背景、NPC、交互热点、系统子组件。

2. `RightRail`
右侧常驻导航面板，负责：

1. 顶部角色简信息卡（头像、名字、等级、经验条）。
2. 主系统切换按钮。
3. 特殊入口按钮。

3. `BottomHud`
底部常驻资源与经验条。

4. `OverlayRoot`
全局覆盖层，负责 tooltip、背包、弹窗、角色详细面板。

---

## 3. Base Coordinates

当前骨架采用以下初始矩形：

| Zone | X | Y | W | H |
| :--- | ---: | ---: | ---: | ---: |
| `SceneViewport` | 0 | 0 | 1540 | 958 |
| `RightRail` | 1540 | 0 | 380 | 1080 |
| `BottomHud` | 0 | 958 | 1540 | 122 |

右栏内部：

| Zone | X | Y | W | H |
| :--- | ---: | ---: | ---: | ---: |
| `PortraitCard` | 1568 | 24 | 324 | 244 |
| `RightNav` | 1570 | 302 | 320 | auto |
| `SealButton` | 1810 | 928 | 82 | 128 |

底栏内部：

| Zone | X | Y | W | H |
| :--- | ---: | ---: | ---: | ---: |
| `ResourceRow` | 24 | 978 | 860 | 78 |
| `XpPanel` | 900 | 978 | 616 | 78 |

这些数值已同步写入：

- `clients/manual/src/config/layout.ts`

后续你如果想手工调位置，优先改这个文件，不要四处散改。

---

## 4. Scene Design Rules

### 4.0 Global Scene Rule

所有系统场景面板必须遵守以下统一规则：

1. 默认进入 `CityScene`。
2. `CityScene` 内包含各系统的建筑地标入口。
3. 右侧导航面板和城市地标都可以切换系统。
4. 每个场景右上角或左上角必须有统一样式的关闭按钮。
5. 非 `CityScene` 点击关闭按钮时，返回 `CityScene`。
6. 在 `CityScene` 点击关闭按钮时，弹出登出确认。

### 4.1 Tavern

酒馆场景应优先强调：

1. 大面积背景图的叙事感。
2. 前景角色和桌椅的舞台感。
3. 可交互热点的隐形区域，而不是网页按钮感。

推荐结构：

1. 背景底图
2. 前景角色层
3. 热点层
4. 特定系统弹出层

### 4.2 BlackMarket

黑市场景不是独立整页，而是占据 `SceneViewport` 的一个场景版本。

建议布局：

1. 顶部 NPC 风味文案
2. 中部商店货架 `2x3`
3. 一侧 NPC 立绘
4. 底部局部操作栏

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

工程中的真实实现，以 `clients/manual` 源码和本规格为准。

---

## 7. Immediate Next Step

在当前骨架基础上，下一步建议优先做：

1. 把酒馆概念图拆成背景、前景人物、右栏、底栏四组资源。
2. 用真实背景图替换 `TavernScene` 的纯 CSS 占位背景。
3. 确定第一版 `OverlayRoot` 打开什么面板：角色大面板还是背包面板。

---

*Last Updated: 2026-05-10*
