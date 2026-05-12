# 游戏美术资产命名与规格字典 (Asset Naming Convention)
Status: Approved (已生效)
Designer: Antigravity

---

## 1. 核心原则 (Core Principles)

为确保“零硬编码 (Zero Hardcoding)”的美术管线顺畅运行，所有提供给前端 (Client) 的美术资源必须严格遵守以下原则：
1. **约定优于配置**：图片路径与文件名的拼接必须能够通过后端的 `ID` 或枚举值直接计算得出。
2. **小写加下划线**：所有文件和目录必须使用 `snake_case`（全小写，下划线分隔），**严禁**出现大写字母、空格或中文字符。
3. **格式统一**：除特别注明的背景大图外，所有 UI 和角色、物品图标必须为透明底的 `.png` 格式。

---

## 2. 目录结构规范 (Directory Structure)

所有美术资源均统一放置在前端项目的 `/public/assets/` 目录下（最终打包后的根目录）：

```text
/public/assets/
  ├── /ui/                 # 通用界面框架、按钮、图标
  ├── /backgrounds/        # 全屏场景或半屏背景
  ├── /foregrounds/        # 各类商人、发牌员等静态立绘
  ├── /items/              # 装备、道具、消耗品图标
  └── /sfx/                # 音频文件
  └── /figure/             # 角色头像等同规格，同类型下数量较大的角色相关资源。
```

---

## 3. 具体资源命名与尺寸规格 (Specs by Category)

### 3.1 物品图标 (Items)
**目录**: `/assets/items/`
**尺寸**: `128x128 px` (PNG 透明底)

命名逻辑分为两种情况：
*   **普通/随机物品 (基于槽位和序号)**：
    *   命名格式：`item_[slot]_[index].png`
    *   示例：`item_weapon_01.png`, `item_body_03.png`
    *   *映射逻辑*：前端收到没有特殊 ID 的普通装备时，根据其 `slot` 和一个基于其内部 ID 生成的随机种子（或后端直接传 `iconId: 3`），拼接出图片路径。
*   **史诗/传说级专属物品 (基于物品 ID)**：
    *   命名格式：`item_[item_id].png`
    *   示例：`item_wpn_epic_001.png`, `item_ring_legendary_01.png`
    *   *映射逻辑*：前端收到具体的物品 ID 时，直接使用 `item_` + ID 的方式寻址。

### 3.2 场景背景 (Backgrounds)
**目录**: `/assets/backgrounds/`
**尺寸**: `1528*980 px` (或根据屏幕高宽比适配的 JPG/PNG)

*   命名格式：`bg_system_[system_name].jpg` 或 `bg_system_[system_name].png`
*   示例：
    *   bg_system_pvp.png

### 3.3 NPC 立绘 (NPC Figures)
**目录**: `/assets/npcs/`
**尺寸**: `512x512 px` (PNG 透明底，人物需尽量撑满画面但留出呼吸空间)

*   命名格式：`npc_[role_name].png`
*   示例：
    *   铁匠瞎子：`npc_blacksmith.png`
    *   奇珍阁半仙：`npc_wizard.png`

### 3.4 杂项 UI 与图标 (Misc UI)
**目录**: `/assets/ui/`
**尺寸**: 根据需求定，通常为 `64x64 px` 或按需切割

*   货币图标：`icon_copper.png`, `icon_token.png`
*   操作按钮：`btn_refresh.png`, `btn_buy.png`
*   属性图标：`icon_str.png`, `icon_agi.png`, `icon_int.png`

---

## 4. 占位图 (Placeholder / Greyboxing) 制作要求

在正式美术交付前，美术/设计人员（或 User）需要向开发团队提供大量占位图，以解除 Client Agent 的开发阻塞。

**占位图标准：**
1.  **尺寸严格遵守**：必须使用上述规定的像素尺寸。
2.  **视觉可辨识**：**切勿**使用全黑全白图片。请在纯色块中央，用清晰的大号字体（白色或黑色）印上该文件的名称或含义。
    *   *错误示范*：一张空白的 128x128 图片。
    *   *正确示范*：一张灰色的 128x128 图片，中间写着粗体的 `wpn_epic_001`。
3.  **批量覆盖**：必须确保《装备表》中存在的所有 `ID`，以及所有基础 `slot` 变种，都有对应的占位图存在于 `/items/` 目录下，否则前端在渲染时会报 `404 Not Found`，影响 UI 排版测试。

---
*Last Updated: 2026-05-04*
