# Go 发版标准

仓库根有 `go.mod` 时走本文件。版本只存在于 git tag（`vX.Y.Z`），`go.mod` 里没有主模块版本字段。发版内容仍按 [release-content.md](release-content.md) 写进仓库根 `CHANGELOG.md`。

子目录里的前端工程不是发版对象。没有 `.changeset/config.json` 的 `.changeset/` 文件忽略；不要用 changesets 给 Go 模块升版本。

## 识别发布物

`.pe.jsonc` 已有 `release_kind` 时直接采用。没有则判断一次并写入：

| 条件 | `release_kind` |
| --- | --- |
| `go.mod` 的模块路径不含 `.`（不是可 fetch 的网络路径，例如 `module myapp`） | `app` |
| 路径含 `.`（例如 `github.com/org/name`），且存在 `.goreleaser.yaml` 或会上传二进制的 release workflow | 用 `交互式提问` 问本次是应用还是模块，写入答案 |
| 路径含 `.`，且没有上述发二进制的设施 | `module` |

`go.work` 列出多个模块时，先问清这次发哪一个。下文的脚本契约只覆盖仓库根的一个模块，不为子模块打 `<目录>/vX.Y.Z`。

模块路径含 `.` 的应用：推送 `v*` tag 之后，任何对该版本的 `go get` / `go list -m` 都会把这个提交发布成模块版本，校验和数据库记下之后就不能改 tag 指向的内容。只打算发二进制时也要遵守「tag 不移动」。

## 两套标准

| | 公开发版 `public` | 本地发版 `local` |
| --- | --- | --- |
| `app` | 本地检查 → 提交并推送 → 打 tag。CI 编译二进制、生成校验和、建 GitHub Release。本机不上传发布用二进制 | 本机交叉编译并 `gh release create`。没有 CI 时用 |
| `module` | 本地检查 → 提交并推送 → 打 tag。用公共模块代理确认可被 `go get` | 打 tag 推到私有远端即可。不查询 `proxy.golang.org` |

已有 `.goreleaser.yaml` 时，CI 的编译和上传改走 goreleaser，先查它的当前文档再改配置。检查、CHANGELOG、打 tag 仍按本文件。接入标准时不要主动添加 goreleaser。

## 设施清单

| 文件 | 要求 |
| --- | --- |
| `.pe.jsonc` | `release_mode` 与 `release_kind` |
| `CHANGELOG.md` | 仓库根目录。发版前写好新版本一节 |
| `scripts/release.sh` | 见「脚本契约」。POSIX shell，不新增依赖。项目用 Make 时可以加 `release` 目标转调该脚本，Agent 仍执行脚本 |
| `.github/workflows/release.yml` | 仅 `app` + `public`。见「CI 契约」。文件名固定为 `release.yml` |

`app` + `public` 的二进制名、`cmd` 路径、`-ldflags` 变量、目标平台、额外资产（安装脚本等）写在项目自己的 workflow 里。

## 脚本契约

调用：`scripts/release.sh <版本> [--dry-run]`

`<版本>` 为 `x.y.z` 或 `x.y.z-<标识>.<n>`，标识只允许 `alpha`、`beta`、`rc`、`next`，`n` 从 0 递增。不带 `v` 前缀；传入 `v1.2.3` 直接失败，避免打出 `vv1.2.3`。拒绝前导零、`+` 构建元数据、以及手写的伪版本。

脚本不交互。任一步失败即非零退出，并打印已完成的步骤和继续方式。

发版分支是脚本常量，默认 `main`。

1. **工作区**
   - `git status --porcelain` 只允许 `CHANGELOG.md` 被修改。其他输出（含未跟踪文件）中止。
   - 完全干净，且 `HEAD` 的提交信息以 `chore(release):` 开头、`CHANGELOG.md` 已有该版本一节 → 进入**续发**。
   - 完全干净但 CHANGELOG 没有该版本 → 退出码 1，提示先写 CHANGELOG。
