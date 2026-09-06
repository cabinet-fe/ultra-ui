---
title: provideFormContext
description: 向子树提供 UForm 字段注册与表单属性上下文
---

`provideFormContext(context)` 向后代 provide 表单上下文。桌面端 `UForm` 在自身 setup 里调用；自定义表单容器也应走这一导出，以便控件用 `injectFormContext` 对齐。

相关类型：`FormContextProps`（表单外观/数据）、`FormFieldItem`（字段校验项）、`FormContextModel`（errors / fields 模型形状）。上下文对象本身无单独导出名。

## context 字段

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
