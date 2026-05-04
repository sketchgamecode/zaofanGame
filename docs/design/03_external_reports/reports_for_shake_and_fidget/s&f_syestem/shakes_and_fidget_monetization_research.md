# Shakes and Fidget (S&F) 变现设计研究摘要

> **游戏信息**: Shakes and Fidget — 德国 Playa Games 开发的浏览器/手机 Idle RPG
> **开发商**: Playa Games (Stillfront Group 旗下)
> **运营平台**: Web浏览器、iOS、Android、Steam
> **商业模式**: Free-to-Play + IAP（应用内购买）
> **核心付费货币**: 蘑菇（Mushrooms/Shrooms）
> **研究日期**: 2026年4月29日

---

## 一、蘑菇（Mushroom）货币系统

### 1.1 货币概述
蘑菇是 S&F 唯一的高级付费货币（Premium Currency），用于几乎所有加速和便利性功能。蘑菇**不可转让**给其他账号。

### 1.2 购买方式
- **蘑菇商（Mushroom Dealer）**: 通过游戏内左上角"+"图标或导航栏蘑菇商人图标进入
- **WebShop**: https://home.sfgame.net/#/shop/
- **支付方式**: PayPal、手机话费、SMS、iTunes、Google Pay 等

### 1.3 蘑菇价格档位

**官方未公开精确定价**（价格因地区、货币、平台、购买数量而异）。根据社区零散信息：

| 参考价格（第三方/灰色市场） | 蘑菇数量 | 备注 |
|---|---|---|
| ~80 EUR | 1,250 蘑菇 | 非官方渠道 |
| ~75 EUR | 3,000 蘑菇 | 非官方渠道 |

> **重要说明**: 官方帮助中心**不公开**具体欧元/美元定价，仅说明价格受"玩家所在地区、支付货币类型、购买数量"等因素影响。Steam 版、移动端和网页版定价可能不同。

### 1.4 限时优惠/促销
| 促销类型 | 加成 |
|---|---|
| **常规促销** | +20% 蘑菇 |
| **季节性促销（如黑五）** | 特殊包 +20%；普通包 **最高 +33%** |
| **黑五特别活动** | 特殊包 +20%/普通包最高 +33%，任务中蘑菇掉率提升 |

