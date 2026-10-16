# changesets 使用参考（@changesets/cli 3.x）

基线（2026-10 联网核对）：`@changesets/cli@3.0.3`（npm `latest`）、`@changesets/config@4.0.1`、`@changesets/changelog-github@1.0.1`、`changesets/action@v2.1.2`。2.x 仍以 `maintenance-v2` 标签维护（最新 `2.31.1`），配套 `changesets/action@v1`。

先读项目实际版本；2.x 项目按文末「2.x 项目」调整写法：

```bash
node -p "require('@changesets/cli/package.json').version"
```

## 识别与环境

- 存在 `.changeset/config.json` 即视为使用 changesets；根 `package.json` 需把 `@changesets/cli` 装为 devDependency。
- 3.x 是 ESM-only，要求 Node `^22.11 || ^24 || >=26`，npm ≥ 10.9.0 / pnpm ≥ 10 / yarn ≥ 4.5.2；不再支持 Yarn Classic。
- 下文命令写作 `changeset <命令>`，执行前缀按包管理器：`npx` / `pnpm` / `yarn` / `bunx`。

## 在两套标准中的用法

- 公开发版：本地 `release` 脚本执行 `changeset version`；CI 用 `changesets/action/publish@v2`（内部执行 `changeset publish`）发布、推 tag、建 Release。
- 本地发版：本地 `release` 脚本执行 `changeset version`；发布不用 `changeset publish`，按 [local-release.md](../local-release.md) 用包管理器打包后发布 tarball，发布成功后 `changeset git-tag` 打 tag，只推送本次新建的 tag。

## 配置 `.changeset/config.json`

严格 JSON（不能带注释），推荐基线：

```json
{
  "$schema": "https://unpkg.com/@changesets/config@4.0.1/schema.json",
  "baseBranch": "main",
  "access": "public",
  "format": "auto",
  "changelog": "@changesets/cli/changelog",
  "commit": false,
  "fixed": [],
  "linked": [],
  "ignore": [],
  "updateInternalDependencies": "patch"
}
```

| 键 | 默认 | 说明 |
| --- | --- | --- |
| `baseBranch` | `main` | 必须等于发版分支；`add`、`status` 以它判定哪些包有改动 |
| `access` | `restricted` | 公开的 scoped 包必须设 `public`（或在各包 `publishConfig.access` 设置），否则 npm 拒绝发布 |
| `format` | `auto` | 3.x 新键：`auto` / `prettier` / `oxfmt` / `deno` / `dprint` / `false`；旧键 `prettier` 已移除 |
| `commit` | `false` | 保持 `false`，由发版脚本统一提交 |
| `fixed` | `[]` | 同组包永远同版本、一起发 |
| `linked` | `[]` | 同组包一起发时对齐到组内最高版本，但不强制一起发 |
| `ignore` | `[]` | 不参与版本化的包；被忽略包的依赖方也必须忽略。与 `version --ignore` 二选一 |
| `privatePackages` | `false` | 3.x 起私有包默认不升版本；`true` = 升版本并打 tag，`{ "version": true, "tag": false }` = 只升版本 |
| `changedFilePatterns` | `["**"]` | 判定「包有改动」的文件模式 |
| `snapshot` | `{}` | `useCalculatedVersion`：快照版本基于计算版本而非 `0.0.0`；`prereleaseTemplate` 可用 `{commit}` `{commit-short}` `{tag}` `{datetime}` `{timestamp}` |

changelog 生成器：

- `@changesets/cli/changelog`（默认）：条目为 `- <短 hash>: <摘要>`，不联网。本地升版本的流程用它。
- `["@changesets/changelog-github", { "repo": "org/repo" }]`：条目带 PR 链接与致谢，但执行 `changeset version` 时必须有 `GITHUB_TOKEN`（环境变量或项目根 `.env`），缺失直接报错；只适合在 CI 里执行 version 的项目。

## changeset 文件

`.changeset/<kebab-case 名>.md`（`README.md` 除外），一个文件描述一处逻辑改动：

```markdown
---
"@scope/core": minor
"@scope/utils": patch
---

`createClient` 新增 `retry` 选项，默认不重试。
```

- frontmatter：带引号的包名 → `patch` / `minor` / `major`。只列真正改了的包；依赖方连带升级、`fixed` 组整组升级由 changesets 自动完成。
- frontmatter 为空（两行 `---`）是空 changeset，表示「本次改动不发版」。
- 正文进入 CHANGELOG，写法见 [release-content.md](../release-content.md)。
- 创建方式：直接写文件（可多段，首选）；或 3.x 非交互命令 `changeset add --minor @scope/core -m "<摘要>"`（多包用逗号分隔，`--empty` 建空 changeset）。不带参数的 `changeset` / `changeset add` 会进入交互，禁止使用。

## 命令（3.x）

