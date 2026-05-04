# 游戏系统策划案 · 铁匠系统（Blacksmith）

**文档版本**：v1.0  
**撰写日期**：2026-04-28  
**参考原型**：Shakes and Fidget（SF Game）by Playa Games GmbH  
**文档用途**：复刻参考 · 系统策划规格文档  

---

## 可信度评级说明

| 评级 | 说明 |
|------|------|
| 🅰️ **A级** | 官方帮助中心（Playa Games）/ sfporadnik.pl wiki / sfgame.fandom.com |
| 🅱️ **B级** | 玩家社区整理（number13.de、Reddit、论坛讨论）|
| 🅲 **C级** | 开源工具逆向（GitHub: HafisCZ/sf-tools，`js/sim/` 战斗模拟器源码）|
| 🅳 **D级** | 本文推测 / 不确定来源 |

---

## 1. 系统概述

### 1.1 系统定位

铁匠系统是游戏中**装备强化核心子系统**，解锁于90级。铁匠提供六大服务：属性升级（强化装备数值）、插槽升级（镶嵌宝石）、物品拆解（获取金属和奥术碎片）、外观修改（改变装备外观）、宝石提取（移除宝石）、符文交换（转移符文属性）。铁匠是游戏后期装备精炼的主要途径，与马桶系统（提供高品质装备素材）、宝石矿（提供宝石）和竞技场经理（提供符文）深度联动。

🅰️ **A级**（官方帮助中心 "Upgrades" + sfporadnik.pl）

### 1.2 解锁条件

| 项目 | 数值 | 可信度 |
|------|------|--------|
| 解锁等级 | **90级** | 🅰️ A级 |
| 访问方式 | 在升级菜单(U)中点击铁匠图标 | 🅰️ A级 |
| 前置条件 | 无其他前置条件 | 🅰️ A级 |

### 1.3 设计目的

- 提供**装备属性强化**能力，延长装备生命周期
- 通过拆解系统建立**金属/奥术碎片**资源体系
- 提供装备**外观定制**功能（消耗蘑菇，商业化出口）
- 作为宝石和符文系统的操作平台

---

## 2. 核心资源

### 2.1 金属（Metal）

🅰️ **A级**（官方帮助中心）

| 项目 | 说明 |
|------|------|
| 来源 | 拆解装备（主要）、出售/拆解已升级装备返还 |
| 用途 | 属性升级、插槽升级、宝石提取、符文交换 |
| 获取量 | 取决于拆解装备的品质和等级 |

### 2.2 奥术碎片（Arcane Splinters）

🅰️ **A级**（官方帮助中心）

| 项目 | 说明 |
|------|------|
| 来源 | 拆解装备（主要）、出售/拆解已升级装备返还 |
| 用途 | 属性升级、插槽升级、宝石提取、符文交换 |
| 获取量 | 取决于拆解装备的品质和等级 |

> **关键机制**：金属和奥术碎片是铁匠所有服务的**通用消耗货币**。资源的回收机制确保玩家投入不会完全损失。

---

## 3. 六大服务详解

### 3.1 属性升级（Attribute Upgrade）

🅰️ **A级**（官方帮助中心 "Upgrades"）

| 项目 | 详情 |
|------|------|
| 最大次数 | 单件装备最多强化 **20次** |
| 效果 | 每次提升装备的属性值 |
| 消耗 | 金属 + 奥术碎片 |
| 操作方式 | 将物品拖拽到铁匠对应区域，或右键上下文菜单 |
| UI提示 | 可升级物品在背包中**高亮显示** |
| 已装备物品 | 已装备的物品**也可以**直接升级 |

**资源回收机制**：

| 场景 | 资源返还 |
|------|---------|
| 出售已升级物品 | 按比例**返还**投入升级的金属和碎片 |
| 拆解已升级物品 | 按比例**返还**投入升级的金属和碎片 |
| 扔进马桶的武器 | ⚠️ **不返还**（失去销售价值的武器拆解时无法返还） |

