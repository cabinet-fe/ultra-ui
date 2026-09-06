---
title: "injectFormContext - 注入 UForm 表单上下文与字段属性"
description: "Vue 表单依赖注入工具函数，供自定义表单控件在深层子组件中读取父级 UForm 上下文、表单尺寸、只读禁用状态并注册表单字段，实现表单统一联动"
keywords:
  - injectFormContext
  - @veltra/utils
  - inject-form-context
  - 注入
  - 表单上下文与字段属性
aliases: ["inject-form-context", "injectFormContext"]
---
## 快速上手

`injectFormContext()` 读取 `provideFormContext` 提供的上下文。返回 `{ inForm, ...context }`：在 `UForm` 子树内可拿到 `formProps`、`registerField`、`unregisterField`、`validateFields`、`shouldValidate`、`handleFieldChange`；在表单外调用时这些字段为 `undefined`。判断是否在表单内应看这些字段是否存在。

控件典型用法：用 `formProps` 做 size / disabled / readonly 回退，并在有 `field` 时 `registerField`。表单项必须用 `field`，不要对同一控件再写 `v-model`。

相关类型见 `provideFormContext`：`FormContextProps`、`FormFieldItem`。

```ts
import { injectFormContext } from '@veltra/utils'

const { formProps, registerField, unregisterField, shouldValidate, handleFieldChange } =
  injectFormContext()

const size = formProps?.size ?? 'default'
```

