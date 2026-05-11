# 黑市与装备系统 设计规格书
Status: Draft (待审批)
Designer: Antigravity
Implementation Allowed: Yes

---

## 1. 系统概述与设计目标

### 1.1 系统定位
本系统是《大宋造反模拟器》的核心数值增长点，完全复刻 Shakes & Fidget (2011) 的商店与装备逻辑。
*   **黑市 (Black Market)**：玩家获取外部数值（装备）的主要渠道。
*   **题材包装**：将 S&F 的“武器店/魔法店”包装为充满大宋末年动荡气息的“兵器铺”与“鬼市/奇珍阁”。
*   **核心体验**：随等级滚动的装备更替、随机刷新的稀有品质诱惑、以及针对职业的主属性博弈。

### 1.2 核心原则
1.  **数值契合**：装备属性与玩家等级线性挂钩，确保旧装备随等级提升自然淘汰。
2.  **题材一致**：文案遵循《文案写作规范》，采用古风黑色幽默（如：描述一把破损的朴刀为“上任主人已在法场物理退役”）。
3.  **单向流动**：装备通过购买或副本获得，通过穿戴提升战力，通过出售或后期拆解回收。

---

## 2. 题材包装对照表 (Reskin Mapping)

| S&F 原项 | 大宋包装名称 | 描述/备注 |
| :--- | :--- | :--- |
| **Mushroom** | **令牌 (Tokens)** | 朝廷颁发的某种“特权证”，在黑市是硬通货。 |
| **Gold** | **铜钱 (Copper)** | 基础流通货币。 |
| **Weapon Shop** | **黑市·兵器铺** | 负责出售：武器、头盔、胸甲、护手、靴子。 |
| **Magic Shop** | **黑市·奇珍阁** | 负责出售：项链、腰带、戒指、饰品、护符。 |
| **Attributes** | **五维属性** | 力量 (STR)、敏捷 (AGI)、智力 (INT)、体质 (CON)、幸运 (LCK)。 |
| **Slot: Off-Hand**| **副手/盾牌** | 猛将用盾，谋士用书/画卷，游侠/刺客用箭袋/副刃。 |

---

## 3. 装备属性生成规格 (Numerical Spec)

### 3.1 属性缩放公式
参考 `SF_GDD_04` 报告及 `core_mechanics_and_formulas.md`：
*   **基础属性值**：`BaseAttr = playerLevel * SlotFactor * QualityMultiplier * (0.85 + random(0, 0.3))`
*   **护甲值 (Armor)**：`Armor = playerLevel * ClassArmorCap / 10` (分配到各护甲部位)。
*   **武器伤害**：
    *   `MinDmg = floor(playerLevel * WeaponFactor * 0.7 * QualityMultiplier)`
    *   `MaxDmg = floor(playerLevel * WeaponFactor * 1.3 * QualityMultiplier)`

### 3.2 品质与稀有度 (Rarity)
对应 `player_save_schema.md` 中的 `rarity` 字段：

| 级别 | 名称 | 对应品质 | 属性加成倍率 | 出现概率 (商店) |
| :--- | :--- | :--- | :--- | :--- |
| **0** | **普通 (Normal)** | 白色 | 1.0 | 90% |
| **1** | **优秀 (Excellent)**| 绿色 | 1.15 | 8% |
| **2** | **史诗 (Epic)** | 紫色 | 1.35 | 2% (50级后解锁) |
| **3** | **传说 (Legendary)**| 橙色 | 1.55 | 仅限特定活动或副本 |
| **4** | **神器 (Artifact)** | 红色 | 2.0 | 副本终极产出 |

### 3.3 槽位系数 (SlotFactor)
*   **主武器**：1.2
*   **衣服 (Body)**：1.0
*   **副手/盾牌**：0.8
*   **首饰/其他**：0.5

---

## 4. 黑市机制 (Shop Mechanics)

### 4.1 刷新逻辑
*   **自动刷新**：每小时整点自动刷新一次（由后端 Cron 或玩家首次登录触发）。
*   **手动刷新**：花费 **1 令牌 (Token)** 立即刷新所有商品。
*   **等级匹配**：刷出的装备等级严格等于玩家当前等级（`playerState.level`）。

