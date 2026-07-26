---
'@veltra/desktop': patch
---

统一选择器交互：Select、MultiSelect、TreeSelect、MultiTreeSelect 的查询过滤与输入创建从下拉面板迁移到触发输入框

- Select/TreeSelect：`filterable` 时触发输入框可直接输入过滤，`creatable` 时回车创建；面板展开时已选标签降级为占位提示，点击输入区域不再收起面板；选中后立即恢复显示选中值，不再等待面板关闭动画；非查询态下触发输入框保持只读防误输入
- MultiSelect/MultiTreeSelect：`filterable` 时触发器内嵌输入框，支持输入过滤、回车创建（MultiSelect），勾选后保持输入焦点
- 修复创建选项临时项在精确匹配后残留的问题；已创建选项并入过滤数据源参与匹配，多次创建不再互相覆盖
