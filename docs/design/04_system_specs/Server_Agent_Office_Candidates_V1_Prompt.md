# Server Agent Prompt: Office Candidates and Plotting V1

请实现“吏部任免台：职位候选人与谋缺诊断 V1”的服务端只读基础。当前阶段不需要兼容旧存档。

## 背景

服务端已经有：

- `WORLD_SERVICE_POSITION_GET_DETAIL`
- `WORLD_SERVICE_POSITIONS_GET_LIST`
- `WORLD_SERVICE_POSITION_LEDGER_GET`
- 职位任期与 KPI
- 职位人事权 / 财权 / 分账
- 职位收益账本
- bot 离线模拟账本

现在玩家已经能看到职位和收益，但还需要知道：

1. 我能不能谋这个缺？
2. 我差什么？
3. 谁比我更有资格？
4. 我下一步应该去哪里办事或削弱谁？

本阶段只做只读解释和候选人列表，不做真正任命、撤换、申请、挑战按钮。

## 新增类型建议

```ts
type OfficeCandidateScoreItem = {
  label: string;
  value: number;
  passed: boolean;
  hint: string;
};

type OfficeCandidateView = {
  actorId: string;
  kind: 'player' | 'bot';
  displayName: string;
  avatarId: string;
  level: number;
  faction: PowerFactionId;
  powerShare: number;
  combatRating?: number;
  isCurrentPlayer: boolean;
  score: number;
  scoreBreakdown: OfficeCandidateScoreItem[];
  recommendation: string;
};

type OfficeCandidateListView = {
  positionId: string;
  incumbent: OfficeCandidateView;
  currentPlayer?: OfficeCandidateView;
  candidates: OfficeCandidateView[];
  plottingAdvice: string[];
};
```

## 新增 API

```ts
WORLD_SERVICE_POSITION_CANDIDATES_GET
```

Request:

```ts
{
  positionId: string;
  limit?: number; // 默认 8，最大 20
}
```

Response:

```ts
OfficeCandidateListView
```

错误码：

- `POSITION_ID_REQUIRED`
- `POSITION_NOT_FOUND`

## 候选人池规则

候选人来源：

1. 当前玩家 actor 必须进入候选评估，即使分数很低。
2. 同地点同 faction 的 bot / player。
3. 同 ownerFaction 的 bot / player。
4. 若不足，再从全世界 actor 兜底。

过滤与排序：

1. 保留当前 incumbent。
2. 候选人按 `score` 降序。
3. 同分按 `powerShare` 降序。
4. 再按等级降序。
5. 最后按 actorId 稳定排序。

不要删除或改变任何 actor，不要改变职位。

## 分数规则 V1

保持简单，不要做复杂 AI。

建议满分 100：

1. 等级门槛：20 分
   - `level >= position.minLevel` 得 20，否则按比例给分。
2. 权柄：30 分
   - `powerShare` 高于 incumbent 得满分。
   - 不足则按比例给分。
3. 派系匹配：20 分
   - `candidate.faction === position.ownerFaction` 得满分。
   - appointment controller faction 相近可给半分。
4. KPI 机会：15 分
   - incumbent KPI 未达标时，候选人得分更高。
   - incumbent KPI 达标时，候选人显示“暂难撬动”。
5. 考功 / 职务适配：15 分
   - 可暂用 combatRating 或 level 近似。
   - 后续再接职业、服务类型和专长。

每项都要写入 `scoreBreakdown`，用于前端展示。

## currentPlayer 诊断文案

`recommendation` 要给玩家可理解的中文短句。

例子：

- “等级足够，但权柄低于现任，先去北镇抚司办差削弱对手。”
- “此缺归吏部文选司掌人事，需先提高该门路权柄。”
- “现任本期交税不足，考功时有机会被撤。”
- “你权柄已高于现任，若能取得上意，可入特旨调换名单。”
- “派系不合，需先改换门路或依附该职位的人事主管。”

## plottingAdvice

返回 3-5 条面向玩家的谋缺建议。

建议生成逻辑：

1. 如果玩家等级不足：提示先升级。
2. 如果玩家权柄不足：提示去相关任务点夺权柄。
3. 如果 incumbent KPI 失败：提示等考功或走吏部。
4. 如果 position 是北镇抚司相关：提示该处任务会削弱目标权柄。
5. 如果玩家派系不合：提示找靠山或换门路。

## 扩展 WORLD_SERVICE_POSITION_GET_DETAIL

在原有详情回包里加入一个轻量摘要：

```ts
candidatesPreview?: {
  currentPlayerRank?: number;
  topCandidate?: OfficeCandidateView;
  advice: string[];
};
```

不要把完整候选列表塞进 detail，完整列表走 `WORLD_SERVICE_POSITION_CANDIDATES_GET`。

## 测试要求

新增/更新测试：

1. `WORLD_SERVICE_POSITION_CANDIDATES_GET` 缺 positionId 抛 `POSITION_ID_REQUIRED`。
2. 不存在 positionId 抛 `POSITION_NOT_FOUND`。
3. 当前玩家一定会出现在评估结果中。
4. incumbent 一定返回。
5. candidates 按 score 降序。
6. scoreBreakdown 包含等级、权柄、派系、KPI、适配五类。
7. incumbent KPI 不达标时，plottingAdvice 提示考功机会。
8. 玩家权柄低于 incumbent 时，recommendation 提示先提高或削弱权柄。
9. `WORLD_SERVICE_POSITION_GET_DETAIL` 返回 candidatesPreview。
10. 不改变 world actors、职位 occupant、权柄总量。
11. TypeScript 编译通过，全量 Vitest 通过。

## 文档要求

更新：

- `server/tdd/api_master_list.md`
- `server/tdd/player_save_schema.md`，如有新增持久字段；若全是派生视图，请明确“不入存档”
- `server/tdd/error_code_dictionary.md`，如新增错误码
- `server/tdd/global_config_and_limits.md`，记录候选列表默认 limit / 最大 limit

## 非目标

本阶段不要做：

1. 真正任命 API。
2. 真正撤换职位。
3. 玩家申请职位。
4. 消耗权柄谋缺。
5. 皇帝特旨执行。
6. 社交消息、私聊、通知。
7. 复杂 AI 派系政治。

本阶段目标只有一个：让玩家看懂自己和其他候选人离这个职位还有多远。
