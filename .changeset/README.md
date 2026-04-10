# Changesets

发布分两步：合并带 changeset 的 PR 后，`.github/workflows/version-pr.yml` 会打开或更新 **Version Packages** PR；合并该 PR 只更新版本与 changelog，**不会**发布。在已 bump 的提交上推送 **`v*` tag** 后，`.github/workflows/release.yml` 才执行构建、`npm publish` 并创建 GitHub Release。详见仓库根目录 [RELEASE.md](../RELEASE.md)。

## 日常贡献

对会影响使用者的改动，在提交 PR 前执行：

```bash
bun run changeset
```

按提示选择 semver bump 类型并写摘要；会生成 `.changeset/<id>.md`，随代码一并提交。

## 仓库密钥

在 GitHub 仓库 **Settings → Secrets and variables → Actions** 中配置 `NPM_TOKEN`（具备发布 `@ultra-ui/*` 的 token）。若使用自建 registry，可在 workflow 中增加写 `.npmrc` 的步骤（勿把 token 写入仓库）。
