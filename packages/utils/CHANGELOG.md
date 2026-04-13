# @veltra/utils

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