> **设计意义**：资源回收机制降低了玩家试错成本，鼓励积极的装备升级尝试。

**升级次数显示**：物品的升级次数显示在铁匠的成就区域以及物品的详细信息中。 [A]

### 3.2 插槽升级（Slot Upgrade）

🅰️ **A级**（官方帮助中心 "Upgrades"）

| 项目 | 详情 |
|------|------|
| 适用范围 | **所有物品**均可添加宝石插槽 |
| 例外 | **战士的盾牌除外** |
| 消耗 | 金属 + 奥术碎片 |
| 操作方式 | 将物品拖至插槽升级区域，或右键上下文菜单 |
| UI提示 | 可添加插槽物品在背包中**高亮显示** |
| 成本依据 | 插槽的资源消耗基于物品的**品质** |

**策略建议**：

🅰️ **A级**（官方帮助中心原文建议）

> "建议在执行'属性升级'**之前**先添加宝石插槽，以优化资源消耗。"

原因：插槽升级的成本基于物品品质，先加插槽再升级属性，可以避免因属性升级导致的品质提升而增加插槽成本。

### 3.3 物品拆解（Item Scrap）

🅰️ **A级**（官方帮助中心 "Upgrades"）

| 项目 | 详情 |
|------|------|
| 每日限制 | 每天 **5个拆解点数** |
| 常规消耗 | 大多数物品消耗 **1个点数** |
| 双手武器 | 侦察兵和法师的双手武器消耗 **2个点数**，返还**双倍**资源 |
| 活动加成 | **锻造狂热节**（Forge Frenzy）期间，点数上限提升至 **15点** |
| 产出 | 金属 + 奥术碎片 |
| 物品处理 | 拆解后物品**不可逆地被摧毁** |

**特殊拆解规则**：

🅰️ **A级**（官方帮助中心）

- 被扔进马桶的武器、从塔楼/暗影地下城获得的物品、传奇地下城"冲刷史诗"物品——这些物品**没有销售价值**
- 拆解此类物品**只能**返还基础物品的资源，**无法**返还之前用于升级它的资源
- 系统会弹出**警告提示**

### 3.4 外观修改（Appearance Change）

🅰️ **A级**（官方帮助中心 + sfporadnik.pl）

| 项目 | 详情 |
|------|------|
| 适用范围 | **史诗**和**传奇**品质装备 |
| 消耗 | **10个蘑菇** |
| 效果 | 将装备外观替换为另一件同槽位史诗/传奇装备的外观 |
| 商业化设计 | 蘑菇为付费货币，是游戏的重要收入来源 |

### 3.5 宝石提取（Gem Extraction）

🅰️ **A级**（官方帮助中心 "Upgrades"）

| 项目 | 详情 |
|------|------|
| 操作方式 | 从物品中提取已镶嵌的宝石 |
| 结果 | 宝石返回背包，**原物品被不可逆地摧毁** |
| 消耗A | 金属 + 奥术碎片 |
| 消耗B（替代） | **10个蘑菇**（跳过碎片消耗） |
| 资源返还 | 若原物品曾进行过属性升级，提取时**按比例返还部分资源** |
| 例外 | 扔进马桶失去价值的武器，提取时不返还升级资源 |

### 3.6 符文交换（Rune Swap）

🅰️ **A级**（官方帮助中心 + sfporadnik.pl）

| 项目 | 详情 |
|------|------|
| 操作方式 | 交换两件装备的符文属性 |
| 消耗 | 金属 + 奥术碎片 |
| 条件 | 两件装备必须有符文槽位 |

**符文系统补充**：

🅲 **C级**（sf-tools 源码逆向）+ 🅱️ **B级**（社区数据）

| 符文类型 | 上限 | 效果 |
|---------|------|------|
| 伤害符文 (Damage Rune) | **60点** | 影响战斗伤害计算 |
| 抗性符文 (Resistance Rune) | **75点** | 影响受到的伤害 |
| 竞技场经理符文 | **无上限** | 提供 +5% 竞技场收入加成（可堆叠） |

