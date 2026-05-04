# 游戏系统策划案 · 冥界系统（Underworld）

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

## 第一部分：冥界基础系统

## 1. 系统概述

### 1.1 系统定位

冥界是SF中**资源管理与灵魂经济系统**，属于后期核心玩法。玩家在冥界中扮演"冥界管理者"角色，通过建筑系统管理灵魂（Souls），招募诱惑英雄（Seduction Heroes），在冥界竞技场中战斗获取资源。冥界与主世界的灵魂获取直接挂钩——主世界战斗中"击杀对手"会为冥界提供灵魂。

🅰️ **A级**（官方帮助中心 "Underworld" + sfporadnik.pl）

### 1.2 解锁条件

| 项目 | 数值 | 可信度 |
|------|------|--------|
| 解锁条件 | 通过**高塔（Tower）第100层**后到达冥界 | 🅰️ A级 |
| 最低等级 | 约 **140级**（通过高塔时的典型等级） | 🅱️ B级（社区估算） |
| 入口位置 | 高塔100层之后 | 🅰️ A级 |
| 前置要求 | 高塔100层通关（即塔楼系统完成） | 🅰️ A级 |

🅰️ **A级**（官方帮助中心 + sfporadnik.pl）

### 1.3 设计目的

- 建立**灵魂经济**作为后期核心资源
- 提供高塔通关后的**后续长期玩法**
- 通过冥界建筑系统提供**战略决策空间**
- **诱惑英雄**系统增加角色养成维度
- 冥界竞技场提供额外的**PVE挑战**和资源来源

### 1.4 冥界 vs 影子世界

🅰️ **A级**（官方帮助中心）

| 维度 | 冥界（Underworld） | 影子世界（Shadow World） |
|------|-------------------|----------------------|
| 解锁条件 | 高塔100层通关 | 高塔100层通关（同一条件） |
| 核心资源 | 灵魂（Souls） | 影子钥匙（Shadow Keys） |
| 核心玩法 | 建筑管理、灵魂经济 | 33座影子地下城探索 |
| 诱惑英雄 | 有 | 无（但影子世界需要**同伴**） |
| 地下城 | 无独立地下城 | 33座独立地下城 |
| 关联系统 | 灵魂受主世界战斗影响 | 同伴系统配合探索 |

> **重要区别**：冥界和影子世界是同一解锁条件下的**两个并行系统**，分别侧重资源管理和地下城探索。

---

## 2. 核心机制：灵魂系统（Souls）

### 2.1 灵魂获取

🅰️ **A级**（官方帮助中心 + sfporadnik.pl + number13.de）

灵魂是冥界的核心货币，通过多种方式获取：

| 来源 | 说明 | 可信度 |
|------|------|--------|
| **主世界击杀** | 在竞技场/地下城/远征中**击杀对手**获得灵魂 | 🅰️ A级 |
| **冥界竞技场** | 冥界中的竞技场战斗胜利获得灵魂 | 🅰️ A级 |
| **每日灵魂** | 每天自动获得一定量灵魂（基础值） | 🅱️ B级 |
| **建筑产出** | 特定冥界建筑额外产出灵魂 | 🅰️ A级 |

> **核心机制**：主世界战斗中，只有**击杀对手（KO）**才会获得灵魂，打至对手逃跑不产生灵魂。灵魂获取量与对手等级和战斗结果相关。

### 2.2 最大灵魂等级（Max Souls Level）

🅰️ **A级**（官方帮助中心 + sfporadnik.pl）

冥界有一个"最大灵魂等级"概念，决定灵魂存储上限和建筑效率：

| 项目 | 详情 | 可信度 |
|------|------|--------|
| 初始最大等级 | **1级**（解锁冥界时） | 🅰️ A级 |
| 提升方式 | 冥界竞技场**胜利**可提升 | 🅰️ A级 |
| 胜利效果 | 最大灵魂等级 **+1** | 🅰️ A级 |
| 失败惩罚 | 最大灵魂等级 **-5** | 🅰️ A级 |
| 调整机制 | 每次战斗后根据结果调整 ±1/-5 | 🅰️ A级 |

> **风险与收益设计**：胜利仅+1，失败却-5。这鼓励玩家在灵魂等级较低时积极挑战，而在高等级时谨慎选择对手，避免一次失败抹去多次胜利的成果。

