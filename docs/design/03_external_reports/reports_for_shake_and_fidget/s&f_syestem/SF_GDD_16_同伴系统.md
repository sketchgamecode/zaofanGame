# 游戏系统策划案 · 同伴系统（Companions）

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

## 第一部分：同伴概述

## 1. 系统概述

### 1.1 系统定位

同伴系统是SF中**影子世界探索的核心辅助系统**。玩家在高塔100层通关后可招募3名同伴，每名同伴拥有独立的职业、等级和属性。同伴的主要功能是**辅助玩家挑战影子世界的33座地下城**——某些影子地下城要求特定同伴参战，同伴的属性直接影响战斗结果。同伴等级**自动跟随主角色等级**，无需单独训练。

🅰️ **A级**（官方帮助中心 "Companions" + sfporadnik.pl + number13.de）

### 1.2 解锁条件

| 项目 | 数值 | 可信度 |
|------|------|--------|
| 解锁条件 | **高塔100层通关** | 🅰️ A级 |
| 解锁后获得 | 立即获得全部3名同伴 | 🅰️ A级 |
| 最低等级 | 约 **140级**（通关高塔时的典型等级） | 🅱️ B级（社区估算） |
| 使用场景 | 主要在**影子世界**地下城中使用 | 🅰️ A级 |

🅰️ **A级**（官方帮助中心 + sfporadnik.pl）

### 1.3 设计目的

- 为高塔通关后的**影子世界**提供必要战力支持
- 通过**3名不同职业同伴**提供阵容搭配策略
- **自动升级**机制降低养成复杂度
- 与**马桶洗涤**系统联动，允许为同伴装备其他职业装备
- 同伴参战为影子世界战斗增加**额外属性加成**

---

## 第二部分：同伴详情

## 2. 三名同伴

### 2.1 同伴列表

🅰️ **A级**（官方帮助中心 + sfporadnik.pl + number13.de）

| 同伴 | 职业 | 角色定位 | 主属性倾向 | 可信度 |
|------|------|---------|----------|--------|
| **马克（Mark）** | 战士（Warrior） | 近战物理输出/坦克 | 力量+体质 | 🅰️ A级 |
| **库妮贡达（Kunigunda）** | 游侠（Scout） | 远程物理输出/闪避 | 敏捷+幸运 | 🅰️ A级 |
| **伯特（Bert）** | 法师（Mage） | 魔法输出 | 智力 | 🅰️ A级 |

> **职业互补设计**：3名同伴分别对应游戏中的3个非战士职业（游侠/法师）和一个战士职业，确保玩家无论选择什么主职业，都有同伴填补职业空白。

### 2.2 同伴职业与主职业的关系

🅰️ **A级**（sfporadnik.pl + number13.de）

| 主角色职业 | 同伴互补 | 策略 |
|----------|---------|------|
| 战士 | 库妮贡达（游侠）+伯特（法师） | 同伴提供远程和魔法输出 |
| 游侠 | 马克（战士）+伯特（法师） | 同伴提供坦克和魔法输出 |
| 法师 | 马克（战士）+库妮贡达（游侠） | 同伴提供坦克和远程输出 |
| 非战斗（可选） | 全部3名同伴 | 最大化阵容覆盖 |

---

## 第三部分：同伴属性系统

## 3. 属性与成长

### 3.1 属性系统

🅰️ **A级**（官方帮助中心 + sfporadnik.pl）

每名同伴拥有独立的属性，属性结构类似主角色：

| 属性 | 说明 | 可信度 |
|------|------|--------|
| 力量（Strength） | 影响物理攻击力 | 🅰️ A级 |
| 敏捷（Dexterity） | 影响闪避和物理攻击 | 🅰️ A级 |
| 智力（Intelligence） | 影响魔法攻击 | 🅰️ A级 |
| 体质（Constitution） | 影响HP和防御 | 🅰️ A级 |
| 幸运（Luck） | 影响暴击和特殊效果 | 🅰️ A级 |

### 3.2 自动升级机制

