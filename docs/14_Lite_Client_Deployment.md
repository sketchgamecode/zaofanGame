# Lite 客户端部署指南

> 本文档告知新 Agent：前端静态文件如何上线到公网。

---

## 一、部署架构概览

```
GitHub 仓库 (main 分支)
   │
   │  git push → 触发 GitHub Actions
   ▼
GitHub Actions (ubuntu-latest)
   │  npm install + npm run build (或直接拷贝静态文件)
   │  SCP 上传到服务器
   ▼
阿里云服务器 47.79.240.134
   │
   ├── Nginx → game.sketchgame.net → /var/www/zaofan-web/   ← 前端静态文件目录
   └── Nginx → api.sketchgame.net  → localhost:3001          ← 后端 API
```

---

## 二、Lite 前端的部署方式

Lite 客户端是**纯静态文件**（单个 `index.html`），**无需构建步骤**。

### 文件放置路径

```
clients/lite/index.html   ← 唯一需要的文件
```

### 自动部署触发条件

推送到 `main` 分支，且改动路径包含 `clients/lite/**`，GitHub Actions 会自动上传。

> **注意**：目前的 `deploy-frontend.yml` 只监听 `clients/web/**`。
> Lite 客户端需要单独一个 workflow，或者把路径改为同时监听两者。

---

## 三、手动部署方式（最快）

如果不想等 CI/CD，可以让项目负责人通过 SSH 直接上传：

```bash
# 在本地执行（项目负责人有 SSH 密钥）
scp clients/lite/index.html root@47.79.240.134:/var/www/zaofan-lite/
```

然后服务器上配置 Nginx（如需独立子域名 lite.sketchgame.net）。

---

## 四、推荐方案：新建 GitHub Actions Workflow

在 `.github/workflows/` 下新建 `deploy-lite.yml`，内容如下：

```yaml
name: Deploy Lite Client to Aliyun

on:
  push:
    branches: [main]
    paths:
      - 'clients/lite/**'

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Deploy to Aliyun via SCP
        uses: appleboy/scp-action@v0.1.7
        with:
          host: 47.79.240.134
          username: root
          key: ${{ secrets.DEPLOY_SSH_KEY }}
          source: "clients/lite/*"
          target: "/var/www/zaofan-lite"
          strip_components: 2
```

---

## 五、服务器信息

| 项目 | 值 |
|---|---|
| 服务器 IP | `47.79.240.134` |
| 操作系统 | Ubuntu 24.04 |
| 前端（主客户端）静态文件目录 | `/var/www/zaofan-web/` |
| 前端（Lite）静态文件目录（建议） | `/var/www/zaofan-lite/` |
| 游戏前端域名 | `https://game.sketchgame.net` |
| API 域名 | `https://api.sketchgame.net` |
| 后端进程管理 | PM2，进程名 `zaofan-server` |
| SSH 用户 | `root` |
| SSH 密钥 | 存在 GitHub Secrets → `DEPLOY_SSH_KEY` |

---

## 六、GitHub 仓库信息

| 项目 | 值 |
|---|---|
| 前端主仓库 | `https://github.com/sketchgamecode/zaofanGame` |
| 后端仓库 | `https://github.com/sketchgamecode/zaofanServer` |
| 部署分支 | `main` |
| 前端 Actions | `.github/workflows/deploy-frontend.yml` |
| 后端 Actions | `.github/workflows/deploy-backend.yml` |

---

## 七、GitHub Secrets（不需要改，已配置）

| Secret 名 | 用途 |
|---|---|
| `DEPLOY_SSH_KEY` | SSH 私钥，用于 SCP 上传到阿里云 |
| `VITE_SUPABASE_URL` | 主客户端构建时注入（Lite 不需要，直接写在 HTML 里） |
| `VITE_SUPABASE_ANON_KEY` | 主客户端构建时注入（Lite 不需要） |

> Lite 客户端的 Supabase key 是公开 anon key，**直接硬编码在 HTML 里即可**，无需 Secrets。
> 详见 `docs/13_Lite_Client_Spec.md` 第三节。

---

## 八、部署验证

部署完成后，访问以下地址验证：

- 主客户端：`https://game.sketchgame.net`
- Lite 客户端（若配置独立域名）：`https://lite.sketchgame.net`
- API 健康检查：`https://api.sketchgame.net/health`
