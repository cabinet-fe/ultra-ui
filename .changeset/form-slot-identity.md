---
"@veltra/desktop": patch
"@veltra/utils": patch
---

- 表单（Form）：移除 `field:change`，仅保留 `field:update`（model 任意写入）。表单项仍向外 emit 自身的 `change`
- 批量编辑（BatchEdit）：同步移除 `field:change`
- 表单上下文：从 `provideFormContext` / `injectFormContext` 移除 `handleFieldChange`
- 表单（Form）：插槽列表身份改为「调用方 `:key` → 组件名+field+出现次序」，不再用 `field` 或空的 vnode key。`v-if` 抽掉中间字段时相邻控件不再复用实例；同一 `field` 出现多次也能各自独立渲染。`showModified` 的「变更前」改为未挂载 vnode 副本，避免与编辑控件抢实例
