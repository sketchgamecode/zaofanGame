# Stability & Observability Baseline V1

适用阶段：
- `v0.1 Public Tavern Loop`

用途：
- 给游戏顾问快速评审
- 给 Server Agent / Client Agent 对齐优先级
- 作为 1-2 天稳定化工作的实施清单

---

## 1. 目标定义

本轮目标不是继续扩玩法，而是补齐最小运行底座，让团队具备：

- 看到问题的能力
- 复现问题的能力
- 快速区分问题归属的能力
- 稳定做公网部署 smoke 的能力

这是后续继续做角色、装备、黑市、竞技场之前的基础加固。

---

## 2. 建议优先级

建议按以下顺序执行：

1. 服务端 action 日志
2. 前端错误提示分层
3. 部署 smoke checklist
4. 测试账号与 reset 流程
5. Production debug runbook

---

## 3. 服务端 action 日志字段清单

最低建议字段：

- `timestamp`
- `releaseTag`
- `requestId`
- `playerId`
- `action`
- `ok`
- `errorCode`
- `message`
- `stateRevisionBefore`
- `stateRevisionAfter`
- `durationMs`
- `origin`
- `hasAuthHeader`
- `userAgent`

酒馆相关可选摘要字段：
- `tavernStatusBefore`
- `tavernStatusAfter`
- `activeMissionIdBefore`
- `activeMissionIdAfter`

注意：
- 不要把完整敏感快照直接打到日志里
- 不要输出 `combatSeed`
- 不要输出 `rewardSnapshot`
- 不要输出完整 `playerCombatSnapshot`

验收标准：
- 能根据日志回答“某玩家刚才是否调用了 `START_MISSION`，是否成功，失败错误码是什么”

---

## 4. 前端错误提示分层清单

建议最少区分以下 5 类：

### 1. 网络错误

例如：
- 请求超时
- 断网
- DNS 错误

### 2. 认证错误

例如：
- token 失效
- 未登录

### 3. 配置错误

例如：
- API base URL 错误
- CORS 被拦

### 4. 服务端业务错误

例如：
- `NOT_ENOUGH_TOKENS`
- `MISSION_NOT_FINISHED`
- `NOT_ENOUGH_THIRST`

### 5. 客户端状态错误

例如：
- 重复点击
- 本地 UI 状态过期

验收标准：
- 玩家提示不再统一显示“操作失败”
- 调试模式下至少能看见 `errorCode`

---

## 5. 测试账号与 reset 使用规则

建议维护两类测试号：

### Smoke 账号

用途：
- 每次部署后跑标准主流程

规则：
- 存档保持可预测
- 可通过受控方式 reset

### 异常测试账号

用途：
- 资源不足
- 重复提交
- 幂等
- 失败分支

规则：
- 不和 smoke 账号混用
- 允许频繁 reset

### Reset 规则

- 仅允许开发/测试环境使用
- 仅允许重置当前登录用户
- 不允许作为线上常规修复手段

验收标准：
- 团队成员都知道用哪个号跑 smoke
- 团队成员都知道何时 reset，如何 reset

---

## 6. 部署 smoke 最小动作清单

每次部署后至少验证：

1. 打开公网前端
2. 登录成功
3. `TAVERN_GET_INFO`
4. `TAVERN_DRINK`
5. `START_MISSION`
6. `SKIP_MISSION` 或 `COMPLETE_MISSION`
7. 结算后回到 `IDLE`

详细执行文档见：

`docs/Deployment_Smoke_Checklist_V1.md`

验收标准：
- 3-5 分钟内能确认主闭环是否健康

---

## 7. 建议文档交付物

本轮建议至少产出 2 份文档：

- `docs/Production_Debug_Runbook_V1.md`
- `docs/Deployment_Smoke_Checklist_V1.md`

这两份文档的用途不同：

### Runbook

解决：
- 出问题了怎么办
- 怎么判断是哪一层的问题

### Checklist

解决：
- 每次部署后具体要做什么验证

---

## 8. 1-2 天实施节奏建议

### Day 1 上午

完成：
- 服务端 action 日志

### Day 1 下午

完成：
- 前端错误提示分层
- 部署 smoke checklist 初版

### Day 2 上午

完成：
- 测试账号与 reset 流程文档化
- Production debug runbook 初版

### Day 2 下午

完成：
- 根据真实联调结果补日志字段
- 修 smoke 缺口
- 补常见错误说明

---

## 9. 当前阶段不建议做的事

这 1-2 天不建议做：

- 完整监控平台
- 复杂 tracing
- 重量级埋点系统
- 新玩法扩展
- 大量多端适配细节

原因：
- 现在最值钱的是最小可观测和最小可排障
- 不是扩复杂系统

---

## 10. 给顾问的结论摘要

当前公网第一步已经打通，产品已经不再是本地 demo，而是一个真实可访问、真实存档联通、服务端权威驱动的在线游戏雏形。

在继续扩角色和装备系统之前，优先做 1-2 天的“稳定与观测基线建设”是合理且必要的。  
因为当前最大风险不是玩法不够，而是出现问题时不可见、不可复现、不可快速定位。

本轮建议优先完成：
- 服务端 action 日志
- 前端错误分层
- 部署 smoke checklist
- 测试账号与 reset 流程
- Production debug runbook

这样做的结果是：
- 降低后续角色/装备系统上线风险
- 降低多端联调成本
- 提升真实公网版本的可运维性

---

## 文件路径

`docs/Stability_Observability_Baseline_V1.md`
