Status: ready-for-agent

## 问题陈述 (Problem Statement)

报表引擎的输入模型缺失报表布局的本质信息——**展开方向**与**从属父格**。ADR-0001 决策 1 用 5 个布局角色替代坐标式配置，代价是引擎必须从单元格坐标反推布局关系。反推即脆弱，且脆弱性已在代码里全面兑现：

- **二维交叉靠坐标大小猜**：`detectMatrixLayout` 用 `c.addr.row < c.addr.col` 判定列分组、`c.addr.col < c.addr.row` 判定行分组。测试用的最小布局（角落 A1 / 列分组 B1 / 行分组 A2）成立，但模板顶部只要多一行标题，列分组落到 B2（`row 1 < col 1` 不成立），`detectMatrixLayout` 返回 `null`，交叉报表静默不展开——不报错、不告警。对角线上的分组头对两个判定都不可见；行分组被放在列号大于行号的位置会被误判成列分组。
- **展开带靠行相邻性猜**：`expansionBlocks` 按行号连续性划分展开带；`classifyTemplateRow` 一行里有一个 matrix 绑定就把整行判为矩阵表头。
- **设计器靠坐标硬编码**：`isGroupAnchorCell` 写死「首列第二行永远是分组锚点」（`addr.row === 1 && addr.col === 0`）。
- **跨数据集拖拽静默损坏数据**：`resolveParentGroupDataset` 命中后 `binding.dataset = parentDataset`，把左侧分组格的数据集覆盖到拖入字段上，产生「dataset 为 Y、field 属于 X」的无效绑定，渲染时静默出空值。
- **父格是不可见的推导缓存**：`leftParent` 被 ADR-0001 定位为「内部推导缓存」，Action Pill 只能只读展示 `resolvedLeftParentLabel`，用户改不了；拓扑连线画的是猜出来的关系，不是模板里真实存储的关系。

表达力上界同样受限：`ReportExpand` 只有 `down | none`，没有横向展开；二维交叉是 matrix 角色的特例路径，且 `matrixCells[0]` 只取第一个绑定、`totalRow = matrixRow + 1` 硬编码；多级列头（年 → 季度）无法表达。

性能上，模板查找全是线性扫（`bindingCells` 每次重建数组、`templateCell` 用 `cells.find`），`expansionBlocks` 与 `detectMatrixLayout` 在每一行被重算，交叉展开的 `filterRows` 复杂度为 O(行值数 × 列值数 × 记录数)。

附带的小缺口：`formatCellAddress` / `parseCellAddress` 只支持单字母列（`/^([A-Z])(\d+)$/`），而父格地址即将成为用户可见的一等概念；`aggregateField` 在数值集为空时统一返回 `0`，`avg` 空集为 0 是错的；`UReportViewer` 无导出入口；条件样式只对绑定格自身值求值，做不到整行高亮；拖拽落点高亮 overlay 在产品化时未随迁。

## 解决方案 (Solution)

推翻 ADR-0001 决策 1，把布局信息从「引擎每次渲染时反推」改为「设计器落格时显式写入模板」。

1. **引擎输入模型 = 展开方向 + 从属父格 + 聚合**：`ReportBinding` 以 `expand: 'down' | 'right' | 'none'`、`rowParent?: CellAddress`、`colParent?: CellAddress`、`aggregate` 描述布局。渲染引擎零几何推断。
2. **布局角色降级为设计器预设**：五个角色（分组头 / 明细行 / 小计行 / 总计行 / 交叉格）不再是模型概念，而是设计器的输入法与展示标签——切换预设即写入一组方向 + 父格 + 聚合的组合值。`preset` 字段存在但引擎不读。
3. **结构约束为树 × 树**：每格最多一个行方向父格 + 一个列方向父格。这一约束保证布局是行树与列树的乘积而非任意 DAG，使扩展坐标计算可解，同时覆盖全部真实报表形态。
4. **交叉表不再是特例**：交叉格 = 同时具有 `rowParent` 与 `colParent` 的汇总格；多级列头 = `colParent` 链。`detectMatrixLayout` 一族启发式整体删除。
5. **扩展坐标系**：所有单元格（含静态格与合并区域）参与逻辑网格 → 物理网格的映射；扩展格的每个实例按父格实例重复展开，父格实例占据的跨度等于其子树展开量。
6. **父格成为可编辑的一等公民**：Action Pill 支持点选式父格编辑（进入拾取态后在网格上点目标格），拓扑连线实时反映真实存储的父子关系。
7. **模板版本段**：`ReportTemplate.version: number`（当前 `1`）。缺失或高于当前一律报可读错误，不写迁移函数。

