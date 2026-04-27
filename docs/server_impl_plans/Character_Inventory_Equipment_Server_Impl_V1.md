# Character Inventory Equipment Server Impl V1

本文档定义 v0.2 Character + Inventory + Equipment Loop 的服务端文件级实施清单。

范围确认：

必须做：
1. `PLAYER_GET_INFO`
2. `EQUIP_ITEM`
3. `UNEQUIP_ITEM`
4. `UPGRADE_ATTRIBUTE`
5. 共享 `buildPlayerCombatSnapshot / combatPreview builder`
6. `CharacterInfoView` 统一响应
7. 角色 / 装备 / 属性 smoke
8. Tavern 回归 smoke

明确不做：
1. `SELL_ITEM`
2. 背包满包严格拦截
3. 装备锁定 / 收藏
4. 装备强化 / 洗练
5. 复杂战力算法
6. 修改 Tavern 已稳定协议

必须遵守：
1. 不改 `TAVERN_GET_INFO / TAVERN_DRINK / START_MISSION / COMPLETE_MISSION / SKIP_MISSION` 的请求/响应契约。
2. `EQUIP_ITEM` 只能从 `inventory.items` 里按 `itemId` 找装备，不能穿已装备 item。
3. `EQUIP_ITEM` 自动交换装备时，必须保证物品总数守恒，不能复制装备，不能吞装备。
4. `UNEQUIP_ITEM` 把装备移回 `inventory.items`，并清空对应 `slot`。
5. `UPGRADE_ATTRIBUTE` 只修改基础属性 `state.attributes`，不修改装备，不持久化 total attributes。
6. `total attributes`、`combatPreview`、`combatRating` 都是 view 计算结果，不作为新持久字段。
7. 任务开始后，即使玩家换装备或升级属性，当前 `activeMission.playerCombatSnapshot` 不变，只影响未来任务。
8. `resourceService` 需要支持 `NOT_ENOUGH_COPPER`，不能再用 `INVALID_GAME_STATE` 表示铜钱不足。
9. `CharacterInfoView.inventory.count` 必须等于 `inventory.items.length`。
10. v0.2 中 `inventory.capacity` 只做展示，不做严格满包拦截；`INVENTORY_FULL` 延后。

---

## 一、要新增的文件

### 1. `server/src/config/characterRules.ts`
职责：
- 承载角色 / 属性升级相关数值规则
- 不放 Tavern 规则
- 不放装备掉落规则

核心导出建议：
- `CHARACTER_RULES`
- `getAttributeUpgradeCost(attributeValue: number): number`

建议内容：
- `attributeUpgradeBaseCost = 10`
- `attributeUpgradeStepCost = 5`
- 可选：
  - `combatRatingWeights`
  - `defaultInventoryCapacity` 如果未来想从工厂配置读取

---

### 2. `server/src/engine/character.ts`
职责：
- 提供 `PLAYER_GET_INFO`
- 提供 `CharacterInfoView` builder
- 作为角色页、背包页、装备页的统一服务入口
- 不处理 Tavern 状态
- 不处理任务结算

核心导出建议：
- `getPlayerInfo(ctx, payload)`
- `buildCharacterInfoView(state, now)`

---

### 3. `server/src/engine/characterCombat.ts`
建议新增，优先于继续塞进 `mathCore.ts`。

职责：
- 承载共享角色战斗快照与展示层战斗预览 builder
- 让 `missions.ts` 与 `character.ts` 共用同一套角色战斗构造逻辑

核心导出建议：
- `buildPlayerCombatSnapshot(state)`
- `buildCombatPreview(state)`

如果不新建这个文件，也可以放进 `mathCore.ts`，但建议拆开，避免 `mathCore.ts` 继续膨胀。

---

## 二、要修改的文件

### 1. `server/src/types/action.ts`
修改内容：
- 新增 `PLAYER_GET_INFO` action name
- 保持现有 Tavern action 不变
- 不新增 `SELL_ITEM`

