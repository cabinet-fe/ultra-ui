# patch-1：可执行的 use-cat-kit 同步与文档入口

## 补丁内容

- 修复 `.agents/skills/use-cat-kit/scripts/sync-api-from-dist.ts` 中错误的仓库根路径（原先指向 `.agents`，且静态 import `maintenance` 导致在 ultra-ui 内无法运行）；改为从 `node_modules/@cat-kit/<pkg>/dist`（及 workspace 子包 node_modules）或 cat-kit 单仓的 `packages/<pkg>/dist` 复制 `.d.ts`；`--build` 仅在存在 `packages/maintenance` 时动态加载 `buildLib`。
- 根目录 `package.json` 增加 `sync-use-cat-kit-api` 与 `typecheck:sample`，与计划步骤 4、sample 验收一致。
- `AGENTS.md` 补充上述命令说明。
- 在仓库根执行一次 `bun run sync-use-cat-kit-api`，刷新 `generated/`（当前环境仅解析到已安装的 `@cat-kit/core` 等包，其余包无 dist 时跳过并告警）。

## 影响范围

- 修改文件: `package.json`
- 修改文件: `AGENTS.md`
- 修改文件: `.agents/skills/use-cat-kit/scripts/sync-api-from-dist.ts`
- 修改目录: `.agents/skills/use-cat-kit/generated/`（脚本生成物）