决策依据：ADR-0005（本次新立）、ADR-0002（Dataset = Connection + SQL、`${param}` 参数、Filter Bar 参数来源，继续有效）、ADR-0003（产品化与 BYO 契约，继续有效）、ADR-0004（渲染扩展口与 cell hook 性能契约，继续有效）。ADR-0001 决策 1 被 ADR-0005 取代，其决策 2（`resolveCellStyle`）与决策 4（拓扑连线 / Action Pill）继续有效。

## 用户故事 (User Stories)

### 报表设计者（设计态终端用户）

1. 作为报表设计者，我希望把字段绑定为横向展开，以便于列头随数据自动向右延展（如按月份出列）。
2. 作为报表设计者，我希望搭建多级列头（年 → 季度），以便于表达真实业务的二维报表。
3. 作为报表设计者，我希望交叉表在模板顶部有标题行时照常工作，以便于报表能有正常的标题与说明区域。
4. 作为报表设计者，我希望在选中格的 Action Pill 上看到并修改它的行方向父格与列方向父格，以便于布局关系由我掌控而非被猜测。
5. 作为报表设计者，我希望修改父格时用点选目标格的方式而不是输入 A1 地址，以便于不必理解坐标体系。
6. 作为报表设计者，我希望拓扑连线画出的是模板里真实存储的父子关系，以便于我能信任它并据此排错。
7. 作为报表设计者，我希望拖拽字段落格时设计器自动推断出预设与父格并立即用拓扑连线展示，以便于我能一眼确认推断是否正确、错了当场改。
8. 作为报表设计者，我希望跨数据集拖拽字段时绑定保留字段自己的数据集，以便于绑定永远指向真实存在的字段。
9. 作为报表设计者，我希望在 Action Pill 上切换展开方向与「扩展实例是否合并单元格」，以便于同一模板既能出合并样式的分组报表、也能出便于 Excel 筛选的平铺报表。
10. 作为报表设计者，我希望在交叉表右侧或下方放静态的合计标题，渲染后它随展开被推移到正确位置，以便于报表的静态说明区域不被展开结果覆盖。
11. 作为报表设计者，我希望条件样式规则能按另一个字段求值并作用于整个输出行，以便于表达「金额超标则整行标红」。
12. 作为报表设计者，我希望使用 `max` / `min` 聚合，以便于表达峰值类指标。
13. 作为报表设计者，我希望横向展开出的列继承其列方向父格所在模板列的宽度，以便于展开结果的列宽符合我在设计态的调整。

### 报表查看者（运行态终端用户）

14. 作为报表查看者，我希望在查看器里直接导出填充报表为 XLSX，以便于不必依赖设计器的预览模式。
15. 作为报表查看者，我希望取数完成前导出入口不可用，以便于不会导出到一份只有模板结构的空报表。

### 下游开发者（集成方）

16. 作为下游开发者，我希望模板携带 `version` 字段且载入不兼容版本时抛可读错误，以便于结构演进不会静默损坏存量模板。
17. 作为下游开发者，我希望 `UReportViewer` expose `exportXlsx()`，以便于导出按钮放在我自己的工具栏里。
18. 作为下游开发者，我希望参考服务的 MySQL 路径与 PostgreSQL 路径行为一致，以便于我照抄契约实现时不会踩到方言差异。

### 库维护者

19. 作为库维护者，我希望渲染引擎不含任何从坐标推断语义的代码，以便于行为可预测、可穷举测试。
20. 作为库维护者，我希望扩展坐标计算是一段可无头单测的纯函数，以便于几何正确性能被大量小 case 钉死。
21. 作为库维护者，我希望纵向报表的现有断言在新引擎下一行不改全绿，以便于重写有硬回归基线。
22. 作为库维护者，我希望模板查找与聚合求值走索引而非线性扫，以便于几万行数据的交叉报表不卡。

## 实现决策 (Implementation Decisions)

### 1. 绑定模型（ADR-0005 决策 1 / 决策 3）

```ts
export type ReportExpand = 'down' | 'right' | 'none'
export type ReportAggregate = 'list' | 'group' | 'sum' | 'avg' | 'count' | 'max' | 'min'

/** 设计器预设标签：引擎不读，仅用于 UI 展示与一键切换 */
export type ReportPreset = 'groupHeader' | 'detail' | 'subtotal' | 'grandTotal' | 'cross'

export interface ReportBinding {
  dataset: string
  field: string
  expand: ReportExpand
  aggregate: ReportAggregate
  /** 纵向从属父格：本格数据受该格当前行实例的值约束 */
  rowParent?: CellAddress
  /** 横向从属父格：本格数据受该格当前列实例的值约束 */
  colParent?: CellAddress
  /** 扩展实例是否合并为单个单元格；缺省 true */
  mergeSpan?: boolean
  sort?: ReportSort
  conditionalRules?: ConditionalRule[]
  preset?: ReportPreset
}

export interface ConditionalRule {
  operator: ConditionalOperator
  value: unknown
  style: CellStylePatch
  /** 求值字段；缺省取绑定格自身字段 */
  field?: string
  /** 作用范围；缺省 'cell' */
  scope?: 'cell' | 'row'
}
```

