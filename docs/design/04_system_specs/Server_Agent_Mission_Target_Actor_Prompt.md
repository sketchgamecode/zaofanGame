# Server Agent Prompt: Mission Target Actor V1

请实现“任务目标世界角色化 V1”。目标是让每个差事任务都有一个来自 `world.actors` 的具体目标角色，前端能在任务卡、战斗播放和结算中显示这个角色。

## 背景

当前玩家已经理解并认可：场所中的 NPC 是离线玩家角色或开服生成的 bot 角色，并且这些角色占据场所职务。现在唯一困惑点是：任务里打的是不是这些世界角色。

本阶段只解决“任务目标是具体角色”这一层，不实现复杂国战、不实现死亡、不实现夺职。

## 设计边界

必须做：

1. 任务生成时，从 `world.actors` 选择一个目标 actor。
2. `MissionOffer`、`ActiveMissionView`、任务结算数据中透传目标 actor 预览。
3. 任务战斗使用该目标 actor 的 `combatSnapshot`。
4. 胜利后沿用现有 suspicion / power transfer 轻量结算。
5. 文档和测试同步更新。

明确不要做：

1. 不删除目标 actor。
2. 不让目标 actor 死亡。
3. 不扣目标永久属性。
4. 不直接夺取目标的 servicePosition。
5. 不发送复仇邮件。
6. 不做在线玩家通知。
7. 不做复杂 faction AI 反制。

## 类型建议

新增：

```ts
type MissionTargetActorPreview = {
  actorId: string;
  kind: 'bot' | 'player';
  displayName: string;
  avatarId: string;
  level: number;
  classId: PlayerClassId;
  raceId?: RaceId;
  faction: PowerFactionId;
  locationId: string;
  locationName?: string;
  powerShare: number;
  title?: string;
  positionId?: string;
  reason: string;
};
```

挂载位置：

1. `MissionOffer.targetActor?: MissionTargetActorPreview`
2. `ActiveMissionView.targetActor?: MissionTargetActorPreview`
3. `CompleteMissionData.targetActor?: MissionTargetActorPreview`
4. 如服务端内部 `ActiveMission` 需要持久化，则也保存 `targetActor` 或足够的 target actor snapshot。

## 目标选择规则

任务生成时，根据 `MissionPowerContext.targetFaction` 选择目标。

第一版筛选优先级：

1. `actor.faction === targetFaction`
2. 等级接近玩家等级
3. 优先位于目标 faction 相关地点
4. 优先 `powerShare > 0`
5. 如果 actor 当前占据 servicePosition，优先选这类角色
6. 严格池为空时，退化为任意同 faction actor
7. 仍为空时，退化为任意 world actor，但要在 reason 中避免写得过于具体

目标一旦进入 offer，就必须稳定。不要在 start/complete 时重新抽目标。

## 战斗规则

任务战斗敌方使用 `targetActor.combatSnapshot` 派生出的 combatant，而不是旧的匿名任务怪。

要求：

1. `BattleResultV2.enemy.id` 应能对应 target actor。
2. `BattleResultV2.enemy.name/avatarId/level/classId` 应来自 target actor。
3. 不要因为战斗胜负修改 target actor 的等级、属性、装备或职位。

## 结算规则

玩家胜利：

1. 原有 XP / copper 奖励照旧。
2. 原有 suspicion 写入照旧。
3. 原有权柄转移照旧，优先从 targetFaction 或目标 actor 所属池扣除。
4. `CompleteMissionData` 返回 `targetActor` 和 `powerResult`，供前端展示“击败了谁、得罪了谁、权柄如何变化”。

玩家失败：

1. 不触发权柄转移。
2. 不修改目标 actor。
3. 仍返回 `targetActor`，让前端能展示“被谁挡下”。

## 文案包装

`targetActor.reason` 应是短句，用于解释为什么此人是目标。例如：

1. `盐引账册牵连人`
2. `蓝党旧部门丁`
3. `都察院弹章经手人`
4. `边镇粮道心腹`
5. `香会暗线头目`

不要回退到“怪物”“敌人”“随机对手”等泛 RPG 文案。

## 测试要求

至少覆盖：

1. `GENERATE_MISSIONS` 返回的每个 mission offer 都有 `targetActor`。
2. `targetActor.faction` 与 `powerContext.targetFaction` 一致，或在 fallback 情况下有明确测试。
3. `START_MISSION` 后 activeMission 保留同一个 targetActor。
4. `COMPLETE_MISSION` 成功返回同一个 targetActor，并正常写入 suspicion / powerResult。
5. `COMPLETE_MISSION` 失败返回同一个 targetActor，但不转移权柄。
6. BattleResultV2 enemy 使用 targetActor 的名字、等级、头像和 classId。
7. 目标 actor 不因胜负被删除，不失去 servicePosition。
8. 全量测试通过。

## 文档同步

请更新：

1. `server/tdd/api_master_list.md`
2. `server/tdd/player_save_schema.md`
3. `server/tdd/error_code_dictionary.md` 如新增错误码
4. 相关 walkthrough / summary

## 交付说明

完成后请汇报：

1. 修改文件清单。
2. `MissionTargetActorPreview` 最终字段。
3. 目标 actor 选择规则。
4. 成功/失败结算影响。
5. 是否改动 BattleResultV2 enemy 数据。
6. 测试数量与结果。