建议新增：
```ts
| 'PLAYER_GET_INFO'
```

---

### 2. `server/src/types/gameState.ts`
修改原则：
- 不改主状态层级
- 不新增 total attributes / combatPreview / combatRating 持久字段
- 如有必要，只补 view 类型和 payload 类型辅助定义

建议新增类型：
- `CharacterInfoView`
- `CombatPreviewView`
- `UpgradeCostsView`
- `EquipItemPayload`
- `UnequipItemPayload`
- `UpgradeAttributePayload`

不建议修改：
- `GameState.inventory`
- `GameState.equipment`
- `GameState.attributes`
- `ActiveMission`
- `TavernState`

---

### 3. `server/src/engine/actionDispatcher.ts`
修改内容：
- 从 disabled action 中移除：
  - `PLAYER_GET_INFO`
  - `EQUIP_ITEM`
  - `UNEQUIP_ITEM`
  - `UPGRADE_ATTRIBUTE`
- 注册正式 handler

建议接入：
- `PLAYER_GET_INFO -> getPlayerInfo`
- `EQUIP_ITEM -> equipItem`
- `UNEQUIP_ITEM -> unequipItem`
- `UPGRADE_ATTRIBUTE -> upgradeAttribute`

保留 disabled：
- `SELL_ITEM`
- 其他非本阶段系统

---

### 4. `server/src/engine/inventory.ts`
当前是 disabled stub，需要改为正式实现。

新增职责：
- `equipItem`
- `unequipItem`

要求：
- `EQUIP_ITEM` 只按 `itemId` 从 `inventory.items` 查找
- 自动交换时保证总物品数守恒
- `UNEQUIP_ITEM` 按 `slot` 卸下回包

核心导出建议：
- `equipItem(ctx, payload)`
- `unequipItem(ctx, payload)`

---

### 5. `server/src/engine/attributes.ts`
当前是 disabled stub，需要改为正式实现。

新增职责：
- `upgradeAttribute`

要求：
- 只改 `state.attributes`
- 只扣 `copper`
- 不改 `equipment`
- 不持久化 `total attributes`

核心导出建议：
- `upgradeAttribute(ctx, payload)`

---

### 6. `server/src/engine/mathCore.ts`
修改内容：
- 保留现有：
  - `getTotalAttributes`
  - `buildPlayerBattleSide`
  - `serverSimulateBattle`
- 如不新建 `characterCombat.ts`，则这里新增：
  - `buildPlayerCombatSnapshot`
  - `buildCombatPreview`

注意：
- 不改现有 Tavern 战斗结算接口
- 不改 battle seed / deterministic 逻辑

---

### 7. `server/src/engine/missions.ts`
修改原则：
- 只做最小改动
- 不改 Tavern 请求/响应契约
- 不改任务生命周期规则

需要改的点：
- 当前私有 `buildPlayerCombatSnapshot` 抽出复用
- `START_MISSION` 改为调用共享 snapshot builder
- 验证：
  - 任务开始后换装 / 升级属性不会影响 `activeMission.playerCombatSnapshot`

---

### 8. `server/src/engine/resourceService.ts`
修改内容：
- 增强资源扣除错误码
- 对 `copper` 不足返回 `NOT_ENOUGH_COPPER`

建议做法：
- 保留统一 `spendResource`
- 但允许调用方指定不足时的错误码
或
- 专门新增 `spendCopper`

建议导出：
- `spendResource(state, kind, amount, errorCode?)`

---

### 9. `server/src/engine/errors.ts`
修改内容：
- 新增 v0.2 所需错误码

至少新增：
- `ITEM_NOT_FOUND`
- `INVALID_EQUIPMENT_SLOT`
- `EQUIP_SLOT_MISMATCH`
- `EMPTY_EQUIPMENT_SLOT`
- `INVALID_ATTRIBUTE_KEY`
- `NOT_ENOUGH_COPPER`