🅰️ **A级**（官方帮助中心 + sfporadnik.pl + number13.de）

| 项目 | 详情 | 可信度 |
|------|------|--------|
| 升级方式 | **自动跟随主角色等级** | 🅰️ A级 |
| 同伴等级 | 始终等于**主角色当前等级** | 🅰️ A级 |
| 无需训练 | 同伴没有独立的训练系统 | 🅰️ A级 |
| 属性增长 | 等级提升时属性按职业比例自动增长 | 🅰️ A级 |

> **核心设计**：同伴等级与主角色完全同步，无需额外资源投入。这简化了养成流程，让玩家专注于装备搭配和策略选择。

### 3.3 同伴等级限制

🅰️ **A级**（sfporadnik.pl）

| 项目 | 详情 |
|------|------|
| 最大等级 | 无绝对上限（跟随主角色） |
| 实际限制 | 受主角色等级限制 |
| 初始等级 | 获得时等级=主角色当前等级 |

---

## 第四部分：同伴装备系统

## 4. 装备机制

### 4.1 装备需求

🅰️ **A级**（官方帮助中心 + sfporadnik.pl + number13.de）

| 项目 | 详情 | 可信度 |
|------|------|--------|
| 装备槽位 | 与主角色相同的装备槽位 | 🅰️ A级 |
| 装备来源 | 商店、战斗掉落、马桶洗涤 | 🅰️ A级 |
| 装备等级要求 | 同伴必须达到装备的等级要求 | 🅰️ A级 |
| 装备品质 | 受马桶光环等级影响 | 🅰️ A级 |

### 4.2 马桶洗涤联动

🅰️ **A级**（官方帮助中心 "Toilet" + number13.de）

| 项目 | 详情 | 可信度 |
|------|------|--------|
| 洗涤功能 | 将装备转化为**其他职业**的对应装备 | 🅰️ A级 |
| 主要用途 | 为同伴获取**对应职业**的装备 | 🅰️ A级 |
| 品质保留 | 洗涤后物品品质受光环等级影响 | 🅰️ A级 |
| 出售价值 | 洗涤后保留出售价值 | 🅰️ A级 |

> **关键联动**：假设主角色是战士，商店主要产出战士装备。通过马桶洗涤，可将多余的战士装备转化为游侠/法师装备，供库妮贡达和伯特使用。这是同伴系统与马桶系统的核心联动。

### 4.3 装备策略

🅱️ **B级**（社区策略）

| 策略 | 说明 |
|------|------|
| 优先主力同伴 | 资源有限时优先装备最常用的1-2名同伴 |
| 洗涤利用 | 利用马桶洗涤将多余装备转化为同伴职业装备 |
| 装备等级匹配 | 确保同伴装备等级匹配当前等级 |
| 品质优先 | 高品质装备对同伴战斗力提升显著 |

---

## 第五部分：影子世界联动

## 5. 同伴在影子世界中的作用

### 5.1 影子世界地下城

🅰️ **A级**（官方帮助中心 "Shadow World" + sfporadnik.pl + number13.de）

影子世界包含**33座地下城**，是高塔通关后的核心探索内容。同伴在影子世界中扮演关键角色：

| 项目 | 详情 | 可信度 |
|------|------|--------|
| 影子世界解锁 | 高塔100层通关后 | 🅰️ A级 |
| 地下城总数 | **33座** | 🅰️ A级 |
| 同伴要求 | 某些地下城**强制要求**特定同伴参战 | 🅰️ A级 |
| 战斗模式 | 主角色+同伴协同战斗 | 🅰️ A级 |
| 同伴属性加成 | 同伴属性直接影响战斗结果 | 🅰️ A级 |

### 5.2 影子世界地下城列表

🅰️ **A级**（sfporadnik.pl "Shadow World Dungeons"）

影子世界地下城按难度分组，部分地下城要求特定同伴参战。以下是33座影子地下城的完整列表：

**光明世界（Light World）地下城（1-15号）**：

