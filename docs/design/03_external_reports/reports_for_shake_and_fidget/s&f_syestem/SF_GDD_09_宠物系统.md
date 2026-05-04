# 游戏系统策划案 · 宠物系统（Pets）

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

宠物系统是游戏中**收集养成型核心子系统**，解锁于75级。系统包含五大元素栖息地（共100只宠物）、PVP宠物对战、PVE栖息地战斗、水果喂养养成、属性加成机制，以及公会九头蛇（Hydra）合作战斗。宠物系统与女巫系统的药水酿造功能深度联动——水果既可喂养宠物，也可酿造大型属性药水。

🅰️ **A级**（官方帮助中心 + sfporadnik.pl）

### 1.2 解锁条件

| 项目 | 数值 | 可信度 |
|------|------|--------|
| 解锁等级 | **75级** | 🅰️ A级 |
| 触发方式 | 在远征或酒馆任务中**随机发现蛋篮（Egg Basket）** | 🅰️ A级 |
| 首次孵化 | 直接获得 **5只宠物**（每个元素各1只，初始随机生成） | 🅰️ A级 |
| 访问入口 | 菜单战斗类别中的**宠物图标**，或城市中的**宠物建筑** | 🅰️ A级 |

### 1.3 设计目的

- 提供**长期收集目标**（100只宠物，多种稀有度）
- 通过宠物属性加成驱动角色成长（最高全属性+5%×5元素=25%）
- 通过PVP/PVE战斗提供每日活跃目标
- 水果作为连接宠物系统与女巫药水酿造系统的**桥梁资源**

---

## 2. 五大元素栖息地

### 2.1 元素与属性对应

🅰️ **A级**（官方帮助中心 + sfporadnik.pl 交叉验证）

| 栖息地 | 元素 | 加成属性 | 对应水果 | 克制元素 | 被克制 |
|--------|------|---------|---------|---------|--------|
| 🔵 **水域 Water** | 水 | **力量 (Strength)** | 🫐 李子 (Plum) | 🔥 火 | 🌙 暗 |
| ☀️ **光明 Light** | 光 | **敏捷 (Dexterity)** | 🍋 柠檬 (Lemon) | 🌙 暗 | 🟤 土 |
| 🟤 **大地 Earth** | 土 | **智力 (Intelligence)** | 🍎 苹果 (Apple) | ☀️ 光 | 🔥 火 |
| 🌙 **暗影 Shadow** | 暗 | **体质 (Constitution)** | 🫐 黑莓 (Blackberry) | 🔵 水 | ☀️ 光 |
| 🔥 **火焰 Fire** | 火 | **幸运 (Luck)** | 🍓 草莓 (Strawberry) | 🟤 土 | 🔵 水 |

**克制循环**：水 → 火 → 土 → 光 → 暗 → 水（环形）

### 2.2 栖息地结构

🅰️ **A级**（官方帮助中心）

| 项目 | 数值 |
|------|------|
| 栖息地数量 | **5个**（每种元素1个） |
| 每栖息地宠物数 | **20只** |
| 宠物总数 | **100只** |
| 初始已知宠物 | 每元素前 **3只**（随机生成） |

### 2.3 宠物稀有度

🅰️ **A级**（官方帮助中心 "Where Can I Find Pets" 完整列表）

| 稀有度 | 数量/栖息地 | 获取方式 |
|--------|------------|---------|
| **普通 (Normal)** | ~15只 | 基础条件（时间段、地点、星期等） |
| **稀有 (Rare)** | ~3只 | 特定活动、排行榜、特殊条件 |
| **史诗 (Epic)** | ~2只 | 通关地下城/特定副本，或始终可用（最终宠物） |

### 2.4 各栖息地最终宠物

🅰️ **A级**（官方帮助中心完整宠物列表）+ 🅱️ **B级**（sfporadnik.pl）

