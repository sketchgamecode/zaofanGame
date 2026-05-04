# 游戏系统策划案 · 魔法镜与奥秘之神马桶系统（Magic Mirror & Toilet of the Arcane Gods）

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

## 第一部分：魔法镜系统（Magic Mirror）

## 1. 系统概述

### 1.1 系统定位

魔法镜是游戏中**镜像复制的核心辅助系统**，通过在任务中收集碎片逐步解锁。魔法镜激活后允许玩家在进行任务/远征的同时，由"镜像"执行竞技场战斗、地下城挑战或城防巡逻等并行操作，极大提升日常效率和资源获取速度。

🅰️ **A级**（官方帮助中心 + sfporadnik.pl）

### 1.2 解锁条件

| 项目 | 数值 | 可信度 |
|------|------|--------|
| 碎片开始出现 | **50级** | 🅰️ A级 |
| 碎片来源 | 在**任务/远征**中随机获得 | 🅰️ A级 |
| 需要碎片数 | **13片** | 🅰️ A级 |
| 预计完成等级 | 约 **70-75级** | 🅱️ B级（社区估算） |
| 激活位置 | 酒馆区域 | 🅰️ A级 |

🅰️ **A级**（sfporadnik.pl）+ 🅱️ **B级**（社区时间估算）

### 1.3 设计目的

- 提供**并行操作**能力，突破单人同时只能做一件事的限制
- 提升竞技场、地下城、城防的日常推进速度
- 通过碎片收集机制（13片）提供中期收集目标
- 与高等级地下城（高塔、影子世界）形成配合

---

## 2. 核心机制

### 2.1 碎片收集

🅰️ **A级**（sfporadnik.pl）

| 项目 | 详情 |
|------|------|
| 碎片总需求 | **13片** |
| 获取方式 | 任务/远征中**随机获得**（类似发现宠物蛋） |
| 出现等级 | 50级起任务中可找到 |
| 收集进度 | 在UI中显示已收集碎片数/13 |

### 2.2 镜像功能

🅰️ **A级**（官方帮助中心 + sfporadnik.pl）

激活后，镜像可在玩家出任务/远征期间**同时进行**以下操作之一：

| 操作 | 说明 |
|------|------|
| **竞技场战斗** | 镜像自动执行竞技场匹配和战斗 |
| **地下城挑战** | 镜像自动进行地下城战斗 |
| **城防巡逻** | 镜像自动执行堡垒城防任务 |

> **关键机制**：镜像在同一时间只能执行**一种**操作。玩家需要手动选择镜像当前的任务类型。

### 2.3 镜像限制

🅱️ **B级**（number13.de + 社区讨论）

| 限制 | 说明 |
|------|------|
| 镜像战斗力 | 使用玩家的**当前装备和属性**进行战斗 |
| 操作选择 | 玩家需手动为镜像分配任务 |
| 无自主AI | 镜像不会自动选择最优操作 |

> ⚠️ 官方帮助中心未详细描述镜像的所有限制和精确规则。以上为社区共识（B级）。

---

## 3. 数值与进度

### 3.1 碎片收集时间线

🅱️ **B级**（社区估算）

| 阶段 | 预计等级 | 说明 |
|------|----------|------|
| 首片碎片 | 50级 | 任务中开始出现 |
| 收集过半 | 约60级 | 大约获得6-7片 |
| 全部集齐 | 约70-75级 | 完成收集并激活 |

### 3.2 效率提升分析

🅱️ **B级**（社区分析）

| 操作 | 无镜像 | 有镜像 | 提升 |
|------|--------|--------|------|
| 竞技场次数/天 | N次 | N次（并行） | 日常效率翻倍 |
| 地下城推进 | 需等待任务完成 | 任务期间同步推进 | 大幅节省时间 |
| 城防巡逻 | 需分配时间 | 并行处理 | 资源获取翻倍 |

---

## 4. 复刻实现指南

### 4.1 数据结构

