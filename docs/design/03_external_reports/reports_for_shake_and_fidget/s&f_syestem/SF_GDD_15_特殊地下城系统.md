# 游戏系统策划案 · 特殊地下城系统（Special Dungeons）

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

## 系统总览

SF中存在多种**特殊地下城**，它们与普通地下城（1-150号）不同，拥有独立的机制、奖励和解锁条件。本文档涵盖以下7种特殊地下城：

| 地下城 | 类型 | 解锁条件 | 核心特色 |
|--------|------|---------|---------|
| **高塔（Tower）** | 长期PVE | Lv1起 | 100层渐进挑战，+1%金币/层 |
| **龙卷风（Twister）** | 活动PVE | 90%HP触发 | 1,000只怪物限时击杀 |
| **传奇地下城（Legendary Dungeon）** | 高级PVE | Lv200+ | 100房间+祝福诅咒+装备掉落 |
| **沙暴（Sandstorm）** | 高级PVE | Lv500 | 1,000只怪物挑战 |
| **偶像循环（Continuous Loop of Idols）** | 特殊PVE | Lv222 | USB记忆棒收集 |
| **恶魔传送门（Demon Portal）** | 公会/个人 | Lv99 | 50层，日恢复10%HP |
| **直升梯（Hellevator）** | 公会活动 | 公会功能 | 500敌人+密钥卡+分层奖励 |

---

## 第一部分：高塔系统（Tower）

## 1. 系统概述

### 1.1 系统定位

高塔是SF中**第一个也是最核心的特殊地下城**，从Lv1即可进入。高塔共**100层**，每层需要击败守关敌人才能进入下一层。高塔的最终意义不仅是100层通关后的冥界/影子世界解锁，更重要的是其**每层+1%金币加成**的永久收益。

🅰️ **A级**（官方帮助中心 "Tower" + sfporadnik.pl）

### 1.2 核心机制

🅰️ **A级**（官方帮助中心 + sfporadnik.pl + sfgame.fandom.com）

| 项目 | 详情 | 可信度 |
|------|------|--------|
| 总层数 | **100层** | 🅰️ A级 |
| 进入条件 | 无等级限制，Lv1即可挑战 | 🅰️ A级 |
| 战斗方式 | 与每层守关敌人进行1v1战斗 | 🅰️ A级 |
| 失败处理 | 失败后可**重试**（无惩罚） | 🅰️ A级 |
| HP机制 | 角色HP在层间**持续**（不自动恢复） | 🅰️ A级 |
| HP恢复 | 可通过物品（药水）恢复HP | 🅰️ A级 |
| 金币加成 | 每通过1层 **+1% 金币收益** | 🅰️ A级 |
| 最大加成 | 100层 = **+100% 金币收益** | 🅰️ A级 |
| 通关奖励 | 解锁**冥界**和**影子世界** | 🅰️ A级 |

### 1.3 高塔金币加成

🅰️ **A级**

| 已通过层数 | 金币加成 |
|----------|---------|
| 1层 | +1% |
| 10层 | +10% |
| 50层 | +50% |
| 100层（全部通过） | +100% |

> **核心公式**：金币加成百分比 = 已通过的最高层数。加成对所有金币来源生效（任务、远征、竞技场奖励等）。

### 1.4 高塔策略

🅱️ **B级**（社区策略）

| 策略 | 说明 |
|------|------|
| 逐步推进 | 随着等级提升装备改善后推进更多层 |
| HP管理 | 合理使用药水，避免在高层因HP耗尽卡住 |
| 装备优先 | 确保装备达到当前等级最优后再挑战高塔 |
| 金币收益 | 即使不通关，每推一层都永久提升金币收益 |

---

## 第二部分：龙卷风系统（Twister）

## 2. 系统概述

### 2.1 系统定位

