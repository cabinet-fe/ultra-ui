---
title: injectFormContext
description: 注入 UForm 上下文，供表单控件读取属性并注册字段
---

`injectFormContext()` 读取 `provideFormContext` 提供的上下文。返回 `{ inForm, ...context }`：在 `UForm` 子树内可拿到 `formProps`、`registerField`、`unregisterField`、`validateFields`、`shouldValidate`、`handleFieldChange`；在表单外调用时这些字段为 `undefined`。判断是否在表单内应看这些字段是否存在。

控件典型用法：用 `formProps` 做 size / disabled / readonly 回退，并在有 `field` 时 `registerField`。表单项必须用 `field`，不要对同一控件再写 `v-model`。

相关类型见 `provideFormContext`：`FormContextProps`、`FormFieldItem`。

```ts
import { injectFormContext } from '@veltra/utils'

const { formProps, registerField, unregisterField, shouldValidate, handleFieldChange } =
  injectFormContext()

const size = formProps?.size ?? 'default'
```