2. **分支**：当前在发版分支。`git fetch` 后 `HEAD` 相对 `origin/<发版分支>` 不落后、不分叉。
3. **版本占用**：远端或本地已有 `v<版本>`，且它的提交不是当前 `HEAD` → 中止（第一次发版时 CHANGELOG 还没提交，只要 tag 已存在就中止）。禁止删除或移动 tag。tag 已经指向 `HEAD` 时留给第 7 步跳过。
4. **内容与模块检查**（续发也执行）
   - `CHANGELOG.md` 有该版本一节（标题写法见 release-content.md），否则中止。
   - `go mod tidy` 之后 `go.mod` / `go.sum` 必须无 diff；有 diff 就还原这两个文件并中止，让用户先提交 tidy 的结果。存在 `vendor/` 时对 `go mod vendor` 做同样的检查。
   - 测试命令默认 `go test ./...`。项目另有门禁时写在脚本常量里，并与 CI 的 test job 保持同一份清单。测试依赖嵌入文件时，脚本与 CI 用同一种方式准备，占位文件不提交。
   - `module`：`go.mod` 不得含 `replace`。主版本 ≥ 2 时模块路径必须以 `/vN` 结尾且 N 等于主版本；v0、v1 不得带 `/vN`。不符合就中止，脚本不改源码。
5. **`--dry-run` 在此结束**：打印 `release_kind`、`release_mode`、版本、tag、CHANGELOG 标题、已跑的测试，以及续发时将补做的步骤（推送、打 tag 或只跟踪 CI）。不提交、不推送、不打 tag、不查询模块代理、不上传 Release。不还原 Agent 写好的 `CHANGELOG.md`，也不要 `git clean`。
6. **提交并推送分支**：只有 `CHANGELOG.md` 有改动时 `git add CHANGELOG.md`（不要 `git add -A`），提交信息按 release-content.md。尚未推送时 `git push origin HEAD:<发版分支>`。推送后的远端提交必须就是 `HEAD`。
7. **打 tag**：`git tag -a v<版本> -m v<版本>`，然后 `git push origin v<版本>`（不用 `--tags`）。tag 指向刚推送的提交。本地 tag 已指向 `HEAD` 但远端没有 → 只推 tag。远端已有且指向 `HEAD` → 跳过。核对应看附注 tag 的 `refs/tags/v<版本>^{}`，那一行才是提交。
8. **按发布物收尾**（见下）。打印版本、tag、提交 hash、以及该路径的验证结果。

先推送提交、再推 tag。tag 推送失败时不要换版本号重打，修好网络或权限后从续发继续推同一个 tag。

### 应用，公开发版

第 8 步不在本机构建、不上传二进制。脚本退出 0 只表示 tag 已在远端。Agent 接着做「跟踪与验证」。

续发且远端 tag 已指向 `HEAD`：查 `gh run list --workflow release.yml --commit HEAD`。有失败的 run 就 `gh run rerun <run-id> --failed`；没有任何 run 就 `gh workflow run release.yml --ref v<版本>`。不新打 tag。

### 应用，本地发版

第 8 步在本机交叉编译项目声明的目标平台：`CGO_ENABLED=0`，`-ldflags` 注入同一个 `v<版本>`（变量路径与 `cmd` 路径是脚本常量）。为每个产物算 SHA256，汇总成 `SHA256SUMS`（CI 上用 `sha256sum`；macOS 上用 `shasum -a 256`）。然后：

```bash
gh release create "v<版本>" --target "$(git rev-parse HEAD)" --title "v<版本>" --notes-file notes.md <资产>...
```

`notes.md` 是该版本的 CHANGELOG 段。版本含 `-` 时加 `--prerelease`。Release 已存在则 `gh release upload v<版本> --clobber <资产>...`，不改已发布的标题和正文。本机未登录时中止，请用户自己 `gh auth login`。

### 模块，公开发版

第 8 步确认代理已经能解析该版本。这一步会让代理抓取并永久缓存该版本，所以只在 tag 推送成功之后执行，演练时禁止执行：

```bash
GOPROXY=proxy.golang.org go list -m <模块路径>@v<版本>
```

输出的版本必须是 `v<版本>`。模块发版的完成标准是这条命令，不是 GitHub Release。

### 模块，本地发版

不访问 `proxy.golang.org`。第 8 步用 `git ls-remote --tags origin refs/tags/v<版本>` 确认 tag 在远端，且 `refs/tags/v<版本>^{}` 指向 `HEAD`。使用者用 `GOPRIVATE` 拉取；前缀写在项目文档里，不写进本技能。

## CI 契约（应用 + 公开发版）