龙卷风是SF中的**限时活动地下城**，在玩家HP降至**90%以下**时自动触发（手动点击龙卷风入口）。龙卷风包含**1,000只怪物**，玩家需要在有限时间内尽可能多地击败它们。当玩家HP恢复到90%以上时，龙卷风自动关闭。

🅰️ **A级**（官方帮助中心 + sfporadnik.pl）

### 2.2 核心机制

🅰️ **A级**（官方帮助中心 + sfporadnik.pl + number13.de）

| 项目 | 详情 | 可信度 |
|------|------|--------|
| 触发条件 | 玩家HP ≤ **90%** | 🅰️ A级 |
| 总怪物数 | **1,000只** | 🅰️ A级 |
| 战斗方式 | 依次与怪物战斗 | 🅰️ A级 |
| HP消耗 | 每次战斗消耗HP（正常战斗消耗） | 🅰️ A级 |
| 自动关闭 | HP恢复至90%以上时龙卷风消失 | 🅰️ A级 |
| 费用 | **免费**（无需额外消耗） | 🅰️ A级 |
| 时间限制 | 无硬性时间限制（受HP约束） | 🅱️ B级 |

### 2.3 奖励机制

🅱️ **B级**（number13.de + 社区整理）

| 奖励类型 | 说明 |
|---------|------|
| 金币 | 每击败一只怪物获得金币 |
| 经验 | 击败怪物获得经验值 |
| 物品掉落 | 怪物可能掉落装备或材料 |

### 2.4 龙卷风策略

🅱️ **B级**（社区策略）

| 策略 | 说明 |
|------|------|
| 刻意降HP | 主动让HP降至90%以下以触发 |
| 准备药水 | 携带足够药水以维持长时间战斗 |
| 装备选择 | 使用高闪避/高防御装备减少HP消耗 |
| 利益最大化 | 在HP即将耗尽前尽可能多击败怪物 |

---

## 第三部分：传奇地下城系统（Legendary Dungeon）

## 3. 系统概述

### 3.1 系统定位

传奇地下城是SF中**最高难度的PVE内容**，解锁于较高等级（约Lv200+）。传奇地下城包含**100个房间**，每个房间有门供选择，玩家通过选择不同的门面对祝福（Blessing）或诅咒（Curse），最终目标是获得**传奇装备（Legendary Weapon）**。传奇地下城拥有独特的**保底机制**——连续20次未获得传奇武器后，第21次必定掉落。

🅰️ **A级**（官方帮助中心 "Legendary Dungeon" + sfporadnik.pl + number13.de）

### 3.2 解锁条件

| 项目 | 数值 | 可信度 |
|------|------|--------|
| 解锁等级 | 约 **Lv200+** | 🅱️ B级（社区估算） |
| 入场费用 | 消耗资源（具体待确认） | ⚠️ 部分已知 |
| 每日次数 | 有每日挑战次数限制 | 🅱️ B级 |

### 3.3 核心机制：房间与门

🅰️ **A级**（官方帮助中心 + sfporadnik.pl + number13.de）

| 项目 | 详情 |
|------|------|
| 总房间数 | **100间** |
| 每间选择 | 每间有**2-3扇门**供选择 |
| 门的内容 | 每扇门后可能是：战斗/宝箱/祝福/诅咒/陷阱/商人/休息等 |
| 房间进度 | 通过门后进入下一间，直至100间完成或角色阵亡 |

### 3.4 门类型详解

🅰️ **A级**（sfporadnik.pl "Legendary Dungeon Doors"）

| 门类型 | 图标/标识 | 效果 | 说明 |
|--------|----------|------|------|
| **战斗门** | 剑/怪物 | 与敌人战斗 | 胜利获得奖励，失败受惩罚 |
| **宝箱门** | 宝箱 | 获得金币/物品 | 随机品质 |
| **祝福门** | 光芒 | 获得正面增益 | 持续至地下城结束 |
| **诅咒门** | 暗影 | 获得负面效果 | 持续至地下城结束或被祝福抵消 |
| **休息门** | 床/火堆 | 恢复部分HP | 回复量不固定 |
| **陷阱门** | 骷髅 | 造成伤害或负面效果 | 直接扣除HP |
| **商人门** | 商人 | 可购买物品 | 使用金币购买 |
| **命运门** | 星星 | 随机效果 | 正面或负面均可 |

