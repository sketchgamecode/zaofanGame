# Docs Index

Status: Active
Last Updated: 2026-05-28

本目录包含现行设计文档、外部参考资料和历史旧稿。新成员接手时请先读本页，避免把旧包装或旧入口结构当成当前实现目标。

## 当前权威文档

1. `docs/design/01_vision_and_charter/00_Product_Core_Strategy.md`
   产品核心方向。
2. `docs/design/01_vision_and_charter/02_Theme_and_Writing_Guidelines.md`
   当前题材包装与文案规则。现阶段以“大明体制内升迁 / 京城权力机器”为核心。
3. `docs/design/01_vision_and_charter/03_Player_Journey_and_User_Stories.md`
   玩家视角的主流程、入口关系和体验验收标准。
4. `docs/design/04_system_specs/Power_Structure_and_World_Actor_System_V1.md`
   权力集团、世界角色池、京城地点、场所职务、权柄系统的主设计。
5. `docs/design/04_system_specs/Frontend_Layout_Spec_V1.md`
   前端固定舞台、右侧随身栏、京城场所入口、复用 UI 规则。
6. `server/tdd/`
   服务端 API、存档结构、错误码和限制的技术真相源。

## 当前入口规则

1. 玩家默认从 `CityScene` 的京城地图进入各场所。
2. 差事、商店、副本、竞技、情报、补给等角色扮演行为，必须从场所内的任职 NPC / `ServicePosition` 进入。
3. 场所内 NPC 使用 `CharacterPortraitCard` 展示；点击角色卡查看角色详情，点击其下方服务牌才进入具体玩法。
4. 右侧导航栏不是第二张地图，只保留个人随身功能，例如角色简报、资源、随身行囊、战报/邮件。
5. `docs/legacy/` 与 `docs/design/03_external_reports/` 只作历史和参考资料，不代表当前实现目标。

## 已废弃或需谨慎引用

1. “大宋造反模拟器”是旧包装名。当前题材核心是“大明体制内升迁”。
2. “黑市作为独立主入口”是旧结构。当前商店由神机营、盐商会馆、织造局等场所职务承载。
3. “酒馆作为统一任务入口”是旧结构。当前任务由不同场所的 missions 职务发布。
4. “右侧导航承载商店、任务、副本、竞技”是旧结构。当前右侧导航只做个人功能。
5. 外部 Shakes & Fidget 报告是机制和 UX 参考，不是题材、命名或入口结构的直接实现文档。
