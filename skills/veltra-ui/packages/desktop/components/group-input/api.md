# UGroupInput — 分组输入

> `import type { GroupInputProps, GroupInputEmits, GroupInputExposed } from '@veltra/desktop'`

> 类型：`../../../generated/types/group-input.ts`

动态分组输入组件。通过 `v-model` 绑定 `GroupItem[]` 数组，每条记录自动生成唯一 ID 并响应式追踪。支持增加、删除条目，可通过默认插槽自定义条目内容，也可通过 `itemStyle` 设定条目样式。`readonly` 模式下仅展示纯文本，`creatable` 模式下空列表显示「新增」按钮。`size`、`disabled`、`readonly` 在表单上下文（`UForm`）中会自动继承。

组件使用 `generic="GroupItem extends Record<string, any>"`，可通过 `v-model` 的类型推导泛型参数。

## Import

```ts
// UGroupInput 由 Vite 自动导入，无需手动 import
```

> 示例见 [examples.md](./examples.md)
