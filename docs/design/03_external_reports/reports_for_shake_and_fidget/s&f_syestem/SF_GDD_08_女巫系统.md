# 游戏系统策划案 · 女巫系统（Witch）

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

女巫系统是游戏中**装备强化与药水酿造的核心中后期子系统**。系统由三大功能模块组成：装备附魔（永久提升装备效果）、大锅捐赠（全服合作解锁+金币回收）、药水酿造（水果转化属性药水）。女巫系统与马桶系统（Toilet of the Arcane Gods）存在深度联动——附魔完成度直接影响马桶光环加成的倍率。

🅰️ **A级**（官方帮助中心 + sfporadnik.pl）

### 1.2 解锁条件

| 项目 | 数值 | 可信度 |
|------|------|--------|
| 解锁等级 | **66级** | 🅰️ A级 |
| 访问方式 | 点击升级菜单(U)中的**大锅图标**，或双击魔法商店按钮，或点击魔法商店中的**"不起眼的书"** | 🅰️ A级 |
| 前置条件 | 无其他前置条件 | 🅰️ A级 |

🅰️ **A级**（Playa Games 官方帮助中心 + sfporadnik.pl 交叉验证）

### 1.3 设计目的

- 提供**装备附魔**能力，为装备增加任务/战斗/经济相关加成
- 通过**全服合作机制**（大锅捐赠）促进玩家间的间接互动
- 提供**药水酿造**功能，作为宠物系统的下游消费出口
- 通过附魔完成度与马桶系统联动，驱动玩家完成全部9种附魔

---

## 2. 大锅捐赠系统（Cauldron Donation）

### 2.1 日常捐赠机制

🅰️ **A级**（官方帮助中心 + sfporadnik.pl + number13.de 三方交叉验证）

| 项目 | 详情 |
|------|------|
| 每日需求 | 女巫每天需要**不同类别**的装备物品（如靴子、武器、盔甲等） |
| 捐赠方式 | 从物品栏将物品**拖拽**到大锅中 |
| 每日捐赠上限 | **无上限**——可捐赠任意数量的符合要求的物品 |
| 物品处理 | 物品被**消耗**，不可返还 |
| 金币奖励 | 获得该物品**销售价值的2倍**金币 |
| 高亮提示 | 符合女巫当日需求的物品在物品栏中会**高亮显示** |

### 2.2 全服合作进度

🅰️ **A级**（官方帮助中心 + sfporadnik.pl）

| 项目 | 详情 |
|------|------|
| 进度显示 | 以**百分比**形式显示 |
| 参与方式 | 所有玩家**共同捐赠**，合力完成每日目标 |
| 进度速度 | 取决于全服玩家的贡献量，活跃服务器完成更快 |

### 2.3 女巫之舞活动（Witches' Dance）

🅰️ **A级**（官方帮助中心）

- 在**女巫之舞**活动期间，女巫接受**任何类型**的装备（不限于当日需求类别）
- 活动期间所有 mighty spell scroll（强力法术卷轴）均可用
- 是快速消耗多余装备获取金币的好时机

### 2.4 复刻设计要点

| 要点 | 说明 |
|------|------|
| 服务端全局进度 | 大锅进度为**全服共享**，需服务端存储当日进度 |
| 每日刷新 | 每日午夜刷新所需物品类别（随机从9个装备部位中选择） |
| 金币回收 | 2倍售价是重要的金币回收机制，防止经济膨胀 |
| 物品消耗 | 投入大锅的物品被销毁，不可恢复 |

---

## 3. 附魔系统（Enchantments）

### 3.1 附魔解锁流程

🅰️ **A级**（官方帮助中心 + sfporadnik.pl）

1. 全服玩家每天向女巫大锅捐赠指定类型的装备
2. 收集满所需材料后，女巫需要 **24小时** 完成卷轴制作
3. 卷轴完成后出现在女巫头顶，玩家可购买用于附魔
4. 附魔按**随机顺序**解锁，玩家无法选择下一个解锁的附魔类型
5. 共9种附魔，新服上全部解锁约需 **2-3个月**

🅱️ **B级**（number13.de — 附魔解锁顺序随机，新服2-3个月全部解锁）

### 3.2 九种附魔完整列表