---

## 4. 联动关系

### 4.1 铁匠 × 马桶系统

| 联动点 | 说明 |
|--------|------|
| 马桶产出 | 冲水获得物品可作为铁匠素材（2/3概率为史诗品质） |
| 物品品质 | 马桶光环等级直接影响商店和冲水物品品质 |
| ⚠️ 马桶武器 | 被马桶冲刷过的武器失去销售价值，拆解时无法返还升级资源 |

### 4.2 铁匠 × 宝石矿

| 联动点 | 说明 |
|--------|------|
| 宝石来源 | 堡垒宝石矿是宝石的主要产出渠道 |
| 宝石镶嵌 | 通过铁匠插槽服务将宝石安装到装备上 |
| 传奇宝石 | 收藏册中存在传奇装备图片后，宝石矿才可能开采出传奇宝石 |

### 4.3 铁匠 × 竞技场经理

| 联动点 | 说明 |
|--------|------|
| 符文来源 | 竞技场经理献祭后获得符文 |
| 符文效果 | 收集1000个符文后，商店物品可出现符文强化属性 |

### 4.4 铁匠 × 女巫附魔

| 联动点 | 说明 |
|--------|------|
| 附魔与升级 | 附魔不影响铁匠的属性升级/插槽升级 |
| 拆解附魔物品 | 附魔装备被拆解时，附魔效果随装备一同消失 |

---

## 5. 数值曲线与进度

### 5.1 属性升级效果

🅱️ **B级**（number13.de + sfporadnik.pl 社区分析）

- 每次属性升级提升的数值取决于**装备基础属性**和**当前升级次数**
- 升级效果呈现**递减曲线**（早期提升大，后期提升小）
- 20次升级累计约提升基础属性的 **40-60%**（具体公式未公开）

> ⚠️ 属性升级的精确公式在所有公开来源中均未找到。

### 5.2 资源消耗参考

🅱️ **B级**（社区经验估算）

| 操作 | 资源消耗趋势 |
|------|------------|
| 属性升级（1-5次） | 较低 |
| 属性升级（6-15次） | 中等 |
| 属性升级（16-20次） | 较高 |
| 插槽升级 | 基于物品品质，史诗>普通 |
| 宝石提取 | 固定基础 + 升级返还相关 |

---

## 6. 复刻实现指南

### 6.1 数据结构

