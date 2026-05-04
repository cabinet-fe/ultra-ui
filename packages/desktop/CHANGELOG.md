# @veltra/desktop

## 1.0.12

### Patch Changes

- b072b20: Collapse 组件全面增强：新增 `size` / `bordered`(ghost) / `iconPosition` / `expandIcon` / `hideIcon`，以 `height` 数值过渡替代 `grid-template-rows` 提升嵌套场景流畅度，暴露 `toggle` / `expand` / `collapse` / `expandAll` / `collapseAll` 实例方法，`#icon` 插槽提供 `isActive` 状态；`@veltra/vite` resolver 注册 `UCollapse` / `UCollapseItem` 自动按需引入。
  - @veltra/utils@1.0.12
  - @veltra/styles@1.0.12
  - @veltra/compositions@1.0.12
  - @veltra/directives@1.0.12
  - @veltra/icons@1.0.12

## 1.0.11

### Patch Changes

- 0b04546: 优化文件预览组件,样式更美观,体验更好
- 8992a55: 优化 code-editor 组件, 使用 one-dark 主题
  - @veltra/utils@1.0.11
  - @veltra/styles@1.0.11
  - @veltra/compositions@1.0.11
  - @veltra/directives@1.0.11
  - @veltra/icons@1.0.11

## 1.0.10

### Patch Changes

- f1bce93: 优化 tabs 组件样式
- Updated dependencies [f1bce93]
  - @veltra/styles@1.0.10
  - @veltra/directives@1.0.10
  - @veltra/utils@1.0.10
  - @veltra/compositions@1.0.10
  - @veltra/icons@1.0.10

## 1.0.9

### Patch Changes

- 81dbe41: 重构 use-lock -> use-user-action, 更加符合直觉
- 组件优化
- Updated dependencies
- Updated dependencies [81dbe41]
- Updated dependencies
  - @veltra/compositions@1.0.9
  - @veltra/directives@1.0.9
  - @veltra/styles@1.0.9
  - @veltra/icons@1.0.9
  - @veltra/utils@1.0.9

## 1.0.8

### Patch Changes

- f758a81: 修复样式问题
- Updated dependencies [f758a81]
  - @veltra/compositions@1.0.8
  - @veltra/directives@1.0.8
  - @veltra/styles@1.0.8
  - @veltra/icons@1.0.8
  - @veltra/utils@1.0.8

## 1.0.7

### Patch Changes

- a91e7a8: 新增面包屑组件
- Updated dependencies [a91e7a8]
  - @veltra/compositions@1.0.7
  - @veltra/directives@1.0.7
  - @veltra/icons@1.0.7
  - @veltra/styles@1.0.7
  - @veltra/utils@1.0.7

## 1.0.6

### Patch Changes

- ab2d8e6: 新增一个 vite 包
- Updated dependencies [ab2d8e6]
  - @veltra/compositions@1.0.6
  - @veltra/directives@1.0.6
  - @veltra/icons@1.0.6
  - @veltra/styles@1.0.6
  - @veltra/utils@1.0.6

## 1.0.5

### Patch Changes

- Updated dependencies
  - @veltra/icons@1.0.5
  - @veltra/utils@1.0.5
  - @veltra/styles@1.0.5
  - @veltra/compositions@1.0.5
  - @veltra/directives@1.0.5

## 1.0.4

### Patch Changes

- Fix published subpath exports so npm consumers resolve wildcard entries to the correct built files.
- Updated dependencies
  - @veltra/directives@1.0.4
  - @veltra/utils@1.0.4
  - @veltra/compositions@1.0.4
  - @veltra/styles@1.0.4
  - @veltra/icons@1.0.4

## 1.0.3

### Patch Changes

- Fix published package manifests to strip `exports.development` conditions from npm tarballs during release.
- Updated dependencies
  - @veltra/utils@1.0.3
  - @veltra/styles@1.0.3
  - @veltra/compositions@1.0.3
  - @veltra/directives@1.0.3
  - @veltra/icons@1.0.3

## 1.0.2

### Patch Changes

- 修复发布流程，确保发布到 npm 的内部包依赖不会保留 `workspace:*`，而是展开为对应版本号。
- Updated dependencies
  - @veltra/utils@1.0.2
  - @veltra/styles@1.0.2
  - @veltra/compositions@1.0.2
  - @veltra/directives@1.0.2
  - @veltra/icons@1.0.2

## 1.0.1

### Patch Changes

- 将 playground、移动端占位与内部 CLI 标为 `private`，避免 `changeset publish` 误发布；发布 1.0.1。
  - @veltra/utils@1.0.1
  - @veltra/styles@1.0.1
  - @veltra/compositions@1.0.1
  - @veltra/directives@1.0.1
  - @veltra/icons@1.0.1