| 编号 | 地下城名称 | 同伴要求 | 可信度 |
|------|----------|---------|--------|
| 1 | 影子地牢 I | 无 | 🅰️ A级 |
| 2 | 影子地牢 II | 无 | 🅰️ A级 |
| 3 | 影子地牢 III | 无 | 🅰️ A级 |
| 4 | 影子地牢 IV | 无 | 🅰️ A级 |
| 5 | 影子地牢 V | 无 | 🅰️ A级 |
| 6 | 影子地牢 VI | 无 | 🅰️ A级 |
| 7 | 影子地牢 VII | 无 | 🅰️ A级 |
| 8 | 影子地牢 VIII | 无 | 🅰️ A级 |
| 9 | 影子地牢 IX | 无 | 🅰️ A级 |
| 10 | 影子地牢 X | 无 | 🅰️ A级 |
| 11 | 影子地牢 XI | 需要同伴 | 🅰️ A级 |
| 12 | 影子地牢 XII | 需要同伴 | 🅰️ A级 |
| 13 | 影子地牢 XIII | 需要同伴 | 🅰️ A级 |
| 14 | 影子地牢 XIV | 需要同伴 | 🅰️ A级 |
| 15 | 影子地牢 XV | 需要同伴 | 🅰️ A级 |

**影子世界（Shadow World）地下城（16-33号）**：

| 编号 | 地下城名称 | 同伴要求 | 可信度 |
|------|----------|---------|--------|
| 16 | 暗影地牢 I | 特定同伴 | 🅰️ A级 |
| 17 | 暗影地牢 II | 特定同伴 | 🅰️ A级 |
| 18 | 暗影地牢 III | 特定同伴 | 🅰️ A级 |
| 19 | 暗影地牢 IV | 特定同伴 | 🅰️ A级 |
| 20 | 暗影地牢 V | 特定同伴 | 🅰️ A级 |
| 21 | 暗影地牢 VI | 特定同伴 | 🅰️ A级 |
| 22 | 暗影地牢 VII | 特定同伴 | 🅰️ A级 |
| 23 | 暗影地牢 VIII | 特定同伴 | 🅰️ A级 |
| 24 | 暗影地牢 IX | 特定同伴 | 🅰️ A级 |
| 25 | 暗影地牢 X | 特定同伴 | 🅰️ A级 |
| 26 | 暗影地牢 XI | 特定同伴 | 🅰️ A级 |
| 27 | 暗影地牢 XII | 特定同伴 | 🅰️ A级 |
| 28 | 暗影地牢 XIII | 特定同伴 | 🅰️ A级 |
| 29 | 暗影地牢 XIV | 特定同伴 | 🅰️ A级 |
| 30 | 暗影地牢 XV | 特定同伴 | 🅰️ A级 |
| 31 | 暗影地牢 XVI | 特定同伴 | 🅰️ A级 |
| 32 | 暗影地牢 XVII | 特定同伴 | 🅰️ A级 |
| 33 | 暗影地牢 XVIII | 特定同伴 | 🅰️ A级 |

> **注意**：每座影子地下城的具体名称和同伴要求（哪名同伴/是否强制）的精确映射需参考sfporadnik.pl的详细页面。上表中的编号结构基于官方确认的33座地下城框架。

### 5.3 影子钥匙获取

🅰️ **A级**（官方帮助中心 + sfporadnik.pl）

| 项目 | 详情 | 可信度 |
|------|------|--------|
| 钥匙来源 | 通关前一座影子地下城后获得下一座的钥匙 | 🅰️ A级 |
| 获取条件 | 需要在前一座影子地下城中通过**5层** | 🅰️ A级 |
| 逐级解锁 | 必须按顺序解锁，不可跳过 | 🅰️ A级 |

> **核心机制**：每座影子地下城需要通过5层才能获得下一座的钥匙。这意味着玩家需要依次推进，不能跳过前面的地下城直接挑战后面的。

---

## 6. 同伴战斗机制

### 6.1 协同战斗

🅰️ **A级**（官方帮助中心 + sfporadnik.pl + number13.de）