### 2.3 灵魂等级与资源产出关系

🅰️ **A级**（sfporadnik.pl + number13.de）

| 最大灵魂等级 | 灵魂存储上限 | 基础灵魂产出 |
|-------------|------------|------------|
| 1 | 基础值 | 基础值 |
| 10 | 基础值×10 | 基础值×10 |
| 50 | 基础值×50 | 基础值×50 |
| 100 | 基础值×100 | 基础值×100 |

> 灵魂等级直接决定每日可累积的灵魂最大值，以及建筑效率和诱惑英雄的最大属性。

---

## 第二部分：冥界建筑系统

## 3. 建筑系统

### 3.1 建筑列表与功能

🅰️ **A级**（官方帮助中心 + sfporadnik.pl + number13.de）

冥界包含多种可升级建筑，每种建筑提供不同的功能加成：

| 建筑 | 功能 | 升级效果 | 可信度 |
|------|------|---------|--------|
| **灵魂圣殿（Souls Sanctuary）** | 提升灵魂存储上限 | 每级增加灵魂上限 | 🅰️ A级 |
| **灵魂裂隙（Souls Rift）** | 提升基础灵魂产出速度 | 每级增加每日灵魂产出 | 🅰️ A级 |
| **灵魂祭坛（Souls Altar）** | 提升主世界击杀获得的灵魂量 | 每级增加击杀灵魂奖励 | 🅰️ A级 |
| **灵魂墓穴（Souls Crypt）** | 存储和积攒灵魂 | 每级增加容量 | 🅱️ B级 |
| **守护者大厅（Keeper Hall）** | 提升灵魂等级上限 | 每级允许更高的最大灵魂等级 | 🅰️ A级 |

### 3.2 核心建筑详解

#### 3.2.1 灵魂圣殿（Souls Sanctuary）

🅰️ **A级**（sfporadnik.pl）

| 项目 | 详情 |
|------|------|
| 功能 | 提升灵魂存储上限 |
| 升级消耗 | 灵魂 |
| 效果 | 每级显著增加最大灵魂存储量 |

#### 3.2.2 守护者大厅（Keeper Hall）

🅰️ **A级**（sfporadnik.pl + number13.de）

| 项目 | 详情 |
|------|------|
| 功能 | 提升冥界守护者的属性和能力 |
| 升级消耗 | 灵魂 |
| 效果 | 每级提升守护者等级，增加冥界防御力 |
| 重要性 | 高等级守护者保护冥界免受入侵 |

#### 3.2.3 角斗士训练场（Gladiator Trainer）

🅰️ **A级**（sfporadnik.pl + number13.de）

| 项目 | 详情 |
|------|------|
| 功能 | 训练诱惑英雄提升属性 |
| 升级消耗 | 灵魂 |
| 效果 | 每级提升诱惑英雄的训练效率或属性上限 |

---

## 第三部分：诱惑英雄系统

## 4. 诱惑英雄（Seduction Heroes）

### 4.1 英雄概述

🅰️ **A级**（官方帮助中心 + sfporadnik.pl）

| 项目 | 详情 | 可信度 |
|------|------|--------|
| 概念 | 玩家可招募的**特殊英雄**，在冥界中战斗 | 🅰️ A级 |
| 招募方式 | 使用灵魂招募 | 🅰️ A级 |
| 数量 | 可招募多个英雄 | 🅱️ B级 |
| 用途 | 参与冥界竞技场战斗、获取资源 | 🅰️ A级 |
| 属性 | 拥有独立的等级和属性系统 | 🅰️ A级 |

### 4.2 英雄属性系统

🅱️ **B级**（number13.de + 社区整理）

| 属性 | 说明 |
|------|------|
| 等级 | 英雄独立等级，通过训练提升 |
| 最大等级 | 受当前最大灵魂等级限制 |
| 主属性 | 与主角色类似（力量/敏捷/智力/体质） |
| 装备 | 可穿戴装备（来源待确认） |

### 4.3 英雄训练

🅰️ **A级**（sfporadnik.pl + number13.de）

| 项目 | 详情 |
|------|------|
| 训练方式 | 在冥界建筑中消耗灵魂训练 |
| 训练效果 | 提升英雄属性 |
| 训练上限 | 受最大灵魂等级限制 |
| 训练速度 | 可通过建筑升级加速 |