| 命令 | 作用 | 要点 |
| --- | --- | --- |
| `changeset status --verbose` | 预览将升的版本及来源 changeset | 有包改动却没有 changeset 时退出码 1；`--since <ref>`；`--output <file>` 输出 JSON |
| `changeset version` | 消费 changeset：改版本号、写 CHANGELOG、删 changeset 文件 | 无待消费 changeset 时退出码 1；不更新 lockfile，之后必须 `<pm> install`；首次发版新建的 `CHANGELOG.md` 是未跟踪文件 |
| `changeset publish` | 发布 registry 上还没有的版本，成功后打本地 tag | 见下节；`--tag <dist-tag>`、`--otp <code>`、`--no-git-tag`、`--from-pack-dir <dir>` |
| `changeset publish-plan` | 只读预览将发布 / 打 tag 的包 | 会查询 registry；`--output <file>` |
| `changeset pack --out-dir <dir>` | 打 tarball 并写 `publish-plan.json` | 与 `publish --from-pack-dir` 配合，把打包和发布拆到不同 CI job |
| `changeset git-tag` | 为当前版本补打缺失的 tag | 附注 tag：多包 `<包名>@<版本>`，单包 `v<版本>`；旧名 `tag` 已弃用 |
| `changeset pre enter <tag>` / `pre exit` | 进入 / 退出预发布模式 | 见「预发布与快照」 |

3.x 遇到未知参数直接报错退出。

## `changeset publish` 行为

- 范围：非 private、未被 ignore 的包中，本地版本号在 registry 上不存在的那些。已发布的自动跳过，所以中途失败后修复原因直接重跑即可。
- 顺序：按内部依赖分批，被依赖的先发；批内并发。
- 实际发布命令随包管理器：pnpm → `pnpm publish --no-git-checks`；yarn Berry → `yarn npm publish`；npm、bun 及其他 → `npm publish`。
- `workspace:` / `catalog:` 协议：pnpm、yarn 发布时自动替换为真实版本（pnpm 读 `pnpm-workspace.yaml`，yarn 读 `.yarnrc.yml`）；**bun 与 npm 仓库走 `npm publish`，不会替换**，`changeset pack` 同样用 `npm pack`。CI 发布前按 [public-release.md](../public-release.md)「协议处理」展开（不提交，含 `devDependencies`）。monorepo 内部包之间的依赖必须用 `workspace:`，禁止用 `catalog:`（否则 `changeset` 构建依赖图时直接报错退出）。
- registry：npm 路径遵循各包 `publishConfig.registry` 与 `publishConfig["@scope:registry"]`；pnpm 项目查询已发布状态时忽略这两项，私有源要配在 `.npmrc`。
- dist-tag：默认 `latest`；`--tag` 可自定义，预发布模式下不允许再加。
- 2FA：交互终端会走网页 / OTP 验证；非交互环境需 `--otp` 或 `NPM_CONFIG_OTP`。失败按包报告，已成功的包照常打 tag，命令以退出码 1 结束。
- tag：成功后只打本地附注 tag（格式同 `git-tag`），**不推送**；CI 里由 `changesets/action` 推送。

## 预发布与快照

预发布（`next`、`beta` 等）：

```bash
changeset pre enter next   # 写 .changeset/pre.json，之后 version 产出 x.y.z-next.N
changeset version          # 再 <pm> install、提交、发布；dist-tag 自动为 next
# 继续「加 changeset → version → 发布」得到 -next.1、-next.2 …
changeset pre exit
changeset version          # 产出正式版 x.y.z，发布到 latest
```

- 3.x 把已版本化的预发布 changeset 移到 `.changeset/pre/`（旧 `pre.json` 自动迁移），正式版前可在其中增删。
- 从未发过正式版的包，在 npm 官方 registry 上仍会落到 `latest`（registry 自动指派）。

快照（给 PR 试用，不进版本线）：

```bash
changeset version --snapshot pr123           # 0.0.0-pr123-<时间>
changeset publish --tag pr123 --no-git-tag   # 必须用非 latest 的 dist-tag
```

快照同样会改版本号、删 changeset：发布后还原工作区（或只在 CI 临时检出里执行），绝不提交。预发布模式下不能做快照。

## CI：changesets/action@v2

- CLI 3.x 用 `@v2`（启动时校验 CLI 版本，2.x 会被拒绝并提示改用 `@v1`）。
- 根 action `changesets/action@v2`：有待消费 changeset 时开 / 更新 Version PR，没有时发布。子 action：`/select-mode`、`/version`、`/pack`、`/publish`、`/pr-status`、`/pr-comment`。
- `changesets/action/publish@v2`：不传 `script` 时执行本地 `changeset publish`（传 `pack-dir-artifact-id` 时从打包产物发布）；成功后经 GitHub API 推 tag；`create-github-releases`（默认 `true`）按包建 Release，名称为 tag、正文为该版本的 CHANGELOG 段、版本含 `-` 时标为预发布。`create-github-releases: true` 要求 `push-git-tags: true`。输出 `published`、`published-packages`（`[{"name","version"}]`）。
- 自定义发布脚本必须把环境变量 `CHANGESETS_OUTPUT` 透传给 changesets CLI，否则 action 拿不到发布结果，无法打 tag、建 Release。
- 官方建议：trusted publishing 优先；顶层 `permissions: {}`，`id-token: write` 只给发布 job；checkout 设 `persist-credentials: false`；setup-node 设 `package-manager-cache: false`。npm Staged Publishing 目前与 changesets 不兼容。