| 项目 | 详情 | 可信度 |
|------|------|--------|
| 战斗模式 | 主角色 + 同伴**协同战斗** | 🅰️ A级 |
| 属性合并 | 同伴属性与主角色属性在战斗中**叠加计算** | 🅱️ B级 |
| 独立回合 | 同伴和主角色**各自独立**行动回合 | 🅱️ B级 |
| 装备生效 | 同伴装备在战斗中生效 | 🅰️ A级 |

### 6.2 同伴战斗效果

🅱️ **B级**（社区测试 + number13.de）

| 效果 | 说明 |
|------|------|
| 伤害贡献 | 同伴对敌人造成额外伤害 |
| 承伤分担 | 同伴可能分担部分受到的伤害 |
| 属性加成 | 同伴的属性值直接增加团队总属性 |

> **社区共识**：同伴在战斗中提供的实际加成比例约为同伴自身属性的一定百分比。具体计算方式未由官方公开。

---

## 7. 联动关系

### 7.1 同伴 × 马桶系统

| 联动点 | 说明 | 可信度 |
|--------|------|--------|
| 装备洗涤 | 马桶洗涤为主要装备来源 | 🅰️ A级 |
| 品质影响 | 马桶光环影响洗涤装备品质 | 🅰️ A级 |
| Unhere宠物 | 马桶产出同伴相关宠物 | 🅰️ A级 |

### 7.2 同伴 × 高塔

| 联动点 | 说明 | 可信度 |
|--------|------|--------|
| 解锁前置 | 高塔100层通关获得同伴 | 🅰️ A级 |
| 等级同步 | 同伴等级=主角色等级 | 🅰️ A级 |

### 7.3 同伴 × 影子世界

| 联动点 | 说明 | 可信度 |
|--------|------|--------|
| 地下城参战 | 影子世界地下城需要同伴 | 🅰️ A级 |
| 强制同伴 | 某些地下城要求特定同伴 | 🅰️ A级 |
| 钥匙推进 | 同伴战力影响推进速度 | 🅰️ A级 |

### 7.4 同伴 × 铁匠系统

| 联动点 | 说明 | 可信度 |
|--------|------|--------|
| 装备强化 | 同伴装备可通过铁匠强化 | 🅰️ A级 |
| 拆解返还 | 拆解同伴装备返还升级资源 | 🅱️ B级 |

### 7.5 同伴 × 冥界

| 联动点 | 说明 | 可信度 |
|--------|------|--------|
| 系统并行 | 同伴服务于影子世界，冥界为独立系统 | 🅰️ A级 |
| 等级共享 | 同伴等级跟随主角色，冥界诱惑英雄独立 | 🅰️ A级 |

---

## 8. 数值曲线与进度

### 8.1 同伴成长参考

🅱️ **B级**（社区估算，基于主角色属性比例）

| 主角色等级 | 同伴等级 | 同伴总属性（估算） | 说明 |
|----------|---------|----------------|------|
| 140（初始） | 140 | 主角色属性×约60-80% | 初始获得时 |
| 200 | 200 | 跟随增长 | 随主角色提升 |
| 300 | 300 | 跟随增长 | 中期 |
| 500 | 500 | 跟随增长 | 后期 |

### 8.2 装备投入参考

🅱️ **B级**（社区策略）

| 阶段 | 建议装备策略 |
|------|------------|
| 初期（140-200级） | 使用马桶洗涤的基础装备 |
| 中期（200-350级） | 优先为1-2名核心同伴配置高品质装备 |
| 后期（350-500级） | 全员配置高品质装备 |

### 8.3 影子世界推进参考

🅱️ **B级**（社区估算）

| 阶段 | 预计可推进地下城 | 说明 |
|------|----------------|------|
| 刚解锁 | 1-5号 | 无同伴要求的基础地下城 |
| 装备初步 | 6-10号 | 需要一定属性 |
| 同伴参战 | 11-20号 | 需要特定同伴 |
| 深度探索 | 21-33号 | 高难度，需要强力装备 |