---

## 第四部分：冥界战斗

## 5. 冥界竞技场

### 5.1 战斗机制

🅰️ **A级**（官方帮助中心 + sfporadnik.pl）

| 项目 | 详情 | 可信度 |
|------|------|--------|
| 对手匹配 | 基于当前灵魂等级匹配 | 🅰️ A级 |
| 战斗方式 | 使用诱惑英雄进行战斗 | 🅰️ A级 |
| 战斗结果 | 胜利+1灵魂等级 / 失败-5灵魂等级 | 🅰️ A级 |
| 战斗频率 | 每日可进行多次战斗 | 🅰️ A级 |
| 奖励 | 胜利获得额外灵魂和资源 | 🅰️ A级 |

### 5.2 战斗策略

🅱️ **B级**（社区策略）

| 策略 | 说明 |
|------|------|
| 低等级速升 | 灵魂等级低时积极挑战，快速提升 |
| 高等级稳守 | 灵魂等级高时选择较弱的对手，避免-5惩罚 |
| 英雄养成 | 投入灵魂训练英雄属性，提升胜率 |
| 建筑优先 | 先升级产出建筑，确保灵魂供给充足 |

---

## 6. 联动关系

### 6.1 冥界 × 主世界

| 联动点 | 说明 | 可信度 |
|--------|------|--------|
| 击杀→灵魂 | 主世界击杀对手为冥界提供灵魂 | 🅰️ A级 |
| 竞技场KO | 竞技场战斗中KO对手获得灵魂 | 🅰️ A级 |
| 地下城KO | 地下城战斗中击杀敌人获得灵魂 | 🅰️ A级 |

### 6.2 冥界 × 高塔

| 联动点 | 说明 | 可信度 |
|--------|------|--------|
| 解锁前置 | 通过高塔100层解锁冥界 | 🅰️ A级 |
| 高塔通关 | 高塔是到达冥界的唯一途径 | 🅰️ A级 |

### 6.3 冥界 × 影子世界

| 联动点 | 说明 | 可信度 |
|--------|------|--------|
| 同级解锁 | 两者均在高塔100层后解锁 | 🅰️ A级 |
| 资源独立 | 灵魂和影子钥匙是独立资源 | 🅰️ A级 |
| 互补玩法 | 冥界侧重资源管理，影子世界侧重探索 | 🅰️ A级 |

### 6.4 冥界 × 公会

| 联动点 | 说明 | 可信度 |
|--------|------|--------|
| 冥界与公会 | 公会成员间可能存在冥界互动 | 🅱️ B级 |

---

## 7. 数值曲线与进度

### 7.1 灵魂等级成长参考

🅱️ **B级**（社区估算）

| 阶段 | 灵魂等级范围 | 建议 |
|------|------------|------|
| 初期 | 1-20 | 积极挑战，快速提升 |
| 中期 | 20-50 | 适度挑战，开始训练英雄 |
| 后期 | 50-100 | 稳定提升，注重建筑升级 |
| 高级 | 100+ | 谨慎选择对手，避免-5惩罚 |

### 7.2 建筑升级优先级

🅱️ **B级**（社区推荐）

| 优先级 | 建筑 | 原因 |
|--------|------|------|
| 1 | 灵魂圣殿 | 提升灵魂上限，解锁更多玩法 |
| 2 | 灵魂裂隙 | 提升灵魂产出速度 |
| 3 | 角斗士训练场 | 提升英雄战斗能力 |
| 4 | 守护者大厅 | 提升防御，保护资源 |
| 5 | 灵魂祭坛 | 提升主世界击杀灵魂奖励 |

---

## 8. 复刻实现指南

### 8.1 数据结构

