# 发布流程说明

发布采用 **Changesets 管理版本与 changelog**，**仅在推送版本 tag 时**在 CI 中执行构建、`npm publish` 并创建 **GitHub Release**。向 `main` 的普通合并不会触发发布。

## 前置条件

- 在 GitHub 仓库 **Settings → Secrets and variables → Actions** 中配置 `NPM_TOKEN`（需具备发布 `@veltra/*` 的权限）。
- 默认分支为 `main`（与 `.changeset/config.json` 中 `baseBranch` 一致）。

## 角色分工

| 环节       | 触发方式                                   | 说明                                                                                                                         |
| ---------- | ------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------- |
| 记录变更   | 本地 `bun run changeset`                   | 生成 `.changeset/*.md`，随功能 PR 合并进 `main`                                                                              |
| 合并版本号 | **Version Packages PR**（推荐）或本地 bump | 由 `.github/workflows/version-pr.yml` 在有未消费 changeset 时打开/更新 PR；合并后各包版本与 changelog 已更新，**仍不会发布** |
| 正式发布   | **推送 tag**                               | `.github/workflows/release.yml` 在符合 `v*.*.*` 或 `v*.*.*-*`（预发布）的 tag 上执行 `bun run release` 并创建 GitHub Release |

## 推荐操作步骤（维护者）

1. **日常**：贡献者在改动用户可见行为前执行 `bun run changeset`，把生成的 changeset 文件一并提交。
2. **准备发版**：将含 changeset 的 PR 合并到 `main`。若无待处理的 Version PR，Action 会打开 **Version Packages** PR；审阅后合并，使 `package.json` 与 changelog 落到 `main`。
3. **（可选）本地合并版本**：若不用 Version PR，在最新 `main` 上执行 `bun run version-packages`，提交并推送 `chore: version packages`。
4. **打 tag 并推送**（**发布扳机**）：

   ```bash
   git pull origin main
   git tag vX.Y.Z
   git push origin vX.Y.Z
   ```

   Tag 须匹配 **`v主.次.修`**（如 `v1.2.3`）或 **`v主.次.修-预发布`**（如 `v1.2.3-beta.1`）；不要使用 `v1`、无点分段等模糊 tag。Tag **必须指向已 bump 版本后的提交**（与即将发布的 npm 版本一致）。

5. **CI**：工作流 **Release** 会安装依赖、执行 `bun run release`（构建除 `@veltra/mobile` 外的 `@veltra/*`，并在 `changeset publish` 前临时把内部 `workspace:*` 依赖展开为当前包版本，同时从各包的 `exports` 中移除仅供仓库内联调使用的 `development` 条件），随后创建 GitHub Release：
   - 若存在 `packages/desktop/CHANGELOG.md`（Changesets 在 `version-packages` 后生成），则取文件中 **第一个 `##` 版本段落** 作为 Release 正文；
   - 否则使用 GitHub 自动生成的 Release Notes。

## 故障与注意

- 若 `npm publish` 失败，工作流会失败，**可能尚未创建 GitHub Release**；修复问题后需重新推送 tag（通常需删除远端 tag 再重建，或改用新 patch 版本号），避免重复发布同一版本到 registry。
- 发布脚本只会在发布命令执行期间临时改写待发布包的 `package.json`（内部 `workspace:*` 展开与 `exports` 去掉 `development`），命令结束后自动恢复仓库里的原始清单；日常开发与 Version PR 不需要手工改这些字段。
- 误推 tag 会触发发布流程；可通过 GitHub 环境与分支保护限制谁可推送 tag。

更细的 changeset 用法见 [.changeset/README.md](.changeset/README.md)。
