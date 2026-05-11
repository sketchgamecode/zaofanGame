# 角色创建与成长系统设计规格书 (Character Growth System Design)
Status: Draft (待审批)
Designer: Antigravity (Design Authority)
Implementation Allowed: Yes

---

## 1. 题材包装 (Great Song Reskin)

为了符合《大宋造反模拟器》的黑色幽默武侠题材，我们将 S&F 的种族与职业进行如下重新包装。所有数值属性（初始加成、HP倍率、护甲上限）**必须 100% 对应 S&F 2011 版**。

### 1.1 种族对照表 (Races)

| 原型 | 大宋包装名称 | 初始属性修正 (STR / DEX / INT / CON / LCK) |
| :--- | :--- | :--- |
| Human | **中原人士 (Central Plains)** | 0 / 0 / 0 / 0 / 0 |
| Elf | **蓬莱仙客 (Penglai Immortal)** | -1 / +2 / 0 / -1 / 0 |
| Dwarf | **漠北蛮族 (Northern Barbarian)** | 0 / -2 / -1 / +2 / +1 |
| Gnome | **苗岭童子 (Miaoling Child)** | -2 / +3 / -1 / -1 / +1 |
| Orc | **契丹豪勇 (Khitan Brave)** | +1 / 0 / -1 / 0 / 0 |
| Dark Elf | **西夏一品堂 (Western Xia)** | -2 / +2 / +1 / -1 / 0 |
| Goblin | **岭南流寇 (Lingnan Bandit)** | -2 / +2 / 0 / -1 / +1 |
| Demon | **摩尼教徒 (Manichaean)** | +3 / -1 / 0 / +1 / -3 |

### 1.2 基础职业对照表 (Classes - Basic)

| 原型 | 大宋包装名称 | 主属性 | HP倍率 | 武器系数 | 护甲上限 | 特殊能力 |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| Warrior | **猛将 (Warrior)** | 力量 | 5 | 2.0 | 50% | 盾牌格挡 25% |
| Scout | **游侠 (Scout)** | 敏捷 | 4 | 2.5 | 25% | 闪避 50% |
| Mage | **谋士 (Mage)** | 智力 | 2 | 4.5 | 10% | 攻击绕过减伤且必中 |
| Assassin | **杀手 (Assassin)** | 敏捷 | 4 | 2.0 | 25% | 双持打击（每回合出手两次） |
| Berserker | **绿林好汉 (Berserker)** | 力量 | 4 | 2.0 | 25% | 连环快攻（50% 概率连续攻击） |

### 1.2.1 武器伤害系数 (Weapon Damage Factors)
由于各职业主属性增长速度不同，基础武器伤害需乘以以下系数以平衡战力：
*   **猛将 (Warrior)**: 2.0
*   **游侠 (Scout)**: 2.5
*   **杀手 (Assassin)**: 2.0 (单次，总计 4.0 但受 0.625 惩罚)
*   **谋士 (Mage)**: 4.5
*   **绿林好汉 (Berserker)**: 2.0

### 1.3 职业战斗特性 (Class Combat Traits)

为了在创建角色时提供明确的策略差异，以下是基础三职业的核心战斗机制：

*   **猛将 (Warrior)**：
    *   **生存力**：极高的 HP 倍率 (x5) 与重甲上限 (50%)。
    *   **特殊能力**：自带 **25% 格挡率**。格挡成功时完全免疫该次物理伤害（对谋士无效）。
*   **游侠 (Scout)**：
    *   **生存力**：中等 HP 倍率 (x4) 与轻甲上限 (25%)。
    *   **特殊能力**：自带 **50% 闪避率**。闪避成功时完全免疫该次物理伤害（对谋士无效）。
*   **谋士 (Mage)**：
    *   **生存力**：极低的 HP 倍率 (x2) 与极低的布甲上限 (10%)。
    *   **特殊能力**：**无视防御 & 必中**。其攻击完全绕过目标的护甲减伤，且不可被格挡或闪避。
*   **杀手 (Assassin)**：
    *   **生存力**：中等 HP 倍率 (x4) 与轻甲上限 (25%)。
    *   **特殊能力**：**双持连击**。由于双手各持一把短兵（需占用副手槽），杀手每回合固定进行两次攻击，单次伤害倍率为 0.625x（总和 1.25x）。
