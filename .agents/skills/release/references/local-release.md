# 本地发版标准（local）

本机 `release` 脚本完成全部步骤：检查 → 升版本 → 构建 → 打包校验 → 提交推送 → 发布到私有 registry → 打 tag 并推送。不经过 CI，不建 GitHub Release。

## 设施清单

| 文件 | 要求 |
| --- | --- |
| `.pe.jsonc` | `"release_mode": "local"` |
| 各可发布包 `package.json` | `publishConfig.registry` = 私有源地址，所有包一致。它是目标 registry 的唯一来源，也防止误发到 npmjs |
| 根 `package.json` | `scripts.release` 指向发版脚本 |
| `scripts/release.<ts\|mjs>` | 见「脚本契约」；用项目已有运行时执行，不新增依赖 |
| `CHANGELOG.md` | 无版本工具：仓库根目录，发版前写好新版本一节；changesets：各包目录自动生成 |

无版本工具时所有可发布包共用一个版本号（单包或整仓同版本）。monorepo 需要各包独立版本时接入 changesets（征得同意再加依赖）。

凭证只放用户级 `~/.npmrc`，禁止写进仓库：

- 交互登录：用户在自己的终端执行 `npm login --registry <源>`（npm 12 已移除 `npm adduser`）。
- token：`//<host>/<path>/:_authToken=${NPM_TOKEN}`，认证项必须绑定到具体 registry 地址；变量未定义时 npm 把 `${NPM_TOKEN}` 字面量当 token 发出去，表现为 401。

常见私有源差异：

| 源 | 登录 | 注意 |
| --- | --- | --- |
| Verdaccio | `npm login --registry <源>`；服务端没开 `flags.webLogin` 时加 `--auth-type=legacy` | 支持 dist-tag、deprecate、unpublish（权限由 `packages.*.unpublish` 控制） |
| Nexus | `npm login --auth-type=legacy --registry <源>`，或 `_auth` Basic 认证 | 发布地址必须是 hosted 仓库（发布到 group 需 Pro 版）；不支持 unpublish；Basic 认证下 `npm whoami` 只打印本地用户名、不校验凭据 |
| GitHub Packages | `npm login --scope=@<owner> --auth-type=legacy --registry=https://npm.pkg.github.com`（classic PAT） | 只支持 scoped 包 |
| GitLab | `_authToken`（PAT 或 deploy token） | 发布走 project 级端点；文档未列 unpublish |
| Gitea | 按 Gitea 文档配置 token | 同版本已存在时须先删除才能重发 |

## 脚本契约

调用：`<pm> run release -- [<版本>] [--dry-run] [--tag <dist-tag>] [--otp <code>]`

| 参数 | 说明 |
| --- | --- |
| `<版本>` | 只在无版本工具时必填：`x.y.z` 或 `x.y.z-<标识>.<n>`；所有可发布包统一为该版本 |
| `--dry-run` | 演练：执行到打包校验并打印发布计划，然后恢复工作区；不提交、不推送、不发布、不打 tag |
| `--tag` | dist-tag；缺省时正式版为 `latest`，预发布版为标识首段（`2.0.0-beta.1` → `beta`）。预发布版禁止用 `latest` |
| `--otp` | registry 要求 2FA 时的一次性密码，原样传给 `npm publish` |

脚本不交互，任一步失败即非零退出，并打印已完成的步骤和继续方式。

1. **前置检查**
   - 工作区干净：`git status --porcelain` 为空（未跟踪文件也算不干净）
   - 当前分支是发版分支（脚本常量；changesets 项目与 `baseBranch` 一致）
   - `git fetch` 后 `HEAD` 与 `origin/<发版分支>` 一致或领先，不落后、不分叉
   - 读取目标源 `<源>`：各可发布包的 `publishConfig.registry`，缺失、不一致或指向 `registry.npmjs.org` 即中止
   - `npm ping --registry <源>` 可达；`npm whoami --registry <源>` 已登录
2. **升版本**
   - changesets：有待消费 changeset → `changeset version`
   - 无工具：`<版本>` 与当前版本不同 → 写入所有可发布包的 `version`，并同步其他包里指向它们的非 `workspace:` 依赖范围；根 `CHANGELOG.md` 必须已有该版本一节，否则中止
   - 没有待升版本时进入**续发**：`HEAD` 是发版提交（信息以 `chore(release):` 开头）且有版本尚未发布 → 跳过升版本与提交，未推送就先推送，然后从第 3 步继续；否则输出「没有待发布的改动」，退出码 1
   - 升版本后执行 `<pm> install` 更新 lockfile。bun 必须做：`bun pm pack` 按 `bun.lock` 替换 `workspace:`，lockfile 过期会打进旧版本号
3. **构建**：运行项目的构建与测试命令
4. **打包校验**：见下节。`--dry-run` 到此结束：打印发布计划（包、版本、`<源>`、dist-tag、tarball 大小与文件数），恢复工作区（`git restore --staged --worktree .` 加 `git clean -fd`，禁止 `-x`），删除临时目录
5. **提交并推送**：暂存全部改动（起点干净，改动只来自本次发版），打印暂存文件清单，提交信息按 [release-content.md](release-content.md)；`git push origin HEAD:<发版分支>`
6. **发布**：按内部依赖拓扑序（被依赖的先发；有环即中止）逐个发布 tarball：

   ```bash
   npm publish <tarball> --registry <源> --@<scope>:registry=<源> --tag <dist-tag> [--otp <code>]
   ```

   - `<tarball>` 用绝对路径：不带 `./` 的相对路径（如 `out/a-1.0.0.tgz`）会被 npm 当成 GitHub 简写 `user/repo` 去拉取
   - 已存在的版本跳过；每发完一个用 `npm view` 确认（规则见下）
   - scoped 包必须带 `--@<scope>:registry`：`.npmrc` 里的 `@scope:registry` 优先级高于 `publishConfig.registry` 和 `--registry`，不带就可能发到别的源
