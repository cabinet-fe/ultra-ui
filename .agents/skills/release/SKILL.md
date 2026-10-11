---
name: release
description: ultra-ui 发版操作（发版规范 A：公开 npm · CI · changesets）。在本仓库发版、发布、升版本、publish、release、出新版本时使用——即使用户没明说「发版」。
---

# ultra-ui 发版

规范 A：公开 npm，一切 publish 由 CI 完成，本地只准备并触发。发版分支是 **dev**（不是 main）。

## 步骤

1. 前置：`git status --porcelain` 干净、在 **dev**、`git pull --ff-only` 不落后。
2. 确认待处理 changeset：`ls .changeset/*.md`（README.md 除外）。没有就用 Write 写 `.changeset/<slug>.md` 并 commit `chore: add changeset`（**不要跑交互式 `bun run changeset`**）：

   ```markdown
   ---
   "@veltra/utils": patch
   ---

   fix: 修复 xxx
   ```

3. `bun run release` —— 自动完成 changeset version（含 fixed 组 peer 修正）+ vp install + commit + push。
4. push 触碰 `packages/*/CHANGELOG.md` 自动触发 release.yml。`gh run list --limit 1` 拿 run 链接告知用户即结束，**不要 watch**。

## 本项目要点

- 发布物：`@veltra/{ai,compositions,desktop,directives,icons,sheet,styles,utils,vite}`；`ofd-core`、playground 私有不发；`@veltra/mobile` 被 CI 构建排除、实际不发。
- fixed 组：`@veltra/{utils,styles,compositions,directives,desktop}` 同步同版本，changeset 只列真正有改动的包即可。
- CI（release.yml）：changesets/action 用 secrets.NPM_TOKEN 发布（无 provenance）；发布后 create-github-releases.ts 创建 `veltra-fixed@<版本>`（fixed 聚合）与 `@veltra/<pkg>@<版本>` 的 GitHub Release（API 创建，非本地 git tag）。
- `.npmrc`（腾讯镜像）被 gitignore，只影响本地装依赖，与发布目标无关。
- 禁止：本地 `npm publish`；watch / 轮询 CI；交互式 changeset CLI。

## 维护

发版配置（fixed 组、workflow、脚本）变动时，以仓库现状为准并同步更新本文件。
