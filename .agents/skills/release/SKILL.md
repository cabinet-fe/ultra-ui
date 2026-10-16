---
name: release
description: >
  npm 包与 Go 项目发版的通用标准与执行。npm 分公开发版（本地升版本并推送，CI 发布到 npm、建 GitHub Release）与本地发版（本机发布到私有 registry）。Go 分应用发版（检查通过后打 tag，CI 构建二进制并建 GitHub Release）与模块发版（打 tag 供 go get；私有模块只推 tag）。规范发版脚本行为和发版内容写法，并按标准为项目接入或执行发版。
  用户要求发版、发布包或二进制、写 changeset / CHANGELOG / release notes、接入或修复发版流程时使用。
---

# release 发版

本技能做两件事：为项目接入（或修正为）统一的发版标准；按标准为项目执行发版。适用 npm 生态项目（单包或 monorepo）和 Go 项目（发布二进制的应用，或供 `go get` 的模块）。项目之间的差异只记录在项目自己的配置与脚本里，本技能不记录任何具体项目。

## 核心原则

**发出去的版本收不回。** npm 上撤销的版本号不能复用；Go 模块版本一旦被模块代理或校验和数据库记录，tag 指向的提交就不能再改；开启 immutable releases 的 GitHub tag 同样不能重用。出错只能发新版本。因此：

- 能在发布前做的检查全部在发布前做完；真正对外发布放在最后。
- 发布可安全重跑：已经发布的版本自动跳过，失败后修复原因直接重跑，不回滚。
- 发布成功与否以发布物查询为准，不以命令输出为准：npm 用 `npm view`，Go 模块用 `go list -m`，Go 应用用 `gh release view`。
- 发版脚本不交互：所有输入来自参数，人和 Agent 用同一条命令。

## 统一工具定义

- `交互式提问`：大部分 Agent 都内置的一种工具, 由 Agent 向用户提出问题并提供选项和自定义输入的一种工具, 它在不同的 Agent 中的名称不同, 可能叫 `AskUserQuestion` 或 `AskQuestion` 等。

## 参考文件（按需读取，不要一次全读）

| 文件 | 何时读 |
| --- | --- |
| [references/public-release.md](references/public-release.md) | npm 公开发版：接入或修正脚本与 CI、执行发版、新包首发、trusted publishing 配置、CI 发布失败排查 |
| [references/local-release.md](references/local-release.md) | npm 本地发版：接入或修正发版脚本、执行发版、发布失败排查 |
| [references/go-release.md](references/go-release.md) | Go 项目：判断应用或模块、接入或修正脚本与 CI、执行发版、发布失败排查 |
| [references/release-content.md](references/release-content.md) | 判定版本幅度，写 changeset / CHANGELOG / GitHub Release 正文 / 发版提交信息 |
| [references/tools/changesets.md](references/tools/changesets.md) | npm 项目使用 changesets（存在 `.changeset/config.json`）。Go 发版不读此文件 |

## 标准

先识别生态（见流程第 1 步）。Go 的版本就是 tag，时序以 go-release.md 为准，不要套用 npm「发布成功之后才打 tag」。

### npm

| | 公开发版 `public` | 本地发版 `local` |
| --- | --- | --- |
| 发布目标 | npmjs + GitHub Release | 私有 registry（任意兼容 npm 协议的源） |
| 谁发布 | CI（GitHub Actions + npm trusted publishing） | 本机 `release` 脚本 |
| 本地 `release` 脚本 | 检查 → 升版本 → 构建测试 → 提交 → 推送 | 检查 → 升版本 → 构建 → 打包校验 → 提交推送 → 发布 → 打 tag |
| 凭证 | 无（OIDC） | 用户级 `~/.npmrc` |

两套共同遵守的契约（细节见各自参考文件）：

- **入口**：根 `package.json` 的 `release` 脚本；`--dry-run` 演练，结束后工作区恢复原样。参数解析忽略单独出现的 `--`。
- **起点**：工作区干净（含未跟踪文件）、在发版分支、不落后于远端。
- **版本**：有版本工具时由工具计算；没有时传目标版本 `release <x.y.z>`，所有可发布包同一版本。
- **顺序**：先提交并推送发版提交，再发布；tag 只在发布成功后创建。
- **命名**：提交 `chore(release): 发布 …`；tag 单包或整仓同版本 `v<版本>`，changesets 多包 `<包名>@<版本>`；预发布版的 dist-tag 取预发布标识，绝不落到 `latest`。见 release-content.md。