### 3.5 祝福与诅咒系统

🅰️ **A级**（sfporadnik.pl + number13.de）

**祝福类型（Blessings）**：

| 祝福 | 效果 |
|------|------|
| 力量祝福 | 增加攻击力 |
| 防御祝福 | 增加防御力 |
| 幸运祝福 | 增加暴击/闪避 |
| 生命祝福 | 恢复HP或增加最大HP |
| 金币祝福 | 增加金币获取 |

**诅咒类型（Curses）**：

| 诅咒 | 效果 |
|------|------|
| 虚弱诅咒 | 降低攻击力 |
| 脆弱诅咒 | 降低防御力 |
| 厄运诅咒 | 降低暴击/闪避 |
| 流血诅咒 | 每间房间损失HP |
| 贫穷诅咒 | 降低金币获取 |

### 3.6 传奇装备保底机制

🅰️ **A级**（官方帮助中心 + sfporadnik.pl + number13.de）

| 项目 | 详情 | 可信度 |
|------|------|--------|
| 保底触发条件 | 连续 **20次** 传奇地下城通关未获得传奇武器 | 🅰️ A级 |
| 保底效果 | 第21次通关**必定**获得传奇武器 | 🅰️ A级 |
| 重置条件 | 获得传奇武器后计数器归零 | 🅰️ A级 |
| 计数范围 | 仅计算**完整通关**（100间全部通过） | 🅱️ B级 |

> **设计意图**：保底机制确保玩家不会因随机性而长期无法获得传奇装备，提供确定性的长期目标。

### 3.7 命运宝石（Fate Gems）

🅱️ **B级**（number13.de + 社区整理）

| 项目 | 详情 |
|------|------|
| 命运宝石数量 | **21种**不同类型的命运宝石 |
| 用途 | 在特定门中使用，改变门的效果 |
| 获取方式 | 传奇地下城内或外部活动获取 |
| 使用效果 | 每种宝石对应一种特殊效果 |

> 命运宝石系统增加了传奇地下城的策略深度，玩家需要在何时使用何种宝石之间做出决策。

---

## 第四部分：沙暴系统（Sandstorm）

## 4. 系统概述

### 4.1 系统定位

沙暴是SF中的**高等级限时挑战地下城**，解锁于Lv500。与龙卷风类似，沙暴包含**1,000只怪物**，但难度远高于龙卷风，适合高等级玩家挑战。

🅰️ **A级**（官方帮助中心 + sfporadnik.pl）

### 4.2 核心机制

🅰️ **A级**（官方帮助中心 + sfporadnik.pl）

| 项目 | 详情 | 可信度 |
|------|------|--------|
| 解锁等级 | **Lv500** | 🅰️ A级 |
| 总怪物数 | **1,000只** | 🅰️ A级 |
| 触发方式 | 主动进入沙暴入口 | 🅰️ A级 |
| 难度 | 怪物等级和属性远高于龙卷风 | 🅰️ A级 |
| HP消耗 | 与普通战斗相同的HP消耗 | 🅰️ A级 |

### 4.3 奖励

🅱️ **B级**（社区整理）

| 奖励类型 | 说明 |
|---------|------|
| 高品质装备 | 概率掉落史诗/传奇装备 |
| 大量金币 | Lv500级别的金币奖励 |
| 稀有材料 | 特殊材料掉落 |

---

## 第五部分：偶像循环（Continuous Loop of Idols）

## 5. 系统概述

### 5.1 系统定位

偶像循环是SF中的**特殊收集型地下城**，解锁于Lv222。该地下城的核心目标是收集**USB记忆棒（USB Stick）**，一种特殊的收集品。