7. **打 tag 并推送**：changesets 项目用 `changeset git-tag`；无工具用 `git tag -a v<版本> -m v<版本>`。只推本次新建的 tag：`git push origin <tag>...`（不用 `--tags`，以免推出无关的本地 tag）
8. **摘要**：逐包打印 包 → 版本 → dist-tag → 状态（已发布 / 跳过 / 失败），以及 `<源>`、提交 hash、tag

先推送提交再发布：发布中途失败时远端已有发版提交，修复原因后重跑 `release` 即进入续发，已发布的版本自动跳过。

## 打包校验

每个待发布包在包目录用项目包管理器打包到临时目录（包管理器会替换 `workspace:` / `catalog:`；直接对含这两种协议的目录跑 `npm publish` 会原样发出去）：

| 包管理器 | 命令 |
| --- | --- |
| npm | `npm pack --pack-destination <dir>` |
| pnpm | `pnpm pack --pack-destination <dir>` |
| yarn（Berry） | `yarn pack --out <dir>/%s-%v.tgz` |
| bun | `bun pm pack --destination <dir>` |

用 `tar -xzOf <tarball> package/package.json` 读 manifest、`tar -tzf <tarball>` 读文件列表，逐项校验，任一项不过即中止：

- 依赖字段（`dependencies`、`peerDependencies`、`optionalDependencies`、`devDependencies`）不含 `workspace:`、`catalog:`
- 内部依赖的版本范围覆盖本次新版本（防 lockfile 过期写入旧版本号）
- `exports`、`main`、`module`、`types`、`bin` 指向的文件都在包内
- 不含 `.env*`、`.npmrc`
- `<包>@<版本>` 在 `<源>` 上尚不存在（续发时已存在的标记为跳过）
- 实际目标源正确：`npm publish <tarball> --dry-run` 加第 6 步的全部参数，输出必须含 `Publishing to <源>`（这一步验证的是 `.npmrc`、scope 配置叠加后的真实去向，不能代替 `npm ping` / `npm whoami`）

项目已装 `publint` 或 `@arethetypeswrong/cli` 时，再对 tarball 运行 `publint <tarball> --strict`、`attw <tarball>`。

## registry 查询规则

`npm view <包>@<版本> version --registry <源>`：

- 输出等于该版本 → 已发布
- 报 E404 或输出为空 → 未发布（前提是 `npm whoami` 已通过：私有源对无权限请求也可能返回 404）
- 其他错误 → 中止，不能当成未发布

## 注意

- `npm publish --dry-run` 不能代替连通性和登录检查：registry 不可达时它仍以 0 退出；对包目录执行时还会运行 `prepublishOnly`、`publish`、`postpublish` 脚本。连通与登录用 `npm ping`、`npm whoami`。
- 发布 tarball 时 npm 不执行包的生命周期脚本，构建必须在第 3 步完成。
- 本地发布不能生成 provenance（只支持 GitHub Actions、GitLab CI 的云端 runner）：`publishConfig` 或 `.npmrc` 里开了 `provenance` 会直接报错，要关掉。
- `npm publish --workspaces` 按声明顺序发布、不按依赖排序、遇错即停，不要用它代替第 6 步。

## 排查表

| 现象 | 原因 | 处理 |
| --- | --- | --- |
| `npm whoami` 报 401 / ENEEDAUTH | 未登录或 token 过期 | 请用户在终端执行 `npm login --registry <源>` 后重跑 |
| `npm ping` 失败 | 源地址错误或网络不通 | 核对 `publishConfig.registry`，确认网络 / VPN |
| E404（view 或 publish） | 包不存在，或账号无该 scope 权限 | 先确认 whoami；再查源的权限配置 |
| E403 / E409 版本已存在 | 版本号被占用 | 续发会自动跳过；若是他人发布的同号版本 → 升版本 |
| 包出现在别的源 | `.npmrc` 中 `@scope:registry` 覆盖了目标 | 发布命令带 `--@<scope>:registry=<源>` |
| tarball 含 `workspace:` / 旧版本号 | 打包前没更新 lockfile，或用了 `npm pack` 打包 pnpm / bun 仓库 | 升版本后先 `<pm> install`，用项目包管理器打包 |
| 推送被拒（远端有新提交） | 发版期间有人推送 | `git pull --rebase` 后重跑 `release`（续发）；禁止 force push |
| 部分包发布失败 | 网络、权限、OTP 过期 | 修复后直接重跑 `release`（续发） |

## 撤回与补救

- 还没发布任何包（失败在第 6 步之前）：修复后重跑。要撤回已推送的发版提交时，先征得用户同意，用 `git revert`，禁止 force push。
- 已发布：只能升版本修复。坏版本 `npm deprecate <包>@<版本> "<原因与替代版本>" --registry <源>`；`latest` 指错时 `npm dist-tag add <包>@<正确版本> latest --registry <源>`。私有源对 unpublish、deprecate、dist-tag 的支持以源的文档为准。
