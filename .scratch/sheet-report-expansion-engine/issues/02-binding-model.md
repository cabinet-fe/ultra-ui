# 02 — 绑定模型定稿与旧角色体系删除

**What to build:** 按 ADR-0005 决策 1 / 决策 3 / 决策 4 重写 `ReportBinding`、`ReportAggregate`、`ConditionalRule` 与 `ReportTemplate`；删除角色与 `leftParent` 一族符号；修 A1 地址的单字母列限制。本票只动类型与纯函数，引擎重写在 03 / 04。

**Blocked by:** 01 — ADR-0005 与 CONTEXT 词汇表修订

**Status:** ready-for-agent

- [ ] `packages/sheet/src/report/types.ts` 定稿：

  ```ts
  export type ReportExpand = 'down' | 'right' | 'none'
  export type ReportAggregate = 'list' | 'group' | 'sum' | 'avg' | 'count' | 'max' | 'min'
  export type ReportPreset = 'groupHeader' | 'detail' | 'subtotal' | 'grandTotal' | 'cross'

  export interface ReportBinding {
    dataset: string
    field: string
    expand: ReportExpand
    aggregate: ReportAggregate
    rowParent?: CellAddress
    colParent?: CellAddress
    mergeSpan?: boolean
    sort?: ReportSort
    conditionalRules?: ConditionalRule[]
    preset?: ReportPreset
  }

  export interface ConditionalRule {
    operator: ConditionalOperator
    value: unknown
    style: CellStylePatch
    field?: string
    scope?: 'cell' | 'row'
  }
  ```

- [ ] `mergeSpan` / `preset` / `field` / `scope` 均为可选，缺省语义即旧行为（`mergeSpan` 缺省合并、`scope` 缺省 `'cell'`、`field` 缺省取绑定格自身字段）
- [ ] `ReportTemplate.version: number` 新增（当前值 `1`），`getTemplate()` 吐出时写入；载入时 `version` 缺失或 `> 1` 抛可读错误（不写迁移函数、不留兼容分支）
- [ ] 删除符号：`ReportRole`、`ReportLeftParent`、`binding.role`、`binding.leftParent`、`resolveReportRole`、`isExpandingBinding`、`findDefaultLeftParent`、`resolveLeftParent`、`aggregateDefaultExpand`
- [ ] `select` → `list` 全量更名（含 `AGGREGATE_PLACEHOLDER_TAG` 文案键）；新增 `max` / `min`；不加 `distinct-count`
- [ ] `formatCellAddress` / `parseCellAddress` 支持多字母列（`A`…`Z`、`AA`…）——父格地址已成为用户可见概念，26 列上限是必修 bug
- [ ] 预设 → 绑定值的映射表（供 05 的 Action Pill 与落格推断共用），每个预设明确其 `expand` / `aggregate` / 父格处置：

  | 预设 | expand | aggregate | 父格 |
  | --- | --- | --- | --- |
  | `groupHeader` | `down`（或 `right`，列分组头） | `group` | 保留推断值 |
  | `detail` | `down`（或 `right`，转置明细） | `list` | 保留推断值 |
  | `subtotal` | `none` | `sum` | 保留 `rowParent` |
  | `grandTotal` | `none` | `sum` | 清空双父格 |
  | `cross` | `none` | `sum` | 要求 `rowParent` + `colParent` |

- [ ] `binding.test.ts` 按新模型改写：预设映射、多字母列 A1 往返、`version` 校验分叉
- [ ] `template.test.ts` 补 `version` 相关断言

## Comments