不需要新增：
- `INVENTORY_FULL`
- `ITEM_NOT_SELLABLE`

---

### 10. `server/src/scripts/smokeCore.ts`
修改内容：
- 扩展 smoke 覆盖 v0.2 角色/装备/属性闭环
- 同时确保 Tavern 现有 smoke 全部继续通过

必须新增的 smoke：
- `PLAYER_GET_INFO`
- `EQUIP_ITEM`
- `UNEQUIP_ITEM`
- `UPGRADE_ATTRIBUTE`
- 任务开始后换装 / 升级不影响当前 `activeMission.playerCombatSnapshot`
- Tavern 全回归

---

## 三、每个 action 的精确定义

### PLAYER_GET_INFO

请求：
```json
{
  "action": "PLAYER_GET_INFO",
  "payload": {}
}
```

payload：
- 空对象
- 当前阶段不需要分页、不需要筛选参数

成功响应：
- `CharacterInfoView`

是否修改状态：
- 否

说明：
- 只读 action
- 不应生成任务
- 不应修改日常计数
- 不应修改背包或属性

---

### EQUIP_ITEM

请求：
```json
{
  "action": "EQUIP_ITEM",
  "payload": {
    "itemId": "eq_xxx"
  }
}
```

处理规则：
1. 只能从 `inventory.items` 中按 `itemId` 查找
2. 找不到则报 `ITEM_NOT_FOUND`
3. 取出 item 后读取 `item.slot`
4. 如果目标槽位为空：
   - 从 `inventory.items` 移除该 item
   - 放入 `equipment.equipped[item.slot]`
5. 如果目标槽位已有装备：
   - 从 `inventory.items` 移除新 item
   - 旧装备放回 `inventory.items`
   - 新装备放入对应槽位
6. 整个过程中必须保证：
   - 物品总数守恒
   - 不复制
   - 不吞物品

成功响应：
- `CharacterInfoView`

错误码：
- `ITEM_NOT_FOUND`
- `EQUIP_SLOT_MISMATCH`
- `INVALID_EQUIPMENT_SLOT`

说明：
- `EQUIP_SLOT_MISMATCH` 理论上用于防御异常数据，例如 payload 将来带 slot 且与 item.slot 不一致；如果 v0.2 payload 只收 `itemId`，该错误码可先保留供内部断言使用
- 不允许装备已经装备中的 item，因为入口只能从 `inventory.items` 查找

---

### UNEQUIP_ITEM

请求：
```json
{
  "action": "UNEQUIP_ITEM",
  "payload": {
    "slot": "weapon"
  }
}
```

处理规则：
1. 校验 `slot` 是否为合法 `EquipmentSlot`
2. 若非法，报 `INVALID_EQUIPMENT_SLOT`
3. 若对应槽位为空，报 `EMPTY_EQUIPMENT_SLOT`
4. 否则：
   - 取出该装备
   - push 回 `inventory.items`
   - 槽位置空

成功响应：
- `CharacterInfoView`

错误码：
- `INVALID_EQUIPMENT_SLOT`
- `EMPTY_EQUIPMENT_SLOT`

说明：
- v0.2 不做 `INVENTORY_FULL`
- 因为容量只展示，不严格拦截

---

### UPGRADE_ATTRIBUTE

请求：
```json
{
  "action": "UPGRADE_ATTRIBUTE",
  "payload": {
    "attribute": "strength"
  }
}
```

允许的 attribute：
- `strength`
- `intelligence`
- `agility`
- `constitution`
- `luck`

处理规则：
1. 校验 attribute key
2. 非法则报 `INVALID_ATTRIBUTE_KEY`
3. 读取基础属性当前值 `state.attributes[attribute]`
4. 计算成本：

```ts
costCopper = 10 + currentBaseAttributeValue * 5
```

5. 通过 `resourceService` 扣 `copper`
6. `state.attributes[attribute] += 1`
7. 不改 `equipment`
8. 不持久化 `total attributes`

