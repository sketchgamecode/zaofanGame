# Server Agent Prompt: Phase 5 World Power Transfer

请继续实现阶段 5：权柄总量系统第一版。

上下文：

1. 阶段 1 已完成：任务有 `MissionPowerContext`，成功结算会写入 `suspicion`，并返回 `powerResult`。
2. 阶段 2 已完成：蓝玉案副本有 `powerCase`，胜利会写入 `suspicion`，并返回 `powerResult`。
3. 阶段 3 已完成：`world.actors` 冷启动生成 260 个 actor，总 `powerShare = 10000`。
4. 阶段 4 已完成：`WORLD_LOCATIONS_GET_STATUS` 能按地点返回人数、权柄、状态和服务。

本阶段目标：

把“权柄总量 100%”从展示推进到第一版可变化闭环。任务和副本成功时，世界 actor 池中的 `powerShare` 发生小额转移，但所有 actor 的总和必须始终等于 `10000`。

实现要求：

1. 保持 `WORLD_POWER_TOTAL = 10000`。
2. 抽出统一 helper，例如 `applyWorldPowerTransfer(ctx, options)`。
3. helper 必须保证：
   - 权柄只能从目标集团或目标 actor 扣除，不能凭空产生。
   - 任意 actor 的 `powerShare` 不能小于 0。
   - 转移后所有 actor 的 `powerShare` 总和仍等于 `10000`。
   - 旧存档没有 `world` 时，沿用 `ensureWorldInitialized` 自动初始化。
4. 普通集团任务成功：
   - 根据 `MissionPowerContext.targetFaction` 或目标集团信息扣权柄。
   - 低风险同阵营差事建议转移 `1` 点。
   - 高风险跨阵营差事建议转移 `2` 点。
5. 权力副本胜利：
   - 根据 `DungeonChapter.powerCase.targetFactions` 扣权柄。
   - 蓝玉案第一版建议转移 `3` 点。
6. 失败任务、失败副本不发生权柄转移。
7. 转移去向：
   - 第一版可以转给 `issuerFaction` 下一个代表性 actor。
   - 更推荐同步/创建一个稳定的玩家 actor，例如 `actorId = player:${playerId}`，把玩家作为世界权力池的一员。
   - 如果创建玩家 actor，需保证不会让总 actor 数和总权柄逻辑混乱；可以从 bot 身上转移权柄给玩家 actor。
8. 扩展 `powerResult`：

```ts
powerResult?: {
  suspicionDelta?: Partial<Record<PowerFactionId, number>>;
  suspicionAfter?: Partial<Record<PowerFactionId, number>>;
  powerTransfer?: {
    worldPowerTotal: number;
    actorPowerDelta?: number;
    issuerFactionPowerDelta?: Partial<Record<PowerFactionId, number>>;
    targetFactionPowerDelta?: Partial<Record<PowerFactionId, number>>;
    targetActorIds?: string[];
    worldPowerAfter?: {
      byFaction: Array<{
        faction: PowerFactionId;
        actorCount: number;
        powerShare: number;
      }>;
    };
  };
};
```

兼容性要求：

1. 不要破坏现有前端读取 `powerResult.suspicionDelta` / `powerResult.suspicionAfter` 的逻辑。
2. 如果你觉得类型上更安全，可以保留原有字段结构，只额外增加 `powerTransfer?`。
3. 非权力任务/非权力副本不返回 `powerTransfer`。

测试要求：

1. 初始世界权柄总和为 `10000`。
2. 普通任务成功后，总和仍为 `10000`。
3. 高风险任务成功后，总和仍为 `10000`。
4. 蓝玉案副本胜利后，总和仍为 `10000`。
5. 失败任务/失败副本不发生权柄转移。
6. 目标集团权柄减少，发起集团或玩家 actor 权柄增加。
7. actor 不会被扣成负数。
8. 旧存档缺 `world` 时仍可初始化并完成转移。
9. `WORLD_ACTORS_GET_OVERVIEW` 与 `WORLD_LOCATIONS_GET_STATUS` 聚合结果保持一致。
10. `powerResult.powerTransfer` 能在任务结算和副本结算响应中返回。

文档要求：

1. 更新 `server/tdd/player_save_schema.md`。
2. 更新 `server/tdd/api_master_list.md`。
3. 如新增常量或上限，更新 `server/tdd/global_config_and_limits.md`。
4. 如新增错误码，更新 `server/tdd/error_code_dictionary.md`。

完成后请汇报：

1. 修改了哪些文件。
2. 权柄转移规则第一版具体怎么定。
3. 是否创建/同步玩家 actor。
4. 总权柄恒等如何校验。
5. 测试数量和结果。

