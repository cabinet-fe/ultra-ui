# ADR-0005: 展开驱动报表引擎 —— 显式方向与从属父格

* **状态**: Accepted (已通过)
* **日期**: 2026-08-12
* **领域 Context**: Sheet Report (`packages/sheet-core/CONTEXT.md`)
* **关联**: 部分取代 ADR-0001 决策 1；ADR-0002 / ADR-0003 / ADR-0004 继续有效

---

## 背景与问题 (Context & Problem Statement)

ADR-0001 决策 1 用 5 个布局角色替代坐标式配置，将「左父格 / 上父格 / 展开方向」从模型中移除，改由引擎在每次渲染时从单元格坐标反推。反推即脆弱，且脆弱性已在代码中全面兑现：

### 证据 1：二维交叉靠坐标大小猜测

`detectMatrixLayout`（`packages/sheet/src/report/render.ts`）用 `c.addr.row < c.addr.col` 判定列分组、`c.addr.col < c.addr.row` 判定行分组。测试用的最小布局（角落 A1 / 列分组 B1 / 行分组 A2）成立，但模板顶部只要多一行标题，列分组落到 B2（`row 1 < col 1` 不成立），`detectMatrixLayout` 返回 `null`，交叉报表**静默不展开**——不报错、不告警。对角线上的分组头对两个判定都不可见；行分组被放在列号大于行号的位置会被误判成列分组。

### 证据 2：设计器靠坐标硬编码

`isGroupAnchorCell`（`packages/sheet/src/components/report/use-report-designer.ts`）写死「首列第二行永远是分组锚点」（`addr.row === 1 && addr.col === 0`）。模板结构稍有变化，分组语义即错位。

### 证据 3：跨数据集拖拽静默损坏数据

`resolveParentGroupDataset` 命中后执行 `binding.dataset = parentDataset`，把左侧分组格的数据集覆盖到拖入字段上，产生「`dataset` 为 Y、`field` 属于 X」的无效绑定，渲染时静默出空值。

### 证据 4：父格是不可见的推导缓存

`leftParent` 被 ADR-0001 定位为「内部推导缓存」，Action Pill 只能只读展示 `resolvedLeftParentLabel`，用户改不了；拓扑连线画的是猜出来的关系，不是模板里真实存储的关系。

**结论**：展开方向与从属父格是报表布局的客观信息。删除这些字段不会让信息消失，只会让引擎每次渲染时反推；而反推即脆弱。

---

## 决策事项 (Decision Drivers & Choices)

### 决策 1：引擎输入模型 —— 展开方向 + 从属父格 + 聚合

`ReportBinding` 以以下字段描述布局，渲染引擎**零几何推断**：

```ts
export type ReportExpand = 'down' | 'right' | 'none'
export type ReportAggregate = 'list' | 'group' | 'sum' | 'avg' | 'count' | 'max' | 'min'

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
  /** 设计器预设标签：引擎不读，仅用于 UI 展示与一键切换 */
  preset?: ReportPreset
}
```

**布局角色降级为设计器预设**：`Group Header` / `Detail Row` / `Subtotal` / `Grand Total` / `Matrix Cross` 不再是引擎模型概念，而是设计器的输入法与展示标签（`preset` 字段）。切换预设即写入一组 `expand` / `aggregate` / 父格的组合值；引擎不读 `preset`。

**论证要点**：父子从属关系与展开方向是报表布局的客观信息，删除字段不会让信息消失，只会让引擎每次渲染时反推，而反推即脆弱。

### 决策 2：扩展坐标系

- **全格参与映射**：静态格、合并区域与绑定格统一按逻辑网格 → 物理网格映射。模板是逻辑网格，输出是展开后的物理网格。
- **实例跨度**：扩展格的每个实例占据的行/列跨度等于其子树展开量；`mergeSpan !== false` 时该跨度合并为单个单元格，否则逐格重复填值。
- **父格约束**：`rowParent` / `colParent` 指向的格的当前实例值构成该格取数的过滤条件；无父格即全数据集。跨数据集时父格约束只在同数据集内生效，绑定各自按自己的 `dataset` 取数，不做数据集覆盖。

### 决策 3：结构约束 —— 行树 × 列树

每格最多一个行方向父格 + 一个列方向父格，布局为行树与列树的乘积而非任意 DAG。

这一约束正是经典「左父格 / 上父格」二分的实质：它保证布局计算可解且覆盖全部真实报表形态。交叉格 = 同时具有 `rowParent` 与 `colParent` 的汇总格；多级列头 = `colParent` 链。`detectMatrixLayout` 一族启发式整体删除。

### 决策 4：模板版本段

`ReportTemplate.version: number`（当前值 `1`）。

- `version` 缺失 → 报可读错误，要求重建模板（旧模板的 matrix 语义无法自动迁移：缺少列方向父格这条信息，猜不出来）。
- `version > 1` → 报可读错误。
- **不写迁移函数、不留兼容分支**。

### 决策 5：打印路线记录（本期不实施）

走 VTable `exportCellRangeImg(cellRange)` 按页截图（内部 `scrollToCell` 后裁剪，能取到视口外区域），不做自研 HTML 分页渲染器。

**代价**：产物为位图（打印清晰度依赖 canvas `pixelRatio`、PDF 内文字不可选不可搜索）。

**本期不实施**，仅记录技术路线供后续评估。

---

## 与 ADR-0001 的取代关系

| ADR-0001 决策 | 状态 | 说明 |
| --- | --- | --- |
| 决策 1：布局角色替代坐标推导 | **被 ADR-0005 取代** | 角色降级为设计器预设；引擎改读显式 `expand` + 父格 |
| 决策 2：`resolveCellStyle` | **继续有效** | 在新模型下条件样式才名副其实（含 `scope: 'row'` 两阶段） |
| 决策 3：数据源中心与声明式参数 | **已被 ADR-0003 取代** | 产品化与 BYO 契约 |
| 决策 4：拓扑连线 / Action Pill | **继续有效** | 在新模型下才名副其实——连线反映真实存储的父子关系，父格可编辑 |

---

## 后续影响 (Consequences)

### 正向影响 (Positive)

- 渲染引擎行为可预测、可穷举测试；扩展坐标计算为可无头单测的纯函数。
- 交叉表在模板顶部有标题行时照常工作；多级列头与横向展开成为一等能力。
- 拓扑连线与 Action Pill 反映模板里真实存储的布局关系，用户可点选编辑父格。
- 跨数据集拖拽不再静默覆盖 `dataset`。

### 潜在风险与应对 (Risks & Mitigation)

- **破坏性变更**：`ReportBinding` / `ReportAggregate` / `ReportTemplate` 均为 breaking 变更；存量模板一律要求重建。应对：`version` 段校验 + 可读错误，不写迁移函数。
- **渲染性能**：交叉展开需索引替代线性扫。应对：模板一次性索引 + 分组字段索引（见 spec 实现决策）。