🅰️ **A级**（Playa Games 官方帮助中心 + sfporadnik.pl + number13.de 三方交叉验证）

| # | 附魔名称（英） | 附魔名称（中） | 装备槽位 | 效果 | 数值 |
|---|-------------|-------------|---------|------|------|
| 1 | Adventurer's Archaeological Aura | 冒险家考古光环 | **头盔** | 任务/远征获得额外经验值 | **+10%** |
| 2 | Mario's Beard | 马里奥的胡子 | **盔甲** | 任务/远征中发现蘑菇的几率 | **+50%** |
| 3 | Shadow of the Cowboy | 牛仔之影 | **手套** | 战斗中更频繁先手攻击（反应值高者先攻） | **+1 反应分数** |
| 4 | 36960-Feet Boots | 36960英尺之靴 | **鞋子** | 任务/远征旅行时间缩短 | **-30秒** |
| 5 | Sword of Vengeance | 复仇之剑 | **武器** | 暴击伤害增加 | **+5%** |
| 6 | Unholy Acquisitiveness | 邪恶贪欲 | **护身符/项链** | 任务/远征中发现物品的几率 | **+10%** |
| 7 | Thirsty Wanderer | 口渴的流浪者 | **腰带** | 每天免费额外获得一杯啤酒 | **+1杯/天** |
| 8 | The Grave Robber's Prayer | 盗墓者的祈祷 | **戒指** | 任务/远征中获得额外金币 | **+10%** |
| 9 | Robber Baron Ritual | 强盗男爵仪式 | **护符** | 竞技场掠夺其他玩家时金币增加 | **最高+20%** |

### 3.3 附魔应用规则

🅰️ **A级**（官方帮助中心）

| 规则 | 说明 |
|------|------|
| 附魔条件 | 装备必须是**未附魔状态**才能附魔 |
| 附魔次数 | 每件装备只能被附魔**一次**（永久性操作） |
| 效果绑定 | 附魔效果**永久附加**在装备上，更换装备后效果不跟随 |
| 不可撤销 | 附魔一旦完成，不可撤销或转移到其他装备 |
| UI提示 | 有可附魔装备时显示**绿色向上箭头**；已附魔显示**金色三星**，未附魔显示**灰色三星** |
| 设置选项 | 可在游戏设置中关闭绿色箭头提示 |

### 3.4 同伴共享规则

🅰️ **A级**（官方帮助中心 + sfporadnik.pl + number13.de 三方交叉验证）

| 附魔 | 同伴可共享？ | 说明 |
|------|-------------|------|
| Shadow of the Cowboy（手套） | ✅ 是 | 同伴穿戴附魔手套后获得+1反应分数 |
| Sword of Vengeance（武器） | ✅ 是 | 同伴穿戴附魔武器后获得+5%暴击伤害 |
| 其余7种附魔 | ❌ 否 | 仅对玩家角色有效 |

### 3.5 附魔关键细节

🅰️ **A级**（sfporadnik.pl + number13.de）

| 附魔 | 细节补充 |
|------|---------|
| 牛仔之影（手套） | 反应分数决定战斗先手权；反应分数高者先攻击；**双方都有此附魔时则重新掷骰决定** |
| 36960英尺之靴（鞋子） | 仅缩短任务**实际时间**，不减少口渴值消耗。例：10分钟任务变为9分30秒，但口渴值仍扣除10点 |
| 口渴的流浪者（腰带） | 免费啤酒必须是**当天第一杯**；若当天稍后才装备此腰带，啤酒将不再免费 |

### 3.6 全部9种附魔完成后的奖励

🅰️ **A级**（Playa Games 官方帮助中心 + sfporadnik.pl）

当**所有9种附魔全部解锁**后：

> **奥秘之神马桶（Toilet of the Arcane Gods）的光环加成效果变为原来的3倍（3x）。**

**具体含义**：
- 解锁的附魔种类越多，厕所的光环加成越高
- 厕所光环等级影响商店物品品质（每+1光环等级 = 物品品质+1）
- **全部9种附魔解锁后**，厕所的物品品质提升效果**×3**
- 光环等级上限为 **400级**（Steam 27.0 更新确认）

