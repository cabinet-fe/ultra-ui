---
"@veltra/desktop": patch
---

修复 batch-edit quick 模式下表单条件字段无法响应当前编辑行的问题：表单改由 `model` 中转实时写回 `row.data`，所有模式均回填 model。