### 4.2 商品构成
每个黑市分支（兵器铺/奇珍阁）默认显示 **6 个** 货架位。
*   **兵器铺**：确保至少 1 件本职业武器。
*   **奇珍阁**：确保至少 1 本减CD书籍（对应 S&F 经验书/金币书，如有）。

### 4.3 价格计算
*   **购买价格 (Copper)**：`floor(playerLevel^1.5 * QualityFactor * 10)`。
*   **出售价格 (Copper)**：购买价格的 **25%**。

---

## 5. 技术兼容性说明（已实现状态）

> [!NOTE]
> 本节已于 2026-05-04 随后端实现完成后更新，反映**实际代码**状态。

### 5.1 数据结构对接

`BlackMarketState`（`server/src/types/gameState.ts`）实际结构：
```typescript
{
  status: 'UNINITIALIZED' | 'DISABLED' | 'ACTIVE';
  items: EquipmentItem[];   // 兵器铺(6件) + 奇珍阁(6件) = 共 12 件
  lastRefreshAt: number | null;
}
```

> [!IMPORTANT]
> **与草案的已决策差异**：最终实现使用单一 `items[]` 而非双数组。前端按如下逻辑过滤：
> - **兵器铺**：`items.filter(i => ['weapon','head','body','hands','feet','offHand'].includes(i.slot))`
> - **奇珍阁**：`items.filter(i => ['neck','belt','ring','trinket','offHand'].includes(i.slot))`

### 5.2 API Action 名称

| 功能 | Action 名称 | Payload |
| :--- | :--- | :--- |
| 刷新商品（自动/手动） | `REFRESH_BLACKMARKET` | `{ force: boolean }` |
| 购买并穿戴 | `BUY_AND_EQUIP_ITEM` | `{ itemId: string }` |
| 购买到背包 | `BUY_ITEM` | `{ itemId: string }` |
| 出售物品（支持身上或背包）| `SELL_ITEM` | `{ itemId: string }` |

> [!WARNING]
> `BLACK_MARKET_REFRESH` 和 `BLACK_MARKET_BUY` 为旧废弃名称，**Client Agent 应使用新名称**。

### 5.3 刷新逻辑细节

*   `force: false`：仅在 `UNINITIALIZED` 或冷却到期（1 小时）时触发，否则原样返回不报错。
*   `force: true`：无视冷却，消耗 1 令牌立即刷新。令牌不足返回 `NOT_ENOUGH_TOKENS`。
*   响应含 `nextAutoRefreshMs`（毫秒），前端直接用于倒计时显示。

### 5.4 属性映射
*   `strength` → 力量
*   `agility` → 敏捷
*   `intelligence` → 智力
*   `constitution` → 体质
*   `luck` → 幸运

### 5.5 图标资产对接（配合 `Asset_Naming_Convention.md` § 3.1）

后端 `id` 末四位即为图标种子，前端计算逻辑：
```javascript
// 普通/优秀 (rarity 0-1)
const index = (parseInt(item.id.slice(-4), 16) % VARIANT_COUNT) + 1;
const iconPath = `/assets/items/item_${item.slot}_${String(index).padStart(2, '0')}.png`;

// 史诗+ (rarity 2+)
const iconPath = `/assets/items/item_${item.id}.png`;
```

---

## 6. 文案示例 (Writing Samples)

### 6.1 武器：【朴刀】
*   **普通品质**：这把刀缺了三个口子，依然能让你在街头斗殴中占据上风。
*   **史诗品质**：【禁军校尉之恨】曾有位校尉用它斩下过三个逃兵的首级，至今刀刃仍透着寒气。

### 6.2 衣服：【皂罗袍】
*   **普通品质**：这种衣服在汴京城的当铺里论斤卖。
*   **传说品质**：【逆党血染的残袍】原本是白色的，但在那一夜后，再也洗不干净了。

---
*Last Updated: 2026-05-04*
