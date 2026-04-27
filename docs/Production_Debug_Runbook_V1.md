# Production Debug Runbook V1

适用阶段：
- `v0.1 Public Tavern Loop`

适用对象：
- 游戏顾问
- Server Agent
- Client Agent
- 负责部署与联调的开发人员

目标：
- 公网版本出问题时，先快速判断问题属于哪一层
- 让团队在 5-15 分钟内知道“是前端问题、认证问题、CORS 问题、API 问题、还是业务逻辑问题”
- 为后续 Unity / iOS / Web 多端共用同一套 gameserver 打下最小可运维基础

---

## 1. 当前产品阶段定义

当前版本：

`v0.1 Public Tavern Loop`

当前已打通的核心闭环：
- 公网可访问
- 手机网页可玩
- 服务端权威 action 驱动
- 真实账号认证
- 真实存档读写
- Tavern Mission Hub 核心循环

当前最大风险：
- 不是玩法太少
- 而是出问题时看不见、复现慢、定位慢

---

## 2. 出问题时先判断哪一层

建议排查顺序固定如下：

1. 前端是否加载成功
2. API base URL 是否正确
3. 登录/认证是否正常
4. 请求是否真的到达服务端
5. 服务端是否返回结构化错误码
6. 是否是酒馆业务逻辑错误
7. 是否是部署后资源/缓存未更新

不要一上来就怀疑“服务端逻辑坏了”。

---

## 3. 线上问题的 5 类常见类型

### A. 前端加载层问题

表现：
- 网页打不开
- 白屏
- 静态资源 404
- JS 初始化失败

优先看：
- 浏览器控制台
- 网络面板
- 前端静态资源路径

### B. API / 配置层问题

表现：
- 前端打开了，但所有请求失败
- 请求打到错误域名
- CORS 拦截
- 混用了 dev/prod API 地址

优先看：
- 当前前端实际请求的 base URL
- `Origin`
- 浏览器 Network 面板中的失败请求

### C. 认证层问题

表现：
- 未登录
- token 失效
- 登录后 action 仍 401/403

优先看：
- Authorization header 是否存在
- token 是否过期
- 登录态是否在刷新时丢失

### D. 服务端业务错误

表现：
- 请求能到达服务端
- 服务端返回 `ok: false`
- 有明确 `errorCode`

常见示例：
- `NOT_ENOUGH_TOKENS`
- `MISSION_NOT_FINISHED`
- `MISSION_ALREADY_IN_PROGRESS`
- `NOT_ENOUGH_THIRST`

优先看：
- action 日志
- errorCode
- stateRevision 前后变化

### E. 部署/版本错配问题

表现：
- 本地正常，公网异常
- 新版本前端和旧版本服务端协议不一致
- 已发版但页面仍命中旧资源

优先看：
- 当前 release tag
- 前端部署时间
- 后端部署时间
- 缓存是否刷新

---

## 4. 如何看服务端 action 日志

最少应该能从日志回答以下问题：

- 谁调用了什么 action
- action 成功还是失败
- 失败错误码是什么
- 当前 `stateRevision` 是多少
- 是否有重复请求/重试
- 是否是认证/CORS/API base URL 问题

建议日志字段：
- `timestamp`
- `releaseTag`
- `requestId`
- `playerId`
- `action`
- `ok`
- `errorCode`
- `stateRevisionBefore`
- `stateRevisionAfter`
- `durationMs`
- `origin`
- `hasAuthHeader`

如果现阶段日志还不完整，至少要做到：
- 查到某个玩家是否调用过 `TAVERN_GET_INFO`
- 查到 `START_MISSION / COMPLETE_MISSION / SKIP_MISSION` 是否成功
- 查到失败时的 `errorCode`

---

## 5. 如何快速判断是否是前端问题

优先看 4 件事：

1. 页面是否成功加载
2. 是否真的发出了 `/api/action` 请求
3. 请求 URL 是否是生产 API 地址
4. 浏览器控制台是否有 CORS / fetch / runtime 错误

如果请求根本没发出去，先不要查服务端业务逻辑。

---

## 6. 如何快速判断是否是认证问题

检查点：

1. 请求里是否带 Authorization header
2. 登录成功后是否真的保存了 token
3. 刷新页面后 token 是否丢失
4. 服务端是否返回了未授权相关状态或错误

如果是认证问题，先修登录链路，不要直接进游戏逻辑排查。

---

## 7. 如何快速判断是否是 CORS / API base URL 问题

