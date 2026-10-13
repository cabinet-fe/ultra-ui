---
"@veltra/desktop": patch
---

fix: select / tree-select 显式配置 labelKey 时 update:text 回发 `row[labelKey]` 原始取值；未配置 labelKey 时回发 labelTemplate 渲染结果，与展示文案一致