> **来源**: [Playa Games 帮助中心 - Mushroom Dealer](https://playa-games.helpshift.com/hc/en/4-shakes-fidget-1653988985/faq/105-mushroom-dealer/), [sfporadnik.pl - Black Friday](https://en.sfporadnik.pl/showNews.php?id=29)

---

## 二、一次性礼包系统（Mushroom Packs）

游戏提供按等级解锁的**一次性购买礼包链**，形成阶梯式付费引导：

| 礼包名称 | 等级要求 | 前置条件 | 蘑菇数量 | 其他内容 |
|---|---|---|---|---|
| **Starter Pack** | Lv 1-20 | 无 | 150 | 1,000金、长生不老药水、**最佳坐骑4周** |
| **Fortress Pack** | ≤ Lv 100 | 堡垒≥Lv1 | 300 | 100,000木材、50,000石头、1级经验值 |
| **Pro Pack** | Lv 120+ | 解锁竞技场经理+塔+地下世界+宠物 | 750 | 1,000沙漏、100,000灵魂、50,000奥术碎片 |
| **Pro+ Pack** | Lv 150+ | 已购 Pro Pack | 1,500 | 1,500沙漏、150,000灵魂、75,000奥术碎片 |
| **Pro Pro Pack** | Lv 200+ | 已购 Pro+ Pack | 3,250 | 2,500沙漏、200,000灵魂、100,000奥术碎片 |
| **Pro++ Pack** | Lv 250+ | 已购 Pro Pro Pack | 1,500 | 1,500沙漏、100,000奥术碎片、500幸运币 |
| **Triple Pro Pack** | Lv 300+ | 已购 Pro++ Pack | 3,350 | 2,500沙漏、150,000奥术碎片、1,000幸运币 |

**所有礼包蘑菇总计**: **10,800 蘑菇**
**设计意图**: 用高等级里程碑 + 前置依赖链，形成长期留存+付费激励

> **来源**: [Playa Games 帮助中心 - Mushroom Dealer](https://playa-games.helpshift.com/hc/en/4-shakes-fidget-1653988985/faq/105-mushroom-dealer/)

---

## 三、黑市（Black Market）

- 位于蘑菇商内的一个区域
- 用**游戏内货币**（幸运币或蘑菇）兑换物品
- 每个优惠**7天内限购1次**，7天后刷新或更换
- 购买后标记为"已售罄"
- **来源**: [Playa Games 帮助中心 - Mushroom Dealer](https://playa-games.helpshift.com/hc/en/4-shakes-fidget-1653988985/faq/105-mushroom-dealer/)

---

## 四、坐骑系统（Mounts/Stables）

### 4.1 坐骑价格与效果

| 坐骑 | 价格 | 旅行时间缩短 | 远征奖励加成 | 租期 |
|---|---|---|---|---|
| **牛 (Cow)** | 1 金 | -10% | +11% | 14天 |
| **猪 (Pig)** | 1 金 | -10% | +11% | 14天 |
| **马 (Horse)** | 5 金 | -20% | +25% | 14天 |
| **狼 (Wolf)** | 5 金 | -20% | +25% | 14天 |
| **虎 (Tiger)** | 10 金 + **1 蘑菇** | -30% | +42% | 14天 |
| **迅猛龙 (Raptor)** | 10 金 + **1 蘑菇** | -30% | +42% | 14天 |
| **狮鹫龙 (Griffin Dragon)** | **25 蘑菇** | **-50%** | **+100%** | 14天 |
| **龙狮鹫 (Dragon Griffin)** | **25 蘑菇** | **-50%** | **+100%** | 14天 |

### 4.2 坐骑付费设计分析
- **低门槛混合付费**: 虎/迅猛龙仅需 1 蘑菇 + 金币，降低首次付费心理门槛
- **核心付费项**: 狮鹫龙/龙狮鹫（25 蘑菇/14天），是最大的"蘑菇消耗器"
- **持续消耗设计**: 租期仅14天，需要持续投入
- **产出补偿**: 狮鹫龙缩短50%任务时间 = 14天内可做双倍任务量，但会降低蘑菇发现率
- **阵营差异**: 根据角色阵营（善恶）显示不同坐骑外观，效果相同
- **狮鹫龙/龙狮鹫特殊奖励**: 租用和续期时额外获得一次环境加成金奖励

### 4.3 坐骑对蘑菇获取的影响
| 场景 | 蘑菇发现率 |
|---|---|
| 无坐骑 | **8%** |
| 有狮鹫坐骑 | **5%** |
| 设计逻辑 | 旅行速度越快，越少机会"偶遇"蘑菇 |

> **来源**: [Playa Games 帮助中心 - Stable](https://playa-games.helpshift.com/hc/en/4-shakes-fidget-1653988985/faq/44-stable/), [Fandom Wiki - Stables](https://sfgame.fandom.com/wiki/Stables)

---

## 五、酒馆任务系统（Thirst for Adventure）

### 5.1 基础机制
| 参数 | 数值 |
|---|---|
| 每日基础口渴值 | **100 点** |
| 每分钟任务消耗 | 1 点口渴值 |
| 午夜自动重置 | 恢复至 100 |

### 5.2 蘑菇购买啤酒（核心付费点）

| 参数 | 数值 |
|---|---|
| 每杯啤酒价格 | **1 蘑菇** |
| 每杯啤酒恢复 | **20 点口渴值** |
| 每日最大购买量 | **10 杯** |
| 10杯总成本 | **10 蘑菇/天** |
| 10杯总计恢复 | **200 点口渴值** |
| 基础+满啤酒总口渴 | **300 点** |
| **蘑菇日消耗上限** | **10 蘑菇/天**（仅啤酒） |

### 5.3 任务跳过
| 方式 | 成本 |
|---|---|
| 用沙漏跳过 | 消耗沙漏 |
| 用蘑菇跳过 | **1 蘑菇**（仅限23:00-23:59） |
| 看广告跳过 | 仅限 Android/iOS |
| 活动免费跳过 | Piecework Party 活动 |

### 5.4 Tavern Gambler（酒馆赌徒）
- 可用金币或蘑菇下注
- **前置条件**: 必须至少在蘑菇商处购买过一次蘑菇（强制付费门槛）
- 赢了可获得蘑菇奖励

> **来源**: [Playa Games 帮助中心 - Tavern](https://playa-games.helpshift.com/hc/en/4-shakes-fidget-1653988985/faq/16-tavern/), [sfporadnik.pl - Tavern](https://www.en.sfporadnik.pl/tavern.php)

---

## 六、自动冒险机（Adventuromatic / Time Machine）

| 参数 | 数值 |
|---|---|
| 最大升级等级 | 15 |
| Lv1-10 产生口渴值 | 每级 1 点 |
| Lv11-15 产生口渴值 | 每级 2 点 |
| Lv15 最大每日产生 | **20 点口渴值** |
| **蘑菇填充** | 用蘑菇自动购买未消耗的啤酒 |
| 奖励类型 | 仅 XP、金、荣誉（**无蘑菇、物品、水果**） |
| 活动加成 | **不适用**周末活动加成 |

> **来源**: [Playa Games 帮助中心 - Adventuromatic](https://playa-games.helpshift.com/hc/en/4-shakes-fidget-1653988985/faq/86-adventuromatic/)

---

## 七、幸运轮盘（Dr. Abawuwu's Wheel of Fortune）

### 7.1 基础规则

| 参数 | 数值 |
|---|---|
| 每日免费旋转 | **1 次** |
| 每日最大旋转次数 | **20 次** |
| 每次额外旋转（蘑菇） | **1 蘑菇** |
| 每次额外旋转（幸运币） | **10 幸运币** |
| 每日蘑菇最大消耗 | **19 蘑菇** |

### 7.2 轮盘 V1（角色等级 ≤ 124）

| 奖励 | 数值 |
|---|---|
| 蘑菇 | 3 个 |
| 随机物品 | 含史诗物品 |
| 木材 | 仓库 1% 或 2% |
| 石头 | 仓库 1% 或 2% |
| 经验 | 等级相关（x1 或 x2） |
| 金币 | 等级相关（最高 5,000,000 或 10,000,000） |

### 7.3 轮盘 V2（角色等级 ≥ 125 + 解锁宠物/地下世界/铁匠）

| 奖励 | 数值 |
|---|---|
| 蘑菇 | 3 个 |
| 随机物品 | 含史诗物品 |
| 随机水果 | 1 个 |
| 木材 | 仓库 3% |
| 石头 | 仓库 3% |
| 灵魂 | 灵魂提取器 2 小时产量 |
| 奥术碎片 | 约 80-160 |
| 经验 | 等级相关（x1 或 x2） |
| 金币 | 等级相关（最高 15,000,000） |

### 7.4 设计分析
- **低门槛沉没成本**: 第1次免费，第2次只需 1 蘑菇，逐步诱导消费
- **每日蘑菇上限**: 19 蘑菇（轮盘）+ 10 蘑菇（啤酒）= 每日潜在消耗 29 蘑菇
- **等级升级激励**: Lv125 解锁 V2 轮盘（更高奖励），驱动等级提升和长期留存

> **来源**: [Playa Games 帮助中心 - Dr. Abawuwu](https://playa-games.helpshift.com/hc/en/4-shakes-fidget-1653988985/faq/104-dr-abawuwu/), [sfporadnik.pl - Abawuwu](https://en.sfporadnik.pl/abawuwu.php)

---

## 八、铁匠系统（Blacksmith，Lv 90 解锁）

| 服务 | 蘑菇费用 | 备注 |
|---|---|---|
| **添加宝石插槽** | **25 蘑菇**（或金属+奥术碎片） | 基于物品品质定价 |
| **宝石提取** | **10 蘑菇**（或金属+奥术碎片） | 替代方案 |
| **属性升级** | 无（金属+奥术碎片） | 最多 20 次，费用递增 |
| **符文交换** | **20 蘑菇** | 两件装备间交换符文加成 |
| **史诗物品外观变更** | **10 蘑菇** | 仅限图鉴已解锁外观 |
| **每日拆解上限** | 5 件/天 | 武器算 2 件 |

> **来源**: [sfporadnik.pl - Blacksmith](https://en.sfporadnik.pl/blacksmith.php), [number13.de - Blacksmith](https://en.number13.de/shakes-fidget-all-about-the-blacksmith/), [Playa Games 帮助中心 - Upgrades](https://playa-games.helpshift.com/hc/en/4-shakes-fidget-1653988985/faq/344-upgrades/)

---

## 九、女巫系统（Witch，Lv 66 解锁）

| 服务 | 蘑菇费用 | 备注 |
|---|---|---|
| **装备附魔** | 无（需收集装备材料） | 全服进度驱动，24小时仪式 |
| **药水制作** | 无（需10个同类水果） | 5种属性药水 |
| **出售装备** | 无 | 获得普通售价 **2 倍** 金币 |
| **免费啤酒附魔 (Belt)** | 无 | 每天第一杯啤酒免费（节省 1 蘑菇/天） |

### 关键附魔效果（影响蘑菇获取）
| 附魔 | 装备位 | 效果 |
|---|---|---|
| Mario's Beard | 护甲 | 任务中蘑菇发现率 **+50%** |
| Unholy Acquisitiveness | 护身符 | 物品发现率 **+10%** |
| Thirsty Wanderer | 腰带 | 每天第一杯啤酒免费（节省 1 蘑菇/天） |
| Robber Baron Ritual | 护符 | 竞技场金币 **+20%** |

> **来源**: [sfporadnik.pl - Witch](https://www.en.sfporadnik.pl/witch.php)

---

## 十、堡垒建造加速（Fortress，Lv 25 解锁）

| 功能 | 蘑菇费用 | 备注 |
|---|---|---|
| **建造加速** | 按跳过时间递增 | "跳过越多时间，成本越高" |
| 取消建造退还 | - | 返还 **75%** 已投入资源 |

> **具体加速公式**: 官方未公开精确公式，仅说明"越长时间成本越高"

> **来源**: [Playa Games 帮助中心 - Building Management](https://playa-games.helpshift.com/hc/en/4-shakes-fidget-1653988985/faq/353-building-management/)

---

## 十一、活动系统

### 11.1 蘑菇相关活动

| 活动名称 | 效果 |
|---|---|
| **Crazy Mushroom Harvest** | 蘑菇商 **+20%** 蘑菇；任务中蘑菇掉率提升 |
| **Lucky Day** | 远征/任务中有几率获得幸运币；轮盘可旋转 **40 次** |

### 11.2 经验/金币加成活动

| 活动名称 | 效果 |
|---|---|
| **Exceptional XP Event** | 远征/任务/竞技场 **2倍经验** |
| **Glorious Gold Galore** | 远征/任务/城卫 **5倍金币** |

### 11.3 史诗物品活动

| 活动名称 | 等级要求 | 效果 |
|---|---|---|
| **Epic Shopping Spree** | Lv 50+ | 商店/远征史诗物品概率 **5倍** |
| **Epic Quest Extravaganza** | - | 完成第2次冒险保证获得史诗物品 |
| **Epic Good Luck Extravaganza** | - | 骰子游戏中史诗物品替代灵魂图标 |

### 11.4 资源加成活动

| 活动名称 | 效果 |
|---|---|
| **Fantastic Fortress Festivity** | 远征/任务中几率获得木材和石头 |
| **Days of Doomed Souls** | 远征中几率获得灵魂；**2倍灵魂** |
| **Sands of Time Special** | 魔法商店沙漏 **10倍** |
| **Forge Frenzy Festival** | 拆解物品获得 **15点**（普通5点） |

### 11.5 季节性限时活动

| 活动名称 | 时间 | 特殊内容 |
|---|---|---|
| **蛋蛋猎寻 (Egg Hunt)** | 复活节 | 需解锁宠物；限时任务 + 独占宠物 |
| **沃尔普吉斯之夜 (Walpurgis)** | 每年4月30日当周 | 4个限时任务 |
| **夏日收集乐 (Summer Collectifun)** | 夏季 | 妖精吟游诗人任务 |
| **传奇地下城 (Legendary Dungeon)** | 每年数次 | Lv 50+；高级装备掉落 |
| **地狱电梯 (Hellevator)** | - | 深入地下世界战斗 |

### 11.6 便利性活动

| 活动名称 | 效果 |
|---|---|
| **Piecework Party** | 跳过远征/任务 **免费** |
| **One Beer, Two Beers, Free Beer** | 酒馆免费啤酒 |
| **Witches' Dance** | 女巫接受任何装备（无视品类限制） |
| **Tidy Toilet Time** | 抛弃物品 **2倍** 魔力值（上限2件/天） |
| **Assembly of Awesome Animals** | 远征中 **保证** 发现水果；宠物可喂食 **9次/天**（3倍水果） |
| **Rumble for Riches** | 竞技场胜利奖励金币 |

> **来源**: [Playa Games 帮助中心 - Events](https://playa-games.helpshift.com/hc/en/4-shakes-fidget-1653988985/section/14-events/), [sfporadnik.pl - Black Friday](https://en.sfporadnik.pl/showNews.php?id=29), [sfeventcal.github.io](https://sfeventcal.github.io/)

---

## 十二、免费获取蘑菇途径

| 方式 | 具体数值 | 备注 |
|---|---|---|
| **每日第1个任务** | 保证 1 个蘑菇 | 每日必得 |
| **后续任务（无坐骑）** | **8%** 概率 | 基础掉率 |
| **后续任务（狮鹫坐骑）** | **5%** 概率 | 速度越快掉率越低 |
| **远征里程碑** | 100 口渴值保证 1 个 | 累计消耗100口渴值 |
| **远征里程碑** | 300 口渴值保证 1 个 | 累计消耗300口渴值 |
| **轮盘奖励** | 3 个 | 有概率获得 |
| **赌徒胜利** | 不定 | 需先在蘑菇商购买过蘑菇 |
| **每日登录日历** | 不定 | 可获得蘑菇奖励 |
| **完成调查/游戏** | 不定 | "赚蘑菇"区域（不受+20%促销影响） |
| **兑换码** | 不定 | 社交媒体/Newsletter/Twitch直播发放 |
| **女巫附魔 Mario's Beard** | 任务中掉率 **+50%** | 装备护甲附魔 |
| **腰带附魔 Thirsty Wanderer** | 每天节省 **1 蘑菇** | 第一杯免费 |

> **来源**: [Playa Games 帮助中心 - How to Get Mushrooms](https://playa-games.helpshift.com/hc/en/4-shakes-fidget-1653988985/faq/145-how-to-get-mushrooms/)

---

## 十三、幸运币（Lucky Coins）与广告系统（Flying Tube）

### 13.1 飞天管（Flying Tube）
| 参数 | 数值 |
|---|---|
| 位置 | 酒馆 + Dr. Abawuwu 区域 |
| 功能 | 看广告获取**幸运币** |
| 每次广告获得 | **1-5 幸运币**（随机） |
| 平台限制 | **Steam 版不可用**（Steam 不允许游戏内广告） |
| 可关闭 | 在设置中随时禁用 |

### 13.2 幸运币用途
| 用途 | 成本 |
|---|---|
| 轮盘旋转 1 次 | **10 幸运币** |
| 黑市购买 | 不定 |

### 13.3 广告其他用途（游戏内）
| 功能 | 限制 |
|---|---|
| 跳过远征/任务旅行时间 | Lv 16+ 可用 |
| 跳过竞技场战斗等待 | **每24小时 50 次** |
| 刷新武器/魔法商店 | **每天每店 1 次** |
| 跳过栖息地/宠物战斗等待 | **每天每种 1 次** |
| 跳过地下城等待 | **每天 1 次** |
| 跳过骰子游戏等待 | **每天 1 次** |

> **来源**: [Playa Games 帮助中心 - Flying Tube](https://playa-games.helpshift.com/hc/en/4-shakes-fidget-1653988985/faq/26-the-flying-tube/), [sfporadnik.pl - Tavern](https://www.en.sfporadnik.pl/tavern.php)

---

## 十四、会员/订阅制度

### 结论: **无订阅制度**

S&F **没有**传统的月度/年度订阅或 VIP 会员系统。变现完全依赖：
1. 蘑菇直接购买（一次性或重复购买）
2. 一次性里程碑礼包（Starter → Triple Pro 链）
3. 广告变现（Flying Tube + Offer Wall + 奖励视频）

> **来源**: 多源综合（官方帮助中心、社区 Wiki、案例研究均未提及订阅系统）

---

## 十五、Offer Wall（第三方广告墙）

根据 Digital Turbine 案例研究：

| 指标 | 数值 |
|---|---|
| 总用户数 | **5,000 万+** |
| Offer Wall 收入占比 | **5%** 总收入 |
| IAP 收入占比 | 约 **90%+**（5-10% 用户贡献约 90% 收入） |
| Offer Wall 集成时机 | 从 **Lv 1** 开始 |
| IAP 蚕食效应 | **零**（未观察到 Offer Wall 影响 IAP） |
| Offer Wall vs 奖励视频 | 收入相当，但用户参与度较低（耗时长） |

> **来源**: [Digital Turbine Case Study](https://www.digitalturbine.com/case-studies/iap-offer-wall-rewarded-video-how-mothership-marketing-monetizes-an-audience-of-over-50m-users-in-an-award-winning-rpg/)

---

## 十六、每日蘑菇消耗汇总

| 消耗场景 | 每日最大蘑菇消耗 |
|---|---|
| 酒馆啤酒（10杯） | **10** |
| 轮盘旋转（19次） | **19** |
| 堡垒建造加速 | 不定 |
| 铁匠服务 | 不定（非每日） |
| 赌徒下注 | 不定 |
| 任务跳过（23:00-23:59） | 不定 |
| **保守日消耗** | **29+** |
| **重氪日消耗** | **50-100+** |

---

## 十七、变现设计特征总结

### 设计亮点
1. **无订阅+纯 IAP 模式**: 降低心理门槛，按需购买
2. **里程碑礼包链**: 7 个等级解锁的礼包形成长期付费驱动力（Lv 1→300）
3. **小额高频消耗**: 啤酒（1 蘑菇/杯）、轮盘（1 蘑菇/次）设计鼓励日常小额消费
4. **免费蘑菇生态**: 8% 掉率 + 每日保证 + 远征里程碑 + 活动，降低付费压力
5. **互补广告变现**: Offer Wall 从 Lv 1 集成，不蚕食 IAP，贡献 5% 增量收入
6. **时间=金钱**: 几乎所有蘑菇功能都是"加速"，不直接卖数值（P2W 程度较低）
7. **坐骑14天租期**: 核心加速道具（狮鹫龙 25 蘑菇/14天）设计为持续消耗
8. **赌徒前置条件**: 需先购蘑菇才能下注，强制首次付费体验
9. **活动日历驱动**: 丰富的限时活动维持参与度，促销活动刺激消费

### P2W（Pay to Win）程度评估
- **低度 P2W**: 蘑菇主要买"便利"和"速度"，不直接卖属性
- 女巫附魔 Mario's Beard（+50% 蘑菇掉率）可通过免费途径获得
- 核心战力（装备、属性）主要通过游戏时间积累
- 竞技场中，蘑菇优势主要体现在进度速度，非直接战斗力

---

## 信息来源汇总

| 来源 | 链接 |
|---|---|
| Playa Games 官方帮助中心 - 蘑菇商 | https://playa-games.helpshift.com/hc/en/4-shakes-fidget-1653988985/faq/105-mushroom-dealer/ |
| Playa Games 官方帮助中心 - Dr. Abawuwu | https://playa-games.helpshift.com/hc/en/4-shakes-fidget-1653988985/faq/104-dr-abawuwu/ |
| Playa Games 官方帮助中心 - 马厩 | https://playa-games.helpshift.com/hc/en/4-shakes-fidget-1653988985/faq/44-stable/ |
| Playa Games 官方帮助中心 - 酒馆 | https://playa-games.helpshift.com/hc/en/4-shakes-fidget-1653988985/faq/16-tavern/ |
| Playa Games 官方帮助中心 - 自动冒险机 | https://playa-games.helpshift.com/hc/en/4-shakes-fidget-1653988985/faq/86-adventuromatic/ |
| Playa Games 官方帮助中心 - 堡垒建造 | https://playa-games.helpshift.com/hc/en/4-shakes-fidget-1653988985/faq/353-building-management/ |
| Playa Games 官方帮助中心 - 飞天管 | https://playa-games.helpshift.com/hc/en/4-shakes-fidget-1653988985/faq/26-the-flying-tube/ |
| Playa Games 官方帮助中心 - 获取蘑菇 | https://playa-games.helpshift.com/hc/en/4-shakes-fidget-1653988985/faq/145-how-to-get-mushrooms/ |
| Playa Games 官方帮助中心 - 升级系统 | https://playa-games.helpshift.com/hc/en/4-shakes-fidget-1653988985/faq/344-upgrades/ |
| Playa Games 官方帮助中心 - 活动系统 | https://playa-games.helpshift.com/hc/en/4-shakes-fidget-1653988985/section/14-events/ |
| sfporadnik.pl - 轮盘 | https://en.sfporadnik.pl/abawuwu.php |
| sfporadnik.pl - 酒馆 | https://www.en.sfporadnik.pl/tavern.php |
| sfporadnik.pl - 铁匠 | https://en.sfporadnik.pl/blacksmith.php |
| sfporadnik.pl - 女巫 | https://www.en.sfporadnik.pl/witch.php |
| sfporadnik.pl - 黑五活动 | https://en.sfporadnik.pl/showNews.php?id=29 |
| number13.de - 堡垒指南 | https://en.number13.de/shakes-fidget-fortress-guide/ |
| number13.de - 铁匠指南 | https://en.number13.de/shakes-fidget-all-about-the-blacksmith/ |
| Fandom Wiki - 马厩 | https://sfgame.fandom.com/wiki/Stables |
| Fandom Wiki - 口渴值 | https://sfgame.fandom.com/wiki/Thirst_for_Adventure |
| Fandom Wiki - 策略 | https://sfgame.fandom.com/wiki/Strategies |
| Fandom Wiki - 商店 | https://sfgame.fandom.com/wiki/Shops |
| Digital Turbine 案例研究 | https://www.digitalturbine.com/case-studies/iap-offer-wall-rewarded-video-how-mothership-marketing-monetizes-an-audience-of-over-50m-users-in-an-award-winning-rpg/ |
| S&F 活动日历（社区） | https://sfeventcal.github.io/ |
| gameplay.tips 蘑菇商指南 | https://gameplay.tips/guides/shakes-and-fidget-mushroom-dealer-guide.html |

---

## 十八、数据缺口与待补充项

| 缺失项 | 说明 |
|---|---|
| 蘑菇精确欧元/美元定价 | 官方未公开，仅社区零散信息 |
| 堡垒加速精确公式 | 官方仅说明"时间越长成本越高" |
| 自动冒险机蘑菇填充成本 | 未公开具体数值 |
| 赌徒具体蘑菇奖惩金额 | 未公开 |
| 每日登录日历具体奖励 | 未公开详细表格 |
| 黑市具体商品和价格 | 每7天轮换，无固定数据 |
| Offer Wall 每次完成获得蘑菇数 | 未公开 |