常见信号：
- 浏览器 console 提示 CORS blocked
- Network 面板里请求状态异常
- 请求打到错误域名
- 前端配置仍指向本地或测试 API

检查顺序：

1. 看当前网页实际请求的 API 域名
2. 看浏览器请求头中的 `Origin`
3. 看服务端 `ALLOWED_ORIGINS` 是否包含当前来源
4. 看是否走了 https / 非 https 混用

---

## 8. 如何使用测试账号

建议至少维护两类测试号：

### Smoke 测试号

用途：
- 每次部署后跑主流程

要求：
- 存档尽量干净
- 路径稳定
- 可快速 reset

### 异常测试号

用途：
- 验证边界错误
- 验证幂等、失败分支、资源不足

要求：
- 可接受频繁 reset
- 不与部署 smoke 共用

---

## 9. 如何 reset save

现阶段建议通过受控开发能力 reset：

- 仅允许开发/测试环境
- 仅允许当前登录用户
- 不允许跨账号重置

建议 reset 场景：
- 部署 smoke 前
- 某个测试号状态污染后
- 需要复现“首次进入酒馆”路径时

不建议把 reset 当成常规问题修复手段。  
先看日志，再决定是否 reset。

---

## 10. 部署后检查步骤

部署完成后，至少执行一次最小 smoke：

1. 打开公网前端
2. 确认前端页面加载正常
3. 确认登录成功
4. 调 `TAVERN_GET_INFO`
5. 确认看到 3 个 mission offers
6. 调 `TAVERN_DRINK`
7. 调 `START_MISSION`
8. 调 `SKIP_MISSION` 或等待后 `COMPLETE_MISSION`
9. 确认结算成功
10. 确认回到 `IDLE`

详细步骤见：

`docs/Deployment_Smoke_Checklist_V1.md`

---

## 11. 常见错误与优先处理顺序

### `NOT_ENOUGH_TOKENS`

含义：
- token 不足

先做什么：
- 确认是不是测试号资源耗尽
- 确认客户端没有本地误扣

### `MISSION_NOT_FINISHED`

含义：
- 任务尚未到完成时间

先做什么：
- 检查 `serverTime`
- 检查 `activeMission.endTime`
- 不要只看本地时间

### `MISSION_ALREADY_IN_PROGRESS`

含义：
- 当前已有任务进行中

先做什么：
- 查 action 重复点击
- 查是否有重试请求

### `NOT_ENOUGH_THIRST`

含义：
- 干粮/口渴值不足

先做什么：
- 看服务端返回的最新 `thirstSecRemaining`
- 不要信客户端本地缓存值

### `NOT_ENOUGH_SKIP_RESOURCE`

含义：
- 没有可用于跳过的 hourglass 或 token

先做什么：
- 看服务端资源状态
- 确认 `SKIP_MISSION` 是否被重复点击

---

## 12. 回滚原则

如果新版本部署后 smoke 失败，建议判断：

### 可快速修复

例如：
- 前端 API base URL 错了
- CORS 漏配置
- 错误提示没处理

处理方式：
- 热修配置或补一版前端

### 不适合现场热修

例如：
- 核心 action 闭环坏了
- 存档读写异常
- 任务无法开始/结算

处理方式：
- 优先回滚到上一个稳定 tag
- 再离线定位问题

原则：
- 公网第一版优先稳定，不追求现场强修

---

## 13. 给顾问 / 客户端 / 服务端同步故障时的统一模板

建议统一用下面格式：

### 现象
- 玩家做了什么
- 实际发生了什么

### 影响范围
- 单账号 / 部分账号 / 全体用户

### 环境
- 前端域名
- API 域名
- 当前版本 tag

### 请求信息
- action
- request time
- requestId（如果有）
- playerId

### 服务端结果
- `ok`
- `errorCode`
- `stateRevision`

### 当前判断
- 前端问题 / 配置问题 / 认证问题 / 业务逻辑问题 / 部署问题

这样三方看到的是同一份结构化信息。

---

## 14. 当前阶段的最低目标

不是上来就做复杂监控，而是确保团队知道：

- 谁调用了什么 action
- 失败错误码是什么
- 当前 `stateRevision` 是多少
- 是否有重复请求
- 是否是认证/CORS/API base URL 问题

只要这 5 件事清楚，后续角色、装备、黑市、竞技场接入时，线上风险就会小很多。

---

## 文件路径

`docs/Production_Debug_Runbook_V1.md`