成功响应：
- `CharacterInfoView`

错误码：
- `INVALID_ATTRIBUTE_KEY`
- `NOT_ENOUGH_COPPER`

说明：
- 当前阶段只升 1 点
- 不支持批量升级
- 不支持 free respec

---

## 四、CharacterInfoView 完整 TypeScript 结构

```ts
type CharacterInfoView = {
  player: {
    level: number;
    exp: number;
    classId: 'CLASS_A' | 'CLASS_B' | 'CLASS_C' | 'CLASS_D';
    displayName?: string;
  };
  resources: {
    copper: number;
    tokens: number;
    hourglasses: number;
    prestige: number;
  };
  attributes: {
    base: {
      strength: number;
      intelligence: number;
      agility: number;
      constitution: number;
      luck: number;
    };
    total: {
      strength: number;
      intelligence: number;
      agility: number;
      constitution: number;
      luck: number;
    };
    upgradeCosts: {
      strength: number;
      intelligence: number;
      agility: number;
      constitution: number;
      luck: number;
    };
  };
  combatPreview: {
    hp: number;
    armor: number;
    damageMin: number;
    damageMax: number;
    critChanceBp: number;
    dodgeChanceBp?: number;
    blockChanceBp?: number;
    itemPowerTotal: number;
    combatRating: number;
  };
  equipment: {
    equipped: {
      head: EquipmentItem | null;
      body: EquipmentItem | null;
      hands: EquipmentItem | null;
      feet: EquipmentItem | null;
      neck: EquipmentItem | null;
      belt: EquipmentItem | null;
      ring: EquipmentItem | null;
      trinket: EquipmentItem | null;
      weapon: EquipmentItem | null;
      offHand: EquipmentItem | null;
    };
  };
  inventory: {
    capacity?: number;
    count: number;
    items: EquipmentItem[];
  };
};
```

要求：
- `inventory.count === inventory.items.length`
- `attributes.base` 来自持久化状态
- `attributes.total` 来自 `base + equipped bonus`
- `combatPreview` 完全由 view 计算
- `combatRating` 也是 view 计算，不持久化

---

## 五、错误码

至少包括：

- `ITEM_NOT_FOUND`
- `INVALID_EQUIPMENT_SLOT`
- `EQUIP_SLOT_MISMATCH`
- `EMPTY_EQUIPMENT_SLOT`
- `INVALID_ATTRIBUTE_KEY`
- `NOT_ENOUGH_COPPER`

延后，不做：
- `INVENTORY_FULL`
- `ITEM_NOT_SELLABLE`

已有 Tavern 错误码保持不变，不改语义。

---

## 六、smoke 测试清单

必须覆盖：

### 1. PLAYER_GET_INFO 完整 view
断言：
- `player`
- `resources`
- `attributes.base`
- `attributes.total`
- `attributes.upgradeCosts`
- `combatPreview`
- `equipment.equipped`
- `inventory.capacity`
- `inventory.count`
- `inventory.items`
全部存在

并断言：
- `inventory.count === inventory.items.length`

---

### 2. EQUIP_ITEM 空槽位
准备：
- 往 `inventory.items` 放一个合法装备

断言：
- 装备前背包 count = N
- 装备后背包 count = N - 1
- 对应槽位不为空
- 该 item 不再留在背包
- `total attributes` 有变化
- `combatPreview` 有变化

---

### 3. EQUIP_ITEM 槽位交换
准备：
- 某槽位已有旧装备
- 背包中有同槽位新装备

断言：
- 操作后该槽位是新装备
- 旧装备回到背包
- 总装备数量守恒
- 没有复制 item
- 没有吞 item

---

### 4. UNEQUIP_ITEM
准备：
- 某槽位已有装备

断言：
- 操作后槽位为空
- 背包 count +1
- 该装备出现在背包
- `total attributes` 回退
- `combatPreview` 回退

---