```javascript
const BLACKSMITH = {
  services: {
    attributeUpgrade: {
      maxLevel: 20,              // 单件装备最多强化20次
      resourceCost: { metal: 'scaling', arcaneSplinters: 'scaling' },
      canUpgradeEquipped: true,  // 已装备物品也可升级
    },
    slotUpgrade: {
      exceptions: ['warrior_shield'],  // 战士盾牌不可添加插槽
      costBasedOn: 'quality',          // 成本基于品质
    },
    scrap: {
      dailyPoints: 5,             // 每日5个拆解点数
      eventBonus: 15,             // 锻造狂热节期间15点
      twoHandedCost: 2,            // 双手武器消耗2点
      twoHandedBonus: 'double',    // 双手武器返还双倍资源
    },
    appearanceChange: {
      mushroomCost: 10,           // 10个蘑菇
      applicableQualities: ['epic', 'legendary'],
    },
    gemExtraction: {
      destroysItem: true,         // 原物品被摧毁
      mushroomAlternative: 10,    // 可用10蘑菇替代资源消耗
      refundsUpgrades: true,      // 返还升级资源（有例外）
    },
    runeSwap: {
      requiresRuneSlots: true,    // 两件装备都需要有符文槽
    },
  },
};

// 装备升级数据
const equipment = {
  // { id, quality, slot, stats, upgradeLevel: 0, maxUpgradeLevel: 20,
  //   gemSlots: [], runes: null, enchanted: false, appearance: 'default' }
};

// 资源系统
const resources = {
  metal: 0,
  arcaneSplinters: 0,
};

// 属性升级（简化）
function upgradeAttribute(equipment, resources) {
  if (equipment.upgradeLevel >= 20) return false;
  
  const cost = calculateUpgradeCost(equipment);
  if (resources.metal < cost.metal || resources.arcaneSplinters < cost.splinters) return false;
  
  resources.metal -= cost.metal;
  resources.arcaneSplinters -= cost.splinters;
  
  equipment.upgradeLevel++;
  const bonusPercent = 0.01 + (20 - equipment.upgradeLevel) / 20 * 0.02; // 递减曲线
  equipment.stats.primary *= (1 + bonusPercent);
  
  return true;
}

// 拆解物品
function scrapItem(equipment, resources, dailyPoints) {
  if (dailyPoints.remaining <= 0) return false;
  
  const pointsCost = equipment.isTwoHanded ? 2 : 1;
  if (dailyPoints.remaining < pointsCost) return false;
  
  dailyPoints.remaining -= pointsCost;
  
  // 基础资源
  const baseResources = calculateBaseResources(equipment);
  resources.metal += baseResources.metal * (equipment.isTwoHanded ? 2 : 1);
  resources.arcaneSplinters += baseResources.splinters * (equipment.isTwoHanded ? 2 : 1);
  
  // 升级资源返还（有例外：马桶武器等）
  if (equipment.hasSaleValue && equipment.upgradeLevel > 0) {
    const refundRate = calculateRefundRate(equipment.upgradeLevel);
    resources.metal += equipment.investedMetal * refundRate;
    resources.arcaneSplinters += equipment.investedSplinters * refundRate;
  }
  
  return { success: true, pointsUsed: pointsCost };
}
```

### 6.2 复刻优先级

| 优先级 | 功能 | 说明 |
|--------|------|------|
| **P0** | 属性升级 | 最多20次，递减曲线，消耗金属+碎片 |
| **P0** | 物品拆解 | 每日5点，产出金属+碎片 |
| **P0** | 插槽升级 | 品质定价，战士盾牌例外 |
| **P1** | 宝石提取 | 摧毁物品，返还宝石 |
| **P1** | 符文交换 | 两件装备交换符文 |
| **P1** | 资源回收 | 出售/拆解已升级物品按比例返还 |
| **P2** | 外观修改 | 10蘑菇，史诗/传奇专属 |
| **P2** | 宝石提取（蘑菇替代） | 10蘑菇跳过资源消耗 |
| **P3** | 锻造狂热节活动 | 拆解点数提升至15点 |
| **P3** | 升级次数成就 | 铁匠成就区域 |

---

## 7. 数据缺口与不确定项

| 数据项 | 状态 | 说明 |
|--------|------|------|
| 属性升级精确公式 | ❌ 未公开 | 每次提升的百分比或固定值 |
| 插槽升级资源消耗公式 | ❌ 未公开 | 品质与消耗的具体数学关系 |
| 宝石提取资源消耗公式 | ❌ 未公开 | 具体消耗的金属和碎片数量 |
| 符文交换资源消耗 | ❌ 未公开 | 具体消耗量 |
| 拆解产出公式 | ❌ 未公开 | 品质/等级与产出的关系 |
| 升级资源返还比例 | ⚠️ "按比例" | 具体返还百分比未公开 |

---

## References

1. [Upgrades — Shakes & Fidget Help Center](https://playa-games.helpshift.com/hc/en/4-shakes-fidget-1653988985/faq/344-upgrades/)
2. [Blacksmith | sfgame guide (sfporadnik.pl)](https://sfporadnik.pl/blacksmith.php)
3. [Items | Shakes and Fidget Wiki (Fandom)](https://sfgame.fandom.com/wiki/Items)
4. [Shakes & Fidget: Everything You Need to Know About the Witch (number13.de)](https://en.number13.de/shakes-fidget-everything-you-need-to-know-about-the-witch/)
5. [sf-tools (GitHub)](https://github.com/Greensi7/sf-tools)