命令写法：`<pm>` 指项目包管理器；给脚本传参统一写成 `<pm> run release -- <参数>`（npm 必须有 `--`）。

### Go

入口是 `scripts/release.sh <版本> [--dry-run]`（参数不带 `v` 前缀）。`public` / `local` 与 `app` / `module` 怎么组合、脚本和 CI 做什么，全部在 go-release.md。

## 项目配置

发版标准记在仓库根 `.pe.jsonc`（提交入库，不放敏感信息；已有该文件时只补字段）：

```jsonc
{
  "release_mode": "public", // public | local
  "release_kind": "app" // 仅 Go：app | module。npm 项目不写
}
```

凭证一律不进仓库：npm 公开发版靠 trusted publishing；npm 本地发版的登录信息由用户写入用户级 `~/.npmrc`；Go 模块公开发版不使用 token；Go 应用的 GitHub Release 使用运行者自己的 `gh` 登录，或 Actions 自带的 `GITHUB_TOKEN`。

## 流程

用户只要求写 changeset 或 CHANGELOG 时，按 release-content.md 写完即结束，不进入发版。

### 1. 识别项目（始终第一步）

逐项确认，之后不再重复判断：

1. **生态**
   - 仓库根有 `go.mod`、没有根 `package.json` → Go。子目录里的 `package.json`（例如嵌入的前端）不改变这个判断，也不是本次发版对象。
   - 仓库根有 `package.json`、没有 `go.mod` → npm。
   - 根目录两者都有 → 用 `交互式提问` 确认本次发哪一种，不在同一次发版里混发。
   - 都没有 → 停止。本技能不覆盖这种仓库。
2. **标准**：读 `.pe.jsonc` 的 `release_mode`。缺失时用 `交互式提问` 询问（公开发版 / 本地发版），确认后写入。
3. **Go**（npm 项目跳过本步）：读 `release_kind`。缺失时按 go-release.md「识别发布物」判断并写入。然后只读 go-release.md，不再做第 4–7 步。
4. **包管理器**：`packageManager` 字段优先，其次 lockfile（`bun.lock`、`pnpm-lock.yaml`、`yarn.lock`、`package-lock.json`）。
5. **可发布包**：根包或 workspaces 中没有 `"private": true` 的包；本地发版另读各包 `publishConfig.registry`。
6. **版本工具**：存在 `.changeset/config.json` → 读 tools/changesets.md。其他工具（release-please、semantic-release、Nx Release 等）暂无参考文件，先查其官方最新文档再动手，脚本契约与内容规范仍按本技能。都没有 → 无工具流程。
7. **设施**（仅 npm）：`release` 脚本、公开发版的 `.github/workflows/release.yml` 是否存在且符合对应参考文件的契约。Go 的设施在 go-release.md，由下一步对照。

### 2. 接入或修正（设施缺失或不合标准时）

1. 读对应参考文件，列出要新增 / 修改的文件与理由，用 `交互式提问` 确认后再改。
2. 按契约实现：脚本只用项目已有的运行时与依赖；需要新增依赖（如接入 changesets）先征得同意，版本以 npm 实查的最新版为准。
3. 演练到通过：npm 用 `<pm> run release -- [<版本>] --dry-run`；Go 用 `scripts/release.sh <版本> --dry-run`。
4. 列出必须由人完成的一次性操作（npm trusted publisher 配置、新包首发、私有源登录、本机 `gh auth login`），等用户确认完成。
5. 接入改动单独提交，不和发版提交混在一起。

### 3. 执行发版

