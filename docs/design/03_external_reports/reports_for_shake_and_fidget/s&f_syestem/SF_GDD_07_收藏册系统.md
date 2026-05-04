# 游戏系统策划案 · 收藏册系统（Scrapbook / Library of Meticulousness）

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

收藏册是游戏中**长期收集型子系统**，隶属于图书馆（Library of Meticulousness）的三大魔典之一（另两个为成就册和传奇物品集）。玩家通过击败怪物、购买装备、竞技场战斗等方式收集装备和怪物信息，逐步填充收藏册，获得永久的经验值加成和属性加成。

🅰️ **A级**（官方帮助中心 + sfporadnik.pl）

### 1.2 解锁条件

| 项目 | 数值 | 可信度 |
|------|------|--------|
| 解锁等级 | **10级** | 🅰️ A级 |
| 获取方式 | 在**魔法商店**以 **25金币** 购买 | 🅰️ A级 |
| 解锁位置 | 图书馆（Library） | 🅰️ A级 |

🅰️ **A级**（官方帮助中心 + sfporadnik.pl 交叉验证）

### 1.3 设计目的

- 为日常任务系统提供**永久经验值加成**，激励长期留存
- 通过收集机制驱动玩家**探索全部游戏内容**（地下城、竞技场、商店、任务）
- 为成就系统提供**可量化的进度目标**
- 为社交竞技提供**收藏品展示**和对比动力

---

## 2. 核心机制

### 2.1 收藏册三大板块

收藏册分为以下三个独立板块：

#### 2.1.1 装备物品（Items）

🅰️ **A级**（官方帮助中心 + sfporadnik.pl）

**分类结构**：收藏册将装备物品按**职业 + 部位**分为4大类、27个子类：

| 大类 | 子类 | 说明 | 可信度 |
|------|------|------|--------|
| **贵重物品（Valuables）** | 护身符（Amulets） | 全职业通用 | 🅰️ A级 |
| | 戒指（Rings） | 全职业通用 | 🅰️ A级 |
| | 护身符/符文（Talismans） | 全职业通用 | 🅰️ A级 |
| **战士装备（Warrior）** | 武器、盾牌、护甲、靴子、手套、头盔、腰带 | 7个子类 | 🅰️ A级 |
| **法师装备（Magician）** | 武器、护甲、靴子、手套、头盔、腰带 | 6个子类 | 🅰️ A级 |
| **斥候装备（Explorer/Scout）** | 武器、护甲、靴子、手套、头盔、腰带 | 6个子类 | 🅰️ A级 |
| **传奇物品（Legendary）** | 传奇装备 | 特殊子类 | 🅰️ A级 |

> **数量参考**：以Amulets子类为例，sfporadnik.pl收录约39件。总贴纸数超过1000（圣杯解锁需1000贴纸）。

#### 2.1.2 怪物图鉴（Monsters）

🅰️ **A级**（官方帮助中心）

记录在地下城和远征中击败的所有怪物。怪物有固定出现地点，涵盖：
- 常规区域怪物
- 特殊任务怪物
- 各大地下城怪物
- 高塔（Tower）怪物
- 公会传送门怪物
- 恶魔传送门怪物
- 连续偶像循环怪物等

#### 2.1.3 成就（Achievements）

🅰️ **A级**（官方帮助中心 + sfporadnik.pl 交叉验证）

- 总成就数：**103个**
- 每完成一个成就：**全属性 +5点**永久加成
- 全部完成：**全属性 +515点**
- 成就按游戏功能分类，每个成就有明确的解锁条件描述

### 2.2 装备入册方式

🅰️ **A级**（官方帮助中心）

装备进入收藏册的途径：

| 获取方式 | 说明 | 可信度 |
|----------|------|--------|
| **远征/地下城** | 获得或遭遇装备 | 🅰️ A级 |
| **商店购买** | 在武器店或魔法店浏览/购买 | 🅰️ A级 |
| **马桶冲水** | 奥秘之神马桶获得物品 | 🅰️ A级 |
| **竞技场/名人堂** | 战斗胜利后**记录对手装备** | 🅰️ A级 |

