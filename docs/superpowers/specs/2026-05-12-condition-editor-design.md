# 条件编辑器 (Condition Editor) 设计文档

## 概述

条件编辑器是一个可视化的条件规则构建组件，用于构建可执行的布尔条件表达式。核心能力：可视化编辑、变量注入、变量数据替换、条件执行结果输出。

## 使用场景

业务规则引擎（工作流分支、触发条件等），条件作为规则引擎的输入。

## 数据模型

```typescript
type ConditionExpression = ConditionGroup

interface ConditionGroup {
  logic: 'and' | 'or'
  conditions: ConditionItem[]
  groups: ConditionGroup[]
}

interface ConditionItem {
  field: string
  operator: string
  value: ConditionValue
  _result?: boolean  // 内部计算，不序列化
}

type ConditionValue =
  | { kind: 'constant'; value: string }
  | { kind: 'variable'; name: string }

interface ConditionField {
  label: string
  value: string
  type: 'string' | 'number' | 'boolean' | 'date' | 'enum'
  enumOptions?: { label: string; value: string }[]
}
```

序列化输出即为 `ConditionExpression` JSON，变量引用以 `{变量名}` 形式嵌入。

## 组件 API

```typescript
interface ConditionEditorProps {
  modelValue?: ConditionExpression
  fields: ConditionField[]
  variables?: VariableItem[]
  data?: Record<string, unknown>
  size?: ComponentSize
  disabled?: boolean
  readonly?: boolean
}

interface ConditionEditorEmits {
  (e: 'update:modelValue', value: ConditionExpression): void
  (e: 'evaluate', results: ConditionExpression): void
}
```

- `fields` — 可用字段列表
- `variables` — 可用变量列表（undefined 时不显示变量注入）
- `data` — 变量实际数据，传入后自动求值并更新 UI 结果
- 遵循 `FormComponentProps` 体系，支持 `useFormFallbackProps`

## UI 设计

### 布局策略：紧凑密度

- 组件高度：28px
- 行间距：6px
- 元素间距：6px（--u-gap-small）
- 圆角：4px（--u-radius-small）
- 字体大小：12px（--u-font-size-main-small）
- 嵌套缩进：左边框 2px + padding-left 12px

### 视觉层次

- **AND/OR tag**：条件组头部，左上角 tag 式切换器
  - AND：蓝底 `#e8f2fd`，文字 `--u-color-primary`
  - OR：橙底 `#fdf2e8`，文字 `--u-color-warning`
  - 点击切换，悬停变色
- **条件行**：[字段 select] [运算符 select] [值输入] [× 删除] [结果指示]
- **嵌套分组**：左边框 `2px solid #e0e3e9`，缩进 16px
- **添加按钮**：文字按钮，`--u-color-primary`，hover 加深

### 结果展示

| 状态 | 图标 | 颜色 |
|------|------|------|
| 通过 | ✓ | `--u-color-success` (#2ba471) |
| 不通过 | ✗ | `--u-color-danger` (#d54941) |
| 未计算 | — | `--u-text-color-assist` (#a8abb2) |

行级结果在条件行末尾显示，分组 AND/OR 汇总在 tag 旁显示。

### 空状态

仅显示 AND/OR tag + 添加按钮，无占位文本。

### 变量注入

- 值输入框中按 `@` 触发变量选择器
- 选中变量渲染为 chip（`border-radius: 999px`，primary light-9 底色）
- chip 可删除、可重选（复用 expression-editor 交互）
- 复用 `expression-editor/components/variable-picker.vue`

## 运算符映射

| 字段类型 | 运算符 |
|----------|--------|
| string | eq(等于), ne(不等于), contains(包含), not_contains(不包含), empty(为空), not_empty(不为空) |
| number | eq(等于), ne(不等于), gt(大于), lt(小于), gte(大于等于), lte(小于等于) |
| boolean | is_true(是), is_false(否) |
| date | eq(等于), ne(不等于), before(早于), after(晚于) |
| enum | eq(等于), ne(不等于), in(包含于) |

## 求值引擎

组件内置表达式求值器。当 `data` prop 传入时：

1. 遍历条件树，解析变量值（将 `{var}` 替换为 `data` 中的实际值）
2. 根据 operator 执行比较
3. 更新 `_result` 字段（boolean）
4. 行级结果实时反映到 UI
5. 分组 AND/OR 汇总：所有叶子结果为 true → 分组通过
6. 通过 `evaluate` emit 抛出结果

## 组件结构

```
condition-editor/
├── condition-editor.vue       # 主组件
├── index.ts                   # 导出
├── style.scss                 # 样式
├── components/
│   └── condition-row.vue      # 单条件行
└── core/
    └── evaluator.ts           # 求值引擎
```

## 状态态

- **disabled** — 灰色背景，禁止所有交互
- **readonly** — 禁止编辑，但可查看和复制
- **is-focus** — 聚焦的条件行高亮边框

## 注意事项

- 空的子组在序列化时应被过滤掉（不输出空组）
- 变量选择器的弹窗定位需从值输入框触发，而非编辑器容器
- `_result` 字段仅内部使用，序列化时排除
