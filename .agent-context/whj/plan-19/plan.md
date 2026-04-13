# 发布时展开内部 workspace 依赖版本

> 状态: 已执行

## 目标

确保 `@veltra/*` 包在版本发布时，对外发布到 npm 的 `package.json` 不再保留内部依赖的 `workspace:*` 协议，而是替换为对应包当前将发布的实际版本；同时保留仓库开发态继续使用 `workspace:*` 协议，避免影响 monorepo 日常联调体验。

## 内容

1. 梳理当前发布链路与各内部包依赖声明，确认 `workspace:*` 出现的位置、发布入口以及最合适的替换时机。
2. 在发布流程中加入一个只面向 `@veltra/*` 包的清单处理步骤，在执行 `changeset publish` 前把 `dependencies`、`peerDependencies`、`optionalDependencies` 中引用内部包且值为 `workspace:*` 的条目替换为目标包当前 `version`。
3. 调整根级发布脚本或相关文档，使发布流程稳定调用上述处理步骤；补充必要说明，避免后续维护者误以为需要手工修改包依赖协议。
4. 运行针对性的验证，确认处理脚本能把现有包清单正确改写且不会误改 `private` 包或非内部依赖。

## 影响范围

- `package.json`
- `tools/cli/release/with-resolved-workspace-versions.ts`
- `RELEASE.md`
- `packages/utils/package.json`
- `packages/utils/CHANGELOG.md`
- `packages/styles/package.json`
- `packages/styles/CHANGELOG.md`
- `packages/compositions/package.json`
- `packages/compositions/CHANGELOG.md`
- `packages/directives/package.json`
- `packages/directives/CHANGELOG.md`
- `packages/desktop/package.json`
- `packages/desktop/CHANGELOG.md`
- `packages/icons/package.json`
- `packages/icons/CHANGELOG.md`

## 历史补丁

- patch-1: 发布 1.0.2 版本
- patch-2: 发布时移除 exports 的 development 条件