| 栖息地 | 最终宠物 | 职业 | 获取条件 |
|--------|---------|------|---------|
| 🔵 水域 | **Hydrospir** | 侦察兵 | 始终（击败上一只后解锁） |
| ☀️ 光明 | **Unikor** | 侦察兵 | 始终（击败上一只后解锁） |
| 🟤 大地 | **Mouthrexor** | 战士 | 始终（击败上一只后解锁） |
| 🌙 暗影 | **Poisnake** | 侦察兵 | 始终（击败上一只后解锁） |
| 🔥 火焰 | **Devastor** | 战士 | 始终（击败上一只后解锁） |

### 2.5 宠物职业系统

🅰️ **A级**（官方帮助中心）

每只宠物拥有一个职业，影响宠物战斗能力：

| 职业 | 说明 |
|------|------|
| **战士 (Warrior)** | 近战型，偏向攻击和生命值 |
| **法师 (Mage)** | 魔法型，偏向特殊能力 |
| **侦察兵 (Scout)** | 远程/侦察型，偏向灵活 |

---

## 3. 宠物升级机制

### 3.1 核心规则

🅰️ **A级**（官方帮助中心）

| 参数 | 数值 |
|------|------|
| 最高等级 | **200级** |
| 初始等级上限 | **100级**（解锁所有栖息地后提升至200级） |
| 每日喂养次数 | 每只宠物最多 **3次/天** |
| 每次喂养效果 | 宠物等级 **+1** |
| 喂养消耗 | **1个对应元素水果** |
| 水果规则 | 宠物只吃**自己元素**对应的水果 |

### 3.2 水果获取渠道

🅰️ **A级**（官方帮助中心）

| 渠道 | 说明 |
|------|------|
| **PVP宠物对战胜利** | 获得对手防守元素的水果 |
| **PVE栖息地战斗胜利** | 获得对应元素水果 + 金币 + 经验值 |
| **幸运转盘 (Wheel of Fortune)** | 随机获得 |
| **远征奖励** | 可选择**水果篮**作为奖励 |
| **酒馆任务** | 有几率获得（**前提**：任务不保证掉落物品） |
| **活动奖励** | 特定活动提高水果掉率 |

---

## 4. 属性加成系统

### 4.1 收集加成（Pack Bonus）

🅰️ **A级**（官方帮助中心 "Advantages from Pets"）

每找到/收集1只宠物 → 角色对应属性 **+1%** 加成。

| 示例 | 加成 |
|------|------|
| 收集1只水系宠物 | 力量 +1% |
| 收集5只水系宠物 | 力量 +5% |
| 收集20只水系宠物（全部） | 力量 +20% |
| 5个元素全部20只 | **全属性各 +20%** |

### 4.2 等级加成

🅰️ **A级**（官方帮助中心 "Advantages from Pets"）

| 宠物等级 | 额外属性加成 |
|----------|-------------|
| 100级 | **+0.5%** |
| 150级 | **+0.75%** |
| 200级（最高） | **+1%** |

> 等级加成为渐进式（100→150→200），而非全有或全无。

### 4.3 栖息地战斗加成（Pack Strength Bonus）

🅱️ **B级**（sfporadnik.pl）

- 每击败/探索一只栖息地宠物 → 该栖息地所有宠物的**全属性提升 +5%**
- 此加成影响栖息地PVE战斗和PVP战斗中该元素宠物的战斗力
- 完成全部100次栖息地战斗后，获得额外金币和经验值奖励

### 4.4 最大理论加成

| 加成来源 | 最大值 |
|---------|--------|
| 单元素收集 | +20%（20只宠物 × 1%） |
| 单元素等级（200级） | +20%（20只宠物 × 1% 顶级加成） |
| 单元素总计 | +20%（收集）+ 20%（等级）= **约+40%** |
| 五元素全满 | **全属性各约 +40%** |

🅰️+🅱️ 级别（官方数据 + 社区验证）

---

## 5. 宠物战斗系统

