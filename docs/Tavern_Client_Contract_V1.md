# Tavern Client Contract V1

本文档面向 Client Agent，用于对接正式版 Tavern Mission Hub - Classic SF 酒馆任务 UI。

范围说明：
- 只描述当前服务端已经实现的酒馆接口契约
- 不描述客户端视觉设计
- 不要求客户端本地推演任务、奖励或战斗
- 所有状态与资源以服务端返回为准

## 1. 酒馆状态机

客户端必须根据 `data.tavern.status` 渲染 UI。

### `IDLE`

含义：
- 当前没有进行中的任务
- 应显示当前三选一任务列表
- 应显示干粮/口渴值
- 应显示喝酒按钮

UI 建议：
- 任务卡片区：显示 `missionOffers`
- 资源区：显示 `thirstSecRemaining`、`drinksUsedToday`
- 操作区：显示 `TAVERN_DRINK`

### `IN_PROGRESS`

含义：
- 当前有进行中的任务
- 应显示当前任务和倒计时
- 应显示跳过按钮

UI 建议：
- 当前任务卡：显示 `activeMission`
- 倒计时：基于 `serverTime` + `activeMission.endTime` 或直接使用 `activeMission.remainingSec`
- 操作区：显示 `SKIP_MISSION`

### `READY_TO_COMPLETE`

含义：
- 当前任务时间已到
- 客户端可以显示完成/领奖按钮

UI 建议：
- 当前任务卡仍显示 `activeMission`
- 操作区：显示 `COMPLETE_MISSION`

### 结算后

无论任务成功还是失败，结算后都会回到 `IDLE`，并带回下一组三选一 `nextMissionOffers`。

---

## 2. 通用 Action Envelope

所有酒馆相关 action 都使用统一 envelope。

### 成功响应

```json
{
  "ok": true,
  "action": "ACTION_NAME",
  "serverTime": 1777200000000,
  "stateRevision": 12,
  "data": {}
}
```

字段说明：
- `ok`: 是否成功
- `action`: 服务端实际响应的 action 名
- `serverTime`: 服务端时间戳，毫秒
- `stateRevision`: 当前状态版本号
- `data`: 当前 action 的业务数据

### 失败响应

```json
{
  "ok": false,
  "action": "ACTION_NAME",
  "serverTime": 1777200000000,
  "stateRevision": 12,
  "errorCode": "ERROR_CODE",
  "message": "Human readable message"
}
```

字段说明：
- `errorCode`: 机器可处理错误码
- `message`: 面向日志或调试的信息

客户端处理规则：
- 先判断 `ok`
- `ok === false` 时，优先根据 `errorCode` 分支处理
- 不要只依赖 `message`

---

## 3. TAVERN_GET_INFO

### 请求 JSON

```json
{
  "action": "TAVERN_GET_INFO",
  "payload": {}
}
```

### 成功响应 JSON 示例

```json
{
  "ok": true,
  "action": "TAVERN_GET_INFO",
  "serverTime": 1777200000000,
  "stateRevision": 12,
  "data": {
    "tavern": {
      "status": "IDLE",
      "thirstSecRemaining": 6000,
      "drinksUsedToday": 0,
      "firstMissionBonusAvailable": true,
      "missionOffers": [
        {
          "offerSetId": "offer_player123_2026-04-26_1",
          "missionId": "mission_offer_player123_2026-04-26_1_0",
          "offerSeq": 1,
          "slotIndex": 0,
          "title": "潜入账房",
          "description": "潜入账房，前往西市黑铺活动 10 分钟。",
          "locationName": "西市黑铺",
          "baseDurationSec": 600,
          "actualDurationSec": 600,
          "thirstCostSec": 600,
          "visibleReward": {
            "xp": 47,
            "copper": 13,
            "hasEquipment": false,
            "hasDungeonKey": false,
            "hasHourglass": false
          },
          "enemyPreview": {
            "enemyId": "enemy_offer_player123_2026-04-26_1_0",
            "name": "密探",
            "level": 1,
            "archetype": "scout"
          },
          "generatedAt": 1777200000000
        }
      ],
      "activeMission": null
    },
    "mount": {
      "timeMultiplierBp": 10000,
      "expiresAt": null
    }
  }
}
```

