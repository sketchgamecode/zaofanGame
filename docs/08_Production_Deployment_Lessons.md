# 08_Production_Deployment_Lessons.md
# 生产部署避坑指南

> 本文档记录了 2026-04-25 将《大宋造反模拟器》从本地开发环境迁移到公网生产环境时遇到的全部实际问题及解决方案。
> 供项目成员学习参考，避免重复踩坑。

---

## 整体架构最终形态

```
玩家浏览器（国内外均可访问）
    ↓ HTTPS
game.sketchgame.net（Let's Encrypt 证书）
    ↓ DNS only，直连新加坡阿里云 47.79.240.134
nginx（80/443 端口）
    ├── 前端静态文件 /var/www/zaofan-web/（dist/）
    └── api.sketchgame.net（Cloudflare Origin Cert）
            ↓ 内部转发 localhost:3001
        PM2 → Node.js 游戏服务端
            ↓
        Supabase（数据库 + 认证）
```

---

## 问题一：TypeScript 构建错误导致 Vercel CI/CD 失败

### 现象
Vercel 部署日志报错，`tsc -b` 失败，错误涉及未使用的 import 和 `possibly undefined` 类型。

### 根本原因
- `Arena.tsx`：import 了 `Swords`、`SkipForward`、`CLASS_CONFIG` 但未使用（TS6133）
- `MissionHub.tsx`：import 了 `FastForward` 但未使用
- `AttributeUpgrade.tsx`：`offHand.weaponDamage` 是可选字段，直接访问不安全；`base[b.key]` 用了 `any` 索引

### 解决方案
```typescript
// 删除未使用的 import
import { Shield, Wand2, Zap, Sword, RefreshCw, Info } from 'lucide-react';

// 修复可选链 + nullish coalescing
const offHandDmg = (gameState.equipped.offHand?.subType === 'weapon'
  ? (gameState.equipped.offHand.weaponDamage ?? { min: 0, max: 0 })
  : { min: 0, max: 0 });

// 修复 any 索引类型
const cost = MathCore.getUpgradeCost(base[b.key as keyof typeof base] ?? 0);
```

### 经验
**TypeScript 严格模式下，未使用的 import 是编译错误，不是警告。** 生产构建前必须先本地跑 `npx tsc -b --noEmit` 验证。

---

## 问题二：Vercel 构建失败 — Rolldown 原生二进制文件找不到

### 现象
```
MODULE_NOT_FOUND
/vercel/path0/node_modules/rolldown/dist/shared/binding-Rc5vBspi.mjs
Node.js v24.14.1
```

### 根本原因
- Vite 8.x 使用 Rolldown 作为打包器，Rolldown 依赖平台原生的 `.node` 二进制文件
- 本地 Windows 生成的 `package-lock.json` 包含 Windows 专用的 Rolldown 二进制引用
- Vercel 默认使用 Node.js 24，Rolldown 尚未为 Node 24 提供预编译二进制

### 解决方案
1. 删除 `clients/web/package-lock.json`（Windows 生成的 lockfile 不能跨平台）
2. 在 `clients/web/package.json` 添加 engines 约束：
   ```json
   "engines": { "node": ">=20.0.0 <22.0.0" }
   ```
3. 添加 `clients/web/.nvmrc` 文件内容为 `20`
4. 在 Vercel 项目设置中将 Node.js 版本改为 **20.x**
5. 构建命令从 `tsc -b && vite build` 改为 `vite build`（tsc 检查在本地做）

### 经验
**package-lock.json 是平台相关的，不能在 Windows 上生成后提交给 Linux CI 使用。** 跨平台项目应在 `.gitignore` 中排除或在 CI 中重新生成。Vite 8.x 尚不稳定，生产项目谨慎升级。

---

## 问题三：HTTPS vs HTTP 混合内容被浏览器拦截

### 现象
```
服务器连接失败: Failed to fetch (http://47.79.240.134:3001)
```
前端部署在 HTTPS（Vercel），后端是 HTTP 裸 IP，浏览器安全策略阻止 HTTPS 页面发起 HTTP 请求。

### 根本原因
**Mixed Content 规则**：HTTPS 页面不允许向 HTTP 地址发请求，这是浏览器强制执行的安全标准，无法绕过。

### 解决方案
给服务端配置 HTTPS，有三种路径：
1. **Cloudflare Tunnel（临时）**：`cloudflared tunnel --url http://localhost:3001`，免费但重启后地址变化
2. **Cloudflare Origin Certificate + 自有域名（推荐）**：永久，免费，15年有效期
3. **Let's Encrypt（公开域名直连）**：适用于 DNS-only 非代理模式的子域名

### 最终选择
- `api.sketchgame.net`（Cloudflare 代理）→ Cloudflare Origin Certificate
- `game.sketchgame.net`（DNS only 直连）→ Let's Encrypt

