# 数据驱动与配置表规范白皮书 (v1.0)
**状态:** 核心规范
**设计宗旨:** 代码与数据严格分离 (Data-Driven Architecture)。所有的升级阈值、怪物属性、产出数值必须从静态配置表中读取，严禁在业务逻辑中硬编码计算。

---

## 1. 经验与等级配置表 (XP Table)
**文件路径:** `src/data/xpTable.ts`
**数据结构:** `Record<number, number>` (Key 为等级，Value 为升到下一级所需经验)。
* **生成基准 (仅供记录查阅):** 表内数据基于多项式拟合曲线生成：`Math.floor(400 + Math.pow(Level, 2) * 50 + Math.pow(Level, 3) * 3)`。
* **数据范围:** 预生成 Level 1 至 Level 100 的数据。

---

## 2. 州府副本配置表 (Dungeon Boss Table)
**文件路径:** `src/data/dungeonTable.ts`
**数据结构:** 游戏内存在多个独立副本（Chapter），每个副本固定包含 10 个关卡（Boss）。

### 2.1 Boss 数据模型 (Interface)
```typescript
export interface DungeonBoss {
  id: string;          // 唯一ID，如 "c1_boss_1"
  name: string;        // Boss 名称，如 "清风寨喽啰"
  description: string; // Boss 描述、梗或典故，用于增加剧情趣味性
  level: number;       // Boss 等级 (决定暴击与护甲压制)
  class: 'CLASS_A' | 'CLASS_B' | 'CLASS_C' | 'CLASS_D'; // Boss 职业 (决定其战斗机制)
  attributes: {
    strength: number;
    dexterity: number;
    intelligence: number;
    constitution: number;
    luck: number;
  };
  weaponDamage: number; // Boss 的基础武器伤害面板
  armor: number;        // Boss 的基础护甲值
  rewardXp: number;     // 击杀奖励经验
  rewardCoins: number;  // 击杀奖励铜钱
}

export interface DungeonChapter {
  id: string;
  name: string;
  bosses: DungeonBoss[]; // 固定长度为 10
}