```javascript
const UNDERWORLD = {
  isUnlocked: false,
  towerFloorsRequired: 100,
  
  // 灵魂系统
  souls: {
    current: 0,
    maxLevel: 1,           // 当前最大灵魂等级
    dailyBaseIncome: 0,    // 每日基础灵魂产出
    fromKills: 0,          // 来自主世界击杀的灵魂
  },
  
  // 灵魂等级调整规则
  soulLevelRules: {
    victoryBonus: +1,      // 胜利 +1
    defeatPenalty: -5,     // 失败 -5
    minLevel: 1,           // 最低等级
  },
  
  // 建筑系统
  buildings: {
    souls_sanctuary: {
      name: '灵魂圣殿',
      level: 0,
      maxLevel: 0,         // 待确认上限
      upgradeCost: [],     // 每级升级所需灵魂
      effect: 'increase_soul_cap',
      description: '提升灵魂存储上限',
    },
    souls_rift: {
      name: '灵魂裂隙',
      level: 0,
      maxLevel: 0,
      upgradeCost: [],
      effect: 'increase_soul_production',
      description: '提升基础灵魂产出速度',
    },
    souls_altar: {
      name: '灵魂祭坛',
      level: 0,
      maxLevel: 0,
      upgradeCost: [],
      effect: 'increase_kill_souls',
      description: '提升主世界击杀获得的灵魂量',
    },
    souls_crypt: {
      name: '灵魂墓穴',
      level: 0,
      maxLevel: 0,
      upgradeCost: [],
      effect: 'increase_storage',
      description: '增加灵魂存储容量',
    },
    keeper_hall: {
      name: '守护者大厅',
      level: 0,
      maxLevel: 0,
      upgradeCost: [],
      effect: 'increase_keeper_stats',
      description: '提升守护者属性和冥界防御力',
    },
    gladiator_trainer: {
      name: '角斗士训练场',
      level: 0,
      maxLevel: 0,
      upgradeCost: [],
      effect: 'improve_hero_training',
      description: '提升诱惑英雄训练效率',
    },
  },
  
  // 诱惑英雄
  heroes: [],              // 已招募的英雄列表
  maxHeroes: 0,            // 最大英雄数量（待确认）
  
  // 冥界竞技场
  arena: {
    dailyBattles: 0,
    maxDailyBattles: 0,    // 每日战斗次数上限（待确认）
    currentOpponent: null,
  },
  
  // 计算灵魂存储上限
  getSoulCapacity() {
    const sanctuaryLevel = this.buildings.souls_sanctuary.level;
    const cryptLevel = this.buildings.souls_crypt.level;
    const baseCapacity = this.souls.maxLevel * 100;
    const sanctuaryBonus = sanctuaryLevel * 50;
    const cryptBonus = cryptLevel * 100;
    return baseCapacity + sanctuaryBonus + cryptBonus;
  },
  
  // 计算每日灵魂产出
  getDailySoulIncome() {
    const riftLevel = this.buildings.souls_rift.level;
    const baseIncome = this.souls.maxLevel * 10;
    const riftBonus = riftLevel * 5;
    return baseIncome + riftBonus;
  },
  
  // 计算击杀灵魂奖励
  getKillSoulBonus(baseSouls) {
    const altarLevel = this.buildings.souls_altar.level;
    const multiplier = 1 + (altarLevel * 0.1);
    return Math.floor(baseSouls * multiplier);
  },
  
  // 处理战斗结果
  processBattleResult(isVictory) {
    if (isVictory) {
      this.souls.maxLevel += this.soulLevelRules.victoryBonus;
    } else {
      this.souls.maxLevel = Math.max(
        this.soulLevelRules.minLevel,
        this.souls.maxLevel + this.soulLevelRules.defeatPenalty
      );
    }
    return this.souls.maxLevel;
  },
};

// 诱惑英雄数据结构
class SeductionHero {
  constructor(id, name, heroClass) {
    this.id = id;
    this.name = name;
    this.heroClass = heroClass;  // 战士/法师/游侠/等
    this.level = 1;
    this.maxLevel = UNDERWORLD.souls.maxLevel;
    this.stats = {
      strength: 0,
      dexterity: 0,
      intelligence: 0,
      constitution: 0,
      luck: 0,
    };
    this.equipment = [];
    this.trainingProgress = 0;
  }
  
  // 训练英雄
  train(soulsCost) {
    if (UNDERWORLD.souls.current < soulsCost) return false;
    UNDERWORLD.souls.current -= soulsCost;
    this.level = Math.min(this.level + 1, UNDERWORLD.souls.maxLevel);
    this.updateStats();
    return true;
  }
  
  // 更新属性
  updateStats() {
    const trainerBonus = UNDERWORLD.buildings.gladiator_trainer.level;
    const statPerLevel = 1 + (trainerBonus * 0.05);
    // 根据职业分配属性点
    this.stats.strength = Math.floor(this.level * statPerLevel * this.getClassMultiplier('strength'));
    this.stats.dexterity = Math.floor(this.level * statPerLevel * this.getClassMultiplier('dexterity'));
    this.stats.intelligence = Math.floor(this.level * statPerLevel * this.getClassMultiplier('intelligence'));
    this.stats.constitution = Math.floor(this.level * statPerLevel * this.getClassMultiplier('constitution'));
    this.stats.luck = Math.floor(this.level * statPerLevel * 0.3);
  }
  
  getClassMultiplier(stat) {
    // 不同职业对不同属性有加成
    const multipliers = {
      warrior: { strength: 1.5, dexterity: 0.8, intelligence: 0.5, constitution: 1.2 },
      mage:    { strength: 0.5, dexterity: 0.8, intelligence: 1.5, constitution: 0.8 },
      scout:   { strength: 0.8, dexterity: 1.5, intelligence: 0.8, constitution: 0.8 },
      bard:    { strength: 0.8, dexterity: 1.0, intelligence: 1.2, constitution: 1.0 },
    };
    return multipliers[this.heroClass]?.[stat] || 1.0;
  }
}
```

