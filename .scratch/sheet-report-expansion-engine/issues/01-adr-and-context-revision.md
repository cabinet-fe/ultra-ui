# 01 — ADR-0005 与 CONTEXT 词汇表修订（文档先行）

**What to build:** 新立 `docs/adr/0005-*.md` 记录「以显式展开方向与从属父格为渲染引擎唯一输入，布局角色降级为设计器预设」；把 ADR-0001 标为部分被取代；按新模型重写 `packages/sheet-core/CONTEXT.md` 的词汇表与架构约束。本票是后续所有 issue 的语义依据，必须先落地。

**Blocked by:** 无

**Status:** resolved

- [x] `docs/adr/0005-expansion-driven-report-engine.md` 新建，含五条决策：

  1. **引擎输入模型**：`expand` + `rowParent` / `colParent` + `aggregate`；布局角色移出模型，降级为设计器预设（`preset` 字段引擎不读）。论证要点：父子从属关系与展开方向是报表布局的客观信息，删除字段不会让信息消失，只会让引擎每次渲染时反推，而反推即脆弱。
  2. **扩展坐标系**：全格（含静态格与合并区域）参与逻辑网格 → 物理网格映射；扩展格实例跨度 = 子树展开量；`mergeSpan` 缺省合并。
  3. **结构约束**：每格最多一个行方向父格 + 一个列方向父格，布局为行树 × 列树而非任意 DAG。说明这一约束正是经典「左父格 / 上父格」二分的实质，它保证布局计算可解且覆盖全部真实报表形态。
  4. **模板版本段**：`ReportTemplate.version: number`（当前 `1`）；缺失或高于当前一律报可读错误，不写迁移函数。
  5. **打印路线记录**：走 VTable `exportCellRangeImg(cellRange)` 按页截图（内部 `scrollToCell` 后裁剪，能取到视口外区域），不做自研 HTML 分页渲染器；代价是位图产物（清晰度依赖 canvas `pixelRatio`、PDF 内文字不可选不可搜索）。本期不实施。

- [x] ADR-0005 的「背景与问题」需引用具体证据：`detectMatrixLayout` 的 `row < col` / `col < row` 判定、模板加一行标题即静默失效、`isGroupAnchorCell` 的 `row === 1 && col === 0` 硬编码、`resolveParentGroupDataset` 覆盖数据集导致的无效绑定
- [x] ADR-0005 声明取代关系：仅取代 ADR-0001 决策 1；决策 2（`resolveCellStyle`）与决策 4（拓扑连线 / Action Pill）继续有效且在新模型下才名副其实；决策 3 早已由 ADR-0003 取代
- [x] `docs/adr/0001-modern-sheet-report-design.md` 状态改为 `Partially Superseded by ADR-0005`，文首点明只有决策 1 被推翻及其原因
- [x] `packages/sheet-core/CONTEXT.md` 词汇表修订：
  - 「布局角色 Layout Role」改写为「设计预设 Design Preset」——设计器的输入法与展示标签，引擎不读
  - 「矩阵交叉点 Matrix Cross」重定义为「同时具有行方向父格与列方向父格的汇总格」，删除其作为独立引擎角色的语义
  - 新增「展开方向 Expand Direction」（`down` / `right` / `none`）
  - 新增「从属父格 Parent Cell」（行方向父格 / 列方向父格）
  - 新增「扩展坐标系 Expansion Coordinate」（逻辑网格 → 物理网格的映射）
  - 「分组头 / 明细行 / 小计行 / 总计行」四条**保留中文名不动**，但定义从「引擎角色」改写为「预设组合」，每条下注明它展开成哪组 `expand` / `aggregate` / 父格值——使词汇表本身成为预设的规格说明
- [x] `CONTEXT.md` 禁用同义词列拆分：「展开方向」与「父格」升为正式术语，仅保留「左父格 / 上父格」这两个坐标视角措辞作为禁用（正式说法是「行方向父格 / 列方向父格」）
- [x] `CONTEXT.md` 架构约束 1（「严禁在 UI 交互层直接向用户暴露 `LeftParent` 坐标计算」）整条删除，替换为「**引擎零推断**：渲染引擎不得从单元格坐标推断任何语义，所有布局关系必须显式存储于绑定」
- [x] `CONTEXT-MAP.md` 的 Relationships 段同步（「绑定 / 报表表达式与 `CellData.f` 是不同概念」这条红线保留不动）

## Comments