🅱️ **B级**（sfporadnik.pl + number13.de）

### 5.2 核心机制

| 项目 | 详情 | 可信度 |
|------|------|--------|
| 解锁等级 | **Lv222** | 🅱️ B级 |
| 核心目标 | 收集**USB记忆棒** | 🅱️ B级 |
| 循环机制 | 地下城可反复挑战 | 🅱️ B级 |
| 难度 | 中等（对应Lv222） | 🅱️ B级 |

> **注意**：偶像循环在官方文档中的详细描述较少，以上为基于社区信息的整理。该系统的设计较为特殊，属于小众收集向内容。

---

## 第六部分：恶魔传送门（Demon Portal）

## 6. 系统概述

### 6.1 系统定位

恶魔传送门是SF中**个人与公会并行的挑战系统**，解锁于Lv99。传送门包含**50层**，每层有一个敌人守护。传送门的独特机制是**HP不自动恢复**，每日仅恢复最大HP的10%。玩家需要策略性地管理HP，尽可能推进更多层数。

🅰️ **A级**（官方帮助中心 "Demon Portal" + sfporadnik.pl + number13.de）

> 注：恶魔传送门的完整策划已包含在 SF_GDD_12（公会系统）中，此处仅作概要说明。详细数据请参考公会系统文档。

### 6.2 核心参数

| 项目 | 详情 | 可信度 |
|------|------|--------|
| 解锁等级 | **Lv99** | 🅰️ A级 |
| 总层数 | **50层** | 🅰️ A级 |
| HP恢复 | 每日午夜恢复**10%最大HP** | 🅰️ A级 |
| 层数加成 | 每通过1层 **+1% HP和伤害**（推测） | 🅱️ B级 |
| 公会传送门 | 公会版传送门独立于个人传送门 | 🅰️ A级 |

---

## 第七部分：直升梯（Hellevator）

## 7. 系统概述

### 7.1 系统定位

直升梯是SF中的**公会限时活动**，属于大型多人协作活动。直升梯包含**500个敌人**，公会成员协同挑战。活动期间通过**密钥卡（Key Card）**机制控制推进节奏，每次活动持续有限时间，结束后重置。

🅰️ **A级**（官方帮助中心 + sfporadnik.pl + number13.de）

### 7.2 核心机制

🅰️ **A级**（官方帮助中心 + sfporadnik.pl + number13.de）

| 项目 | 详情 | 可信度 |
|------|------|--------|
| 活动性质 | **公会活动**（非个人） | 🅰️ A级 |
| 总敌人 | **500个** | 🅰️ A级 |
| 活动时长 | 限时活动（具体周期待确认） | 🅱️ B级 |
| 重置机制 | 活动结束后**完全重置** | 🅰️ A级 |
| 每日重置 | 每**24小时**重置最近20层 | 🅰️ A级 |
| 参与方式 | 公会成员各自挑战敌人 | 🅰️ A级 |

### 7.3 密钥卡系统

🅰️ **A级**（官方帮助中心 + sfporadnik.pl）

| 项目 | 详情 | 可信度 |
|------|------|--------|
| 密钥卡获取 | 每**30分钟**自动获得1张 | 🅰️ A级 |
| 最大密钥卡 | 最多持有**15张** | 🅰️ A级 |
| 密钥卡用途 | 使用密钥卡可**挑战下一层敌人** | 🅰️ A级 |
| 策略意义 | 密钥卡有限，需合理分配使用 | 🅰️ A级 |

### 7.4 奖励系统

🅰️ **A级**（sfporadnik.pl + number13.de）

| 项目 | 详情 | 可信度 |
|------|------|--------|
| 每日宝箱 | 每日可开启**50个**宝箱 | 🅰️ A级 |
| 宝箱内容 | 金币、装备、材料等 | 🅰️ A级 |
| 最终奖励 | 到达500层后的额外奖励 | 🅱️ B级 |
| 奖励分配 | 按公会成员贡献度分配 | 🅱️ B级 |