1. **定内容**：按 release-content.md 收集上次发版以来的改动。changesets 项目补齐、修正待消费的 changeset；无工具的 npm 项目，以及全部 Go 项目，判定幅度、算出目标版本，并在 CHANGELOG 顶部写好该版本一节。
2. **给计划**：向用户列出发布物 → 新版本 → 渠道（npm 的 dist-tag，或 Go 的 tag / GitHub Release / 模块代理），以及发版内容摘要。下列情况用 `交互式提问` 确认一次：幅度拿不准（尤其 major、0.x 的破坏性改动）、首次发布、预发布转正式版、Go 模块升到 v2 及以上（要改模块路径）。其余情况用户说「发版」即视为同意推送与发布。
3. **演练**：npm 用 `<pm> run release -- [<版本>] --dry-run`；Go 用 `scripts/release.sh <版本> --dry-run`。核对输出的版本、文件与发布计划。
4. **执行**：去掉 `--dry-run` 重跑。需要 OTP 或登录时请用户提供或在其终端完成，Agent 不代填、不猜测。
5. **验证**：
   - npm 公开发版：跟踪 CI 直到结束（public-release.md「跟踪与验证」），再查 `npm view <包>@<版本> version` 与 GitHub Release。
   - npm 本地发版：以脚本的 registry 查询结果为准，抽查 `npm view <包>@<版本> version --registry <源>`。
   - 不要靠在下游项目安装来验证 npm 包：pnpm ≥ 11（`minimumReleaseAge` 默认 1440 分钟）与新版 Yarn（`npmMinimalAgeGate` 默认 `1d`）默认不安装发布不满一天的版本。下游需要立即使用时，在下游配置 pnpm `minimumReleaseAgeExclude` 或 Yarn `npmPreapprovedPackages`，加入包名或 `@scope/*`。
   - Go：按 go-release.md「跟踪与验证」。应用公开发版时脚本退出 0 只表示 tag 已推送，还要盯 CI 到 GitHub Release 资产齐全。
6. **报告**：发布物与版本、渠道（dist-tag 或 tag / Release / 代理）、发版提交 hash。失败时说明停在哪一步、已完成什么、下一步怎么做。

失败时按参考文件的排查表处理：修复原因后重跑，禁止重复猜测式重试；禁止删除或移动已推送的 tag；禁止 force push 发版分支；撤回发版提交必须先征得用户同意。

## 检查清单

- [ ] `.pe.jsonc` 有 `release_mode`；Go 项目还有 `release_kind`；凭证不在仓库里
- [ ] 生态已识别。npm：包管理器、可发布包、版本工具已识别，changesets 项目已按实际版本（3.x / 2.x）选用命令。Go：没有把子目录前端包当成发版对象
- [ ] 设施符合对应参考文件的契约；接入改动单独提交
- [ ] 发版内容按 release-content.md 写，幅度判定有依据
- [ ] 先 `--dry-run` 再正式执行
- [ ] npm：以 registry 查询确认每个包都已发布；公开发版的 CI 已跟踪到结束
- [ ] Go 应用：CI 已结束，`gh release view` 的资产与校验和齐全。Go 模块：正式发布后 `go list -m` 返回该版本（私有模块改为 `git ls-remote`）
- [ ] tag 已创建；npm 公开发版和 Go 应用的 GitHub Release 已创建；报告已给出

## 反模式

- 在本技能里写具体项目；把私有源地址写在 `publishConfig.registry` 以外的地方；把 token 写进仓库
- 运行交互式命令（不带参数的 `changeset` / `changeset add`、代用户执行 `npm login`）
- 跳过 `--dry-run` 直接发布；或把 `npm publish --dry-run` 当成连通性与登录检查
- 对含 `workspace:` / `catalog:` 依赖的目录直接 `npm publish`；本地发版不经 `<pm> pack` 而手写脚本临时改写工作区 `package.json`；或把 monorepo 内部包放进 `catalog` 用 `catalog:` 引用（内部包必须用 `workspace:`）
- 发布失败后回滚或改写已发布的版本、移动 tag，而不是修复原因后重跑
- 以命令输出「成功」代替 `npm view` 查询
- 预发布版本发到 `latest`
- 发版提交混入无关改动，或提交信息带 `[skip ci]`
- 公开发版在本地用 npm token 发布；或启用 trusted publishing 的同时又配置 `NODE_AUTH_TOKEN`
- Go 仓库用 changesets 给模块升版本；或同一次发版里又发 npm 包又发 Go 产物
- 把 `go list -m <模块>@<版本>` 当作演练（对公共代理执行会缓存该版本）
- 移动、删除或复用已推送的 `v*` tag；用本地编译的二进制充当公开发版资产
- 发布 Go 模块时打没有 `v` 前缀的 tag，或 v2+ 不改模块路径
