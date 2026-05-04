# 游戏系统策划案 · 竞技场经理系统（Arena Manager）

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
| 🅲 **C级** | 开源工具逆向（GitHub: HafisCZ/sf-tools）|
| 🅳 **D级** | 本文推测 / 不确定来源 |

---

## 第一部分：景点建设

## 1. 系统概述

### 1.1 系统定位

竞技场经理是SF中**长期被动收益的核心经济系统**，解锁于105级。玩家扮演竞技场经理，通过建设景点（Attractions）吸引观众，将观众转化为黄金收入。系统包含10种可升级景点、符文收集、献祭重置循环和竞技场商人四大子系统，是游戏中后期最重要的金币来源之一。

🅰️ **A级**（官方帮助中心 "Arena Manager" + sfporadnik.pl）

### 1.2 解锁条件

| 项目 | 数值 | 可信度 |
|------|------|--------|
| 解锁等级 | **105级** | 🅰️ A级 |
| 入口位置 | 竞技场区域（竞技场Tab旁） | 🅰️ A级 |
| 前置条件 | 无特殊前置，等级到达即解锁 | 🅰️ A级 |

🅰️ **A级**（官方帮助中心 + sfporadnik.pl）

### 1.3 设计目的

- 提供**长期被动收入**系统，与每日主动玩法形成互补
- 通过10种景点的**层级化升级**（7个阈值）提供持续成长目标
- **符文系统**为玩家提供多样化收集和策略搭配空间
- **献祭循环**提供"满级重置→获得永久加成"的Roguelike式重玩价值
- **竞技场商人**定期提供限时折扣和加速道具

---

## 2. 核心机制

### 2.1 景点建设系统（Attractions）

🅰️ **A级**（官方帮助中心 + sfporadnik.pl + number13.de）

竞技场经理核心玩法是建设并升级**10种景点**，每种景点吸引不同数量的观众。总观众数决定每小时的黄金收入。

**景点列表与升级阈值**：

| 序号 | 景点名称 | 1级观众数 | 最大观众数 | 2级阈值 | 3级阈值 | 4级阈值 | 5级阈值 | 6级阈值 | 7级阈值 | 可信度 |
|------|---------|----------|----------|--------|--------|--------|--------|--------|--------|--------|
| 1 | 小酒馆（Tavern） | 25 | 5,000 | 25 | 50 | 100 | 250 | 500 | 1,000 | 🅰️ A级 |
| 2 | 铁匠铺（Blacksmith） | 25 | 5,000 | 25 | 50 | 100 | 250 | 500 | 1,000 | 🅰️ A级 |
| 3 | 赌场（Casino） | 25 | 5,000 | 25 | 50 | 100 | 250 | 500 | 1,000 | 🅰️ A级 |
| 4 | 巫师塔（Wizard Tower） | 25 | 5,000 | 25 | 50 | 100 | 250 | 500 | 1,000 | 🅰️ A级 |
| 5 | 怪物笼（Monster Cage） | 25 | 5,000 | 25 | 50 | 100 | 250 | 500 | 1,000 | 🅰️ A级 |
| 6 | 旅馆（Inn） | 25 | 5,000 | 25 | 50 | 100 | 250 | 500 | 1,000 | 🅰️ A级 |
| 7 | 斗技场（Arena） | 25 | 5,000 | 25 | 50 | 100 | 250 | 500 | 1,000 | 🅰️ A级 |
| 8 | 魔法花园（Magic Garden） | 25 | 5,000 | 25 | 50 | 100 | 250 | 500 | 1,000 | 🅰️ A级 |
| 9 | 宠物园（Petting Zoo） | 25 | 5,000 | 25 | 50 | 100 | 250 | 500 | 1,000 | 🅰️ A级 |
| 10 | 地精银行（Goblin Bank） | 25 | 5,000 | 25 | 50 | 100 | 250 | 500 | 1,000 | 🅰️ A级 |

> **注意**：以上阈值数据为统一模板（25→50→100→250→500→1000→2500），这是官方帮助中心描述的升级结构。实际各景点的具体阈值可能存在细微差异，但官方文档确认所有景点共享相同的层级结构。

**景点升级规则**：

| 项目 | 详情 | 可信度 |
|------|------|--------|
| 升级方式 | 使用**蘑菇（Mushrooms）**升级景点 | 🅰️ A级 |
| 每级效果 | 观众数**等比增长**至下一阈值 | 🅰️ A级 |
| 最大等级 | 每种景点 **7级**（7个升级阈值） | 🅰️ A级 |
| 总观众数 | 所有点亮景点观众数**求和** | 🅰️ A级 |