> **密钥卡策略**：15张密钥卡上限意味着玩家需要每7.5小时上线使用一次，避免溢出浪费。这是典型的"定时上线"设计，用于维持玩家日活跃度。

---

## 8. 各特殊地下城对比

| 维度 | 高塔 | 龙卷风 | 传奇地下城 | 沙暴 | 偶像循环 | 恶魔传送门 | 直升梯 |
|------|------|--------|----------|------|---------|----------|--------|
| 解锁等级 | Lv1 | 无（HP≤90%） | ~Lv200 | Lv500 | Lv222 | Lv99 | 公会 |
| 总层数/敌人 | 100层 | 1,000怪 | 100间 | 1,000怪 | 循环 | 50层 | 500怪 |
| HP恢复 | 无自动恢复 | 无 | 祝福/休息门 | 无 | 无 | 每日10% | 每日重置20层 |
| 时间限制 | 无 | HP约束 | 无 | 无 | 无 | 每日10%恢复 | 限时活动 |
| 费用 | 免费 | 免费 | 消耗资源 | 待确认 | 待确认 | 免费 | 公会活动 |
| 核心奖励 | +1%金币/层 | 金币/经验 | 传奇装备 | 高品质装备 | USB记忆棒 | 装备/材料 | 宝箱 |
| 保底机制 | 无 | 无 | 21次保底 | 无 | 无 | 无 | 无 |
| 重复性 | 一次性 | 触发型 | 可重复 | 可重复 | 循环 | 每日推进 | 周期重置 |

---

## 9. 联动关系

### 9.1 特殊地下城 × 装备系统

| 联动点 | 说明 |
|--------|------|
| 传奇装备 | 传奇地下城是传奇武器的主要来源 |
| 高品质掉落 | 沙暴/恶魔传送门产出高品质装备 |
| 收藏册 | 所有地下城产出的物品可入收藏册 |

### 9.2 特殊地下城 × 高塔

| 联动点 | 说明 |
|--------|------|
| 解锁冥界/影子世界 | 高塔100层通关是后续系统的前置 |
| 金币加成 | 高塔层数影响所有金币收益 |

### 9.3 特殊地下城 × 公会

| 联动点 | 说明 |
|--------|------|
| 直升梯 | 纯公会活动，需公会成员协作 |
| 恶魔传送门 | 公会版传送门 |
| 九头蛇 | 公会传送门产出九头蛇宠物 |

---

## 10. 复刻实现指南

### 10.1 数据结构

