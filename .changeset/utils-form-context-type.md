---
"@veltra/utils": patch
---

- 表单上下文（`provideFormContext` / `injectFormContext`）：`handleFieldChange` 参数放宽为 `(field: string, ...args: any[])`，并新增 `handleFieldUpdate` 用于 `model` 字段更新回调
