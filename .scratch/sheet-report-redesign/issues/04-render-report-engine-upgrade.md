Status: completed

# 04 — 报表渲染引擎升级 (5 大语义角色展开与小计扩展)

**What to build:** 
重构升级 `render.ts` (FilledReportBuilder) 报表填充计算引擎。替代传统父子坐标算法，直接基于 5 大语义角色 (group, detail, subtotal, grandTotal, matrix) 进行纵向数据分组展开、明细行折叠/展开、自动计算行/列小计总计与二维矩阵交叉排列，同时将动态条件样式无缝集成到最终生成的 `SheetSnapshot` 中。

**Blocked by:** 01 — `@veltra/sheet` 动态单元格样式 Hook (`resolveCellStyle`), 02 — 报表绑定 Schema 扩展与条件样式评估引擎.

- [x] 升级 `renderReport` 函数，能够处理语义角色的多层嵌套分组与展开
- [x] 正确支持 `subtotal` 与 `grandTotal` 自动计算逻辑（求和、平均值、计数等）
- [x] 正确支持二维矩阵交叉表（`matrix` 角色）行头、列头与交叉点数据阵列扩展
- [x] 结合 Ticket 02 的条件格式规则，在填充快照生成时将计算出的动态样式固化到单元格与样式表
- [x] 完善 `render.spec.ts` 单测，断言填充后单元格坐标、合并单元格区域及数值计算结果