说明：
- 示例为简写，只展示了 `1` 个 `missionOffer`
- 正式响应中 `missionOffers.length === 3`
- 客户端必须按数组渲染三张任务卡，不要只取第一个

### 客户端应该读取的字段

- `data.tavern.status`
- `data.tavern.thirstSecRemaining`
- `data.tavern.drinksUsedToday`
- `data.tavern.firstMissionBonusAvailable`
- `data.tavern.missionOffers`
- `data.tavern.activeMission`
- `data.mount`
- `serverTime`

### 客户端不应该依赖的字段

- 不要依赖 `stateRevision` 做 UI 业务判断
- 不要假设 `missionOffers.generatedAt` 用于业务判断
- 不要假设 `enemyPreview` 足以推演战斗结果

### 懒生成规则

当客户端调用 `TAVERN_GET_INFO` 时：
- 如果当前 `status = IDLE`
- 且 `missionOffers` 为空

服务端会自动懒生成三选一任务。

如果已有 `missionOffers`，则原样返回，不会重抽。

---

## 4. GENERATE_MISSIONS

### 请求 JSON

```json
{
  "action": "GENERATE_MISSIONS",
  "payload": {}
}
```

### 重要语义

`GENERATE_MISSIONS` 不是刷新按钮。

规则：
- 如果已有 `missionOffers`，不会重抽
- 如果当前 `IDLE` 且没有 `missionOffers`，才生成
- 如果有 `activeMission`，不应使用这个 action

### 客户端什么时候需要调用

可以调用：
- 初次进入酒馆但不想依赖 `TAVERN_GET_INFO` 懒生成时
- 某些页面恢复逻辑里，希望显式确保有任务列表时

不需要调用：
- 已经调用过 `TAVERN_GET_INFO` 且已经拿到 `missionOffers`
- 想“刷新”任务时
- 任务进行中时

### 推荐做法

客户端优先调用 `TAVERN_GET_INFO` 即可。  
绝大多数情况下，不需要额外调用 `GENERATE_MISSIONS`。

---

## 5. TAVERN_DRINK

### 请求 JSON

```json
{
  "action": "TAVERN_DRINK",
  "payload": {}
}
```

### 规则

- 消耗 `1 tokens`
- `thirstSecRemaining += 1200`
- 不封顶到 `6000`
- 如果当前 `thirstSecRemaining = 6000`，喝酒后必须是 `7200`
- 不清空已有 `missionOffers`
- 不重抽已有 `missionOffers`
- `drinksUsedToday` 每日最多 `10`

### 可能错误

- `NOT_ENOUGH_TOKENS`
- `TAVERN_DRINK_LIMIT_REACHED`

### 客户端处理建议

- 成功后直接用返回值刷新 tavern 面板
- 不要本地先扣 token
- 不要把喝酒当成任务刷新动作

---

## 6. START_MISSION

### 请求 payload

兼容请求：

```json
{
  "action": "START_MISSION",
  "payload": {
    "missionId": "mission_xxx"
  }
}
```

推荐请求：

```json
{
  "action": "START_MISSION",
  "payload": {
    "missionId": "mission_xxx",
    "offerSetId": "offer_xxx"
  }
}
```

### 成功后客户端应预期

- `missionOffers` 被清空
- `activeMission` 出现
- `status = IN_PROGRESS`
- `thirstSecRemaining` 已被服务端扣除

### activeMission view 字段

当前客户端可使用的 `activeMission` 视图字段：

- `missionId`
- `offerSetId`
- `offerSeq`
- `slotIndex`
- `title`
- `description`
- `locationName`
- `startedAt`
- `endTime`
- `remainingSec`
- `baseDurationSec`
- `actualDurationSec`
- `thirstCostSec`
- `rewardPreview`
- `mountSnapshot`

其中：

```json
"rewardPreview": {
  "xp": 47,
  "copper": 13,
  "hasEquipment": false,
  "hasDungeonKey": false,
  "hasHourglass": false
}
```