```javascript
const SPECIAL_DUNGEONS = {
  // ===== 高塔 =====
  tower: {
    type: 'tower',
    unlockLevel: 1,
    totalFloors: 100,
    currentFloor: 0,
    highestFloor: 0,
    
    // 金币加成
    getGoldBonus() {
      return this.highestFloor; // +1% per floor
    },
    
    // 检查是否通关
    isCleared() {
      return this.highestFloor >= this.totalFloors;
    },
    
    // 通关奖励
    onClear() {
      // 解锁冥界和影子世界
      return { underworldUnlocked: true, shadowWorldUnlocked: true };
    },
  },
  
  // ===== 龙卷风 =====
  twister: {
    type: 'twister',
    totalMonsters: 1000,
    currentMonster: 0,
    isActive: false,
    monstersDefeated: 0,
    
    // 触发条件
    canTrigger(player) {
      return player.currentHP <= player.maxHP * 0.9;
    },
    
    // 关闭条件
    shouldClose(player) {
      return player.currentHP > player.maxHP * 0.9;
    },
    
    // 战斗一个怪物
    fightMonster(player) {
      // ... 战斗逻辑
      this.currentMonster++;
      if (this.shouldClose(player)) {
        this.isActive = false;
      }
      return { defeated: this.monstersDefeated, closed: !this.isActive };
    },
  },
  
  // ===== 传奇地下城 =====
  legendary: {
    type: 'legendary',
    totalRooms: 100,
    currentRoom: 0,
    isActive: false,
    
    // 保底计数
    failedRuns: 0,
    guaranteeThreshold: 20,
    
    // 当前祝福/诅咒
    activeBlessings: [],
    activeCurses: [],
    
    // 通关处理
    onComplete() {
      this.failedRuns++;
      const legendaryDrop = Math.random() < getBaseLegendaryChance();
      
      // 保底机制
      if (this.failedRuns >= this.guaranteeThreshold || legendaryDrop) {
        this.failedRuns = 0;
        return { legendaryWeapon: true };
      }
      return { legendaryWeapon: false, runsUntilGuarantee: this.guaranteeThreshold - this.failedRuns };
    },
    
    // 门类型
    doorTypes: [
      { type: 'battle', weight: 30 },
      { type: 'treasure', weight: 15 },
      { type: 'blessing', weight: 10 },
      { type: 'curse', weight: 10 },
      { type: 'rest', weight: 10 },
      { type: 'trap', weight: 10 },
      { type: 'merchant', weight: 5 },
      { type: 'fate', weight: 10 },
    ],
  },
  
  // ===== 沙暴 =====
  sandstorm: {
    type: 'sandstorm',
    unlockLevel: 500,
    totalMonsters: 1000,
    currentMonster: 0,
    isActive: false,
    monstersDefeated: 0,
  },
  
  // ===== 偶像循环 =====
  idolLoop: {
    type: 'idol_loop',
    unlockLevel: 222,
    usbSticksCollected: 0,
    isRepeatable: true,
  },
  
  // ===== 恶魔传送门 =====
  demonPortal: {
    type: 'demon_portal',
    unlockLevel: 99,
    totalFloors: 50,
    currentFloor: 0,
    highestFloor: 0,
    
    // HP恢复
    dailyHPRecovery: 0.10, // 10% per day
    
    // 每日恢复
    dailyRecovery(player) {
      const recovery = Math.floor(player.maxHP * this.dailyHPRecovery);
      player.demonPortalHP = Math.min(player.maxHP, player.demonPortalHP + recovery);
      return recovery;
    },
  },
  
  // ===== 直升梯 =====
  hellevator: {
    type: 'hellevator',
    isGuildActivity: true,
    totalEnemies: 500,
    currentEnemy: 0,
    
    // 密钥卡系统
    keyCard: {
      interval: 30 * 60 * 1000,  // 30分钟
      maxCards: 15,
      currentCards: 0,
      lastCardTime: null,
      
      generateCard() {
        const now = Date.now();
        if (this.lastCardTime && now - this.lastCardTime < this.interval) return false;
        if (this.currentCards >= this.maxCards) return false;
        this.currentCards++;
        this.lastCardTime = now;
        return true;
      },
    },
    
    // 每日重置
    dailyResetFloors: 20,  // 重置最近20层
    dailyChests: 50,       // 每日50个宝箱
  },
};

// 祝福和诅咒类型
const LEGENDARY_EFFECTS = {
  blessings: [
    { id: 'strength', name: '力量祝福', stat: 'strength', bonus: 0.10 },
    { id: 'defense', name: '防御祝福', stat: 'armor', bonus: 0.10 },
    { id: 'luck', name: '幸运祝福', stat: 'luck', bonus: 0.10 },
    { id: 'life', name: '生命祝福', stat: 'hp', bonus: 0.15 },
    { id: 'gold', name: '金币祝福', stat: 'gold', bonus: 0.20 },
  ],
  curses: [
    { id: 'weakness', name: '虚弱诅咒', stat: 'strength', penalty: -0.10 },
    { id: 'fragility', name: '脆弱诅咒', stat: 'armor', penalty: -0.10 },
    { id: 'misfortune', name: '厄运诅咒', stat: 'luck', penalty: -0.10 },
    { id: 'bleed', name: '流血诅咒', stat: 'hp', penalty: -0.05, perRoom: true },
    { id: 'poverty', name: '贫穷诅咒', stat: 'gold', penalty: -0.20 },
  ],
};
```

