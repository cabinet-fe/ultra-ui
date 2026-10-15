---
name: release
description: >
  npm 包发版的通用标准与执行。定义公开发版（本地升版本并推送，CI 发布到 npm、建 GitHub Release）与本地发版
  （本机直接发布到私有 registry，不走 CI）两套流程，规范发版脚本行为和发版内容写法，并按标准为项目接入或执行发版。
  用户要求发版、发布包、写 changeset / CHANGELOG / release notes、接入或修复发版流程时使用。
---

# release 包发版

本技能做两件事：为项目接入（或修正为）统一的发版标准；按标准为项目执行发版。适用任何 npm 生态项目——单包或 monorepo，有无版本管理工具均可。项目之间的差异只记录在项目自己的配置与脚本里，本技能不记录任何具体项目。

## 核心原则

**发出去的版本收不回。** npm 版本号撤销后也不能复用，开启 immutable releases 的 GitHub tag 同样不能重用，出错只能升版本修复。因此：

- 能在发布前做的检查全部在发布前做完；发布、打 tag、建 Release 放在最后。
- 发布可安全重跑：registry 上已有的版本自动跳过，失败后修复原因直接重跑，不回滚。
- 发布成功与否以 registry 查询（`npm view`）为准，不以命令输出为准。
- 发版脚本不交互：所有输入来自参数，人和 Agent 用同一条命令。

## 统一工具定义

- `交互式提问`：大部分 Agent 都内置的一种工具, 由 Agent 向用户提出问题并提供选项和自定义输入的一种工具, 它在不同的 Agent 中的名称不同, 可能叫 `AskUserQuestion` 或 `AskQuestion` 等。

## 参考文件（按需读取，不要一次全读）

| 文件 | 何时读 |
| --- | --- |
| [references/public-release.md](references/public-release.md) | 公开发版项目：接入或修正脚本与 CI、执行发版、新包首发、trusted publishing 配置、CI 发布失败排查 |
| [references/local-release.md](references/local-release.md) | 本地发版项目：接入或修正发版脚本、执行发版、发布失败排查 |
| [references/release-content.md](references/release-content.md) | 判定版本幅度，写 changeset / CHANGELOG / GitHub Release 正文 / 发版提交信息 |
| [references/tools/changesets.md](references/tools/changesets.md) | 项目使用 changesets（存在 `.changeset/config.json`） |

## 两套标准

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

## 项目配置

发版标准记在仓库根 `.pe.jsonc`（提交入库，不放敏感信息；已有该文件时只补字段）：

```jsonc
{
  "release_mode": "public" // public | local
}
```

凭证一律不进仓库：公开发版靠 trusted publishing，不需要 token；本地发版的登录信息由用户写入用户级 `~/.npmrc`。

## 流程

用户只要求写 changeset 或 CHANGELOG 时，按 release-content.md 写完即结束，不进入发版。

### 1. 识别项目（始终第一步）

逐项确认，之后不再重复判断：

1. **标准**：读 `.pe.jsonc` 的 `release_mode`。缺失时用 `交互式提问` 询问（公开发版 / 本地发版），确认后写入。
2. **包管理器**：`packageManager` 字段优先，其次 lockfile（`bun.lock`、`pnpm-lock.yaml`、`yarn.lock`、`package-lock.json`）。
3. **可发布包**：根包或 workspaces 中没有 `"private": true` 的包；本地发版另读各包 `publishConfig.registry`。
4. **版本工具**：存在 `.changeset/config.json` → 读 tools/changesets.md。其他工具（release-please、semantic-release、Nx Release 等）暂无参考文件，先查其官方最新文档再动手，脚本契约与内容规范仍按本技能。都没有 → 无工具流程。
5. **设施**：`release` 脚本、公开发版的 `.github/workflows/release.yml` 是否存在且符合对应参考文件的契约。

### 2. 接入或修正（设施缺失或不合标准时）

