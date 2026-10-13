---
"@veltra/desktop": minor
"@veltra/utils": minor
---

feat(desktop): USelect / UMultiSelect / UTreeSelect / UMultiTreeSelect 新增 `labelTemplate` 属性，选项展示文案支持 `{fieldKey}` 占位符按行字段插值（沿用 `o(option).get` 链式取值，支持嵌套路径），模板引用的字段未命中时整体回退 `row[labelKey]`；下拉选项、选中回显、已选标签、树节点文本与 `update:text` 回发统一渲染模板结果，filterable 对原始 label 与模板渲染结果任一 includes 命中即匹配。@veltra/utils 新增 `renderLabelTemplate` 工具函数
