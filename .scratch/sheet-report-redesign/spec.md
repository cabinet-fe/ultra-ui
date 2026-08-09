Status: ready-for-agent

## 问题陈述 (Problem Statement)

现有电子表格报表 (Sheet Report) 示例实现缺乏现代产品级体验，过度依赖 UReport/FineReport 等传统报表引擎的技术概念（如“左父格”、“扩展方向”及坐标推导规则）。用户在设计报表时需要理解复杂的坐标拓扑关系，配置面板繁重且视觉效果过时，缺少从数据源连接、模型配置、动态格式到渲染预览及参数筛选的全流程闭环体验。

## 解决方案 (Solution)

将 `playground/src/sheet-report/` 重构升级为现代化、产品级的报表设计与渲染解决方案。通过：
1. **Mock Data Hub（可视化数据源中心）**：提供多表模拟数据库、字段映射与查询参数定义。
2. **Smart Sheet Designer（直观语义角色映射）**：用“分组头”、“明细行”、“小计行”、“总计行”、“矩阵交叉点” 5 大产品级语义角色替代传统父子坐标推导。
3. **Canvas 视觉交互（SVG 拓扑弧线 & 悬浮 Action Pill）**：在 Sheet 画布上绘制实时关联弧线与单元格悬浮快捷胶囊，直观展示与编辑分组依赖。
4. **动态条件样式引擎 (`resolveCellStyle` Hook)**：在 `@veltra/sheet` 和 `@veltra/sheet-core` 视口渲染热路径中引入动态样式 Hook，实现值阈值样式高亮（如数值 > 100 自动高亮），且与静态 `StylePool` 无缝并发合并、零视口渲染性能损失。
5. **运行态 Filter Bar 与多报表工作区**：根据数据集参数自动生成现代顶部参数筛选栏，预置 3 套商业报表 Tab 模板并支持保真 XLSX 导出。

## 用户故事 (User Stories)

1. 作为一名报表设计师，我希望在可视化的 Mock Data Hub 中查看和管理模拟数据集与 SQL 查询参数，以便于无需编写后端代码即可配置参数化数据模型。
2. 作为一名报表设计师，我希望将数据集字段拖拽到电子表格单元格上，以便于快速为目标单元格分配数据字段绑定。
3. 作为一名报表设计师，我希望为单元格分配直观的角色（分组头、明细行、小计行、总计行、矩阵交叉点），以便于无需手动推导父格坐标即可直观定义报表扩展结构。
4. 作为一名报表设计师，我希望在选中分组单元格时在电子表格画布上看到 SVG 拓扑弧线，以便于一目了然地识别父子扩展依赖关系。
5. 作为一名报表设计师，我希望在选中单元格上方看到悬浮 Action Pill（快捷胶囊），以便于就地快速切换单元格角色、添加聚合函数或配置条件格式规则。
6. 作为一名报表设计师，我希望定义条件样式规则（例如数值 > 100 时将单元格背景变为浅红），以便于在报表渲染期间自动高亮关键业务指标。
7. 作为一名企业终端用户，我希望使用自动生成的顶部 Filter Bar（日期范围、下拉框、Tag 选择器）筛选报表数据，以便于渲染后的报表输出根据所选参数动态更新。
8. 作为一名企业终端用户，我希望在多报表 Tab 工作区中切换预置的商业报表模板（销售业绩汇总表、二维矩阵交叉表、库存预警明细表），以便于分析不同的业务场景。
9. 作为一名企业终端用户，我希望将填充后的报表结果导出为具有完整样式与布局保真度的 Excel (.xlsx) 文件，以便于离线共享报表数据。
10. 作为一名开发者，我希望 `@veltra/sheet` 暴露 `resolveCellStyle` 属性 Hook，以便于在不改变底层 Cell Store 状态的前提下将动态格式注入网格渲染生命周期。
11. 作为一名开发者，我希望条件样式计算仅在视口渲染单元格上运行，以便于即使在大数据集下网格渲染性能也能保持 60fps 顺滑。
12. 作为一名开发者，我希望在导出 XLSX 时将动态条件样式自动持久化到 `StylePool`，以便于导出的电子表格保留条件格式颜色。
13. 作为一名报表设计师，我希望一键预览扩展后的报表结果，以便于立即验证数据分组分页和小计计算。
14. 作为一名报表设计师，我希望在卡片式 Inspector 侧边栏中检查和编辑单元格绑定，以便于微调排序和空值回退等高级参数。
15. 作为一名企业终端用户，我希望在更改报表查询参数时看到明确的加载指示器 (Loading)，以便于清晰获知数据加载状态。