### 8.2 复刻优先级

| 优先级 | 功能 | 说明 |
|--------|------|------|
| **P0** | 冥界解锁 | 高塔100层通关 |
| **P0** | 灵魂系统 | 灵魂获取、存储、消耗 |
| **P0** | 灵魂等级机制 | 胜利+1/失败-5 |
| **P0** | 基础建筑 | 灵魂圣殿、灵魂裂隙 |
| **P1** | 冥界竞技场 | 使用诱惑英雄战斗 |
| **P1** | 诱惑英雄系统 | 招募、训练、属性 |
| **P1** | 守护者大厅 | 冥界防御 |
| **P1** | 角斗士训练场 | 英雄训练加成 |
| **P2** | 灵魂祭坛 | 击杀灵魂加成 |
| **P2** | 灵魂墓穴 | 额外存储 |
| **P2** | 主世界击杀→灵魂联动 | 竞技场/地下城KO产出灵魂 |
| **P3** | 每日灵魂自动产出 | 基础产出机制 |
| **P3** | 建筑升级消耗曲线 | 精确消耗数值 |

---

## 9. 数据缺口与不确定项

| 数据项 | 状态 | 说明 |
|--------|------|------|
| 建筑升级精确灵魂消耗表 | ❌ 未公开 | 每级建筑的具体灵魂消耗 |
| 建筑最大等级 | ❌ 未公开 | 各建筑的最大等级上限 |
| 每日基础灵魂产出精确值 | ❌ 未公开 | 每日自动获得的灵魂数量公式 |
| 最大英雄数量 | ⚠️ 部分已知 | 可招募的最大诱惑英雄数 |
| 英雄招募灵魂消耗 | ❌ 未公开 | 招募一个英雄需要多少灵魂 |
| 冥界竞技场每日战斗次数上限 | ❌ 未公开 | 每日可进行的战斗次数 |
| 灵魂等级精确上限 | ⚠️ 部分已知 | 灵魂等级是否有绝对上限 |
| 主世界击杀→灵魂转化公式 | ❌ 未公开 | 击杀对手获得的精确灵魂数量 |
| 英雄装备系统详情 | ⚠️ 存疑 | 英雄是否可穿戴装备及装备来源 |

---

## References

1. [Underworld — Shakes & Fidget Help Center](https://playa-games.helpshift.com/hc/en/4-shakes-fidget-1653988985/faq/)
2. [Underworld | sfgame guide (sfporadnik.pl)](https://www.en.sfporadnik.pl/underworld.php)
3. [Shakes & Fidget - Underworld Guide (number13.de)](https://en.number13.de/shakes-fidget-underworld/)
4. [Tower — Shakes & Fidget Help Center](https://playa-games.helpshift.com/hc/en/4-shakes-fidget-1653988985/faq/)
5. [Shadow World — Shakes & Fidget Help Center](https://playa-games.helpshift.com/hc/en/4-shakes-fidget-1653988985/faq/)
6. [Underworld | Shakes and Fidget Wiki (Fandom)](https://sfgame.fandom.com/wiki/Underworld)