---

## 问题四：Cloudflare 代理模式（521 错误）

### 现象
访问 `https://api.sketchgame.net` 返回 521 错误。

### 根本原因排查过程
1. 阿里云安全组未开放 80/443 端口（之前只开了 3001）→ 开放后仍 521
2. Cloudflare SSL 模式默认为 Full，服务器无 443 证书 → 改为 Flexible 可绕过但不安全
3. nginx 配置了 `listen 80` 但测试时用 `curl http://localhost` 走 IPv6（::1），而配置未监听 IPv6 → 误判配置有问题
4. **真正原因：缺少源站 SSL 证书**

### 正确解决步骤
1. Cloudflare 控制台生成 Origin Certificate（`*.sketchgame.net`，15年）
2. 上传证书和私钥到服务器 `/etc/ssl/`
3. nginx 配置 `listen 443 ssl` 使用该证书
4. Cloudflare SSL 模式改为 **Full (Strict)**

### 经验
**Cloudflare Origin Certificate 只对 Cloudflare 代理有效，对公网直连无效。** 代理模式和 DNS-only 模式需要不同类型的证书。

---

## 问题五：vercel.app 域名被 GFW 封锁

### 现象
国内用户无法访问 `zaofan-game-web.vercel.app`，必须翻墙。

### 根本原因
GFW 封锁了 `*.vercel.app` 域名，国内无法解析/访问。

### 解决方案：将前端迁移到阿里云新加坡服务器自托管

```bash
# 本地构建
cd clients/web && npm run build

# 上传到服务器
scp -r dist/* root@47.79.240.134:/var/www/zaofan-web/
```

nginx 配置静态文件服务 + SPA fallback：
```nginx
root /var/www/zaofan-web;
location / {
    try_files $uri $uri/ /index.html;
}
```

### 经验
- 新加坡阿里云对国内访问速度良好，无需备案
- 端口 80/443 是标准 Web 端口，GFW 不会无差别封锁（封的是具体 IP/域名）
- 国内阿里云（华东/华北）才需要 ICP 备案，海外节点不受此限制

---

## 问题六：Vite 环境变量在构建时固化

### 现象
上传到服务器的前端仍然连接旧的 `http://47.79.240.134:3001`。

### 根本原因
Vite 的 `VITE_*` 环境变量在 **构建时** 通过字符串替换烧入 JS bundle，不是运行时读取。Vercel 上的环境变量更新不影响本地构建产物。

### 解决方案
每次更新环境变量后必须重新构建：
```bash
# 先更新 clients/web/.env.local
VITE_SERVER_URL=https://api.sketchgame.net

# 再重新构建和上传
cd clients/web && npm run build
scp -r dist/* root@47.79.240.134:/var/www/zaofan-web/
```

### 经验
**Vite 环境变量是编译时常量，不是运行时配置。** 区别于后端的 `process.env`，前端每次环境变化都需要重新构建部署。

---

## 问题七：CORS 白名单未包含新域名

### 现象
```
服务器连接失败: Failed to fetch (https://api.sketchgame.net)
```
前端地址改变后，服务端 CORS 白名单未更新。

### 解决方案
更新服务器 `.env` 文件的 `ALLOWED_ORIGINS`：
```bash
ALLOWED_ORIGINS=http://localhost:5173,https://zaofan-game-web.vercel.app,https://game.sketchgame.net
```
然后重启服务：
```bash
pm2 restart zaofan-server --update-env
```

### 经验
**每次新增前端域名（包括测试域名），都必须同步更新 CORS 白名单并重启服务。** 这是常见的被遗忘的步骤。

---

## 快速参考：部署前检查清单

| 步骤 | 命令/操作 |
|---|---|
| TS 类型检查 | `cd clients/web && npx tsc -b --noEmit` |
| 本地构建 | `cd clients/web && npm run build` |
| 上传前端 | `scp -r dist/* root@47.79.240.134:/var/www/zaofan-web/` |
| 推送服务端 | `git push`（阿里云自动 pull） |
| 更新 CORS | 修改 `/opt/zaofan-server/.env`，`pm2 restart zaofan-server --update-env` |
| 验证 API | `curl https://api.sketchgame.net/health` |
| 验证前端 | 浏览器打开 `https://game.sketchgame.net` |

---

## 关键服务地址

| 服务 | 地址 |
|---|---|
| 游戏前端（国内可访问） | https://game.sketchgame.net |
| 游戏 API | https://api.sketchgame.net |
| Vercel 备用前端（需翻墙） | https://zaofan-game-web.vercel.app |
| 服务器 IP | 47.79.240.134（新加坡阿里云） |
| Supabase 控制台 | https://supabase.com/dashboard |
| Cloudflare 控制台 | https://dash.cloudflare.com |