补充说明：
- `MissionOffer.visibleReward` 与 `ActiveMission.rewardPreview` 语义相同，都是客户端可展示的奖励预览
- 它们不是最终奖励快照
- 最终是否发奖，以 `COMPLETE_MISSION` / `SKIP_MISSION` 返回的 `grantedReward` 为准

### 可能错误

- `MISSION_ALREADY_IN_PROGRESS`
- `MISSION_NOT_FOUND`
- `OFFER_SET_MISMATCH`
- `NOT_ENOUGH_THIRST`

### 客户端建议

- 总是优先带 `offerSetId`
- 不要假设本地还保留着旧任务列表
- 成功后立刻切到任务进行中 UI

---

## 7. COMPLETE_MISSION

### 客户端什么时候调用

当 `tavern.status === READY_TO_COMPLETE` 时调用。  
如果客户端本地倒计时到 0，也应通过 `COMPLETE_MISSION` 让服务端最终确认。

### 未到时间

若任务尚未完成，服务端返回：
- `ok: false`
- `errorCode: "MISSION_NOT_FINISHED"`

### result 语义

- `SUCCESS`: 战斗胜利，发放奖励
- `FAILED`: 战斗失败，不发主奖励
- `ALREADY_SETTLED`: 该任务已结算，返回幂等结果

### 结算后行为

无论成功还是失败：
- 当前 `activeMission` 都会清空
- 下一组三选一都会生成
- 客户端应回到 `IDLE` 流程

### CompleteMissionLikeResponse.data 字段表

`COMPLETE_MISSION` 和 `SKIP_MISSION` 的 `data` 结构一致。

同时要注意：
- `SKIP_MISSION` 外层 `response.action` 必须是 `"SKIP_MISSION"`
- `COMPLETE_MISSION` 外层 `response.action` 必须是 `"COMPLETE_MISSION"`

字段包括：

- `result`: `"SUCCESS" | "FAILED" | "ALREADY_SETTLED"`
- `missionId`
- `offerSetId`
- `battleResult`
- `rewardGranted`
- `grantedReward`
- `playerDelta`
- `nextMissionOffers`
- `tavern`

字段说明：
- `result`
  表示本次结算结果；`ALREADY_SETTLED` 表示幂等返回
- `missionId`
  当前被结算的任务 ID
- `offerSetId`
  当前任务所属三选一任务组 ID
- `battleResult`
  服务端战斗结果，可用于展示战斗回合和胜负
- `rewardGranted`
  是否实际发放了主奖励
- `grantedReward`
  本次实际发放给玩家的奖励内容
- `playerDelta`
  本次结算前后玩家的等级、经验和资源变化
- `nextMissionOffers`
  结算后生成的下一组三选一
- `tavern`
  结算后的最新酒馆状态摘要

### 客户端如何展示 data

建议展示这些部分：

- `battleResult`
  - 战斗回合
  - 最终胜负
  - 双方剩余血量

- `grantedReward`
  - `xp`
  - `copper`
  - `tokens`
  - `hourglass`
  - `equipment`
  - `dungeonKey`

- `playerDelta`
  - 等级变化
  - 经验变化
  - 铜钱变化
  - token 变化
  - hourglass 变化
  - prestige 变化

- `nextMissionOffers`
  - 结算弹窗关闭后用于渲染下一组三选一

---

## 8. SKIP_MISSION

### 请求 JSON

```json
{
  "action": "SKIP_MISSION",
  "payload": {}
}
```

### 行为

- 点击跳过后直接结算
- 优先消耗 `hourglasses`
- 如果没有 `hourglasses`，再消耗 `tokens`
- 返回 `action = "SKIP_MISSION"`
- `data` 结构与 `COMPLETE_MISSION` 类似

### 客户端注意

- `SKIP_MISSION` 成功后，不要再额外强制调用一次 `COMPLETE_MISSION`
- 只有在做幂等重试时，才允许再次调用 `COMPLETE_MISSION`
- 如果后续为了网络重试又触发 `COMPLETE_MISSION`，服务端应返回 `ALREADY_SETTLED`

---

