# 身份验证 (Authentication)

大宋造反模拟器使用 **Supabase Auth** 作为身份验证方案。

## 认证流程

1. 客户端使用 Supabase Client SDK (Web/Unity) 进行登录（QQ 登录或邮箱登录）。
2. 登录成功后，从 Supabase Session 中获取 `access_token` (JWT)。
3. 在后续的所有 API 请求中，将该 Token 放入 Header 中。

## Header 格式

所有受保护的 `/api/*` 接口均需要以下 Header：

```http
Authorization: Bearer <YOUR_SUPABASE_JWT_TOKEN>
```

- **Token 验证**：服务端会调用 `supabase.auth.getUser(token)` 验证 Token 是否合法及其对应的 `userId`。
- **权限管理**：未提供有效 Token 的请求将返回 `401 Unauthorized`。

---

## 管理员权限 (Admin Access)

部分管理接口（如 `/api/admin/*`）除了需要常规的 `Authorization` Header 外，还需要一个额外的密钥。

```http
Authorization: Bearer <ADMIN_USER_JWT_TOKEN>
x-admin-secret: <SERVER_ADMIN_SECRET>
```

- **x-admin-secret**：必须与服务端环境变量 `ADMIN_SECRET` 一致。
- **用途**：用于防止普通玩家通过手动调用接口访问管理后台。