### 5.1 PVP宠物对战

🅰️ **A级**（官方帮助中心 "Pet Fights"）

| 参数 | 规则 |
|------|------|
| 每日次数 | **5次**（每个栖息地各1次） |
| 对手 | 随机匹配其他玩家的**宠物包（Pack）** |
| 冷却 | 每次战斗后 **15分钟** |
| 跳过冷却 | 消耗蘑菇 |
| 每对手限制 | 每天只能攻击**同一对手1次** |

**PVP奖励**：

| 结果 | 奖励 |
|------|------|
| 胜利 | 宠物名人堂积分 + 对手防守元素的水果 |
| 失败 | 扣除名人堂积分，无水果 |

**防守栖息地轮换**（每日固定）：

```
水 → 火 → 土 → 光 → 暗 → 水（循环轮换）
```

🅱️ **B级**（sfporadnik.pl）

**进攻策略**：
- 进攻方可选任意尚未使用的栖息地
- 考虑因素：栖息地宠物总等级 + 元素克制关系
- 克制关系：水>火>土>光>暗>水

### 5.2 PVE栖息地战斗

🅰️ **A级**（官方帮助中心 "Pet Habitat Fights"）

| 参数 | 规则 |
|------|------|
| 免费次数 | 每 **60分钟** 1次 |
| 跳过等待 | 消耗蘑菇 |
| 战斗对象 | 同元素的**未知NPC宠物** |
| 宠物选择 | 已解锁多个同元素宠物时可选择出战宠物 |
| 胜利奖励 | 宠物被"探索" + XP + 金币 + 对应元素水果 |
| 额外效果 | 被探索宠物的蛋可在任务中找到（需满足条件） |

**战斗判定机制**：

🅰️+🅳 **A级+D级**（官方说明"考虑属性、等级、职业和元素克制"，但**未公开具体伤害公式**）

综合考虑以下因素：
- 宠物属性（受收集加成和栖息地加成影响）
- 宠物等级
- 宠物职业（战士/法师/侦察兵的相克关系）
- 元素克制关系

> ⚠️ **数据缺口**：宠物战斗的精确伤害公式在所有公开来源中均未找到。这是系统设计中需要自行定义的部分。

### 5.3 宠物名人堂排名

🅰️ **A级**（官方帮助中心）

- PVP胜利/失败影响排名积分
- 部分稀有宠物需要达到排名门槛才能解锁

---

## 6. 特殊宠物

### 6.1 Watnake（水系稀有宠物）

🅰️ **A级**（官方帮助中心 + sfporadnik.pl）

| 项目 | 详情 |
|------|------|
| 元素 | 水 (Water) |
| 职业 | 法师 (Mage) |
| 稀有度 | 稀有 (Rare) |
| 获取方式 | 在**魔法商店**中随机出现购买 |
| 前置条件 | 需先在栖息地中**击败Watnake**使其被"探索" |

### 6.2 排行榜稀有宠物

🅰️ **A级**（官方帮助中心完整列表）

| 宠物 | 元素 | 解锁条件 |
|------|------|---------|
| **Ninstar** | 暗 | 英雄榜前1000名 或 英雄荣誉50000+ |
| **Mesmerit** | 光 | 公会榜前100名 或 公会荣誉2500+ |
| **Canocle** | 土 | 要塞榜前100名 或 要塞荣誉2500+ |
| **Mermoid** | 水 | 宠物榜前100名 或 宠物荣誉4000+ |
| **Dragopyr** | 火 | 在**武器店**中购买 |

### 6.3 活动限定宠物

🅰️ **A级**（官方帮助中心完整列表）