## 9. 错误码列表

当前酒馆相关错误码：

- `INVALID_TAVERN_STATE`
- `NOT_ENOUGH_TOKENS`
- `TAVERN_DRINK_LIMIT_REACHED`
- `MISSION_ALREADY_IN_PROGRESS`
- `MISSION_NOT_FOUND`
- `OFFER_SET_MISMATCH`
- `NOT_ENOUGH_THIRST`
- `MISSION_NOT_FINISHED`
- `NO_ACTIVE_MISSION`
- `NOT_ENOUGH_SKIP_RESOURCE`

客户端建议：
- 每个错误码都做独立提示映射
- 不要只显示原始 `message`

---

## 10. 客户端倒计时规则

客户端倒计时必须基于：

- `serverTime`
- `activeMission.endTime`
- `activeMission.remainingSec`

推荐规则：

1. 收到响应时，记录 `serverTime`
2. 当前任务剩余秒数优先展示 `activeMission.remainingSec`
3. 本地每秒递减仅用于 UI 展示
4. 最终是否完成，以服务端 `COMPLETE_MISSION` 返回为准

不要只信本地时间。  
本地倒计时只是表现层，服务端才是最终裁决者。

---

## 11. 客户端不应依赖 / 不可能看到的字段

这些字段不会出现在客户端正常响应中，客户端也不应依赖：

- `combatSeed`
- `rewardSeed`
- `rewardSnapshot`
- `hiddenRolls`
- `playerCombatSnapshot`
- `enemySnapshot`
- `settlementStatus`

如果客户端代码里尝试读取这些字段，应视为错误依赖。

---

## 12. 推荐 UI 流程

### 步骤 1：进入酒馆

调用：

```json
{ "action": "TAVERN_GET_INFO", "payload": {} }
```

### 步骤 2：`IDLE`

客户端：
- 展示三选一任务
- 展示干粮/口渴值
- 展示喝酒按钮

### 步骤 3：点击任务

调用：

```json
{
  "action": "START_MISSION",
  "payload": {
    "missionId": "...",
    "offerSetId": "..."
  }
}
```

### 步骤 4：`IN_PROGRESS`

客户端：
- 展示当前任务
- 展示倒计时
- 展示跳过按钮

### 步骤 5：时间到

调用：

```json
{ "action": "COMPLETE_MISSION", "payload": {} }
```

### 步骤 6：点击跳过

调用：

```json
{ "action": "SKIP_MISSION", "payload": {} }
```

### 步骤 7：结算弹窗

展示：
- 战斗结果
- 奖励结果
- 等级/经验/资源变化

### 步骤 8：返回 `IDLE`

使用：
- `nextMissionOffers`
- 或新的 `tavern.missionOffers`

继续展示下一组三选一。

---

## 13. 给 Client Agent 的注意事项

- 不要自己生成任务
- 不要本地扣资源
- 不要本地发奖
- 不要假设任务可以刷新
- 不要把 `TAVERN_DRINK` 当成刷新任务
- 不要在 `SKIP_MISSION` 成功后再强制 `COMPLETE_MISSION`
- 所有资源变化以服务端 `playerDelta` / `tavern` 返回为准
- 所有倒计时完成判定以服务端 `COMPLETE_MISSION` 结果为准
- 所有 mission 列表以服务端 `missionOffers` / `nextMissionOffers` 为准

---

## 14. 客户端最小状态机伪代码

```ts
if (!resp.ok) {
  showError(resp.errorCode);
  return;
}

const tavern = resp.data.tavern;

switch (tavern.status) {
  case "IDLE":
    renderMissionOffers(tavern.missionOffers);
    renderDrinkButton(tavern.drinksUsedToday);
    break;

  case "IN_PROGRESS":
    renderActiveMission(tavern.activeMission);
    startCountdown(resp.serverTime, tavern.activeMission.endTime);
    renderSkipButton();
    break;

  case "READY_TO_COMPLETE":
    renderActiveMission(tavern.activeMission);
    renderCompleteButton();
    break;
}
```

---

## 文件路径

`docs/Tavern_Client_Contract_V1.md`