## 实现决策 (Implementation Decisions)

### 1. 架构组件拆分
- **SheetGrid 基础解耦与重构 (Phase 0)**：将 `@veltra/sheet-core` 中 1400+ 行的 `sheet-grid.ts` 拆解为 `GridStyleResolver`、`GridSelectionController`、`GridRowHeightEngine`、`GridSyncManager`、`GridEditorRouter` 与 `GridCoords` 控制器，`SheetGrid` 保持 100% 接口向下兼容，并将主文件压缩至 300 行以内。
- **Mock Data Hub (`dataset-hub/`)**：负责管理模拟数据库 Catalog、数据表 Schema、参数定义及 Records 模拟数据生成。
- **Smart Designer UI (`designer/`)**：包含字段面板、顶栏操作区、右侧 Inspector 卡片面板、SVG 拓扑弧线 Overlay、悬浮 Action Pill。
- **Conditional Rules Engine (`rules/`)**：提供规则定义接口、比较逻辑求值器 (`evaluateCondition`) 及 `CellStyle` 叠加大全。
- **Render Engine Upgrade (`render.ts`)**：升级 `FilledReportBuilder`，支持 Group Header、Detail Band、Subtotal Row、Matrix Cross 生成，并打通条件样式叠加。

### 2. 接口与数据结构规范
- **`ReportBinding` 扩展**：包含 `datasetId`、`field`、`role`（`group` | `detail` | `subtotal` | `grandTotal` | `matrix`）、`aggregate`（`select` | `group` | `sum` | `avg` | `count`）、`sort`（`asc` | `desc` | `none`）及 `conditionalRules` 数组。
- **`ConditionalRule` 结构**：定义 `operator`（`gt` | `gte` | `lt` | `lte` | `eq` | `between` | `contains`）、`value` 匹配值及 `style` 覆盖增量（字体颜色、背景色、加粗等）。
- **`resolveCellStyle` 视图钩子**：
  在 `@veltra/sheet` (USheet) 和 `@veltra/sheet-core` (SheetGrid) 扩展 `resolveCellStyle(addr: CellAddress, baseStyle?: CellStyle): CellStyle | undefined`。

### 3. 与 `StylePool` 共享静态样式的性能设计
- 视口计算时：`SheetGrid` 优先从 `StylePool` 读取单元格静态 `baseStyle`，经 `resolveCellStyle` 执行微秒级条件对比并返回合并后的 `CellStyle`。
- 导出的快照构建时：把最终计算得到的 `CellStyle` 重新写入导出 `SheetSnapshot.styles` 和格 `s` 指针，保障导出静态文件格式符合标准。

## 测试决策 (Testing Decisions)

### 测试准则
- 坚持黑盒测试与行为驱动测试：侧重测试外部输入与渲染输出成果，不侵入测试内部 DOM 计算或场景图渲染节点。
- 使用单一/最高层级测试缝隙 (Highest Seams)。

### 关键测试缝隙 (Testing Seams)
1. **渲染引擎缝隙 (`renderReport`)**：
   - 输入：`SheetSnapshot` 模板与 `DatasetRecords` 数据。
   - 断言：生成的 `SheetSnapshot` 中单元格数值、合并单元格区域 (`merges`)、小计/总计计算值及写入的样式。
   - 参照：`playground/src/sheet-report/__test__/render.spec.ts`
2. **条件样式评估缝隙 (`evaluateConditionalStyle`)**：
   - 输入：基础单元格值与 `ConditionalRule` 集合。
   - 断言：符合规则时返回正确叠加的 `CellStyle`；未命中规则时原样返回 `baseStyle`。
3. **`USheet` 动态样式 Hook 结合缝隙 (`resolveCellStyle`)**：
   - 输入：单元格地址与属性值。
   - 断言：网格渲染周期中正确响应 `resolveCellStyle` 的样式 Patch。

## 范围外事项 (Out of Scope)

- 单元格内嵌图表 (ECharts / Chart.js) 动态绘制。
- 真实后端数据库 TCP/HTTP 连接（统一使用前端 Mock Data Hub 模拟）。
- 多人实时协同编辑报表模板。

## 补充说明 (Further Notes)

- 重构完全兼容已有的 `@veltra/sheet` 和 `@veltra/sheet-core` 包导出白名单，无破坏性 Breaking Changes。
- Playground 中预置 3 套商业报表示例：【销售业绩分组小计表】、【二维交叉/矩阵报表】、【库存与采购预警表】。