| 宠物 | 元素 | 获取条件 |
|------|------|---------|
| **Pharamumm** | 暗 | 万圣节（10月）"疯狂蘑菇丰收"活动 |
| **Angrack** | 暗 | 13号星期五 |
| **Luchtablong** | 暗 | "非凡经验事件"活动 |
| **Finnettle** | 火 | 情人节（2月14日） |
| **Etrock** | 火 | 除夕/元旦（12月31日/1月1日） |
| **Forror** | 土 | 复活节活动 |
| **Nipprabs** | 土 | 圣灵降临节活动 |
| **Tricerawood** | 土 | 宝石矿等级达到20级以上 |
| **Unhere** | 水 | 光环达到50级以上后冲马桶 |
| **Blazingtongues** | 火 | 通关**单人恶魔传送门** |
| **Tritosting** | 水 | 通关**光明世界第22号地下城** |
| **Heraldon** | 光 | 通关**光明世界之塔** |
| **Devilsatt** | 暗 | 通关**第15暗影地下城第10层** |

---

## 7. 公会九头蛇（Guild Pet / Hydra）

### 7.1 解锁条件

🅰️ **A级**（官方帮助中心 "Guild Pet" + "Guild" 交叉验证）

| 条件 | 要求 |
|------|------|
| 公会会长等级 | **150级** |
| 会长宠物 | 至少1只宠物达到 **100级** |
| 公会成员数 | 至少 **10人** |
| 设置权限 | **仅限会长** |
| 可选宠物 | 任何已探索且喂至**100级以上**的宠物 |

### 7.2 战斗机制

🅰️ **A级**（官方帮助中心 "Guild Pet" + "Guild"）

**属性计算**：
- 取公会中主属性最高的 **25名成员** 的对应属性值
- 将这些值**相加后除以10**
- 主属性类型取决于所选公会宠物的元素对应属性

**等级计算**：
- 公会宠物战斗等级上限 = 25名最高主属性成员的**平均角色等级**
- **最高等级上限**：**600级**
- 每位成员需自行提升贡献等级（消耗金币或金币+蘑菇）

**战斗规则**：
- 每位公会成员每天可攻击九头蛇 **1次**
- 所有成员造成的伤害**累计相加**
- 若九头蛇**未被击败** → 失去一颗头，变弱

### 7.3 奖励机制

🅰️ **A级**（官方帮助中心 "Guild"）

| 结果 | 奖励 |
|------|------|
| **击败九头蛇** | 城市NPC「哥布林吟游诗人」每日任务XP获得 **+25%加成**（每击败一颗头 = +25%） |
| **连胜** | 次日九头蛇长出新头，变得更强；连胜越多加成越高 |
| **未击败** | 加成降低 |

### 7.4 重要说明

🅰️ **A级**（官方帮助中心）

- 会长更换公会宠物时，已购买贡献等级**保留**
- 更换公会时，贡献等级也**保留**

---

## 8. 联动关系

### 8.1 宠物 × 女巫系统

| 联动点 | 说明 |
|--------|------|
| 水果双重用途 | 水果既可喂养宠物（+1等级），也可酿造大型药水（10个→+25%属性） |
| 药水酿造前置 | 女巫药水酿造需"宠物系统已解锁" |
| 资源分配决策 | 后期宠物满级后，水果转为酿造药水的主要用途 |

### 8.2 宠物 × 其他系统

| 联动系统 | 说明 |
|---------|------|
| 冥界角斗士训练师 | 增加宠物暴击伤害，降低栖息地战斗难度 |
| 排行榜系统 | 多只稀有宠物需要排行榜排名解锁 |
| 宝石矿 | Tricerawood宠物需宝石矿20级 |
| 马桶系统 | Unhere宠物需光环50级 |
| 恶魔传送门 | Blazingtongues宠物需通关单人传送门 |

---

## 9. 数值曲线与进度

### 9.1 培养进度参考

🅱️ **B级**（number13.de 社区估算）