> 注：这个3倍效果具体作用于"光环等级对物品品质的加成倍率"，而非所有附魔效果本身。附魔本身的数值（如+10%经验、+50%蘑菇概率等）不会变成3倍。 [A+D: 官方措辞分析]

### 3.7 附魔完成后的持续收益

🅰️ **A级**（官方帮助中心 + sfporadnik.pl）

- 即使所有9种附魔全部解锁后，玩家**仍可持续向大锅捐赠物品**
- 捐赠仍可获得 **2倍售价** 的金币
- 这使得大锅成为游戏后期的**装备回收/金币获取渠道**

---

## 4. 药水酿造系统（Potion Brewing）

### 4.1 解锁条件

🅰️ **A级**（官方帮助中心）

| 条件 | 数值 |
|------|------|
| 全部9个附魔 | 必须**全部完成** |
| 宠物系统 | 必须**已解锁**（75级） |

解锁后，女巫界面下方出现**榨汁机**概览，显示当前拥有的水果数量。

### 4.2 五种水果类型与来源

🅰️ **A级**（Playa Games 官方帮助中心 + sfporadnik.pl）

| 水果类型 | 颜色 | 元素属性 | 对应栖息地 | 酿造产物 |
|---------|------|---------|-----------|---------|
| **黑莓（Blackberry）** | 紫色 | 暗影（Shadow） | 暗影栖息地 | 大型体质药水（+25% 体质） |
| **柠檬（Lemon）** | 黄色 | 光明（Light） | 光明栖息地 | 大型敏捷药水（+25% 敏捷） |
| **苹果（Apple）** | 绿色 | 大地（Earth） | 大地栖息地 | 大型智力药水（+25% 智力） |
| **草莓（Strawberry）** | 红色 | 火焰（Fire） | 火焰栖息地 | 大型幸运药水（+25% 幸运） |
| **李子（Plum）** | 蓝色 | 流水（Water） | 水栖息地 | 大型力量药水（+25% 力量） |

### 4.3 水果获取渠道

🅰️ **A级**（官方帮助中心）

| 获取渠道 | 说明 | 可靠性 |
|---------|------|--------|
| **宠物战斗** | 每天赢得5次宠物战斗（每种元素各1次），必得当日水果 | 🅰️ A级 |
| **远征** | 可选择水果篮（Fruit Basket）作为奖励 | 🅰️ A级 |
| **任务** | 有几率在任务中发现水果 | 🅰️ A级 |
| **幸运转盘（Wheel of Fortune）** | 随机获得 | 🅰️ A级 |
| **活动奖励** | 特定活动提供 | 🅰️ A级 |

> **重要限制**：保证掉落物品的任务**不会**产出水果。选择任务时应优先选择不保证掉落物品的任务以获得水果。 [A: 官方帮助中心]

### 4.4 酿造机制

🅰️ **A级**（官方帮助中心 + sfporadnik.pl）

| 项目 | 详情 | 可靠度 |
|------|------|--------|
| 酿造配方 | **10个同类水果** → 1瓶大型药水 | 🅰️ A级 |
| 酿造位置 | 女巫的**榨汁机**界面 | 🅰️ A级 |
| 酿造时间 | 即时完成（无等待时间） | 🅰️ A级 |
| 额外费用 | 无额外费用（仅需10个水果） | 🅰️ A级 |

### 4.5 酿造药水 vs 商店药水

🅰️ **A级**（官方帮助中心 + sfporadnik.pl）

| 属性 | 商店小型（+10%） | 商店中型（+15%） | 商店大型（+25%） | 酿造大型（+25%） |
|------|---------------|---------------|---------------|---------------|
| **力量** | Jar Opener（1级起） | Arm Wrestler（15级起） | Weightlifter（32级起） | 10个李子 |
| **体质** | Stair Climber（1级起） | Ranger（15级起） | Long Distance Runner（35级起） | 10个黑莓 |
| **智力** | Barfly（1级起） | Nerd（15级起） | Particle Physicist（32级起） | 10个苹果 |
| **敏捷** | Yo-Yo Player（1级起） | Chopstick Warrior（15级起） | Slamdunker（32级起） | 10个柠檬 |
| **幸运** | Consolation Prize Winner（1级起） | Raffle Winner（15级起） | Jackpot Winner（35级起） | 10个草莓 |

