# 公开发版标准（public）

本地 `release` 脚本升版本、提交并推送发版提交；推送触发 CI，由 CI 构建、发布到 npmjs、打 tag、建 GitHub Release。本地不持有任何 npm 发布凭证。

## 设施清单

| 文件 | 要求 |
| --- | --- |
| `.pe.jsonc` | `"release_mode": "public"` |
| 根 `package.json` | `scripts.release` 指向本地发版脚本 |
| 各可发布包 `package.json` | `repository.url` 与 GitHub 仓库逐字一致（trusted publishing 与 provenance 都校验）；公开的 scoped 包设 `publishConfig.access: "public"`（changesets 项目也可用 config `access`） |
| `scripts/release.<ts\|mjs>` | 见「本地 release 脚本契约」；用项目已有运行时执行（`bun`、`node`） |
| `.github/workflows/release.yml` | 见「CI 契约」；文件名固定，npm trusted publisher 按「仓库 + workflow 文件名」绑定 |
| `CHANGELOG.md` | 无版本工具：仓库根目录，发版前写好新版本一节；changesets：各包目录自动生成 |

无版本工具的 monorepo 不走本标准：先建议接入 changesets（征得同意再加依赖），手写多包版本管理不稳定。

## 本地 release 脚本契约

调用：`<pm> run release -- [<版本>] [--dry-run]`。`<版本>` 只在无版本工具时必填（`x.y.z` 或 `x.y.z-<标识>.<n>`）。脚本不交互，任一步失败即非零退出，并打印已完成的步骤和恢复方式。

1. **前置检查**
   - 工作区干净：`git status --porcelain` 为空（未跟踪文件也算不干净）
   - 当前分支是发版分支（脚本常量；与 workflow `branches`、changesets `baseBranch` 三处一致）
   - `git fetch` 后 `HEAD` 与 `origin/<发版分支>` 一致或领先，不落后、不分叉
   - 每个可发布包已存在于 npmjs（`npm view <包> name`）；不存在 → 中止并提示先走「新包首发」
2. **升版本**
   - changesets：有待消费 changeset → `changeset version`；没有 → 输出「没有待发布的改动」，退出码 1
   - 无工具：`<版本>` 写入 `package.json`；根 `CHANGELOG.md` 必须已有该版本一节，否则中止
   - 之后执行 `<pm> install` 更新 lockfile
3. **版本占用检查**：`npm view <包>@<新版本> version` 输出该版本号即已被占用 → 中止，换版本号
4. **构建与测试**：运行与 CI 发布 job 相同的构建、测试命令，在本地拦下坏提交
5. **提交**：起点干净，因此暂存全部改动；打印暂存文件清单；提交信息按 [release-content.md](release-content.md)
6. **推送**：`git push origin HEAD:<发版分支>`；不推 tag（tag 由 CI 在发布成功后创建）

`--dry-run`：执行第 1–4 步并打印版本变化与将提交的文件，然后恢复工作区：`git restore --staged --worktree .` 加 `git clean -fd`（起点干净所以安全；禁止 `-x`，否则会删掉 `node_modules` 等被忽略文件）。不提交、不推送。

推送失败（远端有新提交）：`git pull --rebase` 后直接 `git push`，不要重跑脚本。

## CI 契约

- 触发：`push` 到发版分支且改动了 CHANGELOG（只由发版提交触发）+ `workflow_dispatch`。禁止 `pull_request_target`、`issue_comment` 触发发布（npm 拒绝这两类事件的 OIDC token）。
- 权限：顶层 `permissions: {}`；发布 job 只给 `contents: write`（tag、Release）与 `id-token: write`（trusted publishing）。
- 串行：`concurrency: { group: release, cancel-in-progress: false }`。
- 环境：`actions/checkout@v7` 设 `persist-credentials: false`；`actions/setup-node@v7` + Node 24（自带 npm ≥ 11.5.1，trusted publishing 的下限）+ `package-manager-cache: false`。
- 步骤：冻结 lockfile 安装 → 测试 → 构建 →（需要时）协议改写 → 发布未发布的版本 → 打 tag → 建 GitHub Release。
- 幂等：已发布的版本跳过，tag、Release 已存在则跳过，失败后可直接重跑。
- 凭证：trusted publishing 不注入任何 token。不要同时配置 `NODE_AUTH_TOKEN`：OIDC 交换失败时 npm 只打 verbose 日志、静默回退到 token，报出误导性的 E404 / ENEEDAUTH。
- 发布命令：npm、pnpm 原生支持 OIDC 并自动生成 provenance；Yarn 需 ≥ 4.10，且 provenance 要显式开启（`.yarnrc.yml` 设 `npmPublishProvenance: true`）；`bun publish` 不支持 OIDC 与 provenance，bun 项目发布一律用 `npm publish`。

模板：

- changesets 项目：[tools/changesets.md](tools/changesets.md)「发布 workflow 模板」。
- 无版本工具的单包：下文模板。

### 协议改写（bun / npm 仓库）

