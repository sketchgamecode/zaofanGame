# 美术资产命名与管理规范白皮书 (v1.0)
**状态:** 全局执行标准
**适用对象:** 美术人员、外包团队、AI 生成管线、前端 Coder Agent
**存储位置:** Supabase 存储桶 `zaofanyouxi` -> `game-assets` 目录下对应的分类文件夹。

---

## 1. 核心命名铁律 (The Golden Rules)
1. **全小写与下划线 (Snake Case):** 所有文件名必须为小写字母，单词之间使用下划线 `_` 分隔。绝对禁止使用空格、中文字符或驼峰命名法（如禁止 `Tavern BG.png` 或 `武器.jpg`）。
2. **扁平化管理:** 绝不在定义好的 8 个主目录中再创建子目录。利用文件名的前缀来进行自然分类。
3. **版本号收尾:** 所有的图片必须带上版本号后缀（如 `_v1`, `_v2`）。如果对某张图进行了修改，请直接覆盖上传原名，或者升级版本号并在 `assets.ts` 中更新。避免出现 `_final`, `_new` 这种毫无意义的后缀。
4. **格式限定:**
   - 带有透明背景的立绘、Icon、UI 必须导出为 `.png`。
   - 不带透明通道的大场景背景图，推荐导出为高压缩率的 `.jpg` 或 `.webp`。

---

## 2. 各目录命名公式与范例 (Naming Formula)

所有文件的命名严格遵循以下公式：
**`[分类前缀]_[子类型/部位]_[具体描述]_[状态/品质(可选)]_[版本号].[格式]`**

### 2.1 场景与背景 (`backgrounds/`)
* **公式:** `bg_[游戏模块名]_[场景名]_[版本号]`
* **范例:** * `bg_tavern_interior_v1.jpg` (客栈大厅白天)
  * `bg_dungeon_qingfeng_v1.jpg` (副本-清风寨)

### 2.2 装备系统 (`equipment/`)
* **公式:** `item_[装备槽位]_[武器细分(可选)]_[描述]_[品质]_[版本号].png`
* **槽位缩写标准:** `head`, `chest`, `hands`, `feet`, `neck`, `belt`, `ring`, `trinket`, `weapon`, `shield`
* **品质标准:** `white`, `green`, `blue`, `purple`, `orange`
* **范例:**
  * `item_weapon_saber_iron_white_v1.png` (武器-刀-铁刀-白装)
  * `item_chest_cloth_beggar_green_v1.png` (身体-布甲-丐帮服-绿装)

### 2.3 怪物与敌人 (`monsters/`)
* **公式:** `monster_[种类/势力]_[描述]_[级别(可选)]_[版本号].png`
* **范例:**
  * `monster_bandit_axe_v1.png` (强盗-持斧喽啰)
  * `monster_imperial_guard_elite_v1.png` (皇城司-精英守卫)
  * `monster_beast_bear_boss_v1.png` (野兽-狂熊-Boss)

### 2.4 NPC 与交互角色 (`npcs/`)
* **公式:** `npc_[功能身份]_[描述]_[版本号].png`
* **范例:**
  * `npc_bartender_fat_v1.png` (掌柜-胖子)
  * `npc_questgiver_monk_v1.png` (任务发布者-和尚)

### 2.5 玩家角色体系 (`avatars/`)
* **公式:** `avatar_[职业]_[性别/特征]_[版本号].png`
* **范例:**
  * `avatar_classa_male_v1.png` (猛将-男)
  * `avatar_classd_female_v1.png` (刺客-女)

### 2.6 通用图标 (`icons/`)
* **公式:** `icon_[系统]_[描述]_[版本号].png`
* **范例:**
  * `icon_currency_copper_v1.png` (货币-铜钱)
  * `icon_currency_token_v1.png` (货币-通宝)
  * `icon_stat_strength_v1.png` (属性-武力)

### 2.7 界面元素 (`ui/`)
* **公式:** `ui_[控件类型]_[描述]_[状态(可选)]_[版本号].png`
* **范例:**
  * `ui_btn_primary_normal_v1.png` (主按钮-常规态)
  * `ui_panel_wood_dark_v1.png` (面板底板-深色木纹)
  * `ui_frame_purple_v1.png` (品质框-紫色)

### 2.8 战斗特效 (`vfx/`)
* **公式:** `vfx_[类型]_[颜色/描述]_[版本号].png`
* **范例:**
  * `vfx_slash_red_v1.png` (刀光-红色)
  * `vfx_impact_spark_v1.png` (受击-火花)

---

## 3. 前后端资源调用范式 (Coder Guidelines)
所有的外网图片 URL 拼装工作，必须集中在 `src/constants/assets.ts` 中进行。

**前端代码中绝对禁止出现：**
`const imgUrl = "https://xxx.supabase.co/storage/v1/object/public/game-assets/equipment/" + item.id + ".png"`

**必须封装为统一的读取函数：**
```typescript
const CDN_BASE = '[https://你的supabase项目地址.supabase.co/storage/v1/object/public/game-assets/](https://你的supabase项目地址.supabase.co/storage/v1/object/public/game-assets/)';

export const AssetManager = {
  getEquipmentImage: (slot: string, subType: string, quality: string) => {
    // 根据一定的映射逻辑，返回 CDN 地址
    return `${CDN_BASE}equipment/item_${slot}_${subType}_${quality}_v1.png`;
  }
}