**药水通用规则**：

| 规则 | 说明 | 可信度 |
|------|------|--------|
| 持续时间 | 所有属性药水持续 **3天** | 🅰️ A级 |
| 永生药水 | +25% HP，持续 **7天**，可与体质药水同时使用 | 🅰️ A级 |
| 同时持有上限 | 最多同时持有 **3个** 生效中的药水 | 🅰️ A级 |
| 属性限制 | 3个药水必须针对**不同属性** | 🅰️ A级 |
| 覆盖机制 | 可用更强同名药水**覆盖**旧药水（自动生效） | 🅰️ A级 |
| 删除操作 | 点击药水并确认后可**删除**（不可恢复） | 🅰️ A级 |

> 酿造大型药水的持续时间，官方未明确说明，推断为3天（与商店大型药水一致）。 [D: 推断]

---

## 5. 联动关系

### 5.1 女巫 × 马桶系统

🅰️ **A级**（官方帮助中心）

| 附魔完成度 | 马桶光环倍率 |
|-----------|-------------|
| 0种 | 1x（基础） |
| 1~8种 | 介于 1x ~ 3x 之间（具体公式未公开） |
| 全部9种 | **3x** |

### 5.2 女巫 × 宠物系统

🅰️ **A级**（官方帮助中心）

- 药水酿造需要宠物系统产出的**水果**
- 宠物全部升满200级后，水果的主要用途转为酿造药水
- 宠物战斗（每日5次）是水果的**稳定获取来源**

### 5.3 女巫 × 装备/铁匠系统

| 联动点 | 说明 |
|--------|------|
| 附魔绑定 | 附魔为永久效果，更换装备需重新附魔 |
| 铁匠强化 | 附魔不影响铁匠的属性升级/插槽升级 |
| 传奇装备 | 传奇装备也可被附魔 |
| 武器拆解 | 附魔装备被拆解时，附魔效果随装备一同消失 |

---

## 6. 数值曲线与进度

### 6.1 附魔解锁时间线

🅱️ **B级**（number13.de 社区估算）

| 阶段 | 时间 | 说明 |
|------|------|------|
| 第1个附魔 | 约1-2周 | 新服务器，全服合力捐赠 |
| 全部9个 | 约2-3个月 | 依赖全服活跃度 |

### 6.2 经济影响

🅱️ **B级**（number13.de 社区分析）

| 系统功能 | 经济影响 |
|---------|---------|
| 大锅捐赠 | 每日2倍售价回笼金币（重要的金币回收机制） |
| 药水酿造 | 免费获取+25%属性药水（替代商店购买，节省金币） |
| 任务效率提升 | +10% XP + +10%金币 + -30秒时间 + +50%蘑菇 = 综合提升约15-20%任务效率 |

---

## 7. 复刻实现指南

### 7.1 数据结构

