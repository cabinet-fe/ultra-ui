# Context: Sheet Report (报表系统)

本文档定义了 `@veltra/sheet` & `@veltra/sheet-core` 中报表系统的统一领域术语（Ubiquitous Language）与架构约束。

## 领域词汇表 (Domain Glossary)

| 术语 | 英文 | 描述 | 排除同义词 (禁用) |
| --- | --- | --- | --- |
| **展开方向** | Expand Direction | 绑定格的扩展方向：`down`（向下展开行）、`right`（向右展开列）、`none`（不扩展，静态或汇总）。引擎一等输入，不得从坐标推断。 | — |
| **从属父格** | Parent Cell | 约束本格取数范围的父绑定格。分**行方向父格**（`rowParent`，纵向从属）与**列方向父格**（`colParent`，横向从属）；每格最多各一个。父格当前实例的值构成过滤条件；无父格即全数据集。 | 左父格 / 上父格（坐标视角措辞，正式说法为行方向父格 / 列方向父格） |
| **扩展坐标系** | Expansion Coordinate | 逻辑网格（模板）→ 物理网格（展开输出）的映射。全格参与（含静态格与合并区域）；扩展格实例跨度 = 子树展开量；`mergeSpan` 缺省合并。 | — |
| **设计预设** | Design Preset | 设计器的输入法与展示标签（`preset` 字段），引擎不读。切换预设即写入一组 `expand` / `aggregate` / 父格的组合值；缺失时 Action Pill 显示「自定义」。 | 布局角色 / Layout Role |
| **分组头** | Group Header | **预设组合**（非引擎角色）：`expand: down` 或 `right` + `aggregate: group` + 无父格（或仅列方向父格用于多级列头）。按字段值去重、分组并展开与合并单元格。 | 聚合根 / 主格子 |
| **明细行** | Detail Row | **预设组合**：`expand: down` + `aggregate: list` + `rowParent` 指向最近纵向扩展绑定。跟随上级分组展开输出多条数据集记录明细。 | 列表格 / 展开格 |
| **小计行** | Subtotal Row | **预设组合**：`expand: none` + `aggregate: sum`（或 `avg` / `count` / `max` / `min`）+ `rowParent` 指向所属分组头。对当前所属分组内的记录进行汇总。 | 组内合计 |
| **总计行** | Grand Total Row | **预设组合**：`expand: none` + `aggregate: sum`（或 `avg` / `count` / `max` / `min`）+ 无父格。对数据集或全表记录进行全局最终汇总。 | 全局小计 |
| **矩阵交叉点** | Matrix Cross | **预设组合**：同时具有 `rowParent` 与 `colParent` 的汇总格（`expand: none` + `aggregate: sum` 等）。不再作为独立引擎角色；交叉表 = 行列父格显式指定的树 × 树乘积。 | 交叉网格 |
| **数据源中心** | Data Hub | 数据连接与数据集的可视化管理中心（drawer 形态）：连接 CRUD、SQL 数据集编辑、参数元数据与数据预览。 | 数据源配置弹窗 |
| **数据连接** | Data Connection | 真实数据库的连接配置（类型 `mysql`/`postgresql` + host/port/库名/账号）。纯序列化对象，仅驻留内存，凭据持久化由下游负责；数据集必须挂载在某个连接下。 | 数据库实例 |
| **数据连接器** | Data Connector | 前端取数接口（`test`/`describe`/`query`）。库定义接口与 HTTP 契约并提供 `createHttpConnector`；真实数据库访问由下游后端实现（BYO），前端包不含任何数据库驱动。 | 数据库驱动/连接池 |
| **数据集** | Dataset | 报表数据的唯一来源：`Data Connection + SQL`。字段 schema 从 SELECT 列解析，是字段面板拖拽绑定与渲染引擎取数的基础。 | 数据表/查询结果缓存 |
| **查询参数** | Query Parameter | SQL 中 `${param}` 占位符自动提取的运行时参数，类型体系 `text/number/date/date-range/select`，驱动 Filter Bar 自动生成。 | 筛选器/过滤条件定义 |
| **参数筛选栏** | Filter Bar | 在报表运行态/预览态根据数据集参数 Schema 自动生成的极简交互式筛选 UI 控件组。 | 检索面板 |
| **拓扑连线** | Topology Overlay | 在 Sheet 网格上方使用 SVG 绘制的动态连接线，直观高亮子格与父绑定格的依赖拓扑关系（反映模板中真实存储的 `rowParent` / `colParent`）。 | 依赖关系线 |
| **就地操作胶囊** | Action Pill | 悬浮于选中单元格正上方的小型微控面板，支持切换预设、编辑父格（点选拾取）、配置条件格式或清除绑定。 | 快捷浮窗 |
| **动态条件样式** | Conditional Style Patch | 视口渲染时根据数据求值规则（如 `val > 100`）动态作用于单元格的样式 Patch，与 `StylePool` 享元共享样式并行共存。支持 `field`（求值字段）与 `scope: 'row'`（染满物理输出行）。 | 静态高亮 |
| **报表设计器** | Report Designer（`UReportDesigner`） | 报表模板设计态组件：数据中枢、字段拖拽绑定、拓扑连线与 Action Pill 的完整编排；模板经 expose 的 `getTemplate()` 取回。 | 报表设计页 |
| **报表查看器** | Report Viewer（`UReportViewer`） | 报表运行态组件：按模板与查询参数经数据连接器取数，展开渲染填充报表并驱动 Filter Bar；暴露 `refresh()` 与 `exportXlsx()`。 | 报表预览页 |

---

## 架构约束 (Architecture Constraints)

1. **引擎零推断**：渲染引擎不得从单元格坐标推断任何语义，所有布局关系必须显式存储于绑定（`expand`、`rowParent`、`colParent`、`aggregate`）。`preset` 字段仅供设计器 UI 使用，引擎不读。
2. **样式双轨制**：
   - 静态基础样式归属于 `@veltra/sheet-core` 的 `StylePool`。
   - 视口计算样式通过 `resolveCellStyle` Hook 在绘制时叠加，保持视口虚拟化零性能损耗。
3. **导出打平机制**：生成持久化快照或导出 XLSX 时，必须将满足条件的动态样式合并写入 `SheetSnapshot.styles` 与 `StylePool`，确保 Excel 打开文件完全保真。
4. **连接器边界**：报表引擎与 UI 只依赖 `DataConnector` 接口；前端包（`sheet`/`sheet-core`）严禁引入数据库驱动或 Node-only 依赖；库不内置任何凭据持久化。
5. **格内渲染扩展**：单元格形态自定义经 `resolveCellRenderer` Hook（VTable customLayout，ADR-0004）按格扩展，遵守 cell hook 性能契约（纯函数/同步/O(1)，见 `packages/sheet-core/AGENTS.md`）；格内内容走 renderer hook，跨格浮动内容走 ImageLayer。
