# Deployment Smoke Checklist V1

适用版本：
- `v0.1 Public Tavern Loop`

目标：
- 每次部署后在 3-5 分钟内确认公网主闭环没有坏
- 不追求覆盖全部系统，只验证当前最关键的真实用户路径

---

## 1. Smoke 前准备

准备项：
- 一个固定 smoke 测试号
- 一个可用的 reset save 流程
- 当前部署版本 tag
- 前端公网地址
- API 公网地址

建议记录：
- smoke 开始时间
- 当前版本 tag
- 测试账号

---

## 2. 最小 smoke 路径

### Step 1：打开公网前端

检查：
- 页面能打开
- 没有明显白屏
- 静态资源加载成功

失败则优先判断：
- 前端部署失败
- Nginx 静态资源路径错误
- 缓存未刷新

### Step 2：确认登录成功

检查：
- 登录流程完成
- 浏览器里能正常进入主界面
- 没有明显未授权错误

失败则优先判断：
- 认证链路异常
- token 存储丢失
- API 域名或 CORS 错误

### Step 3：进入酒馆

动作：
- 调用 `TAVERN_GET_INFO`

检查：
- 请求成功
- 返回 `ok: true`
- `data.tavern.status` 合法
- `missionOffers.length === 3`

失败则优先判断：
- API 连通性
- 认证问题
- 服务端 action 逻辑异常

### Step 4：喝酒

动作：
- 调用 `TAVERN_DRINK`

检查：
- 返回 `ok: true`
- `thirstSecRemaining` 增加 `1200`
- `drinksUsedToday + 1`
- `missionOffers` 没有被清空
- `missionOffers` 没有被重抽

失败则优先判断：
- token 是否不足
- 前端是否错误地把喝酒当成刷新任务

### Step 5：开始任务

动作：
- 从三选一中选一个任务，调用 `START_MISSION`

检查：
- 返回 `ok: true`
- `status = IN_PROGRESS`
- `activeMission` 存在
- `missionOffers` 被清空
- `thirstSecRemaining` 被正确扣除

失败则优先判断：
- 是否有旧任务未结算
- `offerSetId` 是否不匹配
- 是否 `NOT_ENOUGH_THIRST`

### Step 6：跳过或完成任务

建议方式：
- 部署 smoke 优先走 `SKIP_MISSION`

检查：
- 返回 `ok: true`
- `action = SKIP_MISSION`
- `result = SUCCESS | FAILED | ALREADY_SETTLED`
- `playerDelta` 合法
- `nextMissionOffers.length === 3`
- `tavern.status` 回到 `IDLE`

若使用 `COMPLETE_MISSION`：
- 需确保任务已到时间
- 否则预期可能返回 `MISSION_NOT_FINISHED`

### Step 7：回到酒馆空闲状态

检查：
- 能看到下一组三选一
- 可以再次开始任务
- 页面没有卡死在旧状态

---

## 3. 通过标准

本轮部署 smoke 通过，至少满足：

- 前端可打开
- 登录可用
- `TAVERN_GET_INFO` 正常
- `TAVERN_DRINK` 正常
- `START_MISSION` 正常
- `SKIP_MISSION` 或 `COMPLETE_MISSION` 正常
- 结算后回到 `IDLE`

---

## 4. 失败时的分类记录

建议记录成以下几类：

### A. 前端加载失败

例如：
- 白屏
- 资源 404

### B. 登录/认证失败

例如：
- 未授权
- 登录后仍不能调 action

### C. API / CORS / Base URL 失败

例如：
- 请求打错域名
- CORS 被拦

### D. 服务端业务错误

例如：
- `NOT_ENOUGH_TOKENS`
- `MISSION_NOT_FOUND`
- `MISSION_NOT_FINISHED`

### E. 版本错配

例如：
- 前端协议和后端协议不一致

---

## 5. Smoke 失败后的处理顺序

建议固定顺序：

1. 确认是不是前端资源问题
2. 确认是不是登录/认证问题
3. 确认是不是 API base URL / CORS 问题
4. 查服务端 action 日志
5. 必要时 reset smoke 测试号
6. 如果主闭环损坏且短时间修不完，优先回滚

---

## 6. Smoke 测试号建议

建议至少维护：

- `Smoke账号`
  用于每次发版后的标准流程

- `异常测试账号`
  用于资源不足、重复点击、幂等、失败路径验证

不要把所有人都拿同一个号做测试。

---

## 7. Smoke 记录模板

建议每次部署后记录：

### 部署信息
- 日期
- 版本 tag
- 前端版本标识
- 后端版本标识

### Smoke 结果
- 打开页面：通过 / 失败
- 登录：通过 / 失败
- `TAVERN_GET_INFO`：通过 / 失败
- `TAVERN_DRINK`：通过 / 失败
- `START_MISSION`：通过 / 失败
- `SKIP_MISSION / COMPLETE_MISSION`：通过 / 失败

### 失败备注
- 错误码
- 请求时间
- playerId
- 初步判断

---

## 8. 当前 smoke 的边界

这份 checklist 只验证：
- 公网访问
- 认证
- 存档
- Tavern 主循环

不覆盖：
- 角色成长完整性
- 装备系统完整性
- 黑市 / 竞技场 / 副本
- 多端差异联调

这些属于后续阶段。

---

## 文件路径

`docs/Deployment_Smoke_Checklist_V1.md`