```javascript
const WITCH_SYSTEM = {
  cauldron: {
    // 每日大锅状态
    dailyItemType: 'boots',     // 当日需求物品类别
    serverProgress: 0.75,       // 全服进度（0-1）
    scrollBeingCrafted: false,  // 是否正在制作卷轴
    scrollCraftEndTime: null,   // 卷轴完成时间
    currentScrollType: null,    // 当前正在制作的卷轴类型
  },
  
  enchantments: {
    // 9种附魔定义
    list: [
      { id: 1, slot: 'helmet',  name: 'Adventurer\'s Archaeological Aura', effect: 'quest_xp_bonus', value: 0.10, companion: false },
      { id: 2, slot: 'armor',   name: 'Mario\'s Beard',                   effect: 'mushroom_chance',  value: 0.50, companion: false },
      { id: 3, slot: 'gloves',  name: 'Shadow of the Cowboy',             effect: 'reaction_score',   value: 1,    companion: true  },
      { id: 4, slot: 'boots',   name: '36960-Feet Boots',                 effect: 'quest_time_reduce',value: 30,   companion: false },
      { id: 5, slot: 'weapon',  name: 'Sword of Vengeance',               effect: 'crit_damage_bonus',value: 0.05, companion: true  },
      { id: 6, slot: 'amulet',  name: 'Unholy Acquisitiveness',           effect: 'item_find_chance', value: 0.10, companion: false },
      { id: 7, slot: 'belt',    name: 'Thirsty Wanderer',                 effect: 'free_beer_daily',  value: 1,    companion: false },
      { id: 8, slot: 'ring',    name: 'The Grave Robber\'s Prayer',       effect: 'quest_gold_bonus', value: 0.10, companion: false },
      { id: 9, slot: 'talisman',name: 'Robber Baron Ritual',              effect: 'arena_gold_bonus', value: 0.20, companion: false },
    ],
    unlocked: [],  // 已解锁的附魔ID列表
    // 附魔完成度影响马桶光环倍率的公式
    getAuraMultiplier() {
      const count = this.unlocked.length;
      if (count >= 9) return 3.0;
      // 0-8种附魔的具体倍率公式未公开 [D]
      return 1.0 + (count / 9) * 2.0; // 线性插值推测 [D]
    }
  },
  
  brewing: {
    // 药水酿造
    unlocked: false,     // 是否已解锁（需9附魔+宠物）
    fruits: {
      blackberry: 0,     // 暗影水果
      lemon: 0,          // 光明水果
      apple: 0,          // 大地水果
      strawberry: 0,     // 火焰水果
      plum: 0,           // 水水果
    },
    recipeCost: 10,      // 每瓶药水需要10个同类水果
  },
  
  // 水果→药水映射
  fruitPotionMap: {
    blackberry: { stat: 'constitution', bonus: 0.25, name: 'Large Constitution Potion' },
    lemon:      { stat: 'dexterity',   bonus: 0.25, name: 'Large Dexterity Potion' },
    apple:      { stat: 'intelligence', bonus: 0.25, name: 'Large Intelligence Potion' },
    strawberry: { stat: 'luck',        bonus: 0.25, name: 'Large Luck Potion' },
    plum:       { stat: 'strength',    bonus: 0.25, name: 'Large Strength Potion' },
  }
};
```

### 7.2 核心逻辑实现

```javascript
// 大锅捐赠
function donateToCauldron(player, item) {
  if (item.category !== WITCH_SYSTEM.cauldron.dailyItemType) return false;
  
  const goldReward = item.sellPrice * 2;  // 2倍售价
  player.gold += goldReward;
  player.inventory.removeItem(item);
  
  // 更新全服进度（服务端）
  serverData.cauldronProgress += getItemContribution(item);
  
  return { gold: goldReward };
}

// 附魔装备
function enchantItem(player, item, scrollType) {
  if (item.enchanted) return false;
  if (!WITCH_SYSTEM.enchantments.unlocked.includes(scrollType.id)) return false;
  
  item.enchanted = true;
  item.enchantment = scrollType;
  player.inventory.removeItem(scrollType);
  
  // 检查是否全部9种已解锁
  if (WITCH_SYSTEM.enchantments.unlocked.length === 9) {
    WITCH_SYSTEM.toiletAuraMultiplier = 3.0;  // 马桶光环×3
  }
  
  return true;
}

// 药水酿造
function brewPotion(player, fruitType) {
  if (!WITCH_SYSTEM.brewing.unlocked) return false;
  if (WITCH_SYSTEM.brewing.fruits[fruitType] < 10) return false;
  
  WITCH_SYSTEM.brewing.fruits[fruitType] -= 10;
  const potion = WITCH_SYSTEM.fruitPotionMap[fruitType];
  
  player.inventory.addPotion({
    stat: potion.stat,
    bonus: potion.bonus,
    duration: 3 * 24 * 60 * 60,  // 3天（秒）
    source: 'brewing'
  });
  
  return true;
}

// 任务时间缩短（36960英尺之靴）
function applyBootEnchantment(quest, hasBootEnchant) {
  if (hasBootEnchant) {
    quest.actualDuration = Math.max(0, quest.duration - 30);  // -30秒
    quest.thirstCost = quest.duration;  // 口渴值仍按原始时长扣除
  }
  return quest;
}

// 先手判定（牛仔之影手套）
function determineFirstAttacker(attacker, defender) {
  const attackerReaction = attacker.reaction + (attacker.gloves?.enchantment?.effect === 'reaction_score' ? 1 : 0);
  const defenderReaction = defender.reaction + (defender.gloves?.enchantment?.effect === 'reaction_score' ? 1 : 0);
  
  if (attackerReaction !== defenderReaction) {
    return attackerReaction > defenderReaction ? attacker : defender;
  }
  // 反应值相同时重新掷骰
  return Math.random() < 0.5 ? attacker : defender;
}
```