*   **绿林好汉 (Berserker)**：
    *   **生存力**：中等 HP 倍率 (x4) 但**护甲减半**。由于性格狂热，其护甲实际减伤减半（最大 25%）。
    *   **特殊能力**：**嗜血连击**。每次攻击后有 50% 概率立即发起下一次追加攻击，运气好时可形成疯狂的连续打击。

*(注：其他 8 个高级职业将在后续迭代中补齐名称包装，当前开发优先确保上述 3 个基础职业的逻辑闭环)*

---

## 2. 核心数学公式 (The Formulas)

### 2.1 最大生命值 (Max HP)
$$MaxHP = Constitution \times ClassMultiplier \times (Level + 1)$$
*注：这里的 Constitution 是包含装备加成后的总属性。*

### 2.2 基础伤害加成 (Damage Bonus & Mitigation)
攻击方的伤害受属性加成因子 $AttrFactor$ 影响：
$$AttrFactor = 1 + \frac{\max(\frac{OwnMainStat}{2}, OwnMainStat - \frac{EnemyMainStat}{2})}{10}$$

*   **设计意义**：
    *   **主属性输出**：自身主属性越高，伤害越高。
    *   **副属性防御**：若玩家（如猛将）提升了副属性（如智力），虽然不加攻，但能有效抵消敌方（如谋士）的部分属性加成，从而**减免受到的伤害**。这使得“全属性培养”在后期具有极高的战略价值。
$$Cost = Level \times (0.2 + n \times 0.05)$$
*注：$n$ 是指通过金币/铜钱**累计购买**的该属性点数。*

### 2.3 护甲减伤 (Armor Reduction)
$$ArmorReduction\% = \min(ClassMaxReduction, \frac{ArmorValue}{AttackerLevel})$$
*注：谋士在计算伤害时此百分比视为 0。*

### 2.4 暴击率 (Crit Chance)
$$CritChance = \min(50\%, \frac{Luck \times 2.5}{EnemyLevel \times 100})$$

---

## 3. 角色创建流程 (Creation Flow)

基于对 S&F 截图的分析，创建过程分为两步：**职业选择** 与 **外观/种族/命名**。

1.  **判定点**：当玩家调用 `GET /api/save/` 时，若存档不存在，后端创建一个 `save.player.status: "PENDING_CREATION"` 的空存档。
2.  **创建动作**：玩家通过 `CREATE_CHARACTER` 接口提交选择。
    *   **Payload**:
        ```typescript
        {
          nickname: string;   // 2-12 字符，需进行后端唯一性/敏感词校验
          classId: string;    // 'warrior' | 'scout' | 'mage' | ...
          raceId: string;     // 'central_plains' | 'khitan' | ...
          avatarId: string;   // 选中的头像文件名 (如 "avatar_placeholder_003")
        }
        ```
3.  **头像系统 (Portrait System)**：
    *   目前不实现复杂的 Avatar 拼装系统。
    *   前端提供 `clients/manual/public/assets/figure/portrait/` 目录下的 64 张预设头像供玩家选择。
    *   头像寻址格式：`avatar_placeholder_{000-063}`。

补充说明：

1. 当前服务端正式支持的基础职业为 `CLASS_A ~ CLASS_E`，即 5 个职业。
2. “11 职业”是题材包装与后续扩展目标，不是当前版本的实际实现范围。
3. 创建流前端判定必须读取 `save.player.status`，而不是顶层 `status`。

4.  **初始化逻辑**：
    *   根据种族应用初始属性偏移。
    *   初始金钱、经验设为 0。
    *   `status` 转为 `ACTIVE`。

---

## 4. 给 Server Agent 的实现指令

1.  **扩展 Schema**：
    *   在 `PlayerState` 中新增 `raceId` 和 `avatarId` 字段。
    *   在 `AttributeState` 中新增 `bought: { strength: number, ... }` 字段，专门记录玩家手动购买的点数。
2.  **实现 `CREATE_CHARACTER`**：确保只能在 `PENDING_CREATION` 状态下调用一次。校验昵称长度和唯一性。
3.  **重构 `UPGRADE_ATTRIBUTE`**：
    *   计算成本时读取 `bought[attr]`，并使用对标 S&F 的阶梯公式。
    *   升级成功后，同时增加 `base[attr]` 和 `bought[attr]`。
4.  **更新 TDD**：完成代码实现后，请务必更新 `server/tdd/` 下的 `player_save_schema.md`、`api_master_list.md` 和 `core_mechanics_and_formulas.md`。

---
*Last Updated: 2026-05-10*