`changeset publish` 在 bun、npm 仓库里调用 `npm publish`，不会替换 `workspace:` / `catalog:`。待发布包的依赖字段含这两种协议时，CI 在发布前改写待发布包的 `package.json`（不提交）：

| 原值 | 改写为 |
| --- | --- |
| `workspace:^` / `workspace:~` | `^<该包版本>` / `~<该包版本>` |
| `workspace:*` / `workspace:` | `<该包版本>` |
| `workspace:<范围>` | `<范围>` |
| `catalog:` / `catalog:<名>` | 根配置中默认 / 具名 catalog 里该依赖的范围 |

改写覆盖 `dependencies`、`peerDependencies`、`optionalDependencies`；改写后任何依赖字段仍残留协议即失败退出。pnpm、yarn 仓库无需改写。

### 无版本工具的单包模板

```yaml
# .github/workflows/release.yml
name: Release

on:
  push:
    branches: [main] # 发版分支
    paths: ['CHANGELOG.md']
  workflow_dispatch:

permissions: {}

concurrency:
  group: release
  cancel-in-progress: false

jobs:
  publish:
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    permissions:
      contents: write
      id-token: write
    steps:
      - uses: actions/checkout@v7
        with:
          persist-credentials: false
      - uses: actions/setup-node@v7
        with:
          node-version: 24
          package-manager-cache: false
      - run: npm ci # 按包管理器替换安装、测试、构建命令；发布保持 npm publish
      - run: npm test
      - run: npm run build
      - name: 发布到 npm
        id: publish
        run: |
          name=$(node -p "require('./package.json').name")
          version=$(node -p "require('./package.json').version")
          echo "version=$version" >> "$GITHUB_OUTPUT"
          if [ "$(npm view "$name@$version" version 2>/dev/null)" = "$version" ]; then
            echo "$name@$version 已发布，跳过"; exit 0
          fi
          tag=latest
          case "$version" in *-*) tag=$(echo "${version#*-}" | cut -d. -f1) ;; esac
          npm publish --access public --tag "$tag"
      - name: 建 GitHub Release
        env:
          GH_TOKEN: ${{ github.token }}
          VERSION: ${{ steps.publish.outputs.version }}
        run: |
          if gh release view "v$VERSION" > /dev/null 2>&1; then echo "Release 已存在，跳过"; exit 0; fi
          awk -v v="$VERSION" '$0 == "## " v || index($0, "## " v " ") == 1 || index($0, "## [" v "]") == 1 {p=1; next} p && /^## / {exit} p' CHANGELOG.md > notes.md
          test -s notes.md || { echo "CHANGELOG.md 缺少 $VERSION 一节"; exit 1; }
          flags=""; case "$VERSION" in *-*) flags="--prerelease" ;; esac
          gh release create "v$VERSION" --target "$GITHUB_SHA" --title "v$VERSION" --notes-file notes.md $flags
```

`gh release create --target` 会在该提交上创建 tag。重试优先用 `gh run rerun <run-id> --failed`（沿用原提交）；`workflow_dispatch` 只在推送没触发 workflow 时用，且此时发版提交必须仍是分支最新提交，否则 tag 会落到后来的提交上。

## npm trusted publishing

每个可发布包配置一次（npmjs 包页面 → Settings → Trusted Publisher → GitHub Actions）：

- 填 Organization/user、Repository、Workflow filename（只填 `release.yml`）、Environment（workflow 没用 environment 就留空）。字段大小写敏感，npm 保存时不校验。
- **勾选允许 publish**：2026-09-03 之后新建的配置默认只允许 stage（staged publishing 需人工审批），而 changesets 不支持 staged publishing。
- 命令行等价：`npm trust github <包> --file release.yml --repo <owner>/<repo> --allow-publish -y`（npm ≥ 11.15.0，账号已开 2FA，包须已存在）。
- 新配置创建后 48 小时内必须有一次成功发布，否则过期失效；过期后删除并重建。
- 发布 job 放在被 `workflow_call` 调用的可复用 workflow 里时，npm 校验的是调用方的文件名：trusted publisher 填调用方，父子两个 workflow 都要给 `id-token: write`。
- 公开仓库发布公开包时自动生成 provenance，无需 `--provenance`；私有仓库不支持 provenance。
- 配置完成后可在包设置选「Require two-factor authentication and disallow tokens」，彻底禁用 token 发布。

### 新包首发

trusted publishing 不能发布包的第一个版本（npm 端须先有包才能配置）。新包按顺序：

1. 维护者在本地构建该包，把版本临时改为 `0.0.0-init.0`，用项目包管理器打包（命令同 [local-release.md](local-release.md)「打包校验」），执行 `npm publish <tarball 绝对路径> --access public --tag init`（浏览器完成 2FA）。版本改动不提交。
2. 按上节为该包配置 trusted publisher，勾选允许 publish。
3. 48 小时内走正常发版流程，由 CI 发布第一个正式版本（同时完成配置验证）。
4. 可选：`npm dist-tag rm <包> init`。