v1 → v2 迁移：

| v1 | v2 |
| --- | --- |
| `publish` / `version` | `publish-script` / `version-script` |
| `commit` / `title` / `branch` | `commit-message` / `pr-title` / `pr-base-branch` |
| `createGithubReleases` | `create-github-releases`；为 `false` 时**不再**连带关闭 tag，需另设 `push-git-tags: false` |
| `commitMode` | `push-with-git-cli`（默认 `false`：经 GitHub API 推送，提交与 tag 带 GitHub 签名） |
| `setupGitUser` | 移除，自动沿用已有 git 身份，缺省为 `github-actions[bot]` |
| 环境变量 `GITHUB_TOKEN` 传自定义 token | 只认 `github-token` 输入 |
| 环境变量 `NPM_TOKEN` 自动写 `.npmrc` | 移除；用 trusted publishing，或 setup-node `registry-url` + `NODE_AUTH_TOKEN` |
| 输出 `publishedPackages` / `hasChangesets` / `pullRequestNumber` | `published-packages` / `has-changesets` / `pr-number` |
| `cwd` | 2.0 移除，2.1.0 恢复 |

### 发布 workflow 模板（本地升版本 + CI 发布）

配合 [public-release.md](../public-release.md) 的本地 `release` 脚本：本地 `changeset version` 后推送，推送触发本 workflow，CI 只负责发布。

```yaml
# .github/workflows/release.yml（文件名固定：npm trusted publisher 按 仓库 + workflow 文件名 绑定）
name: Release

on:
  push:
    branches: [main] # 发版分支
    paths: ['**/CHANGELOG.md'] # 只由发版提交触发
  workflow_dispatch: # 失败后重跑；publish 幂等

permissions: {}

concurrency:
  group: release
  cancel-in-progress: false

jobs:
  publish:
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    permissions:
      contents: write # 推 tag、建 Release
      id-token: write # trusted publishing
    steps:
      - uses: actions/checkout@v7
        with:
          persist-credentials: false
      - uses: actions/setup-node@v7
        with:
          node-version: 24 # 自带 npm ≥ 11.5.1
          package-manager-cache: false
      # 非 npm 项目在此装包管理器：oven-sh/setup-bun@v2 / pnpm/action-setup@v6
      - run: bun install --frozen-lockfile # npm ci / pnpm install --frozen-lockfile / yarn install --immutable
      - run: bun run test
      - run: bun run build
      # 仅 bun / npm 仓库且待发布包含 workspace: / catalog: 依赖时，按 public-release.md「协议处理」展开 manifest（不提交）
      - uses: changesets/action/publish@v2
```

- 只用 token 发布（registry 不支持 trusted publishing）时：setup-node 加 `registry-url: https://registry.npmjs.org`，publish 步骤加 `env: NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}`。
- 不想按包建 Release（例如 `fixed` 组要一条聚合 Release）：`create-github-releases: false`，tag 仍会推送；聚合 Release 用后续步骤读 `published-packages` 自建。
- 需要更强隔离时按官方模板拆成 `select-mode` → `pack` → `publish` 三个 job，发布 job 只拿打包产物：<https://changesets.dev/guide/automating>。

## 常见坑

- 公开 scoped 包没设 `access: public` → 发布被拒。
- 提交信息带 `[skip ci]` → 发布 workflow 不运行。
- `changeset version` 或修改 `catalog` 后没跑 `<pm> install` → lockfile 里的 workspace / catalog 版本过期，CI `--frozen-lockfile` 失败，或 `bun pm pack` 打进旧版本。
- `bun` 仓库 CI 改写协议时漏处理 `devDependencies` 中的 `catalog:` / 私有 `workspace:` 包 → 残留协议检查失败或把 `catalog:` 原样发进 registry manifest。
- 3.x 中 peer 依赖升级只让依赖方 patch；确属破坏性时手写 `major` changeset。
- 改了 `baseBranch` 以外的分支发版 → `status --since`、`add` 的改动检测失真。

## 2.x 项目

- 命令：打 tag 用 `changeset tag`；`add` 没有 `--major/--minor/--patch`，只能直接写 changeset 文件；没有 `publish-plan`、`pack`。
- 配置：用 `prettier` 而非 `format`；私有包默认升版本。
- CI：`changesets/action@v1`（输入 `publish`、`createGithubReleases`，输出 `publishedPackages`）；`createGithubReleases: false` 时连 tag 也不推，需要自己 `git push --follow-tags`。
- npm 12 下 `npm info --json` 总是返回数组，`< 2.31.1` 会把所有包误判为未发布 → 至少升到 2.31.1，或固定 `npm@11`。
- 升到 3.x 属于依赖升级，须先征得用户同意；改动点：Node 版本、`prettier` → `format`、`tag` → `git-tag`、`privatePackages` 默认值、action v1 → v2 输入输出改名。
