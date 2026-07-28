---
"@veltra/desktop": patch
---

`USelect` / `UTreeSelect` 移除 `text` prop 与 `v-model:text`。展示文案仅由选项/`data` 推导，并通过单向 `@update:text` 通知父级同步冗余字段。

迁移：`v-model:text="form.text"` → `@update:text="form.text = $event"`。
