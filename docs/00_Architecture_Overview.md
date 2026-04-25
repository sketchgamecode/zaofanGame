# 大宋造反模拟器 — 项目架构总览

> 最后更新：2026-04-25 | 当前阶段：服务端迁移完成，公网可访问

## 访问地址
- **游戏前端**：https://game.sketchgame.net
- **API 服务**：https://api.sketchgame.net

---

## 目录结构

```
ZaoFanGame/
├── clients/
│   ├── web/          ← React + TypeScript 主前端 (Vite)
│   └── lite/         ← 轻量H5备用前端（未完全对接服务端）
├── server/           ← Node.js + Express 后端（权威服务端）
│   ├── src/
│   │   ├── engine/   ← 核心游戏逻辑（任务、背包、黑市等）
│   │   ├── routes/   ← HTTP路由（/api/action, /api/save）
│   │   ├── types/    ← TypeScript类型定义（GameState等）
│   │   └── data/     ← 静态数据（XP表、装备模板等）
│   └── database/     ← Supabase SQL初始化脚本
├── docs/             ← 设计文档（见下方说明）
├── .github/workflows/← CI/CD（前端+后端自动部署到阿里云）
├── nginx-api.conf    ← Nginx API反代配置
└── nginx-www.conf    ← Nginx 前端静态文件配置
```

---

## 技术架构

```
浏览器 (clients/web)
  │  HTTPS
  ▼
Nginx (阿里云 47.79.240.134)
  ├── / → 前端静态文件 (/var/www/zaofan-web)
  └── /api → Express 服务 (localhost:3001, PM2管理)
         │
         ▼
    Supabase (PostgreSQL)
      ├── auth.users     ← 用户认证（Supabase Auth）
      ├── player_saves   ← 完整 GameState 存档（JSONB）
      └── profiles       ← 玩家档案
```

### 核心设计原则：**服务端是真相的唯一来源**

- 所有游戏动作通过 `POST /api/action` 发到服务端
- 服务端从数据库读取 GameState → 执行引擎 → 写回数据库 → 返回结果
- 客户端**只做展示**，不做任何存档写入
- localStorage 不再用于游戏数据

---

## CI/CD 流程

| 修改路径 | 触发 | 部署目标 |
|---|---|---|
| `clients/web/**` | `deploy-frontend.yml` | `/var/www/zaofan-web` |
| `server/**` | `deploy-backend.yml` | `/opt/zaofan-server` + PM2重启 |

**推到 `main` 分支 = 自动上线**，无需手动操作。

---

## 文档索引

| 文件 | 内容 |
|---|---|
| `00_Product_Vision.md` | 产品愿景与游戏设计方向 |
| `00_Agent_Dev_Guidelines.md` | AI开发助手工作规范 |
| `02_Core_Gameplay.md` | 核心玩法设计 |
| `04_Arena_System_Design.md` | 竞技场系统设计 |
| `04_Core_Math_And_Classes.md` | 职业与数值公式 |
| `07_Premium_Economy_Design.md` | 通宝/沙漏付费体系 |
| `08_Production_Deployment_Lessons.md` | ⭐ 部署经验与踩坑记录 |
| `09_Tavern_Mission_Hub.md` | 客栈与任务系统设计 |
| `10_Public_Deployment_And_Donation_Ops.md` | 公网运营方案 |
| `11_Art_Assets_And_Multi_Client_Frontend.md` | 美术与多端前端规划 |
| `12_Art_Asset_Naming_Guidelines.md` | 美术资源命名规范 |
