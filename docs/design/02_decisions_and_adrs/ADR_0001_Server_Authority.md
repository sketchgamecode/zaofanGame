# ADR_0001 Server Authority

**Status:** Draft  
**Owner Approved By:** TBD  
**Approved Date:** TBD  
**Implementation Allowed:** no  
**Decision Type:** Architecture / Product Rule  
**Last Updated:** 2026-04-27

---

## 1. Context

ZaoFanGame 当前已经公网运行，并且产品目标明确为：

- 以经典 S&F 异步 RPG 节奏为蓝本
- 长期支持多客户端接入
- 避免客户端本地逻辑导致数值漂移、作弊空间和多端不一致

当前仓库中的产品与架构文档已经反复强调：

- 所有游戏动作通过统一 action 接口进入服务端
- 服务端读取状态、执行规则、写回状态、返回结果
- 客户端以展示为主，不应拥有规则裁定权

证据：

- `docs/00_Architecture_Overview.md`
- `docs/00_Product_Vision.md`
- `docs/Tavern_Client_Contract_V1.md`

---

## 2. Decision

项目正式采用以下规则：

### 2.1 服务端是唯一权威

- gameserver 是游戏状态与规则结算的唯一权威来源
- 客户端只负责发起玩家意图与渲染服务端结果

### 2.2 客户端禁止承担以下职责

- 禁止客户端生成任务
- 禁止客户端扣除资源
- 禁止客户端发放奖励
- 禁止客户端本地裁定战斗输赢
- 禁止客户端本地决定掉落

### 2.3 统一 action contract 是主交互面

- 已上线 Tavern 与 Character action contract 默认视为 stable
- 若要破坏性修改其请求结构、响应结构或语义，必须先写 ADR，并经 Owner 批准

### 2.4 多客户端共享同一套规则真相

- Web、Lite、未来移动端、未来其他客户端，都应面向同一套服务端真相
- 任何仅在某个客户端存在的本地规则，都应被视为风险

---

## 3. Consequences

### 正面结果

- 多端一致性更强
- 作弊与状态分叉风险更低
- 设计文档、golden tests、smoke tests 更容易统一
- 未来替换前端技术栈不会重写核心规则

### 成本

- 客户端开发速度可能略慢，因为很多“省事本地逻辑”不能做
- 任何 contract 变更都需要更严格的文档与评审
- 服务端规则文档与测试责任更重

---

## 4. Enforcement

本 ADR 生效后：

1. 任何新系统默认按服务端权威模式设计。
2. 任何 coder agent 不得在前端补充会改变机制结果的本地规则。
3. 任何破坏已上线 stable action contract 的提案，都必须先补 ADR。
4. Design Agent 负责把该原则写入 context pack、compatibility 文档和开发前门禁。

---

## 5. Related Documents

- `docs/00_Architecture_Overview.md`
- `docs/00_Product_Vision.md`
- `docs/Tavern_Client_Contract_V1.md`
- `docs/server_impl_plans/Character_Inventory_Equipment_Server_Impl_V1.md`
