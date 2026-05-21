# @veltra/utils

## 1.1.12

## 1.1.11

## 1.1.10

## 1.1.9

### Patch Changes

- ca68f74: chore: republish all packages since 1.1.8 was not published

## 1.1.8

## 1.1.7

## 1.1.6

## 1.1.5

## 1.1.4

## 1.1.3

### Patch Changes

- 将表单上下文抽到 `@veltra/utils`，统一 `form` 相关组件的 `provide/inject` 入口。

## 1.1.2

### Patch Changes

- ef0ef2d: Refine shared expand transitions and related component/theme behavior.

## 1.1.1

## 1.1.0

## 1.0.15

## 1.0.14

## 1.0.13

## 1.0.12

## 1.0.11

## 1.0.10

## 1.0.9

### Patch Changes

- 81dbe41: 重构 use-lock -> use-user-action, 更加符合直觉
- 组件优化

## 1.0.8

### Patch Changes

- f758a81: 修复样式问题

## 1.0.7

### Patch Changes

- a91e7a8: 新增面包屑组件

## 1.0.6

### Patch Changes

- ab2d8e6: 新增一个 vite 包

## 1.0.5

## 1.0.4

### Patch Changes

- Fix published subpath exports so npm consumers resolve wildcard entries to the correct built files.

## 1.0.3

### Patch Changes

- Fix published package manifests to strip `exports.development` conditions from npm tarballs during release.

## 1.0.2

### Patch Changes

- 修复发布流程，确保发布到 npm 的内部包依赖不会保留 `workspace:*`，而是展开为对应版本号。

## 1.0.1
