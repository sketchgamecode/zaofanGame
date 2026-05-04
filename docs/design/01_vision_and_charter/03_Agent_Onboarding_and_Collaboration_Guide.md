# ZaoFan 项目 AI Agent 入职与协作通用指南

欢迎加入《大宋造反模拟器》开发组。为了确保不同职责的 AI Agent 能够像一个团队一样高效协作，所有成员必须遵守本指南。

---

## 1. 项目核心北极星 (North Star)

*   **机制核心**：100% 精确复刻 Shakes & Fidget (2011 经典版) 的数值与系统逻辑。**禁止擅自“微创新”。**
*   **题材包装**：中国古代历史、武侠、神魔文学大杂烩，带有讽刺与黑色幽默色彩。
*   **技术架构**：服务端唯一权威 (Server Authority)，客户端仅负责渲染与交互。

---

## 2. Agent 职责手册 (Role-Specific Rules)

### 2.1 游戏设计 Agent (Designer Agent)
*   **核心任务**：将参考资料（分析报告）转化为具体的系统规格书 (System Specs)。
*   **必读路径**：`docs/design/03_external_reports/`。
*   **协作纪律**：
    *   在产出设计前，必须查阅 `server/tdd/`，确保设计方案与已有的技术实现（如资源命名 `tokens`, `thirst` 等）兼容。
    *   所有设计必须包含“验收标准”，以便下游 Agent 执行。

### 2.2 服务端 Agent (Server Agent)
*   **核心任务**：实现逻辑，并维护技术事实来源 (TDD)。
*   **必读路径**：`server/src/` & `server/tdd/`。
*   **协作纪律**：
    *   实施完成后，**必须同步更新** `server/tdd/` 下的相关文档（API 总表、存档结构等）。
    *   `server/tdd/` 的内容必须与代码实现 100% 保持一致，它是所有 Agent 的“物理真相”。

### 2.3 客户端 Agent (Client Agent)
*   **核心任务**：实现 UI/UX 表现。
*   **必读路径**：`server/tdd/api_master_list.md`。
*   **协作纪律**：
    *   严格遵守 API 契约，**禁止在本地编写任何涉及游戏机制的逻辑**（如本地计算掉落、本地扣除体力）。
    *   如发现服务端数据缺失，应向 Server Agent 提出需求，而非自行脑补。

---

## 3. 真相源 (SSoT) 导航

如果你不确定某个信息，请按以下路径查找，**严禁引用长聊天历史作为依据**：

| 信息类型 | 查阅位置 (SSoT) |
| :--- | :--- |
| **产品愿景与文案风格** | `docs/design/01_vision_and_charter/` |
| **原始机制参考** | `docs/design/03_external_reports/` |
| **具体系统设计规格** | `docs/design/04_system_specs/` |
| **技术实现/API/存档结构** | `server/tdd/` |

---

## 4. 协作通用禁令 (Golden Rules)

1.  **禁止脑补**：不确定的数值、公式或名称，必须标记为 `unknown` 并请求 User 或 Designer 澄清。
2.  **文档优先**：代码变动，文档先行。实施完成后必须清理/更新对应的 TDD 文档。
3.  **简洁沟通**：在回复 User 时保持简洁，直接汇报结果或提出待解决的问题。
4.  **尊重权限**：所有 `Draft` 状态的设计文档不可进入开发，必须等待 User 审批为 `Approved`。

---
*本项目由 USER 总负责，所有 Agent 行为均受 Git 版本控制记录。*
