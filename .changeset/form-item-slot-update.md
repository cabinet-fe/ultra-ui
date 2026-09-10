---
"@veltra/desktop": patch
---

- 表单项（FormItem）：修复默认插槽经内部组件转发后没有更新路径的问题。父级重渲染时插槽控件不再冻结在首帧，动态绑定（`disabled`、透传属性等）与控件 `change` 拦截（`field:change`）均可正常更新