1. 读对应参考文件，列出要新增 / 修改的文件与理由，用 `交互式提问` 确认后再改。
2. 按契约实现：脚本只用项目已有的运行时与依赖；需要新增依赖（如接入 changesets）先征得同意，版本以 npm 实查的最新版为准。
3. 执行 `<pm> run release -- [<版本>] --dry-run`，修到通过。
4. 列出必须由人完成的一次性操作（npm trusted publisher 配置、新包首发、私有源登录），等用户确认完成。
5. 接入改动单独提交，不和发版提交混在一起。

### 3. 执行发版

1. **定内容**：按 release-content.md 收集上次发版以来的改动。changesets 项目补齐、修正待消费的 changeset；无工具项目判定幅度、算出目标版本，并在 CHANGELOG 顶部写好该版本一节。
2. **给计划**：向用户列出 包 → 新版本 → dist-tag，以及发版内容摘要。下列情况用 `交互式提问` 确认一次：幅度拿不准（尤其 major、0.x 的破坏性改动）、首次发布新包、预发布转正式版。其余情况用户说「发版」即视为同意推送与发布。
3. **演练**：`<pm> run release -- [<版本>] --dry-run`，核对输出的版本、文件与发布计划。
4. **执行**：去掉 `--dry-run` 重跑。需要 OTP 或登录时请用户提供或在其终端完成，Agent 不代填、不猜测。
5. **验证**：
   - 公开发版：跟踪 CI 直到结束（public-release.md「跟踪与验证」），再查 `npm view <包>@<版本> version` 与 GitHub Release。
   - 本地发版：以脚本的 registry 查询结果为准，抽查 `npm view <包>@<版本> version --registry <源>`。
   - 不要靠在下游项目安装来验证：pnpm ≥ 11（`minimumReleaseAge` 默认 1440 分钟）与新版 Yarn（`npmMinimalAgeGate` 默认 `1d`）默认不安装发布不满一天的版本。下游需要立即使用时，在下游配置 pnpm `minimumReleaseAgeExclude` 或 Yarn `npmPreapprovedPackages`，加入包名或 `@scope/*`。
6. **报告**：发布的包与版本、dist-tag、tag、发版提交 hash。失败时说明停在哪一步、已完成什么、下一步怎么做。

失败时按参考文件的排查表处理：修复原因后重跑，禁止重复猜测式重试；禁止删除或移动已推送的 tag；禁止 force push 发版分支；撤回发版提交必须先征得用户同意。

## 检查清单

- [ ] `.pe.jsonc` 有 `release_mode`；凭证不在仓库里
- [ ] 包管理器、可发布包、版本工具已识别；changesets 项目已按实际版本（3.x / 2.x）选用命令
- [ ] 设施符合对应参考文件的契约；接入改动单独提交
- [ ] 发版内容按 release-content.md 写，幅度判定有依据
- [ ] 先 `--dry-run` 再正式执行
- [ ] 以 registry 查询确认每个包都已发布；公开发版的 CI 已跟踪到结束
- [ ] tag 与 Release（公开发版）已创建，报告已给出

## 反模式

- 在本技能里写具体项目；把私有源地址写在 `publishConfig.registry` 以外的地方；把 token 写进仓库
- 运行交互式命令（不带参数的 `changeset` / `changeset add`、代用户执行 `npm login`）
- 跳过 `--dry-run` 直接发布；或把 `npm publish --dry-run` 当成连通性与登录检查
- 对含 `workspace:` / `catalog:` 依赖的目录直接 `npm publish`
- 发布失败后回滚或改写已发布的版本、移动 tag，而不是修复原因后重跑
- 以命令输出「成功」代替 `npm view` 查询
- 预发布版本发到 `latest`
- 发版提交混入无关改动，或提交信息带 `[skip ci]`
- 公开发版在本地用 npm token 发布；或启用 trusted publishing 的同时又配置 `NODE_AUTH_TOKEN`
