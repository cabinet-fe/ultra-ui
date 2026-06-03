# UExpressionEditor：表达式编辑器

> `import type { ExpressionEditorProps, ExpressionEditorEmits, ExpressionEditorExposed, VariableItem, ExpressionSelectableLevels } from '@veltra/desktop'`

> 类型：`../../../generated/types/expression-editor.ts`

用于编辑「普通文本 + 变量 chip」组成的表达式。对外 `v-model` 始终是字符串，变量按 `{value}` 序列化，例如：`你好{form.user.name}`。

继承 `FormComponentProps`，支持在 UForm 中联动 `size` / `disabled` / `readonly`。

## Import

```ts
// UExpressionEditor 由 Vite 自动导入，无需手动 import
import type { VariableItem, ExpressionSelectableLevels } from '@veltra/desktop'
```

> 示例见 [examples.md](./examples.md)
