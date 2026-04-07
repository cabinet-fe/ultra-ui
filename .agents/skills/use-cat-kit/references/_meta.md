# use-cat-kit — 外置安装与版本

本技能可拷贝到其它项目的 `.cursor/skills/use-cat-kit/` 使用。

## 与 npm 对齐（权威）

- **类型与签名**以本技能目录下的 **`generated/<包短名>/**/*.d.ts`** 为准：该树由脚本从仓库 `packages/<name>/dist` 镜像，与 **`npm` 包内 `dist` typings** 一致（同版本构建前提下）。
- 在**本仓库**更新技能：于根目录执行  
  `bun run sync-use-cat-kit-api`（需已构建各包 dist）或  
  `bun run sync-use-cat-kit-api:build`（先 tsdown / tsc 再复制）。  
  脚本：`skills/use-cat-kit/scripts/sync-api-from-dist.ts`  
  元数据：`generated/manifest.json`

## references/*.md

主题为导航；**具体 API 请直接读 `generated/` 中对应 `.d.ts`**，勿依赖过时手写摘录。