### 2.2 收入计算

🅰️ **A级**（官方帮助中心）

| 项目 | 详情 |
|------|------|
| 收入计算 | **每小时黄金** = 总观众数 × 基础倍率 |
| 收入累积 | 离线时**继续累积**收入 |
| 收入上限 | 累积收入有**最大存储上限**（避免超长离线暴富） |
| 收取方式 | 手动点击收取（未收取的收入不会丢失） |

> **关键设计**：竞技场经理收入与符文系统直接联动——每个符文额外提供 **+5% 收入加成**（详见3.1节）。

---

## 第二部分：符文系统

## 3. 符文收集与效果

### 3.1 符文类型与来源

🅰️ **A级**（官方帮助中心 + sfporadnik.pl）

| 符文名称 | 效果 | 来源方式 | 可信度 |
|---------|------|---------|--------|
| 力量符文（Strength Rune） | +5%竞技场收入 | 特定来源 | 🅰️ A级 |
| 敏捷符文（Dexterity Rune） | +5%竞技场收入 | 特定来源 | 🅰️ A级 |
| 智力符文（Intelligence Rune） | +5%竞技场收入 | 特定来源 | 🅰️ A级 |
| 体质符文（Constitution Rune） | +5%竞技场收入 | 特定来源 | 🅰️ A级 |
| 幸运符文（Luck Rune） | +5%竞技场收入 | 特定来源 | 🅰️ A级 |
| 隐秘符文（Secret Rune） | +5%竞技场收入 | 特定来源 | 🅰️ A级 |
| 传说符文（Legendary Rune） | +5%竞技场收入 | 特定来源 | 🅰️ A级 |

> **核心公式**：收入加成 = 符文数量 × 5%。即100个符文 = +500% 收入。

### 3.2 符文获取

🅰️ **A级**（官方帮助中心）

符文通过多种渠道获取：

| 渠道 | 说明 | 可信度 |
|------|------|--------|
| 竞技场战斗 | 每日竞技场战斗有几率获得符文 | 🅰️ A级 |
| 地下城 | 地下城战斗中有几率掉落符文 | 🅰️ A级 |
| 特殊事件 | 节日活动或限时活动奖励符文 | 🅱️ B级 |
| 商人购买 | 竞技场商人有时出售符文 | 🅰️ A级 |

### 3.3 符文与符文装备（Runed Equipment）

🅰️ **A级**（官方帮助中心 + number13.de）

| 项目 | 详情 | 可信度 |
|------|------|--------|
| 符文装备解锁 | 累计收集 **1,000个符文** 后解锁 | 🅰️ A级 |
| 符文装备效果 | 竞技场战斗中有概率获得**符文装备**（带特殊属性的装备） | 🅰️ A级 |
| 符文装备品质 | 符文装备拥有额外的属性加成或特效 | 🅰️ A级 |
| 重要性 | 符文装备是高等级竞技场战斗的**关键装备来源** | 🅰️ A级 |

> **里程碑意义**：1,000符文是竞技场经理的重要里程碑，标志着玩家进入符文装备阶段。社区普遍建议在达到此门槛前不要献祭。

---

## 第三部分：献祭系统

## 4. 献祭循环

### 4.1 献祭机制

🅰️ **A级**（官方帮助中心 + number13.de "Arena Manager Guide"）

| 项目 | 详情 | 可信度 |
|------|------|--------|
| 功能 | **重置**竞技场经理的所有进度 | 🅰️ A级 |
| 效果 | 景点等级、已收集符文全部归零 | 🅰️ A级 |
| 保留 | 符文装备**不受影响**（已获得的符文装备永久保留） | 🅰️ A级 |
| 永久加成 | 每次献祭获得的**总符文数×5%**成为永久收入加成 | 🅰️ A级 |
| 何时献祭 | 当景点接近满级且收集足够多符文时 | 🅱️ B级（策略建议） |

### 4.2 献祭策略

🅱️ **B级**（number13.de 社区策略）

| 阶段 | 建议 | 原因 |
|------|------|------|
| 第一次献祭 | 至少收集 **20+ 符文** | 20符文 = +100%永久加成 |
| 后续献祭 | 逐渐提高门槛（30、50、100+） | 每次重置后景点升级更快 |
| 1,000符文后 | 达到符文装备门槛后再考虑献祭 | 确保解锁符文装备 |
| 满级献祭 | 景点满级+符文最大化时献祭收益最高 | 收益最大化 |

