# @veltra/styles

## 1.1.1

### Patch Changes

- a9e4a86: 修复 `@veltra/styles` 构建产物导出路径，将 `import` 与 `default` 条件正确指向 `dist/` 目录；新增 `normalize.ts` 与 `anime/index.ts` 入口文件以支持独立导入；更新 `tsdown.config.ts` 构建入口。
  - @veltra/utils@1.1.1
  - @veltra/compositions@1.1.1

## 1.1.0

### Minor Changes

- dad6fef: refactor: replace hardcoded backdrop-filter with bg-filter CSS variable across components; add `is-not` SCSS mixin for cleaner disabled state selectors; improve input clearable/suffix interaction; add number-input clearable support; fix badge type safety; fix palette clear alpha bug; fix select displayed value; fix progress-nodes border color token; adjust hero/shadcn/glass themes

### Patch Changes

- @veltra/utils@1.1.0
- @veltra/compositions@1.1.0

## 1.0.15

### Patch Changes

- @veltra/utils@1.0.15
- @veltra/compositions@1.0.15

## 1.0.14

### Patch Changes

- 3da006a: - desktop: 重写 expression-editor，移除 lexical 依赖；batch-edit 合并精简实现
  - desktop: action / cascade / code-editor / dialog / layout / number-input / table / tree 体验与样式细节优化
  - icons: 新增 dot 图标
  - styles: 调整 spring 动效曲线
  - compositions: 精简 use-drag 内部实现
- Updated dependencies [3da006a]
  - @veltra/compositions@1.0.14
  - @veltra/utils@1.0.14

## 1.0.13

### Patch Changes

- @veltra/utils@1.0.13
- @veltra/compositions@1.0.13

## 1.0.12

### Patch Changes

- @veltra/utils@1.0.12
- @veltra/compositions@1.0.12

## 1.0.11

### Patch Changes

- @veltra/utils@1.0.11
- @veltra/compositions@1.0.11

## 1.0.10

### Patch Changes

- f1bce93: 修复样式导入入口副作用丢失的问题
  - @veltra/utils@1.0.10
  - @veltra/compositions@1.0.10

## 1.0.9

### Patch Changes

- 81dbe41: 重构 use-lock -> use-user-action, 更加符合直觉
- 组件优化
- Updated dependencies
- Updated dependencies [81dbe41]
- Updated dependencies
  - @veltra/compositions@1.0.9
  - @veltra/utils@1.0.9

## 1.0.8

### Patch Changes

- f758a81: 修复样式问题
- Updated dependencies [f758a81]
  - @veltra/compositions@1.0.8
  - @veltra/utils@1.0.8

## 1.0.7

### Patch Changes

- a91e7a8: 新增面包屑组件
- Updated dependencies [a91e7a8]
  - @veltra/compositions@1.0.7
  - @veltra/utils@1.0.7

## 1.0.6

### Patch Changes

- ab2d8e6: 新增一个 vite 包
- Updated dependencies [ab2d8e6]
  - @veltra/compositions@1.0.6
  - @veltra/utils@1.0.6

## 1.0.5

### Patch Changes

- @veltra/utils@1.0.5
- @veltra/compositions@1.0.5

## 1.0.4

### Patch Changes

- Updated dependencies
  - @veltra/utils@1.0.4
  - @veltra/compositions@1.0.4

## 1.0.3

### Patch Changes

- Fix published package manifests to strip `exports.development` conditions from npm tarballs during release.
- Updated dependencies
  - @veltra/utils@1.0.3
  - @veltra/compositions@1.0.3

## 1.0.2

### Patch Changes

- 修复发布流程，确保发布到 npm 的内部包依赖不会保留 `workspace:*`，而是展开为对应版本号。
- Updated dependencies
  - @veltra/utils@1.0.2
  - @veltra/compositions@1.0.2

## 1.0.1

### Patch Changes

- @veltra/utils@1.0.1
- @veltra/compositions@1.0.1
