# 修复 legacy 移除引发的 CSS 变量引用失效

## 补丁内容

plan-39 删除了 `UITheme.withLegacyDuplicates`，输出的 CSS 变量不再包含无前缀副本（如 `--color-primary`、`--text-color-second`），但仓库内仍有代码引用这些旧变量，导致上线后视觉失效。本补丁将所有无前缀引用迁移到 `--u-` 前缀命名空间，保持与正式主题 token 一致。

具体修改：

1. `packages/desktop/src/components/progress/progress.vue`
   - `stroke` 计算属性从 `` `var(--color-${type.value})` `` 改为 `` `var(--u-color-${type.value})` ``。
   - 位于 `<script>` 内生成字符串，非 SCSS 作用域，无法使用 `fn.use-var`，故使用原生 `var(--u-color-<type>)`。
2. `playgrounds/desktop/src/progress/index.vue`
   - 模板 `:style` 内联表达式从 `var(--color-${type})` 改为 `var(--u-color-${type})`。
   - 位于模板字符串内，同样无法使用 `fn.use-var`。
3. `playgrounds/desktop/src/progress-nodes/index.vue`
   - `<style lang="scss" scoped>` 中 `.label` 的 `color: var(--text-color-second);` 改为 `color: fn.use-var(text-color, second);`，并在 `<style>` 块顶部新增 `@use 'pkg:@veltra/styles/functions' as fn;`。
   - 此处在 SCSS 作用域内，按用户要求使用 `fn.use-var`。

## 影响范围

- 修改文件: `packages/desktop/src/components/progress/progress.vue`
- 修改文件: `playgrounds/desktop/src/progress/index.vue`
- 修改文件: `playgrounds/desktop/src/progress-nodes/index.vue`
