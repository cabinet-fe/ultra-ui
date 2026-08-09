# ADR-0001: 现代化 Sheet 报表架构与角色驱动引擎

* **状态**: Accepted (已通过)
* **日期**: 2026-08-09
* **领域 Context**: Sheet Report (`packages/sheet-core/CONTEXT.md`)

---

## 背景与问题 (Context & Problem Statement)

既有的报表实现 (`playground/src/sheet-report/`) 过于依赖传统报表工具（UReport / FineReport）的硬核概念。用户需要手动配置坐标式的“左父格 (Left Parent)”、“上父格 (Up Parent)”以及“向下扩展 (Expand Down)”。这种机制带来以下痛点：
1. 界面与配置极为沉重且偏向程序员视角，缺乏现代产品级的直观性。
2. 缺乏直观的数据拓扑可视化与就地微调能力。
3. 缺失通用的单元格动态条件样式（如数值 > 100 标红）插件机制。

我们致力于打破常规，构建一套直观、美观、涵盖“数据源配置 ➔ 模板设计 ➔ 渲染展开 ➔ 参数筛选 ➔ 多报表展示”的全流程现代报表系统。

---

## 决策事项 (Decision Drivers & Choices)

### 决策 1：直观布局角色替代坐标推导 (Role-Driven Architecture)

放弃暴露坐标式父子格，重构 `ReportBinding` 为 5 大直观角色：
- `Group Header`（分组头）
- `Detail Row`（明细行）
- `Subtotal`（组内小计）
- `Grand Total`（全局总计）
- `Matrix Cross`（二维矩阵交叉点）

**效果**：布局引擎根据单元格相对位置与角色定义自动推导逻辑父格与展开树，抹平技术门槛。

### 决策 2：视口级动态样式 Hook (`resolveCellStyle`)

在 `@veltra/sheet-core` 的 `SheetGrid` 与 `@veltra/sheet` 的 `USheet` 中新增 `resolveCellStyle` 动态 Hook（与 `resolveDisplayValue` 保持一致）：
```ts
resolveCellStyle?: (addr: CellAddress, baseStyle?: CellStyle) => CellStyleOption
```
- **共享静态样式 (`StylePool`) 共存**：入参 `baseStyle` 直读 `StylePool`。Hook 仅在视口格（50-100 个可见格）绘制时叠加条件样式 Patch（如 >100 标红）。
- **导出打平**：在导出 XLSX 或持久化时，将满足计算条件的样式自动合流写入 `SheetSnapshot.styles`。

### 决策 3：数据源中心 (Mock Data Hub) 与声明式参数

- 预置多表模拟数据库（`sales_orders`, `customers`, `inventory`），支持可视化 SQL/拖拽视图与参数定义（如 `@startDate`, `@region`, `@minAmount`）。
- 预览/运行态自动将参数 Schema 渲染为顶部的现代交互式筛选栏 (`Filter Bar`)。

### 决策 4：画布拓扑图层 (Topology Overlay) 与悬浮胶囊 (Action Pill)

- **SVG 拓扑连线**：在网格上方绘制 SVG 弧线，高亮呈现分组头与子行、小计行的依赖结构。
- **Action Pill**：选中格上方弹出小型悬浮胶囊，支持快捷切换角色、添加条件格式规则与清除绑定。

---

## 后续影响 (Consequences)

### 正向影响 (Positive)

- 彻底摆脱对传统沉重报表工具的依赖，呈现现代化产品级的 UI/UX 体验。
- 架构清晰、分层合理，底层 `sheet-core` 获得通用的动态样式 Hook 能力。
- 3 套典型的商业报表 Tab（分组小计、二维矩阵、预警高亮）能够全面展示系统威力。

### 潜在风险与应对 (Risks & Mitigation)

- **快照兼容**：原有 `ReportBinding` 中包含 `leftParent` 字段。应对：保留 `leftParent` 作为内部推导缓存，确保旧模板快照向下兼容。
- **渲染性能**：条件格式求值不可阻塞主线程。应对：依靠 VTable 视口虚拟化，且规则表达式建立预编译索引。