```javascript
const MAGIC_MIRROR = {
  unlockLevel: 50,        // 碎片开始出现等级
  requiredShards: 13,     // 需要碎片数
  collectedShards: 0,     // 已收集碎片
  isActive: false,        // 是否已激活
  currentTask: null,      // 当前镜像任务类型
  taskTypes: ['arena', 'dungeon', 'city_guard'],
};

// 镜像执行任务
function executeMirrorTask(player, taskType) {
  if (!MAGIC_MIRROR.isActive) return false;
  if (player.isQuesting) return false;  // 出任务时才能用镜像
  
  MAGIC_MIRROR.currentTask = taskType;
  
  // 使用玩家当前属性进行战斗
  const mirrorStats = {
    ...player.stats,
    equipment: [...player.equipment],
  };
  
  switch (taskType) {
    case 'arena':
      return executeArenaBattle(mirrorStats);
    case 'dungeon':
      return executeDungeonBattle(mirrorStats);
    case 'city_guard':
      return executeCityGuard(mirrorStats);
  }
}
```

### 4.2 复刻优先级

| 优先级 | 功能 | 说明 |
|--------|------|------|
| **P0** | 碎片收集 | 50级起，13片，任务/远征中获得 |
| **P0** | 镜像激活 | 集齐后解锁并行操作 |
| **P1** | 竞技场镜像 | 并行执行竞技场战斗 |
| **P1** | 地下城镜像 | 并行进行地下城 |
| **P2** | 城防镜像 | 并行城防巡逻 |
| **P3** | 镜像任务选择UI | 手动选择镜像任务类型 |

---

---

## 第二部分：奥秘之神马桶系统（Toilet of the Arcane Gods）

## 5. 系统概述

### 5.1 系统定位

奥秘之神马桶是游戏中**装备品质提升的核心循环系统**，解锁于100级。系统通过"献祭装备→积累法力→冲水升级光环→获得物品"的循环机制，持续提升玩家获得高品质装备的概率。光环等级直接影响商店物品品质，是游戏后期角色战力提升的最重要途径之一。

🅰️ **A级**（官方帮助中心 "Toilet of the Arcane Gods" + sfporadnik.pl + Steam 27.0 更新公告）

### 5.2 解锁条件

| 项目 | 数值 | 可信度 |
|------|------|--------|
| 解锁等级 | **100级** | 🅰️ A级 |
| 获取方式 | 在任务中获得**马桶钥匙**（100级起可找到） | 🅰️ A级 |
| 每日钥匙 | 100级起每天可找到**多个**马桶钥匙（未解锁时） | 🅰️ A级 |
| 钥匙售价 | **25,000金币**（可选择出售而非使用） | 🅰️ A级 |
| 激活位置 | 酒馆右侧的**门**（持有钥匙时点击） | 🅰️ A级 |

🅰️ **A级**（number13.de + sfporadnik.pl + 官方帮助中心 三方交叉验证）

### 5.3 设计目的

- 建立**装备品质提升循环**（献祭→法力→冲水→物品）
- 通过光环等级系统提供**长期升级目标**（1-400级）
- 提供装备**洗涤（Wash）**功能，转换职业装备给同伴使用
- 与女巫附魔系统联动（9附魔完成→光环效果×3）

---

## 6. 核心机制

### 6.1 献祭系统（Sacrifice）

🅰️ **A级**（官方帮助中心 + number13.de）

在"献祭"标签页中，玩家可将物品投入马桶填充法力槽。

**物品法力值**：

| 物品类型 | 法力值 | 可信度 |
|---------|--------|--------|
| **史诗/传奇物品** | **50法力** | 🅰️ A级 |
| **宝石** | **30法力** | 🅰️ A级 |
| **普通物品** | **25法力** | 🅰️ A级 |
| **法力药水** | **10法力** | 🅰️ A级 |

**每日献祭限制**：

🅰️ **A级**（number13.de）

| 项目 | 详情 |
|------|------|
| 每日献祭上限 | 有**数量限制**（具体数量随版本调整） |
| 溢出保留 | 法力槽溢出的法力值**保留**并计入下一级 |

**特殊活动**：

🅱️ **B级**（number13.de）

- **整洁厕所时间**活动期间：每天献祭数量变为2个，且所有物品提供的法力值**翻倍**