> **关键策略点**：竞技场战斗是快速填充收藏册的高效途径——获胜后对手的所有装备自动入册。这要求玩家在名人堂中搜索装备未收集的对手。

### 2.3 经验值加成公式

🅱️ **B级**（社区共识，多源交叉验证）

收藏册完成度提供**永久的经验值加成**：

```
任务经验 = 基础经验 × (1 + 收藏册完成百分比)
```

| 完成进度 | XP加成 | 可信度 |
|----------|--------|--------|
| 10% | +10% XP | 🅱️ B级 |
| 50% | +50% XP | 🅱️ B级 |
| 90% | +90% XP | 🅱️ B级 |
| 100% | +100% XP | 🅱️ B级 |

> **来源说明**：官方描述为"proportional experience bonus"（成比例的经验加成），社区普遍解读为完成百分比等于加成百分比。官方未给出精确数学公式，此为社区共识（B级）。

### 2.4 传奇物品联动

🅰️ **A级**（官方帮助中心）

- 传奇物品**仅**在"传奇地下城"中出现
- 传奇地下城在一年四季中各出现一次，每次持续几天
- 每个传奇地下城有一套独特装备
- **收集传奇物品越多**，在堡垒宝石矿中找到**传奇宝石**的概率越高

---

## 3. 圣杯系统（Holy Grail）

### 3.1 解锁条件

🅰️ **A级**（官方帮助中心 + 德语官方 + 匈牙利官方交叉验证）

| 条件 | 数值 | 可信度 |
|------|------|--------|
| 角色等级 | **≥ 85级** | 🅰️ A级 |
| 收藏册贴纸 | **≥ 1000张** | 🅰️ A级 |
| 获取地点 | 堡垒的**宝石矿坑**（Gem Mine） | 🅰️ A级 |
| 激活方式 | 挖出后**自动激活**，无需手动使用 | 🅰️ A级 |

### 3.2 圣杯效果

🅰️ **A级**（官方帮助中心）

激活后，在**名人堂**中：
- 收藏册中**缺失**的物品会产生**抖动视觉效果**
- 帮助玩家快速识别缺失装备
- **传奇物品永远不会抖动**（因为无法通过竞技场获得）

> **设计意义**：圣杯极大降低了收藏册后期的收集难度，是完成90%以上收集度的关键道具。

---

## 4. 成就系统详解

### 4.1 成就奖励规则

🅰️ **A级**

- 每个成就完成：**所有属性永久 +5点**
- 全部103个成就：**所有属性 +515点**
- 成就归属不同游戏功能类别

### 4.2 重要成就列表

🅰️ **A级**（sfporadnik.pl 完整列表）

| 成就名称 | 要求 | 难度 |
|----------|------|------|
| Finally 18 | 达到18级 | 简单 |
| Hero | 达到100级 | 中等 |
| Elite | 达到200级 | 困难 |
| Epic Superhero | 达到500级 | 极难 |
| Collecting Mania | 收藏册90%完成度 | 约280级可达成 |
| Anniversary | 游玩满1年 | 时间限制 |
| Always On | 连续登录30天 | 坚持 |
| Fashion-conscious | 为角色装备6件同职业专属物品 | 中等 |

---

## 5. 数值曲线与进度

### 5.1 收藏进度参考

🅱️ **B级**（社区估算）

| 完成度 | 预计等级 | 说明 |
|--------|----------|------|
| ~30% | 约50级 | 低等级装备容易获取 |
| ~60% | 约100级 | 需要系统性地打竞技场 |
| ~90% | 约280级 | 部分史诗物品和怪物需高等级 |
| ~100% | 极高等级 | 需要大量时间和稀有物品 |

### 5.2 收藏效率优化策略

🅱️ **B级**（number13.de 新手指南）