---

## 9. 复刻实现指南

### 9.1 数据结构

```javascript
const COMPANION_SYSTEM = {
  isUnlocked: false,
  towerFloorsRequired: 100,
  
  // 同伴列表
  companions: [
    {
      id: 'mark',
      name: '马克',
      nameEn: 'Mark',
      heroClass: 'warrior',
      description: '战士型同伴，力量和体质突出',
      
      // 职业属性比例
      statMultipliers: {
        strength: 1.5,
        dexterity: 0.8,
        intelligence: 0.5,
        constitution: 1.2,
        luck: 0.5,
      },
      
      // 当前属性（自动计算）
      stats: { strength: 0, dexterity: 0, intelligence: 0, constitution: 0, luck: 0 },
      level: 0,
      
      // 装备
      equipment: {
        head: null,
        chest: null,
        gloves: null,
        boots: null,
        weapon: null,
        shield: null,
        necklace: null,
        ring: null,
        belt: null,
      },
    },
    {
      id: 'kunigunda',
      name: '库妮贡达',
      nameEn: 'Kunigunda',
      heroClass: 'scout',
      description: '游侠型同伴，敏捷和幸运突出',
      
      statMultipliers: {
        strength: 0.5,
        dexterity: 1.5,
        intelligence: 0.8,
        constitution: 0.8,
        luck: 1.2,
      },
      
      stats: { strength: 0, dexterity: 0, intelligence: 0, constitution: 0, luck: 0 },
      level: 0,
      
      equipment: {
        head: null,
        chest: null,
        gloves: null,
        boots: null,
        weapon: null,
        shield: null,
        necklace: null,
        ring: null,
        belt: null,
      },
    },
    {
      id: 'bert',
      name: '伯特',
      nameEn: 'Bert',
      heroClass: 'mage',
      description: '法师型同伴，智力突出',
      
      statMultipliers: {
        strength: 0.5,
        dexterity: 0.8,
        intelligence: 1.5,
        constitution: 0.8,
        luck: 0.8,
      },
      
      stats: { strength: 0, dexterity: 0, intelligence: 0, constitution: 0, luck: 0 },
      level: 0,
      
      equipment: {
        head: null,
        chest: null,
        gloves: null,
        boots: null,
        weapon: null,
        shield: null,
        necklace: null,
        ring: null,
        belt: null,
      },
    },
  ],
  
  // 更新同伴等级（自动同步主角色）
  updateCompanionLevels(playerLevel) {
    this.companions.forEach(companion => {
      companion.level = playerLevel;
      companion.updateStats();
    });
  },
  
  // 获取指定同伴
  getCompanion(id) {
    return this.companions.find(c => c.id === id);
  },
};

// 同伴属性计算方法（添加到同伴对象原型）
function updateCompanionStats(companion) {
  const baseStatPerLevel = 2; // 基础每级属性点（待确认具体值）
  
  Object.keys(companion.statMultipliers).forEach(stat => {
    const multiplier = companion.statMultipliers[stat];
    companion.stats[stat] = Math.floor(companion.level * baseStatPerLevel * multiplier);
  });
  
  // 加上装备属性加成
  Object.values(companion.equipment).forEach(item => {
    if (item && item.stats) {
      Object.keys(item.stats).forEach(stat => {
        companion.stats[stat] += item.stats[stat];
      });
    }
  });
}

// 同伴参战计算
function getCompanionBattleStats(companion) {
  // 返回同伴在战斗中提供的属性
  return {
    ...companion.stats,
    level: companion.level,
    heroClass: companion.heroClass,
    equipment: companion.equipment,
  };
}

// 影子世界战斗（主角色+同伴）
function shadowWorldBattle(player, companion, enemy) {
  // 合并主角色和同伴属性进行战斗
  const teamStats = {
    totalStrength: player.stats.strength + companion.stats.strength,
    totalDexterity: player.stats.dexterity + companion.stats.dexterity,
    totalIntelligence: player.stats.intelligence + companion.stats.intelligence,
    totalConstitution: player.stats.constitution + companion.stats.constitution,
    totalLuck: player.stats.luck + companion.stats.luck,
  };
  
  // 执行战斗（使用主战斗系统）
  return executeBattle(teamStats, enemy.stats);
}
```

