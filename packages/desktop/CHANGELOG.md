# @veltra/desktop

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
