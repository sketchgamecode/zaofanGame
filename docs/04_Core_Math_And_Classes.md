# 核心数值与职业算法白皮书 (v0.4 - 全球对齐版)
**状态:** 最终基准文档
**设计宗旨:** 确保底层数值与 Shakes & Fidget (S&F) 完全一致，实现“原汁原味”的放置体验，同时通过大宋题材进行文化包装。

---

## 1. 基础属性与资源 (Core Stats)
* **武力 (Strength):** `CLASS_A` 主属性。增加武力伤害；提升对物理职业的防御。
* **身法 (Dexterity):** `CLASS_B` 与 `CLASS_D` 主属性。增加远程/双持伤害；提升对敏捷职业的防御。
* **智谋 (Intelligence):** `CLASS_C` 主属性。增加法术伤害；提升对法系职业的防御。
* **体质 (Constitution):** 全局血量属性。
* **福缘 (Luck):** 全局暴击属性，上限 50%。

---

## 2. 职业体系与特性 (Class Mechanics)

| Class ID | 建议名称 | 主属性 | 血量乘数 | 护甲上限 | **核心战斗机制** |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **`CLASS_A`** | 猛将 | 武力 | 5 | 50% | **【格挡】**: 副手装备盾牌时，有 25% 概率完全免疫物理伤害。 |
| **`CLASS_B`** | 游侠 | 身法 | 4 | 25% | **【闪避】**: 受到物理攻击时，有 50% 概率完全闪避。 |
| **`CLASS_C`** | 谋士 | 智谋 | 2 | 10% | **【必中破防】**: 攻击不可被闪避/格挡，且计算时忽略目标护甲。 |
| **`CLASS_D`** | 刺客 | 身法 | 4 | 25% | **【双持连击】**: 每回合必定攻击两次。单次攻击伤害系数 0.625。 |

---

## 3. 十槽位装备系统 (Equipment System)

为对齐标准，系统必须支持以下 10 个独立装备位。除武器外，其余部位主要提供基础护甲与随机属性。

| 槽位 ID | 类型 | 说明 |
| :--- | :--- | :--- |
| `head` | 头部 | |
| `chest` | 身体 | |
| `hands` | 手部 | |
| `feet` | 脚部 | |
| `neck` | 项链 | |
| `belt` | 腰带 | |
| `ring` | 戒指 | |
| `trinket` | 饰品 | |
| `mainHand` | 主手 | 所有职业必装武器。 |
| `offHand` | 副手 | **猛将**: 仅限盾牌；**刺客**: 仅限武器；**其余**: 不可装或纯属性件。 |

---

## 4. 核心战斗引擎公式 (Combat Formulas)

### 4.1 生命值 (Max HP)
`MaxHP = Constitution * Level * ClassMultiplier`

### 4.2 伤害输出 (Damage Calculation)
* **通用公式 (A, B, C 职业):**
  `FinalDamage = WeaponDamage * (1 + (MainAttribute / 10))`
* **刺客双持公式 (CLASS_D):**
  刺客每回合执行两次独立的伤害判定流程。
  `HitDamage = WeaponDamage(CurrentHand) * 0.625 * (1 + (Dexterity / 10))`
  *(注：第一击取主手武器，第二击取副手武器。若副手空置，第二击伤害为 0)*

### 4.3 暴击率 (Critical Chance)
`CritChance = Math.min(50%, (Luck * 5) / (EnemyLevel * 2))`

### 4.4 护甲减伤 (Damage Reduction)
`Reduction% = Math.min(ClassArmorCap, (TotalArmor / EnemyLevel) * 100%)`

---

## 5. 经济平衡与升级 (Economy)

### 5.1 属性升级消耗 (Upgrade Cost)
随属性值增高呈指数级增长，作为主要的金币回收路径。
`Cost = Math.floor(10 * Math.pow(1.1, CurrentAttributeValue))`

---

## 6. 开发执行规范 (Implementation Rules)

1. **逻辑解耦**: 所有公式必须收口于 `src/core/mathCore.ts`。
2. **战斗状态机**: 战斗循环必须能处理“两段式攻击”（刺客）和“特殊防御判定”（格挡/闪避）。
3. **装备校验**: 在更换装备（Equip Action）时，必须根据 `playerClass` 校验 `offHand` 槽位的合法性。
4. **UI 数据绑定**: 角色面板显示的“攻击力”应根据当前职业特性显示区间。刺客应显示主副手两行伤害数值。