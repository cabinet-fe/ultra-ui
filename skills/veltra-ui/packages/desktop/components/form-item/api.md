# UFormItem — 表单项

> `import type { FormItemProps, FormItemEmits, FormItemExposed } from '@veltra/desktop'`

> 类型：`../../../generated/types/form-item.ts`

表单控件容器组件，提供统一的标签、提示信息、字段校验错误展示和响应式栅格布局。

**大多数情况下不需要手动使用。** 当表单输入组件设置了 `field` 属性时，`<u-form>` 会自动包裹 `FormItem`。只在以下场景需要手动使用：

- 一个表单项内包含多个输入组件的组合
- 需要自定义 `label` 插槽内容
- 其他无法通过单个 `field` 属性表达的复杂布局

## Import

```ts
// UFormItem 由 Vite 自动导入，无需手动 import
```

> 示例见 [examples.md](./examples.md)