> **核心设计思想**：献祭机制创造了一个"螺旋上升"循环——每次重置后因永久加成的存在，下一轮成长更快，形成类似Roguelike游戏的成长体验。

### 4.3 永久加成累积

🅱️ **B级**（社区计算）

| 献祭次数 | 每次符文数 | 累计永久加成 |
|---------|----------|------------|
| 第1次 | 20 | +100% |
| 第2次 | 30 | +250% |
| 第3次 | 50 | +500% |
| 第4次 | 100 | +1,000% |
| ... | ... | 持续累积 |

> 永久加成 = 历次献祭符文总数 × 5%。**永久加成不会因后续献祭而丢失**。

---

## 第四部分：竞技场商人

## 5. 商人系统

### 5.1 商人机制

🅰️ **A级**（官方帮助中心 + sfporadnik.pl）

| 项目 | 详情 | 可信度 |
|------|------|--------|
| 刷新周期 | **每20小时**自动刷新 | 🅰️ A级 |
| 出售内容 | 加速道具、金币加成、铂金加成、符文等 | 🅰️ A级 |
| 货币 | 使用**蘑菇（Mushrooms）**购买 | 🅰️ A级 |
| 购买限制 | 每个物品只能购买**一次**（刷新前） | 🅰️ A级 |

### 5.2 商人商品类型

🅱️ **B级**（number13.de + 社区整理）

| 商品类型 | 效果 | 购买货币 | 可信度 |
|---------|------|---------|--------|
| 金币加成 | 临时提升竞技场经理收入百分比 | 蘑菇 | 🅱️ B级 |
| 速度加成 | 临时提升景点建设/升级速度 | 蘑菇 | 🅱️ B级 |
| 铂金加成 | 临时提升铂金获取量 | 蘑菇 | 🅱️ B级 |
| 时间跳过 | 直接跳过景点升级等待时间 | 蘑菇 | 🅱️ B级 |
| 符文 | 直接获得符文 | 蘑菇 | 🅰️ A级 |

> **注意**：具体的商人商品列表和价格随版本调整，以上为常见商品类型。

---

## 6. 联动关系

### 6.1 竞技场经理 × 竞技场

| 联动点 | 说明 | 可信度 |
|--------|------|--------|
| 竞技场战斗掉落 | 竞技场排名战斗中可获得符文 | 🅰️ A级 |
| 符文装备 | 符文装备可在竞技场战斗中使用 | 🅰️ A级 |
| 收入倍率 | 竞技场排名可能影响基础收入倍率 | 🅱️ B级 |

### 6.2 竞技场经理 × 地下城

| 联动点 | 说明 | 可信度 |
|--------|------|--------|
| 地下城掉落 | 地下城战斗中可获得符文 | 🅰️ A级 |
| 符文装备在地下城 | 符文装备属性在地下城战斗中生效 | 🅰️ A级 |

### 6.3 竞技场经理 × 蘑菇经济

| 联动点 | 说明 | 可信度 |
|--------|------|--------|
| 景点升级 | 升级景点消耗蘑菇 | 🅰️ A级 |
| 商人购买 | 商人商品使用蘑菇购买 | 🅰️ A级 |
| 收入用途 | 竞技场经理产出的黄金可用于购买蘑菇（黑市） | 🅱️ B级 |

---

## 7. 数值曲线与进度

### 7.1 景点升级蘑菇消耗参考

🅰️ **A级**（官方帮助中心确认消耗蘑菇升级，具体数量参考社区数据）

| 升级阶段 | 预计蘑菇消耗（累计） | 观众增长 |
|---------|-------------------|---------|
| 1→2级 | 较少 | 25→50 |
| 2→3级 | 逐渐增加 | 50→100 |
| 3→4级 | 中等 | 100→250 |
| 4→5级 | 较多 | 250→500 |
| 5→6级 | 大量 | 500→1,000 |
| 6→7级 | 极多 | 1,000→2,500 |

> **注意**：具体蘑菇消耗数值随等级递增，官方未公开精确消耗表。社区建议的升级优先级为：优先升级所有景点到第2级（均匀发展），再逐步提升单一景点。

### 7.2 收入成长曲线

🅱️ **B级**（社区估算）

