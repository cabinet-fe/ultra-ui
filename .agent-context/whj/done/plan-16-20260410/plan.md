# GitHub Actions + Changesets 自动化发版

> 状态: 已执行

## 目标

用业界常见的 **Changesets** 流程替代本地交互式 `tools/build/release.ts`：在 `main` 上由 Action 打开「Version Packages」PR，合并后自动 `build` 并 `npm publish`；删除不再需要的 release 脚本与依赖，并更新文档。

## 内容

1. 在仓库根加入 `@changesets/cli`、`.changeset/config.json`（`fixed` 锁定 6 个发布包同版本、`ignore` 排除 mobile / tools / play-desktop 等非发布包）、`.changeset/README.md` 说明贡献者如何 `bun run changeset`。
2. 根 `package.json` 增加脚本：`changeset`、`version-packages`（`changeset version`）、`release`（`bun run build && changeset publish`）。
3. 新增 `.github/workflows/release.yml`：`actions/checkout`（不低于 v4）、`oven-sh/setup-bun`（与 `packageManager` 对齐）、`bun install --frozen-lockfile`、`changesets/action@v1`，`permissions` 含 `contents: write` 与 `pull-requests: write`，`NPM_TOKEN` 用于发布。
4. 精简 `tools/build`：删除 `release.ts`；`index.ts` 仅代理根目录 `bun run build`；从 `package.json` 移除 `release` 脚本及仅用于 release 的依赖；更新 `tools/build/AGENTS.md` 与根 `AGENTS.md` 中的发版说明。

## 影响范围

- `package.json`、`bun.lock`
- `.changeset/config.json`、`.changeset/README.md`
- `.github/workflows/release.yml`、`.github/workflows/version-pr.yml`
- `AGENTS.md`、`RELEASE.md`
- `tools/build/index.ts`、`tools/build/package.json`、`tools/build/AGENTS.md`
- 删除 `tools/build/release.ts`

## 历史补丁

- patch-1: 按 tag 触发发布并补充 RELEASE.md
- patch-2: 收紧 Release tag 规则与 Release 正文来源
