# 发布流程

Veltra Ultra UI 采用 Changesets 管理版本与 changelog。维护者在 `dev` 分支开发并提交 changeset 后，运行 `bun run release` 落版本号并推送。

## 角色分工

| 环节 | 触发方式 | 说明 |
|------|----------|------|
| 记录变更 | `bun run changeset` | 生成 `.changeset/*.md`，随开发提交进入 `dev`，内容范围包含未提交内容和已提交但未推送至远端的内容 |
| 落版本号 | `bun run release` | 执行 `changeset version`、`bun install`、提交版本变更并推送 |
| 正式发布 | `packages/*/CHANGELOG.md` 变更进入 `dev` | CI 自动完成 check-types、test、build、npm publish、GitHub Release |

## 操作步骤

1. **日常开发**：改动用户可见行为前执行 `bun run changeset`，把生成的 changeset 文件一并提交
2. **准备发版**：在最新且干净的 `dev` 上执行 `bun run release`，可用 `--dry-run` 预览
3. **CI 发布**：推送后 CI 自动执行 build → test → npm publish → GitHub Release

## 版本策略

- fixed 组（`@veltra/utils`、`@veltra/styles`、`@veltra/compositions`、`@veltra/directives`、`@veltra/desktop`、`@veltra/icons`）统一版本号
- 独立包（如 `@veltra/vite`）按包独立版本
- 发布分支为 `dev`

## 故障处理

- CI publish 前失败：修复后在 GitHub Actions 重跑
- 部分包已发布后失败：确认 npm 实际状态后再重跑，聚合 Release 可能需要人工核对
- 本地 `.npmrc` 默认用安装镜像，CI 发布时会覆盖为 npmjs registry
- 不要通过推送 `v*` tag 触发发布
