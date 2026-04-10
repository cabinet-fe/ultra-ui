# 按 tag 触发发布并补充 RELEASE.md

## 补丁内容

将 npm 发布与 GitHub Release 从「推 main」改为「推 `v*` tag」触发；保留 `changesets/action` 仅负责在 `main` 上创建/更新 Version PR（不再在 CI 中执行 `publish`）。新增根目录 `RELEASE.md` 说明全流程，并更新 `AGENTS.md`、`.changeset/README.md` 中的发版描述。

## 影响范围

- 新增文件: `.github/workflows/version-pr.yml`、`RELEASE.md`
- 修改文件: `.github/workflows/release.yml`、`AGENTS.md`、`.changeset/README.md`
- 删除文件: 无
