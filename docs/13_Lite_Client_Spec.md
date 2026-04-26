# 大宋造反模拟器 — Lite 客户端开发规范

> 本文档供独立开发Agent使用。目标：用最少代码实现一个可玩的极简Web客户端。

---

> [!CAUTION]
> **严禁复用 `clients/lite/src/` 目录下的任何现有代码！**
> 该目录中的旧代码大量依赖本地 `@core`、`@data`、`setGameState(...)` 本地演算，与服务端权威原则完全冲突。
> **请从空白 HTML 文件开始重写。**

---

## 一、项目背景

游戏后端已完成，所有游戏逻辑都在服务端。客户端**只负责展示和发请求**，不做任何业务逻辑计算。

- **后端 API**：`https://api.sketchgame.net`
- **现有主客户端**（参考用）：`https://game.sketchgame.net`（React + TypeScript，可参考但不要抄代码结构）
- **本次目标路径**：`clients/lite/` 目录下

---

## 二、技术要求

| 项目 | 要求 |
|---|---|
| 框架 | **纯 HTML + Vanilla JS**（无框架，无 npm 构建），单 `index.html` 文件即可 |
| 样式 | 引用 CDN Tailwind CSS v3 |
| 认证 | 引用 CDN `@supabase/supabase-js` 做登录 |
| 部署 | 静态文件，放到 `clients/lite/` 即可，CI/CD 会自动上传 |

---

## 三、认证流程

使用 **Supabase** 登录（邮箱+密码）。

```js
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// 登录
await supabase.auth.signInWithPassword({ email, password });

// 获取 JWT token（每次请求都要带）
const { data: { session } } = await supabase.auth.getSession();
const token = session.access_token;
```

**Supabase 配置**（直接写在代码里，是公开 key，安全）：
```js
const SUPABASE_URL = 'https://kstzpcgwqxgxdcxuzqwg.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtzdHpwY2d3cXhneGRjeHV6cXdnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQzMzQwMDIsImV4cCI6MjA4OTkxMDAwMn0.WHoV0ETfh37TMhE-UynHFa7K1EAIeJVjU0tgqTI-d-U';
const API_URL = 'https://api.sketchgame.net';
```

---

## 四、核心API调用

### 4.1 加载存档

```
GET https://api.sketchgame.net/api/save
Header: Authorization: Bearer <token>

// 新玩家（无存档）
Response: { save: null, isNewPlayer: true }

// 老玩家（有存档）
Response: { save: GameState, saveVersion: number, updatedAt: string }

// 判断逻辑：
if (data.isNewPlayer || !data.save) {
  // 新玩家：立即调用 GENERATE_MISSIONS 初始化
} else {
  gs = data.save; // 直接使用
}
```

### 4.2 执行游戏动作（唯一写入接口）

```
POST https://api.sketchgame.net/api/action
Header: Authorization: Bearer <token>
Body: { "action": "ACTION_NAME", "payload": {} }

Response: { success: bool, gameState: GameState, log: [...], error?: string, data?: any }
```

> **每次成功的 action 响应里都包含最新的 gameState，直接用来更新 UI，不要自己算！**

---

## 五、所有支持的 Action

| Action | payload | 说明 |
|---|---|---|
| `GENERATE_MISSIONS` | `{}` | 生成3个任务选项（存在 gameState.availableMissions） |
| `START_MISSION` | `{ missionId }` | 开始任务（扣精力，记录 endTime） |
| `COMPLETE_MISSION` | `{ forceDrop?: bool }` | 完成任务结算 |
| `SKIP_MISSION` | `{}` | 花1通宝立即完成任务 |
| `UPGRADE_ATTRIBUTE` | `{ attribute: "strength"\|"intelligence"\|"agility"\|"constitution"\|"luck" }` | 升属性（扣铜钱） |
| `TAVERN_DRINK` | `{}` | 买酒恢复精力（每日上限10次，每次1通宝） |
| `EQUIP_ITEM` | `{ slot, itemIndex }` | 装备背包里第 itemIndex 个物品到 slot |
| `UNEQUIP_ITEM` | `{ slot }` | 脱下装备 |
| `BLACK_MARKET_REFRESH` | `{}` | 刷新黑市（花1通宝） |
| `BLACK_MARKET_BUY` | `{ itemIndex }` | 购买黑市第 itemIndex 个物品 |
| `ARENA_FIGHT` | `{}` | **服务端自动生成NPC、模拟战斗、结算状态**，响应 `data` 里包含 `playerWon/npcName/npcLevel/coinGain` 等供客户端展示动画 |
| `ARENA_SKIP_COOLDOWN` | `{}` | 花1通宝跳过竞技场冷却 |
| `GUARD_WORK_START` | `{ hours }` | 开始押镖（1-10小时） |
| `GUARD_WORK_CLAIM` | `{}` | 领取押镖报酬 |
| `DUNGEON_FIGHT` | `{ chapterId }` | **服务端模拟与Boss战斗、结算进度**，响应 `data` 里包含 `playerWon/bossName/coinGain` 等 |
| `DEBUG_CHEAT` | `{ preset?: "money"\|"tokens"\|"xp"\|"food" }` | 开发作弊（生产环境已禁用） |

---

## 六、GameState 数据结构

