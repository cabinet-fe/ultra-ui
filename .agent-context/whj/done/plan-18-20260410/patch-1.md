# 修正 Changesets 发布范围（packages 除 mobile）

## 补丁内容

计划 18 原先误将 Changesets 配置为**仅**对 `@ultra-ui/mobile` 做 version/publish。按维护者本意，应为：仅对 `packages/` 下**除** `@ultra-ui/mobile` 之外的 `@ultra-ui/*` 包做 release 管理与发布；占位包 mobile、工具与 playground 不参与。

具体变更：

- `.changeset/config.json`：`ignore` 改为 `@ultra-ui/mobile`、`cli`、`play-desktop`、`play-icons`；将六个发布包重新纳入 `fixed` 同版本组。
- 根 `package.json` 的 `release` 脚本中 Turbo 增加 `--filter='!@ultra-ui/mobile'`，与 Changesets 范围一致。
- `RELEASE.md`：CI 步骤描述与上述构建范围对齐。

## 影响范围

- 修改文件: `.changeset/config.json`
- 修改文件: `package.json`
- 修改文件: `RELEASE.md`