- `mergeSpan` 与 `preset` 为可选（缺省即旧行为、模板体积更小）；`preset` 缺失时 Action Pill 显示「自定义」。
- 删除符号：`ReportRole`、`ReportLeftParent`、`binding.role`、`binding.leftParent`、`resolveReportRole`、`isExpandingBinding`、`findDefaultLeftParent`、`resolveLeftParent`、`aggregateDefaultExpand`。
- `select` → `list` 更名（`select` 是 SQL 视角，与词汇表「明细」对不上）；新增 `max` / `min`；**不加** `distinct-count`（消费驱动）。
- `formatCellAddress` / `parseCellAddress` 扩展到多字母列（AA/AB…）。

### 2. 扩展坐标系（ADR-0005 决策 2）

- **全格参与映射**：静态格、合并区域与绑定格统一按逻辑网格 → 物理网格映射。模板是逻辑网格，输出是展开后的物理网格。现有 `emitStaticTemplateRow` 按模板行直搬的做法整体替换。
- **实例跨度**：扩展格的每个实例占据的行/列跨度等于其子树展开量；`mergeSpan !== false` 时该跨度合并为单个单元格，否则逐格重复填值。
- **父格约束**：`rowParent` / `colParent` 指向的格的当前实例值构成该格取数的过滤条件；无父格即全数据集。
- **跨数据集**：父格约束只在同数据集内生效；绑定各自按自己的 `dataset` 取数，不做数据集覆盖。

### 3. 展开与聚合语义

- 横向展开支持 `group`（列分组头）与 `list`（一条记录一列的转置明细）；引擎中两个方向完全对称，不设特例。
- 空数据集：展开块输出 0 行/0 列，静态格与表头照常输出。「无数据」提示由查看器层承担（取数成功但绑定数据集全空时给 banner），不进引擎。
- `avg` 空集返回空值而非 `0`（现有 bug）；`sum` 空集仍为 `0`。
- 聚合求值按分组字段建索引，替代交叉展开里 O(行值数 × 列值数 × 记录数) 的重复 `filterRows`。

### 4. 条件样式（Q12 / Q27）

- `field` 缺省取绑定格自身字段，指定时对同一条记录的另一字段求值。
- `scope: 'row'` 染满整个**物理输出行**（含横向展开出的所有列）。交叉表下会染满整行，文档需写明整行高亮的真实用例是明细行报表。
- **不加** `scope: 'column'`（实现只是换轴，但无需求驱动）。
- 行内静态格的样式解析延后到该行所有绑定格求值完成之后（两阶段）。

### 5. 设计器推断规则（替换坐标硬编码）

- 落格时同列向上找最近的纵向扩展绑定作为 `rowParent` 候选，同行向左找最近的横向扩展绑定作为 `colParent` 候选。
- 预设默认「明细」（`list` + `down`）；字段为数值类型且落点位于已有展开带的下方相邻行时预设为「小计」。
- 推断结果立即以拓扑连线可视化。
- 删除 `isGroupAnchorCell` 的坐标硬编码与 `resolveParentGroupDataset` 的数据集覆盖。
- 父格编辑以点选为主（进入拾取态后在网格上点目标格）、下拉候选为辅；**不做** A1 地址输入框——ADR-0001 当初想消灭的是这个交互，不是这个字段。

### 6. 模板版本（ADR-0005 决策 4）

- `ReportTemplate.version: number`，当前值 `1`。
- 载入时 `version` 缺失 → 报可读错误要求重建（旧模板的 matrix 语义无法自动迁移：缺少列方向父格这条信息，猜不出来）；`version > 1` → 报错。
- 不写迁移函数、不留兼容分支。

### 7. 列宽

- 横向展开出的列继承其列方向父格所在模板列的宽度。
- 列宽持久化进 `SheetSnapshot` 是 sheet-core 的已知限制，不由报表这条线推动（范围外）。

### 8. 模块边界

新引擎落 `packages/sheet/src/report/render/`，按「坐标计算层 / 输出组装层」切分而非按纵横切分：