| 阶段 | 预计等级 | 说明 |
|------|----------|------|
| 首次获得宠物 | 75级 | 发现蛋篮，获得5只初始宠物 |
| 解锁全部栖息地 | 约100-150级 | 需击败全部100只NPC宠物 |
| 全部宠物升至100级 | 约200-300级 | 需大量水果（100只 × 100级 × 1水果 = 10,000水果） |
| 全部宠物升至200级 | 极高等级 | 需100只 × 100额外等级 = 10,000额外水果 |

### 9.2 水果消耗优化策略

🅱️ **B级**（number13.de "Ultimate Pet-Guide"）

- **不要将初始宠物练满再换**——尽早切换到更强的宠物可节省约50个水果/元素
- 以水系为例：鳄鱼约45级切换 → 章鱼约100级 → 最终Hydrospir
- 角斗士训练师等级越高，栖息地战斗越容易，水果消耗越少

---

## 10. 复刻实现指南

### 10.1 数据结构

```javascript
const PET_SYSTEM = {
  habitats: {
    water:   { element: 'water',   stat: 'strength',     fruit: 'plum',      petCount: 20 },
    light:   { element: 'light',   stat: 'dexterity',    fruit: 'lemon',     petCount: 20 },
    earth:   { element: 'earth',   stat: 'intelligence', fruit: 'apple',     petCount: 20 },
    shadow:  { element: 'shadow',  stat: 'constitution', fruit: 'blackberry', petCount: 20 },
    fire:    { element: 'fire',    stat: 'luck',         fruit: 'strawberry', petCount: 20 },
  },
  
  pets: [
    // { id, name, element, habitat, class:'warrior'|'mage'|'scout',
    //   rarity:'normal'|'rare'|'epic', level:0, maxLevel:200,
    //   explored:false, found:false,
    //   unlockCondition:{ type, params } }
  ],
  
  battles: {
    pvp: {
      dailyLimit: 5,           // 每日5次
      cooldownMinutes: 15,      // 冷却15分钟
      defenseRotation: ['water','fire','earth','light','shadow'],  // 防守轮换
      defenseIndex: 0,          // 当前防守索引
    },
    pve: {
      cooldownMinutes: 60,      // 60分钟冷却
      habitatProgress: { water: 0, light: 0, earth: 0, shadow: 0, fire: 0 },
    },
  },
  
  // 元素克制表
  elementAdvantage: {
    water: 'fire',    fire: 'earth',   earth: 'light',
    light: 'shadow',  shadow: 'water',
  },
};

// 属性加成计算
function calculatePetBonus(player) {
  const bonus = { strength: 0, dexterity: 0, intelligence: 0, constitution: 0, luck: 0 };
  
  for (const habitat of Object.values(PET_SYSTEM.habitats)) {
    const pets = player.pets.filter(p => p.element === habitat.element);
    
    // 收集加成：每只宠物 +1%
    bonus[habitat.stat] += pets.length * 0.01;
    
    // 等级加成：渐进式
    for (const pet of pets) {
      if (pet.level >= 200) bonus[habitat.stat] += 0.01;
      else if (pet.level >= 150) bonus[habitat.stat] += 0.0075;
      else if (pet.level >= 100) bonus[habitat.stat] += 0.005;
    }
  }
  
  return bonus;
}

// PVP战斗判定（简化版，实际公式未公开）
function resolvePetBattle(attacker, defender, attackerElement, defenderElement) {
  // 元素克制检查
  const advantage = PET_SYSTEM.elementAdvantage[attackerElement] === defenderElement;
  const disadvantage = PET_SYSTEM.elementAdvantage[defenderElement] === attackerElement;
  
  let attackerPower = calculatePetPower(attacker) * (advantage ? 1.3 : (disadvantage ? 0.7 : 1.0));
  let defenderPower = calculatePetPower(defender) * (disadvantage ? 1.3 : (advantage ? 0.7 : 1.0));
  
  // 加入随机因素
  attackerPower *= (0.9 + Math.random() * 0.2);
  defenderPower *= (0.9 + Math.random() * 0.2);
  
  return attackerPower >= defenderPower;  // true = 进攻方胜
}
```

