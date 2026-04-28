# Changesets

本目录保存版本变更意图与发布元信息。

## 日常贡献

对会影响使用者的改动，在提交 PR 前执行：

```bash
bun run changeset
```

按提示选择 semver bump 类型并写摘要；会生成 `.changeset/<id>.md`，随代码一并提交。

## 发布

版本与 changelog 进入 `dev` 后，`.github/workflows/release.yml` 会自动执行类型检查、测试、构建、`npm publish` 并创建 GitHub Release notes。

维护者在干净且最新的 `dev` 上执行 `bun run release`，该命令只负责 `changeset version`、`bun install`、commit、push，其余由 GitHub Actions 完成。

## 仓库密钥

在 GitHub 仓库 **Settings → Secrets and variables → Actions** 中配置 `NPM_TOKEN`（具备发布 `@veltra/*` 的 token）。详见仓库根目录 [RELEASE.md](../RELEASE.md)。