| 策略 | 说明 |
|------|------|
| **从Day 1开始** | 早期就应购买收藏册（10级，25金币） |
| **竞技场优先** | 获胜后对手装备自动入册 |
| **高塔推图** | 逐层击败怪物填充图鉴 |
| **各职业装备** | 关注战士/法师/斥候三个职业的全部装备 |
| **圣杯激活后** | 优先在名人堂中搜索缺失装备 |

---

## 6. 复刻实现指南

### 6.1 数据结构

```javascript
const SCRAPBOOK = {
  categories: {
    valuables: { subtypes: ['amulets', 'rings', 'talismans'] },
    warrior: { subtypes: ['weapon', 'shield', 'armor', 'boots', 'gloves', 'helmet', 'belt'] },
    magician: { subtypes: ['weapon', 'armor', 'boots', 'gloves', 'helmet', 'belt'] },
    explorer: { subtypes: ['weapon', 'armor', 'boots', 'gloves', 'helmet', 'belt'] },
    legendary: { subtypes: ['legendary'] }
  },
  
  items: {
    // 每件装备记录
    // { id, name, category, subtype, level, quality, stats, collected: boolean }
  },
  
  monsters: {
    // 每只怪物记录
    // { id, name, location, level, defeated: boolean }
  },
  
  achievements: {
    // 每个成就记录
    // { id, name, description, category, completed: boolean, reward: '+5 all stats' }
  }
};
```

### 6.2 XP加成计算

```javascript
function calculateQuestXP(baseXP, scrapbook) {
  const totalItems = scrapbook.items.length;
  const collectedItems = scrapbook.items.filter(i => i.collected).length;
  const completionPercent = collectedItems / totalItems;
  
  // B级公式（社区共识）
  const bonusMultiplier = 1 + completionPercent;
  return Math.floor(baseXP * bonusMultiplier);
}
```

### 6.3 复刻优先级

| 优先级 | 功能 | 说明 |
|--------|------|------|
| **P0** | 装备收集基础 | 3职业×7部位装备分类，击败/购买入册 |
| **P0** | XP加成 | 完成百分比 = 加成百分比 |
| **P1** | 怪物图鉴 | 地下城怪物 defeat → 入册 |
| **P1** | 成就系统 | 103个成就，全属性+5/个 |
| **P2** | 竞技场装备记录 | 胜利后记录对手装备 |
| **P2** | 圣杯系统 | 85级+1000贴纸→宝石矿获取 |
| **P3** | 传奇物品联动 | 传奇地下城 + 矿坑传奇宝石概率 |

---

## 7. 数据缺口与不确定项

| 数据项 | 状态 | 说明 |
|--------|------|------|
| 每级装备精确数量 | ⚠️ 未找到 | 需游戏内数据挖掘 |
| 收藏册总物品精确值 | ⚠️ >1000 | 具体数量随版本变化 |
| XP加成精确公式 | 🅱️ B级 | 社区共识，非官方确认 |
| 圣杯掉落概率 | ⚠️ 未公开 | 宝石矿中的具体概率 |

---

## References

1. [Library of Meticulousness — Shakes & Fidget Help Center](https://playa-games.helpshift.com/hc/en/4-shakes-fidget-1653988985/faq/286-library-of-meticulousness/)
2. [Holy Grail — Shakes & Fidget Help Center](https://playa-games.helpshift.com/hc/en/4-shakes-fidget-1653988985/faq/113-scrapbook-of-meticulousness/)
3. [Scrapbook of Meticulousness | sfgame guide (sfporadnik)](https://en.sfporadnik.pl/scrapbook.php)
4. [Scrapbook Index | sfgame guide (sfporadnik)](https://en.sfporadnik.pl/scrapbook/index.php)
5. [Items | Shakes and Fidget Wiki (Fandom)](https://sfgame.fandom.com/wiki/Items)
6. [Bonus from Game Features — Shakes & Fidget Help Center](https://playa-games.helpshift.com/hc/en/4-shakes-fidget-1653988985/faq/111-bonus-from-game-features/)
7. [Shakes & Fidget: Beginners Guide (Level 1-110) - number13](https://en.number13.de/shakes-fidget-beginners-guide/)
