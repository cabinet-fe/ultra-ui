---
title: "provideFormContext - 向组件子树提供 UForm 表单上下文"
description: "Vue 依赖提供工具函数，向组件子树注入 UForm 的字段收集、表单校验、尺寸与只读状态上下文，支撑 UForm 表单容器对子表单控件的管控"
keywords:
  - provideFormContext
  - @veltra/utils
  - provide-form-context
  - 向组件子树提供
  - 表单上下文
aliases: ["provide-form-context", "provideFormContext"]
---
`provideFormContext(context)` 向后代 provide 表单上下文。桌面端 `UForm` 在自身 setup 里调用；自定义表单容器也应走这一导出，以便控件用 `injectFormContext` 对齐。

相关类型：`FormContextProps`（表单外观/数据）、`FormFieldItem`（字段校验项）、`FormContextModel`（errors / fields 模型形状）。上下文对象本身无单独导出名。

## 参数说明

| 字段                              | 说明                                                                         |
| --------------------------------- | ---------------------------------------------------------------------------- |
| `formProps`                       | 表单属性，形状为 `FormContextProps` 的部分字段再加任意键                     |
| `registerField(field, item)`      | 注册字段；`item` 为 `FormFieldItem`（`validate` 必填，`clearValidate` 可选） |
| `unregisterField(field)`          | 注销字段                                                                     |
| `validateFields?(keys?)`          | 校验指定字段；省略 `keys` 时校验已注册全部                                   |
| `shouldValidate?()`               | 是否需要进行校验                                                             |
| `handleFieldChange(field, value)` | 字段值变化                                                                   |

`FormContextProps`：`labelWidth`、`labelPosition`（`top` 或 `left`）、`size`、`disabled`、`readonly`、`noTips`、`model`。

```ts
import { provideFormContext } from '@veltra/utils'

provideFormContext({
  formProps: props,
  registerField,
  unregisterField,
  validateFields: validate,
  shouldValidate,
  handleFieldChange
})
```