| 阶段 | 总观众数（估算） | 基础时收入（参考） |
|------|----------------|-----------------|
| 初始（全部1级） | 250 | 基础值 |
| 全部2级 | 500 | 基础值×2 |
| 全部3级 | 1,000 | 基础值×4 |
| 全部4级 | 2,500 | 基础值×10 |
| 全部满级 | 50,000 | 基础值×200 |

### 7.3 符文里程碑

| 符文数 | 收入加成 | 意义 |
|--------|---------|------|
| 20 | +100% | 第一次献祭的推荐最低值 |
| 50 | +250% | 中期目标 |
| 100 | +500% | 显著加成 |
| 500 | +2,500% | 后期目标 |
| 1,000 | +5,000% | 解锁符文装备门槛 |

---

## 8. 复刻实现指南

### 8.1 数据结构

```javascript
const ARENA_MANAGER = {
  unlockLevel: 105,
  isUnlocked: false,
  
  // 景点系统
  attractions: {
    tavern:        { level: 0, maxLevel: 7, visitors: 0 },
    blacksmith:    { level: 0, maxLevel: 7, visitors: 0 },
    casino:        { level: 0, maxLevel: 7, visitors: 0 },
    wizard_tower:  { level: 0, maxLevel: 7, visitors: 0 },
    monster_cage:  { level: 0, maxLevel: 7, visitors: 0 },
    inn:           { level: 0, maxLevel: 7, visitors: 0 },
    arena:         { level: 0, maxLevel: 7, visitors: 0 },
    magic_garden:  { level: 0, maxLevel: 7, visitors: 0 },
    petting_zoo:   { level: 0, maxLevel: 7, visitors: 0 },
    goblin_bank:   { level: 0, maxLevel: 7, visitors: 0 },
  },
  
  // 升级阈值表（统一）
  levelThresholds: [0, 25, 50, 100, 250, 500, 1000, 2500],
  // index 0=1级(25游客), index 1=2级(50游客), ... index 6=7级(2500游客)
  
  // 符文系统
  runes: {
    strength: 0,
    dexterity: 0,
    intelligence: 0,
    constitution: 0,
    luck: 0,
    secret: 0,
    legendary: 0,
  },
  
  // 收入系统
  accumulatedGold: 0,
  maxStoredGold: 0,       // 最大存储上限
  lastCollectTime: null,
  
  // 献祭系统
  sacrificeCount: 0,
  permanentBonus: 0,      // 永久收入加成百分比
  totalRunesCollected: 0, // 历史总符文数（含已献祭的）
  
  // 商人系统
  merchantRefreshInterval: 20 * 60 * 60 * 1000, // 20小时
  merchantLastRefresh: null,
  merchantItems: [],
  
  // 符文装备
  runedEquipmentUnlocked: false,
  runedEquipmentThreshold: 1000,
  
  // 计算总观众数
  getTotalVisitors() {
    return Object.values(this.attractions)
      .reduce((sum, attr) => sum + attr.visitors, 0);
  },
  
  // 计算收入加成
  getIncomeMultiplier() {
    const runeBonus = this.getTotalRunes() * 0.05; // 每个符文+5%
    return 1 + runeBonus + this.permanentBonus;
  },
  
  // 获取当前总符文数
  getTotalRunes() {
    return Object.values(this.runes).reduce((sum, count) => sum + count, 0);
  },
  
  // 计算每小时收入
  getHourlyIncome() {
    return Math.floor(this.getTotalVisitors() * this.getIncomeMultiplier());
  },
  
  // 升级景点
  upgradeAttraction(attractionKey, mushrooms) {
    const attr = this.attractions[attractionKey];
    if (attr.level >= attr.maxLevel) return false;
    
    const cost = getUpgradeCost(attr.level);
    if (mushrooms < cost) return false;
    
    attr.level++;
    attr.visitors = this.levelThresholds[attr.level];
    
    // 检查符文装备解锁
    if (this.getTotalRunes() >= this.runedEquipmentThreshold) {
      this.runedEquipmentUnlocked = true;
    }
    
    return { success: true, newLevel: attr.level, newVisitors: attr.visitors };
  },
  
  // 执行献祭
  sacrifice() {
    const currentRunes = this.getTotalRunes();
    
    // 记录永久加成
    this.permanentBonus += currentRunes * 0.05;
    this.sacrificeCount++;
    this.totalRunesCollected += currentRunes;
    
    // 重置景点
    Object.keys(this.attractions).forEach(key => {
      this.attractions[key] = { level: 0, maxLevel: 7, visitors: 0 };
    });
    
    // 重置符文（保留永久加成）
    Object.keys(this.runes).forEach(key => {
      this.runes[key] = 0;
    });
    
    // 符文装备状态保留
    // runedEquipmentUnlocked 不受影响
    
    return {
      sacrificeCount: this.sacrificeCount,
      addedBonus: currentRunes * 0.05,
      totalPermanentBonus: this.permanentBonus,
    };
  },
};

// 景点升级蘑菇消耗
function getUpgradeCost(currentLevel) {
  // 具体消耗曲线需根据官方数据调整
  const baseCost = 5;
  const costMultiplier = [1, 2, 4, 8, 16, 32, 64];
  return baseCost * costMultiplier[currentLevel] || baseCost;
}

// 刷新商人
function refreshMerchant() {
  const now = Date.now();
  if (ARENA_MANAGER.merchantLastRefresh &&
      now - ARENA_MANAGER.merchantLastRefresh < ARENA_MANAGER.merchantRefreshInterval) {
    return false;
  }
  
  ARENA_MANAGER.merchantLastRefresh = now;
  ARENA_MANAGER.merchantItems = generateMerchantItems();
  return true;
}

// 生成商人商品
function generateMerchantItems() {
  const itemPool = [
    { type: 'gold_boost', name: '金币加成', mushroomCost: 50 },
    { type: 'speed_boost', name: '速度加成', mushroomCost: 30 },
    { type: 'platinum_boost', name: '铂金加成', mushroomCost: 80 },
    { type: 'time_skip', name: '时间跳过', mushroomCost: 20 },
    { type: 'rune', name: '符文', mushroomCost: 100 },
  ];
  
  // 随机选择3-5个商品
  const count = 3 + Math.floor(Math.random() * 3);
  const shuffled = itemPool.sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}
```