| 模块 | 职责 |
| --- | --- |
| `template-index.ts` | 模板一次性索引：绑定 Map、父子树构建、按地址直查 |
| `coordinate.ts` | 扩展坐标系：实例枚举、子树跨度、逻辑格 → 物理区间映射（纯计算、无输出） |
| `aggregate.ts` | 聚合求值 + 分组字段索引 |
| `style-resolver.ts` | 静态样式 + 条件样式（含 `scope: 'row'` 两阶段） |
| `builder.ts` | Filled Report 快照组装 |
| `index.ts` | `renderReport` 编排 |

旧 `render.ts` 在 issue 04 内整体删除，不与新引擎并存。

### 9. 破坏性与发布

- `ReportBinding` / `ReportAggregate` / `ReportTemplate` 均为 breaking 变更；内部项目、无外部消费者，按 minor 发布并在 changeset 中明确声明。
- 存量模板一律要求重建（Q9 决策）。

## 测试决策 (Testing Decisions)

### 测试准则

- 只测外部行为，不测实现细节。
- 复用现有缝隙，不新开缝隙；尽可能在最高层级测试。

### 回归基线（硬约束）

- 现有 `render.test.ts` 中纵向报表的断言（分组头 / 明细行 / 小计 / 总计四个预设）**一行不改**，新引擎必须让它们全绿。输出任何逐格差异都视为 bug。
- 矩阵那一组测试按新语义改写——其断言建立在 `row < col` 能识别的特殊布局上，语义本身要变，硬保它等于给旧启发式立碑。

### 缝隙 1 — 扩展坐标系（headless 纯计算）

- 对象：`coordinate.ts` 的实例枚举、子树跨度与逻辑 → 物理映射。用大量小 case 覆盖：单级纵向、多级纵向嵌套、单级横向、多级列头、行列同时展开、`mergeSpan` 开关、静态格推移、空展开。
- 不产出快照，只断言坐标与跨度，便于穷举。

### 缝隙 2 — 渲染引擎（headless，无 DOM）

- 对象：`renderReport`（模板 + records → Filled Report 快照）。覆盖四个纵向预设的逐格回归、横向展开、多级列头、交叉格、跨数据集、条件样式 `field` 与 `scope: 'row'`、空数据集、`avg` 空集。

### 缝隙 3 — 组件级（happy-dom + 内存 stub connector）

- 对象：设计器落格推断新规则（含跨数据集不覆盖数据集）、点选式父格编辑写入模板、预设切换写入正确的方向 + 父格组合、拓扑连线读取真实父格；查看器 `exportXlsx()` 与取数前拒绝导出。

### 不测项

- playground hono 参考服务不写自动化测试（dev-only，契约形状已被 `createHttpConnector` 的 mock-fetch 测试覆盖，真实连接由演示者手动演练验证）。

## 范围外 (Out of Scope)

- **打印与 PDF**。技术路线已勘定并记入 ADR-0005：走 VTable `exportCellRangeImg(cellRange)` 按页截图（它内部会 `scrollToCell` 再裁剪，能取到视口外区域），不是自研 HTML 分页渲染器。代价是产物为位图（打印清晰度依赖 canvas `pixelRatio`、PDF 内文字不可选不可搜索）。本期不做。
- 报表表达式语言（跨字段计算如「毛利率 = (收入-成本)/收入」）；本期仍靠多绑几个格子绕过。
- 单元格内嵌图表（ADR-0001 之后两份 spec 均已排除）。
- `scope: 'column'` 条件样式；`distinct-count` 聚合。
- 列宽持久化进 `SheetSnapshot`（sheet-core 既有限制）。
- 模板迁移机制（版本段只做校验与报错）。
- 大数据量分页 / 流式取数（`query` 一次性返回全量行）。
- 多数据集 join；权限模型；协同编辑。
- `template` prop 置空不清空设计态（反向语义未定义，保守保留现状）。

## 附注 (Further Notes)

- 领域文档需在 issue 01 内先行更新：新立 `docs/adr/0005-*.md`；ADR-0001 状态改为 `Partially Superseded by ADR-0005`；`packages/sheet-core/CONTEXT.md` 词汇表与架构约束按 issue 01 清单修订。后续所有 issue 必须使用修订后的词汇表术语。
- 依赖链：01 → 02 → 03 → 04 → 05 → 06；07 与 08 不碰引擎可随时并行插队（建议 08 最先做，它是唯一能验证契约的真实数据通道）；09 收尾。
- 最终验收：`bun run lint` / `bun run test` / `bun run build` 全绿；由项目负责人出真实 MySQL 数据库完成一次连接演练（PostgreSQL 已于 productization 阶段验证通过）。
