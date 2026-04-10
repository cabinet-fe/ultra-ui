# packages 版本 1.0.0 与 Changesets 发布范围（除 mobile）

> 状态: 已执行

## 目标

将 `packages/*` 下各包 `version` 统一为 `1.0.0`；通过 Changesets 对 **`packages` 下除 `@ultra-ui/mobile` 外的全部 `@ultra-ui/*` 包** 进行 version/publish；`@ultra-ui/mobile` 与 `cli`、`play-desktop`、`play-icons` 等不参与 release；`fixed` 锁定六个发布包同版本。（初版计划曾误写为「仅发 mobile」，见 `patch-1` 修正。）

## 内容

1. 将 `packages/utils`、`styles`、`compositions`、`directives`、`desktop`、`icons`、`mobile` 的 `package.json` 中 `"version"` 改为 `"1.0.0"`。
2. 编辑 `.changeset/config.json`：`fixed` 锁定六个 `@ultra-ui` 发布包；`ignore` 含 `@ultra-ui/mobile`、`cli`、`play-desktop`、`play-icons`（以 `patch-1` 为准，替代初稿中「仅发 mobile」的反向配置）。
3. 在回复中说明 GitHub Actions `NPM_TOKEN` 与本地 `npm login` / `~/.npmrc` 配置方式（不写真实 token）。

## 影响范围

- `packages/utils/package.json`
- `packages/styles/package.json`
- `packages/compositions/package.json`
- `packages/directives/package.json`
- `packages/desktop/package.json`
- `packages/icons/package.json`
- `packages/mobile/package.json`
- `.changeset/config.json`
- `package.json`（`release` 脚本 Turbo 过滤）
- `RELEASE.md`

## 历史补丁

- patch-1: 修正 Changesets 发布范围（packages 除 mobile）