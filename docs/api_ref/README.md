# 大宋造反模拟器 API 引用手册 (Server API Reference)

> **版本**：1.0.0  
> **最后更新**：2026-04-26  
> **服务地址**：`https://api.sketchgame.net` (或本地测试 `http://localhost:3001`)

本目录包含了大宋造反模拟器（ZaoFanGame）服务端的接口说明，供客户端（Web/Unity/Lite/Agents）对接使用。

## 核心设计原则

1. **服务端权威 (Server Authority)**：服务端是真相的唯一来源。所有涉及游戏数值变更的操作必须通过 API 发送到服务端执行。
2. **统一动作接口 (Unified Action API)**：大部分游戏逻辑通过 `/api/action` 接口分发，客户端只需传入动作类型 (Action) 和参数 (Payload)。
3. **无状态与持久化**：服务端不维护长连接，每次请求都会从数据库拉取最新的 `GameState`，执行逻辑后写回并返回。

## 快速导航

- [身份验证与安全 (Auth)](auth.md) - 如何获取 Token 并调用接口。
- [游戏动作 (Actions)](actions.md) - 核心玩法接口（任务、属性、黑市、竞技场等）。
- [存档与管理 (Save & Admin)](save_and_admin.md) - 存档查询、管理后台接口。

## 公共响应格式

所有接口（除 404/500 严重错误外）均返回 JSON 格式。

### 成功响应示例
```json
{
  "success": true,
  "gameState": { ... },
  "log": [
    { "type": "info", "text": "开始执行任务..." },
    { "type": "reward", "text": "获得 100 铜钱" }
  ],
  "data": { ... }
}
```

### 失败响应示例
```json
{
  "success": false,
  "error": "铜钱不足",
  "detail": "升级需要 120 铜钱，当前只有 50"
}
```

## 维护者说明
如需添加新接口，请在 `server/src/routes` 中定义路由，并在 `server/src/engine` 中实现对应逻辑。