### 10.2 复刻优先级

| 优先级 | 功能 | 说明 |
|--------|------|------|
| **P0** | 五大元素栖息地 | 5元素×20宠物，基础收集解锁 |
| **P0** | 水果喂养 | 1水果=+1等级，每日3次/只 |
| **P0** | 属性加成 | 收集+1%/只，等级100/150/200额外加成 |
| **P0** | PVE栖息地战斗 | 60分钟冷却，击败→探索下一只 |
| **P1** | PVP宠物对战 | 5次/天，15分钟冷却，元素克制 |
| **P1** | 水果系统 | 5种水果，多渠道获取 |
| **P1** | 宠物职业 | 战士/法师/侦察兵影响战斗 |
| **P2** | 稀有宠物 | 排行榜/活动/特殊条件解锁 |
| **P2** | 宠物名人堂 | PVP排名系统 |
| **P2** | 公会九头蛇 | 会长150级+宠物100级，全公会合作 |
| **P3** | 栖息地加成（+5%/只） | PVE/PVP宠物包全属性加成 |
| **P3** | 等级上限提升 | 100级→200级（需全部栖息地解锁） |

---

## 11. 数据缺口与不确定项

| 数据项 | 状态 | 说明 |
|--------|------|------|
| 宠物战斗精确伤害公式 | ❌ 未公开 | 官方仅说明考虑"属性、等级、职业和元素克制" |
| 宠物职业相克关系 | ❌ 未公开 | 战士/法师/侦察兵之间的克制关系未明确 |
| 宠物属性具体数值 | ⚠️ 未知 | 每只宠物的具体属性值未公开 |
| PVP匹配算法 | ❌ 未公开 | 如何选择对手的详细机制 |
| Watnake出现概率 | ❌ 未公开 | 魔法商店中的出现概率和价格 |
| 栖息地战斗概率 | ⚠️ 部分已知 | sfporadnik.pl提供各宠物的击败概率参考 |
| 等级加成插值方式 | 🅳 D级 | 100→150→200之间的加成是否线性插值 |

---

## References

1. [Pets — Shakes & Fidget Help Center](https://playa-games.helpshift.com/hc/en/4-shakes-fidget-1653988985/faq/189-pets-1664447861/?p=all)
2. [Pet Fights — Shakes & Fidget Help Center](https://playa-games.helpshift.com/hc/en/4-shakes-fidget-1653988985/faq/46-pet-fights/)
3. [Pet Habitat Fights — Shakes & Fidget Help Center](https://playa-games.helpshift.com/hc/en/4-shakes-fidget-1653988985/faq/47-pet-habitat-fights/)
4. [Advantages from Pets — Shakes & Fidget Help Center](https://playa-games.helpshift.com/hc/en/4-shakes-fidget-1653988985/faq/49-advantages-from-pets/)
5. [Where Can I Find Pets? — Shakes & Fidget Help Center](https://playa-games.helpshift.com/hc/en/4-shakes-fidget-1653988985/faq/50-where-can-i-find-pets/)
6. [Guild Pet — Shakes & Fidget Help Center](https://playa-games.helpshift.com/hc/en/4-shakes-fidget-1653988985/faq/101-guild-pet/)
7. [Guild — Shakes & Fidget Help Center](https://playa-games.helpshift.com/hc/en/4-shakes-fidget-1653988985/faq/91-guild/?p=web)
8. [Pets | sfgame guide (sfporadnik.pl)](https://en.sfporadnik.pl/pets.php)
9. [Shakes & Fidget: Ultimate Pet-Guide (number13.de)](https://en.number13.de/shakes-fidget-ultimate-pet-guide/)
10. [Shakes & Fidget: Bestmöglicher Pet-Guide (number13.de)](https://www.number13.de/shakes-fidget-pet-guide/)
11. [SFTools - Pet Simulator](https://sftools.mar21.eu/pets.html)
