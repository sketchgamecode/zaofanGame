# 存档与管理接口 (Save & Admin)

## 存档接口 (Save API)

### `GET /api/save` - 获取当前玩家存档
- **Auth**: [需要 Bearer Token](auth.md)
- **Response**:
  ```json
  {
    "save": { ...GameState... },
    "saveVersion": 2,
    "updatedAt": "2026-04-26T10:00:00Z"
  }
  ```
- **说明**: 客户端启动时调用，用于初始化本地状态。若玩家无存档，返回 `isNewPlayer: true`。

---

## 管理员接口 (Admin API)

这些接口受 `x-admin-secret` 保护。

### `GET /api/admin/players` - 玩家列表
- **Query Params**:
  - `search` (string): 可选。按显示名称或 QQ 号搜索。
- **说明**: 分页（默认 50 条）列出玩家基础信息。

### `GET /api/admin/players/:id/resources` - 玩家资源概览
- **Params**:
  - `id` (string): 玩家 UID。
- **说明**: 查看特定玩家的通宝、沙漏、声望等核心资源。

### `POST /api/admin/players/:id/grant` - 发放资源
- **Params**:
  - `id` (string): 玩家 UID。
- **Body**:
  ```json
  {
    "tokens": 10,
    "hourglasses": 5,
    "reason": "系统维护补偿"
  }
  ```
- **说明**: 运营人员手动发放通宝或沙漏。必须填写原因。
- **审计日志**：该操作会记录到 `admin_actions` 表中。

---

## 健康检查 (Health)

### `GET /health`
- **Auth**: 无需认证
- **说明**: 确认服务端是否存活。Railway 等平台使用此接口进行存活检查。