### 6.2 冲水与光环升级

🅰️ **A级**（官方帮助中心 + Steam 27.0 更新公告 + number13.de）

| 项目 | 详情 |
|------|------|
| 冲水触发 | 法力槽**满后**必须冲水 |
| 冲水效果 | 光环等级 **+1** |
| 冲水奖励 | 获得1件新物品（1/3概率为**史诗品质**） |
| 溢出保留 | 溢出法力值保留并计入下一级 |
| 光环上限 | **400级**（Steam 27.0 更新提升，此前为66级） |
| 400级后 | 仍可持续献祭冲水获得物品，但光环不再提升 |

### 6.3 光环等级效果

🅰️ **A级**（官方帮助中心 + number13.de）

光环等级直接影响**物品品质（Item Quality）**：

| 效果 | 说明 |
|------|------|
| 商店物品品质 | 左上角显示当前物品品质等级 |
| 马桶洗涤物品品质 | 洗涤出的物品品质受光环影响 |
| 冲水获得物品品质 | 冲水奖励物品品质受光环影响 |
| Twitch Drops品质 | 受光环影响 |

> **核心公式**：光环等级 = 物品品质加成值。光环每升1级，相关渠道获得的物品品质+1。物品实际品质显示在物品右上角的星号旁边。

### 6.4 光环等级所需法力值

🅰️ **A级**（官方帮助中心 + Steam 27.0 更新日志）

| 光环等级范围 | 每级所需法力值 | 可信度 |
|-------------|-------------|--------|
| **1~18级** | 100 + Level × 50 | 🅰️ A级（Steam 27.0更新明确说明） |
| **19~400级** | **1000法力**（封顶） | 🅰️ A级（Steam 27.0更新明确说明） |

**具体计算**：

```javascript
function getManaRequiredForLevel(level) {
  if (level <= 18) {
    return 100 + level * 50;
    // Level 1: 150, Level 10: 600, Level 18: 1000
  }
  return 1000;  // Level 19~400: 固定1000
}
```

> 注：Steam 27.0更新（2025年8月发布）对马桶系统进行了重大改动，将最大光环从66级提升至400级，并调整了法力值曲线。

### 6.5 女巫附魔联动（3倍效果）

🅰️ **A级**（官方帮助中心 "Enchantments" + "Spell Scrolls"）

| 女巫附魔完成度 | 马桶光环倍率 |
|-------------|-------------|
| 0种附魔 | **1x**（基础） |
| 1~8种附魔 | 介于 1x ~ 3x 之间（具体公式**未公开**） |
| **全部9种** | **3x** |

> **官方原文**："The more enchantments have been unlocked, the higher the effect of the toilet's aura bonus. You get three times the effect when all nine enchantments are unlocked."

**具体含义**：3倍效果作用于"光环等级对物品品质的加成倍率"。即光环等级的实际品质提升效果变为3倍。附魔本身的数值（+10%经验等）**不会**受此影响。

### 6.6 洗涤功能（Wash）

🅰️ **A级**（number13.de）

| 项目 | 详情 |
|------|------|
| 功能 | 将物品转化为**其他职业**的对应装备 |
| 用途 | 为塔楼同伴（Mark/Kunigunda/Bert）装备对应职业装备 |
| 物品保留 | 转化后**保留出售价值** |
| 物品安全 | **不会**损毁史诗或普通物品 |
| 物品品质 | 洗涤出的物品品质受光环等级影响 |

---

## 7. 联动关系

### 7.1 马桶 × 女巫系统

| 联动点 | 说明 |
|--------|------|
| 附魔倍率 | 全部9种附魔解锁后，马桶光环效果×3 |
| 法力药水 | 法力药水可投入马桶提供10法力 |

### 7.2 马桶 × 铁匠系统

| 联动点 | 说明 |
|--------|------|
| 产出素材 | 冲水获得的物品可作为铁匠素材 |
| ⚠️ 马桶武器 | 被马桶冲刷过的武器失去销售价值，拆解时铁匠无法返还升级资源 |
| 品质提升 | 高品质物品更适合铁匠强化 |

