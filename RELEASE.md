# 发布流程说明

发布采用 **Changesets 管理版本与 changelog**。维护者在 `dev` 分支开发并提交 changeset 后，运行 `bun run release` 即可落版本号并推送版本提交；该提交进入 `dev` 后，`.github/workflows/release.yml` 会自动执行类型检查、测试、构建、`npm publish`，并自动编写 **GitHub Release notes**。

## 前置条件

- 在 GitHub 仓库 **Settings → Secrets and variables → Actions** 中配置 `NPM_TOKEN`（需具备发布 `@veltra/*` 的权限）。
- 发布分支为 `dev`（与 `.changeset/config.json` 中 `baseBranch` 一致）。

## 角色分工

| 环节     | 触发方式                                  | 说明                                                                                                      |
| -------- | ----------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| 记录变更 | 本地 `bun run changeset`                  | 生成 `.changeset/*.md`，随开发提交进入 `dev`                                                              |
| 落版本号 | 本地 `bun run release`                    | 在 `dev` 上执行 `changeset version`、`bun install`、提交版本变更并推送                                    |
| 正式发布 | `dev` 上的 `packages/*/CHANGELOG.md` 变更 | Release workflow 自动完成 `check-types`、`test`、packages build、npm publish 和 GitHub Release notes 创建 |

## 推荐操作步骤（维护者）

1. **日常**：在 `dev` 分支开发。改动用户可见行为前执行 `bun run changeset`，把生成的 changeset 文件一并提交。
2. **准备发版**：在最新且干净的 `dev` 上执行 `bun run release`。该命令会执行 `changeset version`、`bun install`、提交版本变更并推送；远端 CI 负责真正发布。可用 `bun run release --dry-run` 预览版本变更后自动回滚本地改动。
3. **CI 发布**：`packages/*/CHANGELOG.md` 变更进入 `dev` 后，工作流 **Release** 会：
   - 安装依赖，并运行 `bun run check-types`、`bun run test`；
   - 执行 `bun run build:packages`，构建除 `@veltra/mobile` 外的 packages；
   - 发布前把 CI 内的 `.npmrc` 切到 npmjs；
   - 执行 `scripts/normalize-release-manifests.ts`，将内部 `workspace:` 依赖解析为当前包版本，并从发布清单的 `exports` 中移除仅供仓库内联调用的 `development` 条件；
   - 通过 `changesets/action` 执行 `changeset publish`；
   - 根据发布结果运行 `scripts/create-github-releases.ts` 创建或更新 GitHub Release。

## GitHub Release 规则

- fixed 组（`@veltra/utils`、`@veltra/styles`、`@veltra/compositions`、`@veltra/directives`、`@veltra/desktop`、`@veltra/icons`）创建一个聚合 Release，tag 形如 `veltra-fixed@1.2.3`。
- 独立包（如 `@veltra/vite`）按包创建 Release，tag 形如 `@veltra/vite@1.2.3`。
- Release notes 由 `scripts/create-github-releases.ts` 自动生成：正文来自对应包 `CHANGELOG.md` 中本次版本的 `## <version>` 小节；缺失时会回退为简短默认文案。

## 故障与注意

- 若 CI 在 npm publish 前失败，修复后可在 GitHub Actions 页面重跑同一次 workflow。
- 若 CI 在部分包已发布后失败，先确认 npm 上的实际发布结果，再重跑 workflow；`changeset publish` 会基于 registry 状态处理已发布版本，但聚合 Release 可能需要人工核对。
- 本地 `.npmrc` 默认使用安装镜像，发布 workflow 会在 publish 前覆盖为 npmjs registry，避免误向镜像发布。
- 不要再通过推送 `v*` tag 触发发布；tag 由 GitHub Release 创建流程按发布结果生成。

更细的 changeset 用法见 [.changeset/README.md](.changeset/README.md)。