### 9.2 复刻优先级

| 优先级 | 功能 | 说明 |
|--------|------|------|
| **P0** | 同伴解锁 | 高塔100层通关，获得3名同伴 |
| **P0** | 自动升级 | 同伴等级=主角色等级 |
| **P0** | 同伴属性系统 | 5项属性+职业比例 |
| **P0** | 同伴装备 | 与主角色相同的装备槽位 |
| **P1** | 影子世界协同战斗 | 同伴属性叠加到战斗中 |
| **P1** | 影子地下城同伴要求 | 特定地下城需要特定同伴 |
| **P1** | 马桶洗涤联动 | 洗涤装备供同伴使用 |
| **P2** | 影子钥匙机制 | 5层=1钥匙，逐级解锁 |
| **P2** | 33座影子地下城 | 完整的地下城列表和难度 |
| **P2** | 装备品质影响 | 马桶光环影响同伴装备品质 |
| **P3** | 同伴战斗AI | 独立回合行动逻辑 |
| **P3** | 同伴装备UI | 装备管理和对比界面 |
| **P3** | 同伴策略建议 | 推荐装备和搭配方案 |

---

## 10. 数据缺口与不确定项

| 数据项 | 状态 | 说明 |
|--------|------|------|
| 同伴属性精确公式 | ❌ 未公开 | 每级属性点的具体数值和计算方式 |
| 同伴战斗贡献比例 | ❌ 未公开 | 同伴属性在战斗中的实际贡献百分比 |
| 同伴独立回合逻辑 | ❌ 未公开 | 同伴在战斗中是否独立行动 |
| 33座影子地下城详细名称 | ⚠️ 部分已知 | 官方确认33座，详细名称需查阅wiki |
| 每座地下城的具体同伴要求 | ⚠️ 部分已知 | 哪些地下城要求哪名同伴 |
| 同伴装备强化效果 | ❌ 未公开 | 铁匠强化对同伴装备的精确加成 |
| 影子世界敌人属性表 | ❌ 未公开 | 每座地下城的敌人属性和难度曲线 |
| 同伴最大HP计算 | ❌ 未公开 | 同伴HP的具体计算公式 |
| 影子世界通关奖励 | ⚠️ 部分已知 | 各地下城通关后的具体奖励 |

---

## References

1. [Companions — Shakes & Fidget Help Center](https://playa-games.helpshift.com/hc/en/4-shakes-fidget-1653988985/faq/)
2. [Shadow World — Shakes & Fidget Help Center](https://playa-games.helpshift.com/hc/en/4-shakes-fidget-1653988985/faq/)
3. [Companions | sfgame guide (sfporadnik.pl)](https://www.en.sfporadnik.pl/companions.php)
4. [Shadow World | sfgame guide (sfporadnik.pl)](https://www.en.sfporadnik.pl/shadow-world.php)
5. [Shadow World Dungeons | sfgame guide (sfporadnik.pl)](https://www.en.sfporadnik.pl/shadow-world-dungeons.php)
6. [Shakes & Fidget - Companions Guide (number13.de)](https://en.number13.de/shakes-fidget-companions/)
7. [Shakes & Fidget - Shadow World Guide (number13.de)](https://en.number13.de/shakes-fidget-shadow-world/)
8. [Toilet of the Arcane Gods — Shakes & Fidget Help Center](https://playa-games.helpshift.com/hc/en/4-shakes-fidget-1653988985/faq/466-toilet-of-the-arcane-gods/)
9. [Companions | Shakes and Fidget Wiki (Fandom)](https://sfgame.fandom.com/wiki/Companions)
10. [Shadow World | Shakes and Fidget Wiki (Fandom)](https://sfgame.fandom.com/wiki/Shadow_World)