```typescript
// 以下是完整字段集，以 server/src/types/gameState.ts 为准
GameState = {
  playerLevel: number,
  classId: 'CLASS_A' | 'CLASS_B' | 'CLASS_C' | 'CLASS_D',
  exp: number,
  attributes: { strength, intelligence, agility, constitution, luck },  // 基础属性（不含装备加成）
  resources: { copper, prestige, rations, tokens, hourglasses },
  equipped: { head, chest, hands, feet, neck, belt, ring, trinket, mainHand, offHand },  // Equipment | null
  inventory: Equipment[],
  activeMission: { id, name, endTime, coinReward, expReward, foodCost, durationSec, type, dropRate } | null,
  availableMissions: ActiveMission[],  // 3选扩1任务池，类型同 ActiveMission
  blackMarket: { items: (Equipment | null)[], lastRefresh: number },
  dungeonProgress: { chapter_1: number, chapter_2: number, ... },
  dungeonDailyAttempt: { date: string, used: number },
  lastRationsRefill: number,       // 干粮上次回复时间（timestamp ms）
  arenaWins: number,
  arenaDailyXP: { date: string, wins: number },
  arenaCooldownEndTime: number,    // 竞技场冷却结束时间（timestamp ms）
  tavernDailyDrinks: { date: string, count: number },
  activeGuardWork: { endTime: number, coinReward: number } | null,
  lastUpdated: number,             // 存档最后更新时间（timestamp ms）
}
```

### 职业说明
| classId | 名称 | 主属性 |
|---|---|---|
| CLASS_A | 猛将 | 力量 |
| CLASS_B | 游侠 | 敏捷 |
| CLASS_C | 谋士 | 智谋 |
| CLASS_D | 刺客 | 敏捷（双持） |

---

## 七、战斗展示（客户端仅做UI动画）

> [!IMPORTANT]
> **客户端不做任何胜负判定。** 调用 `ARENA_FIGHT` 或 `DUNGEON_FIGHT` 后，从响应的 `data.playerWon` 读取结果，根据这个值播放胜利或失败的动画/文字。

```js
// Arena 战斗示例
const res = await callAction('ARENA_FIGHT', {});
if (res.success) {
  const { playerWon, npcName, npcLevel, coinGain, prestigeDiff } = res.data;
  showBattleResult(playerWon, `对手：${npcName} Lv.${npcLevel}`, coinGain);
}

// Dungeon 战斗示例  
const res = await callAction('DUNGEON_FIGHT', { chapterId: 'chapter_1' });
if (res.success) {
  const { playerWon, bossName, coinGain, xpGain } = res.data;
  showBattleResult(playerWon, `Boss：${bossName}`, coinGain);
}
```

客户端**不需要**实现任何战斗算法，只需根据 `data.playerWon` 显示对应界面。

---

## 八、Dungeon 章节数据

章节列表（对应 `gameState.dungeonProgress` 的 key）：

| chapterId | 名称 | 解锁等级 | Boss数 |
|---|---|---|---|
| chapter_1 | 第一章 | 1 | 10 |
| chapter_2 | 第二章 | 15 | 10 |
| chapter_3 | 第三章 | 25 | 10 |
| chapter_4 | 第四章 | 35 | 10 |
| chapter_5 | 第五章 | 45 | 10 |
| chapter_6 | 第六章 | 55 | 10 |

---

## 九、UI 最低要求（6个页面/Tab）

> 极简即可，文字列表比图形更省时间。

1. **人物** — 显示等级/经验/属性，按钮升级属性（显示升级费用），显示已装备列表
2. **行囊** — 显示背包物品列表，点击装备
3. **客栈** — 显示精力值，生成/选择任务，任务进行中显示倒计时，完成后弹出奖励
4. **竞技场** — 点击「出战」按钮触发 `ARENA_FIGHT`，等待响应后显示 `data.npcName/npcLevel` 和胜负结果，**不要本地生成NPC或计算属性**
5. **州府** — 选章节，挑战Boss，显示进度
6. **黑市** — 刷新物品列表，购买按钮

---

## 十、注意事项

1. **所有状态改变必须通过 `/api/action`**，不能本地修改后直接用
2. **每次 action 成功后，用响应里的 `gameState` 替换本地变量**，重新渲染 UI
3. **任务完成判断**：`Date.now() >= gameState.activeMission.endTime`
4. **升级属性费用公式**：`Math.floor(10 * Math.pow(1.1, 当前属性值))`（仅供展示，扣费在服务端）
5. **新玩家注册**：`supabase.auth.signUp({ email, password })`，注册后自动登录
6. 不需要支持离线、不需要 localStorage、不需要 Service Worker

---

## 十一、参考文件路径

```
clients/lite/                    ← 你的工作目录（从空白开始！）
server/src/types/gameState.ts    ← 完整 GameState 类型定义（仅供查阅字段名）
server/src/engine/index.ts       ← 所有 Action 注册表（仅供查阅支持的动作名）
docs/00_Architecture_Overview.md ← 整体架戶说明
```

> [!IMPORTANT]
> 参考以上文件时，**仅用于确认字段名和 Action 名称**。
> 严禁将服务端类型文件中的公式、算法、常量复刻到客户端。所有计算均在服务端完成，客户端只读取并展示结果。