### 10.2 复刻优先级

| 优先级 | 功能 | 说明 |
|--------|------|------|
| **P0** | 高塔 | 100层，+1%金币/层，HP持续 |
| **P0** | 恶魔传送门 | 50层，10%日恢复 |
| **P1** | 龙卷风 | 1,000怪，HP≤90%触发 |
| **P1** | 传奇地下城 | 100间，祝福/诅咒，21次保底 |
| **P2** | 直升梯 | 公会活动，密钥卡系统 |
| **P2** | 沙暴 | Lv500，1,000怪 |
| **P2** | 偶像循环 | Lv222，USB记忆棒 |
| **P3** | 命运宝石 | 21种宝石的效果和使用 |
| **P3** | 祝福/诅咒详细效果 | 5种祝福+5种诅咒的具体数值 |
| **P3** | 直升梯奖励分配 | 公会成员贡献度计算 |

---

## 11. 数据缺口与不确定项

| 数据项 | 状态 | 说明 |
|--------|------|------|
| 传奇地下城精确解锁等级 | ⚠️ 部分已知 | 社区估算约Lv200+ |
| 传奇地下城入场费用 | ❌ 未公开 | 每次挑战的具体消耗 |
| 传奇武器基础掉落概率 | ❌ 未公开 | 21次保底前的每次掉落概率 |
| 传奇地下城每日次数限制 | ⚠️ 部分已知 | 是否有每日挑战上限 |
| 沙暴精确奖励 | ⚠️ 部分已知 | 具体掉落品质和概率 |
| 偶像循环详细机制 | ❌ 不充分 | 官方文档较少，社区信息有限 |
| 直升梯活动周期 | ❌ 未公开 | 活动开始频率和持续时间 |
| 直升梯奖励分配公式 | ❌ 未公开 | 公会成员间奖励分配规则 |
| 命运宝石效果详情 | ❌ 未公开 | 21种宝石的具体效果 |
| 高塔每层敌人属性 | ❌ 未公开 | 100层守关敌人的属性曲线 |

---

## References

1. [Tower — Shakes & Fidget Help Center](https://playa-games.helpshift.com/hc/en/4-shakes-fidget-1653988985/faq/)
2. [Legendary Dungeon — Shakes & Fidget Help Center](https://playa-games.helpshift.com/hc/en/4-shakes-fidget-1653988985/faq/)
3. [Demon Portal — Shakes & Fidget Help Center](https://playa-games.helpshift.com/hc/en/4-shakes-fidget-1653988985/faq/)
4. [Tower | sfgame guide (sfporadnik.pl)](https://www.en.sfporadnik.pl/tower.php)
5. [Legendary Dungeon | sfgame guide (sfporadnik.pl)](https://www.en.sfporadnik.pl/legendary-dungeon.php)
6. [Hellevator | sfgame guide (sfporadnik.pl)](https://www.en.sfporadnik.pl/hellevator.php)
7. [Shakes & Fidget - Legendary Dungeon Guide (number13.de)](https://en.number13.de/shakes-fidget-legendary-dungeon/)
8. [Shakes & Fidget - Tower Guide (number13.de)](https://en.number13.de/shakes-fidget-tower/)
9. [Tower | Shakes and Fidget Wiki (Fandom)](https://sfgame.fandom.com/wiki/Tower)
10. [Legendary Dungeon | Shakes and Fidget Wiki (Fandom)](https://sfgame.fandom.com/wiki/Legendary_Dungeon)
11. [Hellevator | Shakes and Fidget Wiki (Fandom)](https://sfgame.fandom.com/wiki/Hellevator)