基线（2026-10 核对）：`actions/checkout@v7`、`actions/setup-go@v7`、`actions/upload-artifact@v7`、`actions/download-artifact@v8`。

- 触发：推送 `v*` tag，外加 `workflow_dispatch`（给 tag 重跑）。job 条件 `github.ref_type == 'tag'`，避免从分支手动触发时对着分支建 Release。
- 权限：顶层 `permissions: {}`。test / binaries 只给 `contents: read`；publish 给 `contents: write`。
- 串行：`concurrency: { group: release-${{ github.ref }}, cancel-in-progress: false }`。
- 工具链：`actions/setup-go@v7` 的 `go-version-file: go.mod`。不写死 Go 版本。
- 顺序：测试 → 交叉编译 → 汇总 SHA256 → 建 GitHub Release。测试命令与 `scripts/release.sh` 相同。
- 版本注入：`-ldflags` 的值用 `GITHUB_REF_NAME`（已带 `v`）。变量必须是已有的字符串变量，路径按项目改。多个 `main` 用同一个版本。
- 产物：每个平台一个二进制，文件名含 OS 与架构。全部进入 `SHA256SUMS`。项目若还分发安装脚本，放进同一上传清单，脚本里的版本来自 tag。
- 正文：该版本的 CHANGELOG 段，不从 `git log` 生成。版本含 `-` 时标为 prerelease。
- 幂等：Release 已存在则 `gh release upload --clobber` 补齐资产，不新建 tag（tag 由本地脚本推送）。
- checkout 设 `persist-credentials: false`。CI 不推提交、不推 tag。

嵌入前端的二进制：在 `go build` 之前于同一工作流里构建前端，产物放到编译单元约定的目录，再编译。传给前端构建的版本和 `-X` 是同一个 tag。`go:embed` 让 `go test` 缺少文件时，测试 job 按项目方式准备占位或先构建，占位文件不提交。本地 `release` 脚本仍然不上传二进制。

tag 上的 workflow 就是这次要跑的那份。修正 workflow 的提交必须在打 tag 之前进入发版分支。

模板（二进制名、`cmd` 路径、平台矩阵按项目改；有多个 `main` 就在构建步骤里连续 `go build`）：

```yaml
# .github/workflows/release.yml
name: Release

on:
  push:
    tags: ["v*"]
  workflow_dispatch:

permissions: {}

concurrency:
  group: release-${{ github.ref }}
  cancel-in-progress: false

jobs:
  test:
    if: github.ref_type == 'tag'
    runs-on: ubuntu-latest
    permissions:
      contents: read
    steps:
      - uses: actions/checkout@v7
        with:
          persist-credentials: false
      - uses: actions/setup-go@v7
        with:
          go-version-file: go.mod
      - run: go test ./...

  binaries:
    needs: test
    if: github.ref_type == 'tag'
    runs-on: ubuntu-latest
    permissions:
      contents: read
    strategy:
      matrix:
        include:
          - { goos: linux, goarch: amd64, suffix: linux-amd64 }
          - { goos: linux, goarch: arm64, suffix: linux-arm64 }
    steps:
      - uses: actions/checkout@v7
        with:
          persist-credentials: false
      - uses: actions/setup-go@v7
        with:
          go-version-file: go.mod
      - name: Build
        env:
          CGO_ENABLED: "0"
          GOOS: ${{ matrix.goos }}
          GOARCH: ${{ matrix.goarch }}
        run: |
          # 嵌入前端时先构建前端，再 go build。
          go build -ldflags "-s -w -X main.version=${GITHUB_REF_NAME}" \
            -o "app-${{ matrix.suffix }}" ./cmd/app
      - uses: actions/upload-artifact@v7
        with:
          name: app-${{ matrix.suffix }}
          path: app-${{ matrix.suffix }}

  publish:
    needs: binaries
    if: github.ref_type == 'tag'
    runs-on: ubuntu-latest
    permissions:
      contents: write
    steps:
      - uses: actions/checkout@v7
        with:
          persist-credentials: false
      - uses: actions/download-artifact@v8
        with:
          pattern: app-*
          merge-multiple: true
      - name: Checksums and notes
        env:
          TAG: ${{ github.ref_name }}
        run: |
          echo "$TAG" | grep -Eq '^v(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)(-(alpha|beta|rc|next)\.[0-9]+)?$' \
            || { echo "tag 不是 vX.Y.Z 或 vX.Y.Z-<标识>.<n>"; exit 1; }
          sha256sum app-* > SHA256SUMS
          ver="${TAG#v}"
          awk -v v="$ver" '$0 == "## " v || index($0, "## " v " ") == 1 || index($0, "## [" v "]") == 1 {p=1; next} p && /^## / {exit} p' CHANGELOG.md > notes.md
          test -s notes.md || { echo "CHANGELOG.md 缺少 $ver 一节"; exit 1; }
      - name: GitHub Release
        env:
          GH_TOKEN: ${{ github.token }}
          TAG: ${{ github.ref_name }}
        run: |
          flags=""
          case "$TAG" in *-*) flags="--prerelease" ;; esac
          if gh release view "$TAG" >/dev/null 2>&1; then
            gh release upload "$TAG" --clobber app-* SHA256SUMS
            exit 0
          fi
          gh release create "$TAG" --target "$GITHUB_SHA" --title "$TAG" --notes-file notes.md $flags app-* SHA256SUMS
```