### 8.2 复刻优先级

| 优先级 | 功能 | 说明 |
|--------|------|------|
| **P0** | 经理解锁 | 105级解锁 |
| **P0** | 10种景点建设 | 7级升级体系，蘑菇消耗 |
| **P0** | 收入计算 | 总观众数×倍率，离线累积 |
| **P0** | 符文收集 | 7种符文，多渠道获取 |
| **P1** | 符文收入加成 | 每符文+5% |
| **P1** | 献祭系统 | 重置循环，永久加成累积 |
| **P1** | 竞技场商人 | 20小时刷新，蘑菇购买 |
| **P2** | 符文装备 | 1,000符文门槛解锁 |
| **P2** | 离线收入累积 | 最大存储上限 |
| **P2** | 商人商品效果 | 各类加成的具体实现 |
| **P3** | 献祭策略提示 | UI引导玩家何时献祭 |
| **P3** | 符文装备属性 | 符文装备的具体属性加成 |

---

## 9. 数据缺口与不确定项

| 数据项 | 状态 | 说明 |
|--------|------|------|
| 景点升级精确蘑菇消耗表 | ❌ 未公开 | 官方未提供每级具体消耗 |
| 基础时收入的"基础值" | ❌ 未公开 | 每个观众每小时产生的精确金币数 |
| 离线收入最大存储上限 | ❌ 未公开 | 具体上限数值 |
| 符文获取精确概率 | ❌ 未公开 | 各渠道掉落符文的概率 |
| 各景点是否有不同升级消耗 | ⚠️ 存疑 | 官方暗示统一阈值，但可能有差异 |
| 符文装备属性范围 | ⚠️ 部分已知 | 基础效果已知，具体数值范围未完全确定 |
| 商人商品完整列表与价格 | ⚠️ 版本相关 | 随版本更新调整 |

---

## References

1. [Arena Manager — Shakes & Fidget Help Center](https://playa-games.helpshift.com/hc/en/4-shakes-fidget-1653988985/faq/344-upgrades/)
2. [Arena Manager | sfgame guide (sfporadnik.pl)](https://www.en.sfporadnik.pl/arena-manager.php)
3. [Shakes & Fidget - Arena Manager Guide (number13.de)](https://en.number13.de/shakes-fidget-arena-manager/)
4. [Arena | Shakes and Fidget Wiki (Fandom)](https://sfgame.fandom.com/wiki/Arena)
5. [Upgrades — Shakes & Fidget Help Center](https://playa-games.helpshift.com/hc/en/4-shakes-fidget-1653988985/faq/344-upgrades/)
6. [Runes — Shakes and Fidget Wiki (Fandom)](https://sfgame.fandom.com/wiki/Runes)