### 7.3 马桶 × 宠物系统

| 联动点 | 说明 |
|--------|------|
| Unhere宠物 | 水系稀有宠物，需光环达到**50级以上**后冲马桶获得 |

### 7.4 马桶 × 收藏册

| 联动点 | 说明 |
|--------|------|
| 物品入册 | 冲水获得的物品可入收藏册 |
| 高品质物品 | 高光环等级产出更多高品质物品，加快收藏册填充 |

---

## 8. 数值曲线与进度

### 8.1 光环等级进度参考

🅰️ **A级**（官方帮助中心 + Steam 27.0）

| 光环等级 | 累计所需法力（近似） | 说明 |
|---------|-------------------|------|
| 1 | ~150 | 初始 |
| 10 | ~3,250 | |
| 18 | ~7,650 | 低等级法力递增段结束 |
| 19 | ~8,650 | 进入固定1000法力段 |
| 50 | ~39,650 | |
| 100 | ~89,650 | |
| 200 | ~189,650 | |
| 400 | ~389,650 | 上限 |

> 累计法力为近似值（基于 100+level×50 for 1-18, 1000 for 19-400 公式计算）。

### 8.2 日常法力获取参考

🅱️ **B级**（number13.de 社区估算）

| 献祭物品 | 法力值 | 日常可获取量 |
|---------|--------|------------|
| 普通物品 | 25 | 较多（每日上限内） |
| 宝石 | 30 | 依赖宝石矿产出 |
| 史诗物品 | 50 | 有限（需马桶/商店产出） |

### 8.3 策略建议

🅱️ **B级**（number13.de "All About the Toilet"）

| 策略 | 说明 |
|------|------|
| **先卖钥匙** | 100级时先出售马桶钥匙（25,000金币），投资技能点更划算 |
| **技能点优先** | 等到技能点花费超过约15,000金币后再开启马桶 |
| **优先史诗物品** | 史诗/传奇物品提供50法力，效率最高 |
| **法力药水利用** | 多余的法力药水也可投入（10法力） |

---

## 9. 复刻实现指南

### 9.1 数据结构

```javascript
const ARCANE_TOILET = {
  isUnlocked: false,
  auraLevel: 0,
  maxAuraLevel: 400,
  currentMana: 0,
  dailySacrificeLimit: 0,
  dailySacrificesRemaining: 0,
  enchantmentMultiplier: 1.0,  // 1x~3x
  
  // 物品法力值表
  manaValues: {
    epic: 50,
    legendary: 50,
    gem: 30,
    normal: 25,
    potion_mana: 10,
  },
  
  // 活动状态
  eventActive: false,        // 整洁厕所时间
  eventDoubleMana: false,    // 活动期间法力翻倍
  eventLimitReduction: 2,    // 活动期间每日限2个
  
  // 光环品质效果
  getItemQualityBonus() {
    return this.auraLevel * this.enchantmentMultiplier;
  },
  
  // 计算升到下一级所需法力
  getManaRequired() {
    if (this.auraLevel >= this.maxAuraLevel) return Infinity;
    if (this.auraLevel < 18) {
      return 100 + (this.auraLevel + 1) * 50;
    }
    return 1000;
  }
};

// 献祭物品
function sacrificeItem(player, item) {
  if (ARCANE_TOILET.dailySacrificesRemaining <= 0) return false;
  
  let mana = ARCANE_TOILET.manaValues[item.type] || 25;
  if (ARCANE_TOILET.eventActive) mana *= 2;
  
  ARCANE_TOILET.dailySacrificesRemaining--;
  player.inventory.removeItem(item);
  ARCANE_TOILET.currentMana += mana;
  
  // 检查是否可以冲水
  if (ARCANE_TOILET.currentMana >= ARCANE_TOILET.getManaRequired()) {
    return { sacrificed: true, canFlush: true };
  }
  return { sacrificed: true, canFlush: false };
}

// 冲水
function flushToilet() {
  const required = ARCANE_TOILET.getManaRequired();
  if (ARCANE_TOILET.currentMana < required) return false;
  
  ARCANE_TOILET.currentMana -= required;
  ARCANE_TOILET.auraLevel++;
  
  // 生成奖励物品
  const isEpic = Math.random() < (1/3);
  const qualityLevel = ARCANE_TOILET.getItemQualityBonus();
  
  const rewardItem = generateItem({
    quality: isEpic ? 'epic' : 'normal',
    qualityBonus: qualityLevel,
    playerLevel: player.level,
  });
  
  return { newAuraLevel: ARCANE_TOILET.auraLevel, reward: rewardItem };
}

// 洗涤物品
function washItem(item) {
  // 转换为其他职业的对应装备
  const newClass = getRandomClass(item.currentClass);
  return convertToClassEquipment(item, newClass, ARCANE_TOILET.getItemQualityBonus());
}
```