Agent 可以代为执行第 1 步的命令，但 2FA 与第 2 步的网页配置必须由用户完成；用户确认后再继续。

### 无法使用 trusted publishing 时

适用：仓库创建于 2026-07-15 之后且 OIDC 失败（见排查表）、self-hosted runner、目标不是 npmjs。

- 用 granular access token（写权限最长 90 天，到期前轮换），存为仓库 secret `NPM_TOKEN`。
- setup-node 加 `registry-url: https://registry.npmjs.org`，发布步骤加 `env: NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}`。
- token 发布可能只进入 staged（取决于 token 与包的 2FA 设置）：命令显示成功、退出码 0，但版本不可安装，需维护者在 npm 网页审批。一律以 `npm view <包>@<版本> version` 为准。npm 计划于 2027-01 取消 bypass 2FA token 的直接发布能力，届时只能 stage。

## GitHub Release

- 名称 = tag；正文 = 该版本的 CHANGELOG 段（唯一真源，不另写）；版本含 `-` 时标为 prerelease。正文写法见 [release-content.md](release-content.md)。
- changesets 多包默认每个包一条 Release，同时发布多个包时哪条成为 Latest 不可控。整个仓库是一个 `fixed` 组时改为一条聚合 Release：`create-github-releases: false`，后续步骤读 `published-packages` 输出，tag 用 `v<版本>`，正文按包拼接各自的 CHANGELOG 段。
- immutable releases：`gh api repos/<owner>/<repo>/immutable-releases --jq .enabled` 为 `true` 时，Release 一经发布就锁定 tag 与资产（标题、正文仍可改）。Release 必须放在发布成功之后，带资产时先建草稿、传完资产再发布。
- `GITHUB_TOKEN` 创建的 tag、Release 不会触发其他 workflow（`on: release`、`on: push: tags`）；下游需要被触发时改用 GitHub App token（`actions/create-github-app-token@v3`）。

## 跟踪与验证

推送后：

```bash
gh run list --workflow release.yml --commit "$(git rev-parse HEAD)" --limit 1   # 拿到本次发版提交的 run id
gh run watch <run-id> --exit-status               # 跟到结束
npm view <包>@<版本> version                       # 以 registry 为准
gh release view <tag>
```

## 排查表

| 现象 | 原因 | 处理 |
| --- | --- | --- |
| E404 Not Found（发布时） | trusted publisher 与运行身份不一致（仓库、workflow 文件名、environment，大小写敏感）；配置已过期；包不存在 | 逐项核对 npm 端配置；新包走「新包首发」 |
| 报错要求走 stage（如 `E_STAGE_REQUIRED`） | trusted publisher 配置或 token 只允许 staged publishing | npm 端勾选允许 publish |
| E404 / ENEEDAUTH，仓库创建于 2026-07-15 之后 | `gh api repos/<owner>/<repo>/actions/oidc/customization/sub` 返回 `use_immutable_subject: true`，npm 尚不接受这种 OIDC subject（[npm/cli#9969](https://github.com/npm/cli/issues/9969)，截至 2026-10 未修复） | 先看 issue 是否已修复；未修复则改用 token 发布 |
| ENEEDAUTH | OIDC 交换失败且没有 token：配置与运行身份不一致（同 E404 一行）、缺 `id-token: write`、npm < 11.5.1、self-hosted runner | 发布命令加 `--loglevel verbose` 看 oidc 日志，逐项排除 |
| E403 cannot publish over previously published version | 版本号已被占用 | 升版本重发；版本号永不可复用 |
| `You must specify a tag using --tag when publishing a prerelease version` | 预发布版本没指定 dist-tag | 按 dist-tag 规则传 `--tag` |
| E402 / 「private packages」相关报错 | scoped 包未设公开 | `publishConfig.access: "public"` 或 changesets `access: "public"` |
| 部分包发布失败 | 网络或 registry 临时错误 | 修复后 `gh run rerun <run-id> --failed`，已发布的自动跳过 |
| 发布成功但没有 tag / Release | 自定义发布脚本没透传 `CHANGESETS_OUTPUT`；或关闭了 Release | 透传环境变量；补 tag：`changeset git-tag` 后推送对应 tag |
| workflow 没触发 | 提交信息含 `[skip ci]`；发版提交没改 CHANGELOG；推送由 `GITHUB_TOKEN` 产生 | `gh workflow run release.yml --ref <发版分支>` |

## 撤回与补救

- 新版本还没上 npm：修复原因后重跑 CI。版本号定错要撤回发版提交时，先征得用户同意，用 `git revert <发版提交>`，禁止 force push 发版分支。
- 已发布：只能升版本修复（fix-forward）。坏版本 `npm deprecate <包>@<版本> "<原因与替代版本>"`；`latest` 指错时 `npm dist-tag add <包>@<正确版本> latest`。这两条由维护者在本地 `npm login` 后执行（trusted publishing 不覆盖 deprecate）。unpublish 不恢复版本号可用性，不作为补救手段。
