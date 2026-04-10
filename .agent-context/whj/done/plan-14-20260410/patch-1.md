# patch-1: review 后小修 — 文档、turbo 缓存输入、清理误生成 SCSS

## 补丁内容

- **审查**：补充根目录 `AGENTS.md` 常用命令（`bun run test` / `check-types`、去掉重复的 `bun run build` 行），说明测试经 `scripts/vitest-run.ts` 在仓库根执行 vitest。
- **Turbo**：`globalDependencies` 增加 `vitest.config.ts`，`test` 任务增加 `inputs`（含根目录 vitest 配置与 `scripts/vitest-run.ts`），避免改测试配置仍命中错误缓存。
- **仓库卫生**：删除误出现在 `packages/styles/` 包根下的 `.scss` 副本（仅应存在于 `src/` 与构建后的 `dist/`）。

## 影响范围

- 修改文件: `AGENTS.md`、`turbo.json`
- 删除文件: `packages/styles/_functions.scss`、`packages/styles/_mixins.scss`、`packages/styles/_vars.scss`、`packages/styles/normalize.scss`、`packages/styles/anime/*`（包根下误生成副本，非 `src/`）