### 9.2 复刻优先级

| 优先级 | 功能 | 说明 |
|--------|------|------|
| **P0** | 马桶解锁 | 100级，钥匙激活 |
| **P0** | 献祭系统 | 4种法力值，每日上限 |
| **P0** | 冲水升级 | 法力满→冲水→光环+1→物品奖励 |
| **P0** | 光环品质 | 物品品质=基础品质+光环等级 |
| **P1** | 法力值曲线 | 1-18级递增，19-400级固定1000 |
| **P1** | 洗涤功能 | 装备转换职业 |
| **P1** | 溢出保留 | 多余法力计入下一级 |
| **P2** | 女巫附魔联动 | 9附魔→光环×3 |
| **P2** | 史诗概率 | 冲水奖励1/3概率史诗 |
| **P2** | 整洁厕所活动 | 法力翻倍，限2个 |
| **P3** | 钥匙出售 | 25,000金币出售 |
| **P3** | 光环400级上限 | 27.0版本新上限 |
| **P3** | Unhere宠物 | 光环50级+冲马桶获得 |

---

## 10. 数据缺口与不确定项

| 数据项 | 状态 | 说明 |
|--------|------|------|
| 附魔中间进度的倍率公式 | ❌ 未公开 | 1-8种附魔的具体倍率 |
| 每日献祭具体上限 | ⚠️ 版本相关 | 随版本调整 |
| 镜像战斗精确规则 | ⚠️ 部分已知 | 社区共识，非官方确认 |
| 洗涤物品品质公式 | ❌ 未公开 | 洗涤出的物品品质计算 |
| 27.0之前的光环上限 | 🅱️ B级 | 旧版为66级，已过时 |

---

## References

1. [Toilet of the Arcane Gods — Shakes & Fidget Help Center](https://playa-games.helpshift.com/hc/en/4-shakes-fidget-1653988985/faq/466-toilet-of-the-arcane-gods/)
2. [Enchantments — Shakes & Fidget Help Center](https://playa-games.helpshift.com/hc/en/4-shakes-fidget-1653988985/faq/43-enchantments-1721315075/)
3. [Spell Scrolls — Shakes & Fidget Help Center](https://playa-games.helpshift.com/hc/en/4-shakes-fidget-1653988985/faq/178-spell-scrolls-1664369174/)
4. [Upgrades — Shakes & Fidget Help Center](https://playa-games.helpshift.com/hc/en/4-shakes-fidget-1653988985/faq/344-upgrades/)
5. [Shakes and Fidget - Update 27.0 - Steam News](https://store.steampowered.com/news/app/438040/view/518595390150280181)
6. [Changelog - 27.000 — home.sfgame.net](https://home.sfgame.net/en/blog/changelog/2025/changelog-27-000/)
7. [Arcane Toilet Update — home.sfgame.net](https://home.sfgame.net/en/blog/dev-blog/arcane-toilet-update/)
8. [Shakes & Fidget: All About the Toilet of the Arcane Gods (number13.de)](https://en.number13.de/shakes-fidget-all-about-the-toilet-of-the-arcane-gods/)
9. [Witch | sfgame guide (sfporadnik.pl)](https://www.en.sfporadnik.pl/witch.php)
10. [Tavern | Shakes and Fidget Wiki (Fandom)](https://sfgame.fandom.com/wiki/Tavern)