### 5. UPGRADE_ATTRIBUTE 成功
准备：
- 给足 `copper`

断言：
- 指定基础属性 +1
- `copper` 被正确扣除
- `total attributes` 同步变化
- `combatPreview` 同步变化

---

### 6. UPGRADE_ATTRIBUTE 铜钱不足
准备：
- `copper = 0`

断言：
- 返回 `NOT_ENOUGH_COPPER`
- 属性不变
- 资源不变

---

### 7. 装备 / 属性变化影响 combatPreview
断言：
- 穿装备前后 `combatPreview` 变化
- 升属性前后 `combatPreview` 变化

至少覆盖：
- `hp`
- `armor`
- `damageMin / damageMax`
- `critChanceBp` 或 `dodgeChanceBp`
- `combatRating`

---

### 8. START_MISSION 后再换装 / 升级，activeMission.playerCombatSnapshot 不变
流程：
1. 生成任务
2. `START_MISSION`
3. 记录 `activeMission.playerCombatSnapshot`
4. 执行 `EQUIP_ITEM` 或 `UPGRADE_ATTRIBUTE`
5. 读取当前状态

断言：
- `state.equipment` 或 `state.attributes` 已变化
- 但 `activeMission.playerCombatSnapshot` 与开始任务时完全一致

---

### 9. Tavern 现有 smoke 全部继续通过
要求：
- 现有 Tavern smoke 不删
- 不降级
- `TAVERN_GET_INFO / TAVERN_DRINK / START_MISSION / COMPLETE_MISSION / SKIP_MISSION` 的既有断言全部继续通过

---

## 七、实施顺序

### Phase S1：类型、规则、view builder、共享 combat snapshot
目标：
- 新增 `characterRules.ts`
- 定义 `CharacterInfoView`
- 抽出共享 `buildPlayerCombatSnapshot`
- 提供 `buildCombatPreview`
- 提供 `buildCharacterInfoView`

验收：
- typecheck 通过
- 不改 Tavern 协议
- `missions.ts` 已改用共享 snapshot builder

---

### Phase S2：PLAYER_GET_INFO
目标：
- 实现只读角色信息接口
- 用统一 `CharacterInfoView` 响应

验收：
- `PLAYER_GET_INFO` 成功返回完整 view
- `inventory.count === inventory.items.length`
- 不修改状态

---

### Phase S3：EQUIP_ITEM / UNEQUIP_ITEM
目标：
- 实现背包穿装备
- 实现卸装回包
- 保证总数守恒

验收：
- 空槽位装备通过
- 槽位交换通过
- 卸装通过
- 总物品数守恒
- `combatPreview` 正确刷新

---

### Phase S4：UPGRADE_ATTRIBUTE
目标：
- 实现属性升级
- 铜钱成本公式生效
- 返回统一 `CharacterInfoView`

验收：
- 升级成功路径通过
- `NOT_ENOUGH_COPPER` 路径通过
- 不持久化 total attributes

---

### Phase S5：smoke 和 Tavern 回归
目标：
- 补齐 v0.2 smoke
- 现有 Tavern smoke 全回归

验收：
- 所有新增 smoke 通过
- 现有 Tavern smoke 全通过
- 任务开始后换装 / 升级不影响当前 mission snapshot

---

## 八、验收命令

必须继续通过：

```bash
cd server
npm run typecheck
npm run build
npm run smoke:core
```

这三个命令是 v0.2 的最低验收线。

---

## 最终说明

v0.2 的核心不是做大而全的 RPG 系统，而是把当前已存在的：
- Tavern 奖励
- 背包装备
- 基础属性
- 战斗快照

真正闭成一条稳定的服务端权威回路。

因此本阶段严格控制范围：
- 做角色查看
- 做穿脱装备
- 做属性升级
- 做战斗预览
- 保持 Tavern 稳定协议不变

不在本阶段扩卖装、强化、洗练、复杂经济或复杂战力模型。
