# 装备文案与配置生成管线 (Item Generation Pipeline)
Status: Draft (待审批)
Designer: Antigravity
Implementation Allowed: Yes

---

## 1. 管线概述 (Pipeline Overview)

《大宋造反模拟器》需要海量的装备库来支撑长期的数值成长体验。为了在保证质量（符合《大宋造反模拟器文案规范》的黑色幽默）的前提下实现高产量，我们将采用 **AI 辅助矩阵生成法**。

本管线定义了如何指导“文案 Agent”或直接通过 LLM Prompt 批量产出 `equipment_table.json` 的标准流程。

---

## 2. 词缀矩阵法 (Affix Matrix Method)
用于批量生成**普通 (Normal) 和优秀 (Excellent)** 品质的装备。这些装备数量极其庞大，通过动态组合可以产生近乎无限的变化。

### 2.1 命名公式
`[前缀形容词] + [物品词根] + [后缀/产地/典故]`
*   **前缀池 (Prefixes)**：破损的、沾血的、贪官用过的、从死人堆扒出来的、散发着异味的...
*   **词根池 (Roots)**：朴刀、长枪、幞头、皂罗袍、玉佩、护心镜...
*   **后缀池 (Suffixes)**：(汴京特供)、(法场退役版)、(走私货)、(梁山泊认证)...

### 2.2 生成示例
*   【从死人堆扒出来的】+【步人甲】+【(法场退役版)】
*   【沾满油污的】+【杀猪刀】+【(高太尉亲属专用)】

---

## 3. 定制化风味描述 (Flavor Text Template)
用于生成**史诗 (Epic)、传说 (Legendary) 和 神器 (Artifact)**。高级装备必须有固定的 ID 和专属的段子描述。

### 3.1 Prompt 模板 (给文案 Agent 的指令)
```text
你是一个精通《水浒传》和《大宋野史》，且极具黑色幽默感的文案策划。
请为《大宋造反模拟器》生成 10 件【史诗级】武器配置表。
要求：
1. 槽位 (Slot)：weapon
2. 名称必须是四字到六字的专属名词（如：禁军教头之恨）。
3. 描述 (Description) 必须符合“古代语境化的现代梗”或“悲剧宿命感”的黑色幽默。
4. 严禁使用现代词汇（如 yyds, 绝绝子, 互联网黑话）。
5. 格式输出为 JSON 数组：[{id, name, slot, rarity, description}]
```

---

## 4. 产出 Demo：首批 10 件装备配置表 (Proof of Concept)

以下是通过上述逻辑试生成的 Demo 数据，可直接供后端开发作为初始化的 Seed Data：

```json
[
  {
    "id": "wpn_epic_001",
    "name": "高衙内的折扇",
    "slot": "weapon",
    "rarity": 2,
    "description": "扇骨是用上等沉香木做的，可惜上面沾满了强抢民女时溅上的胭脂和鼻血。用来打人伤害不高，但侮辱性极强。"
  },
  {
    "id": "wpn_epic_002",
    "name": "提辖的开环戒刀",
    "slot": "weapon",
    "rarity": 2,
    "description": "刀刃上豁了几个口子，据说是砍镇关西时用力过猛崩坏的。现在这把刀只对卖肉的屠户有真实伤害加成。"
  },
  {
    "id": "body_epic_001",
    "name": "生辰纲押运官软甲",
    "slot": "body",
    "rarity": 2,
    "description": "防护性能极佳，唯一的缺点是穿上它的人走过黄泥冈时必定会口渴犯困。已被朝廷列为不祥之物。"
  },
  {
    "id": "head_epic_001",
    "name": "林教头的风雪毡帽",
    "slot": "head",
    "rarity": 2,
    "description": "虽然很保暖，但戴上它总觉得头顶绿油油的，且有一股强烈的想烧草料场的冲动。"
  },
  {
    "id": "ring_legendary_001",
    "name": "蔡太师的祖传扳指",
    "slot": "ring",
    "rarity": 3,
    "description": "极品和田玉打造。原本值一万贯，但因为上一任主人刚被抄家凌迟，现在黑市只卖十个铜板，附赠一身霉运。"
  },
  {
    "id": "offhand_epic_001",
    "name": "汴京府尹的惊堂木",
    "slot": "offHand",
    "rarity": 2,
    "description": "拍下去震耳欲聋。对于那些没钱行贿的犯人，这块木头比任何武器都致命。"
  },
  {
    "id": "feet_normal_001",
    "name": "沾血的草鞋",
    "slot": "feet",
    "rarity": 0,
    "description": "非常便宜的草鞋。上一位主人穿着它跑了八百里水路，最后还是在菜市口被追上了。"
  },
  {
    "id": "neck_epic_001",
    "name": "李师师的半截肚兜",
    "slot": "neck",
    "rarity": 2,
    "description": "上面残留着龙涎香的味道。由于某种不可言说的原因，这件装备对朝廷命官有绝对的防御力。"
  },
  {
    "id": "wpn_legendary_001",
    "name": "方腊的雕龙明教斧",
    "slot": "weapon",
    "rarity": 3,
    "description": "吃菜事魔，替天行道。斧头很锋利，但用久了会产生一种‘我能当皇帝’的致命幻觉。"
  },
  {
    "id": "belt_epic_001",
    "name": "充军囚犯的铁枷锁",
    "slot": "belt",
    "rarity": 2,
    "description": "极其沉重，严重降低敏捷，但能有效防止你在流放途中逃跑。大宋刑部推荐产品。"
  }
]
```

---
*Last Updated: 2026-05-04*
