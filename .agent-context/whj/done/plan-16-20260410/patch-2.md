# 收紧 Release tag 规则与 Release 正文来源

## 补丁内容

将 Release 工作流的 tag 触发从 `v*` 改为 `v*.*.*` 与 `v*.*.*-*`，避免误匹配单段 tag。在创建 GitHub Release 时，若存在 `packages/desktop/CHANGELOG.md`，截取首个 `##` 版本块作为正文；否则回退为 GitHub 自动生成 Release Notes。同步更新 `RELEASE.md`、`AGENTS.md` 中的说明。

## 影响范围

- 修改文件: `.github/workflows/release.yml`、`RELEASE.md`、`AGENTS.md`
- 新增文件: 无
- 删除文件: 无