`gh run rerun <run-id> --failed` 重跑的是 tag 那次的 workflow 文件。`workflow_dispatch` 要带 `--ref v<版本>`，对着分支触发会被 `github.ref_type == 'tag'` 跳过。

## 跟踪与验证

应用 + 公开发版，tag 推送后：

```bash
gh run list --workflow release.yml --commit "$(git rev-parse HEAD)" --limit 1
gh run watch <run-id> --exit-status
gh release view "v<版本>" --json tagName,assets,isPrerelease
```

资产清单与 workflow 声明的文件一致，且包含 `SHA256SUMS`。抽查时下载一个资产，用 `SHA256SUMS` 核对。

模块 + 公开发版：上一节的 `go list -m` 输出该版本即完成。不要用 GitHub Release 代替。

模块 + 本地发版：`git ls-remote --tags origin refs/tags/v<版本>`。

应用 + 本地发版：`gh release view` 的资产与 `SHA256SUMS` 一致。

## 排查表

| 现象 | 原因 | 处理 |
| --- | --- | --- |
| 远端 tag 指向别的提交 | 版本号已被占用 | 换版本号。禁止删除或移动原 tag |
| `go list -m` 报校验和不匹配 | 该版本曾指向另一份内容，校验和数据库已记录 | 不能复用。升版本 |
| 脚本拒绝 v2+ | 模块路径没有 `/vN`，或 N 与主版本不一致 | 先改 `go.mod` 和 import 并提交，再发版 |
| CI 里 `go test` 失败 | tag 上的代码未通过测试 | 不能改这个 tag。修代码后发下一个版本 |
| job 因权限或网络失败 | workflow 文件不用改 | `gh run rerun <run-id> --failed` |
| tag 上的 workflow 本身有缺陷 | 重跑不会采用之后提交里的 workflow | 这个版本作废，修 workflow 后发下一个版本 |
| 公共代理查不到私有模块 | 对私有模块跑了 `proxy.golang.org` | 只核 `git ls-remote` |
| `gh release` 401 / 403 | 本机未登录，或 publish job 没有 `contents: write` | 用户自己 `gh auth login`；或补上 job 权限后发下一个版本（tag 上的旧 workflow 不会因此改变） |
| 推送被拒（远端有新提交） | 发版期间有人推送 | `git pull --rebase` 后重跑脚本。禁止 force push。rebase 若改写了已推送的发版提交，先征得用户同意 |

## 撤回与补救

- tag 还没推送：修复后重跑脚本。要撤回已推送的发版提交时，先征得用户同意，用 `git revert`，禁止 force push。
- tag 已推送：不删除、不移动、不复用。应用的二进制有问题，或模块的代码有问题，都发下一个版本。
- 模块的坏版本用 `retract` 标明不要依赖，版本本身仍可下载。在更高版本的 `go.mod` 里写 `retract vX.Y.Z // 原因；改用 vA.B.C`，然后按正常流程发布那个更高版本。`go` 从模块的最新版本读取 `retract`。
- GitHub Release 发错资产：同一个 tag 上用 `gh release upload --clobber` 替换资产，或把错误说明写进下一个版本。immutable releases 锁定资产时不能覆盖，只能发新版本。
