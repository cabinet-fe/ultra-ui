---
'@veltra/desktop': minor
'@veltra/utils': minor
---

重构表单体系：移除 `IFormModel` / `dynamic-form-model`，`UForm` 改为使用 `Record` 数据模型；校验逻辑下沉至 `form-item` 与各表单控件 `rules` 属性；从 `@veltra/utils` 移除 `validate` 导出及相关类型。
