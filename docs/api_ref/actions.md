# 统一游戏动作接口 (Game Actions)

所有游戏内的交互逻辑均通过此接口分发。

- **Endpoint**: `POST /api/action`
- **Auth**: [需要 Bearer Token](auth.md)
- **Content-Type**: `application/json`

## 请求格式 (Request)

```json
{
  "action": "ACTION_NAME",
  "payload": {
    "key": "value"
  }
}
```

---

## 支持的动作列表 (Supported Actions)

### 1. 任务系统 (Missions)

#### `START_MISSION` - 开始任务
- **Payload**:
  - `missionId` (string): 可选任务列表中的任务 ID。
- **说明**: 消耗干粮，进入任务状态。

#### `COMPLETE_MISSION` - 结算任务
- **Payload**: 无
- **说明**: 检查当前任务是否到达 `endTime`。若完成，发放奖励（铜钱、经验、概率装备）。

#### `SKIP_MISSION` - 立即完成任务
- **Payload**: 无
- **说明**: 消耗 1 枚通宝，无视倒计时立即完成当前任务并结算奖励。

---

### 2. 属性系统 (Attributes)

#### `UPGRADE_ATTRIBUTE` - 升级属性
- **Payload**:
  - `attribute` (string): `strength` | `intelligence` | `agility` | `constitution` | `luck`
- **说明**: 消耗铜钱升级基础属性。费用随属性等级指数增长。

---

### 3. 客栈系统 (Tavern)

#### `TAVERN_DRINK` - 买酒恢复精力
- **Payload**: 无
- **说明**: 消耗 1 枚通宝，恢复 20 点精力（干粮）。每日上限 10 次。

#### `GENERATE_MISSIONS` - 刷新可选任务
- **Payload**: 无
- **说明**: 若当前没有可选任务，则随机生成 3 个新任务。

---

### 4. 背包与装备 (Inventory)

#### `EQUIP_ITEM` - 穿戴装备
- **Payload**:
  - `slot` (string): 装备部位 (`head`, `body`, `weapon`, `offHand`, etc.)
  - `itemIndex` (number): 物品在 `inventory` 数组中的索引。
- **说明**: 将背包中的物品穿戴到指定部位。若该部位已有装备，则自动脱下放入背包。

#### `UNEQUIP_ITEM` - 脱下装备
- **Payload**:
  - `slot` (string): 装备部位。
- **说明**: 将指定部位的装备移回背包。

---

### 5. 黑市系统 (Black Market)

#### `BLACK_MARKET_REFRESH` - 刷新黑市
- **Payload**: 无
- **说明**: 消耗 1 枚通宝，随机生成 6 件新商品。

#### `BLACK_MARKET_BUY` - 购买商品
- **Payload**:
  - `itemIndex` (number): 商品在 `blackMarket.items` 数组中的索引。
- **说明**: 消耗铜钱购买指定商品，放入背包。

---

### 6. 竞技场系统 (Arena)

#### `ARENA_FIGHT` - 发起挑战
- **Payload**: 无
- **说明**: 随机匹配一名对手并进行战斗模拟。胜利可获得经验、声望和铜钱。
- **Response Data**: 返回 `playerWon`, `npcName`, `hp` 等战斗详情。

#### `ARENA_SKIP_COOLDOWN` - 跳过挑战冷却
- **Payload**: 无
- **说明**: 消耗 1 枚通宝，立即重置竞技场 5 分钟冷却时间。

---

### 7. 副本系统 (Dungeon)

#### `DUNGEON_FIGHT` - 挑战副本
- **Payload**: 无
- **说明**: 挑战当前章节的关卡 Boss。

---

### 8. 开发工具 (Debug)

#### `DEBUG_CHEAT` - 作弊指令
- **Payload**:
  - `preset` (string): `money` | `tokens` | `xp` | `food` | `default`
- **说明**: 仅在 `process.env.ALLOW_CHEATS` 开启时有效。快速获得资源。