### 7.3 复刻优先级

| 优先级 | 功能 | 说明 |
|--------|------|------|
| **P0** | 大锅捐赠 | 2倍售价 + 全服进度 + 每日类别刷新 |
| **P0** | 附魔系统 | 9种附魔 + 随机解锁顺序 + 24小时制作 |
| **P0** | 附魔效果 | 头盔XP、盔甲蘑菇、鞋子时间、腰带啤酒、戒指金币、项链物品、护符竞技场金币 |
| **P1** | 同伴共享 | 手套+武器附魔可应用于同伴 |
| **P1** | 先手判定 | 反应分数+1的战斗先手机制 |
| **P1** | 马桶联动 | 9附魔完成→光环×3 |
| **P2** | 药水酿造 | 10水果→大型药水（需9附魔+宠物解锁） |
| **P2** | 女巫之舞活动 | 活动期间接受所有装备 |
| **P3** | 暴击伤害加成 | 武器附魔+5%暴击伤害 |

---

## 8. 数据缺口与不确定项

| 数据项 | 状态 | 说明 |
|--------|------|------|
| 卷轴购买的具体蘑菇/金币价格 | ❌ 未找到 | 官方帮助中心和多个wiki均**未明确列出**每个卷轴的购买价格 |
| 附魔中间进度的光环倍率公式 | ❌ 未找到 | 如解锁1个、3个、6个附魔时倍率分别是多少 |
| 酿造药水的确切持续时间 | ⚠️ 推测3天 | 官方未明确，基于商店药水一致性推断 [D] |
| 附魔顺序的具体概率分布 | ❌ 未找到 | 每种附魔被选为下一个解锁的概率是否均等 |
| 大锅每日需求类别的选择逻辑 | ⚠️ 推测 | 是否从9个装备类别中均匀随机 [D] |

---

## References

1. [Witch — Shakes & Fidget Help Center](https://playa-games.helpshift.com/hc/en/4-shakes-fidget-1653988985/faq/42-witch/)
2. [Enchantments — Shakes & Fidget Help Center](https://playa-games.helpshift.com/hc/en/4-shakes-fidget-1653988985/faq/43-enchantments-1721315075/)
3. [Spell Scrolls — Shakes & Fidget Help Center](https://playa-games.helpshift.com/hc/en/4-shakes-fidget-1653988985/faq/178-spell-scrolls-1664369174/)
4. [Potions — Shakes & Fidget Help Center](https://playa-games.helpshift.com/hc/en/4-shakes-fidget-1653988985/faq/33-potions/)
5. [Upgrades — Shakes & Fidget Help Center](https://playa-games.helpshift.com/hc/en/4-shakes-fidget-1653988985/faq/344-upgrades/)
6. [Toilet of the Arcane Gods — Shakes & Fidget Help Center](https://playa-games.helpshift.com/hc/en/4-shakes-fidget-1653988985/faq/466-toilet-of-the-arcane-gods/)
7. [Witches' Dance — Shakes & Fidget Help Center](https://playa-games.helpshift.com/hc/en/4-shakes-fidget-1653988985/faq/130-witches-dance/)
8. [Witch | sfgame guide (sfporadnik.pl)](https://www.en.sfporadnik.pl/witch.php)
9. [Magic Shop | sfgame guide (sfporadnik.pl)](https://en.sfporadnik.pl/magicshop.php)
10. [Shakes & Fidget: Everything You Need to Know About the Witch (number13.de)](https://en.number13.de/shakes-fidget-everything-you-need-to-know-about-the-witch/)
11. [Shakes & Fidget: All About the Toilet of the Arcane Gods (number13.de)](https://en.number13.de/shakes-fidget-all-about-the-toilet-of-the-arcane-gods/)
12. [Wiedźma w SFGAME — Porady i tajemnice (poradniksf.pl)](https://poradniksf.pl/wied%C5%BAma)
