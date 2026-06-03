# UConditionEditor — 条件编辑器

> `import type { ConditionEditorProps, ConditionEditorEmits, ConditionEditorExposed, ConditionExpression, ConditionGroup, ConditionLeaf, ConditionNode, ConditionConnector, ConditionValue, ConditionField, VariableItem } from '@veltra/desktop'`

> 类型：`../../../generated/types/condition-editor.ts`

可视化条件规则构建器：

- 树状嵌套分组，**同组内每两个相邻子项之间可独立切换 AND / OR**（混合逻辑）
- `@` 触发 `VariablePicker` 注入变量引用
- 表达式 JSON 树是纯配置数据，不再包含运行期 `_result` 字段
- 求值由独立纯函数 `evaluateConditionExpression(expr, options)` 完成，与编辑器解耦

## Import

```ts
// UConditionEditor 由 Vite 自动导入，无需手动 import
import { evaluateConditionExpression } from '@veltra/desktop'
import type { ConditionExpression, ConditionField, VariableItem } from '@veltra/desktop'
```

## 关联类型

```ts
type ConditionExpression = ConditionGroup

interface ConditionGroup {
  type: 'group'
  children: ConditionNode[]
  /** `connectors[i]` 连接 `children[i]` 与 `children[i+1]`，长度 = children.length - 1 */
  connectors: ConditionConnector[]
}

type ConditionConnector = 'and' | 'or'
type ConditionNode = ConditionLeaf | ConditionGroup

interface ConditionLeaf {
  type: 'condition'
  field: string // 字段 key
  operator: string // 'eq' / 'gt' / 'contains' / ...
  value: ConditionValue
}

type ConditionValue = { kind: 'constant'; value: string } | { kind: 'variable'; name: string }

interface ConditionField {
  label: string
  value: string // 字段 key
  type: 'string' | 'number' | 'boolean' | 'date' | 'enum' // 决定可用运算符与值控件
  enumOptions?: { label: string; value: string }[] // type='enum' 时用
}

interface VariableItem {
  label: string
  value: string // 变量路径，如 'currentUser.status'
  type?: string
  children?: VariableItem[]
}
```

## 求值

```ts
import { evaluateConditionExpression } from '@veltra/desktop'

const ok = evaluateConditionExpression(expression, {
  fields, // 提供字段定义可启用类型感知比较（number/boolean/date）
  data // 上下文数据，用于解析 kind: 'variable' 引用
})
```

- 纯函数，**不修改入参**
- 空表达式（无任何叶子）视为 `true`（"无限制"）
- 同组内 AND / OR 按 **从左到右、等优先级** 求值；如需 `AND > OR` 等优先级请用子组显式分组
- 字段类型决定比较语义：`number` 走数值、`boolean` 走真值、`date` 走时间戳、其余走字符串

## 工厂函数

```ts
import { createEmptyGroup, createEmptyLeaf } from '@veltra/desktop'

createEmptyGroup() // → { type: 'group', children: [], connectors: [] }
createEmptyLeaf() // → { type: 'condition', field: '', operator: 'eq', value: { kind: 'constant', value: '' } }
```

> 示例见 [examples.md](./examples.md)
