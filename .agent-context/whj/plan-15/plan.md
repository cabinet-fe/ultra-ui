# 主题 TS 迁入 @ultra-ui/styles

> 状态: 已执行

## 目标

将 `packages/compositions` 中的 `load-theme.ts` 与 `theme/` 迁入 `packages/styles`，使设计 token、CSS 变量注入与共享样式包职责一致；通过包依赖方向（styles → compositions，compositions 不依赖 styles 的 TS）避免循环依赖。

## 内容

1. 在 `packages/styles/src` 新增 `theme/`（自 compositions 平移：`ui-theme`、`light`/`dark`、`helper`、`type`、`index`）与根级 `load-theme.ts`；`load-theme` 继续从 `@ultra-ui/compositions` 引入 `useConfig`。
2. 平移 `theme/__test__/ui-theme.test.ts`；将 `ui-theme.ts` 中控制台提示前缀改为 `@ultra-ui/styles`。
3. 更新 `packages/styles/package.json`：增加 `exports["./theme"]`；增加 `dependencies`（`@cat-kit/core`、`@ultra-ui/utils`、`@ultra-ui/compositions`）与 `peerDependencies`（`vue`）；扩展 `sideEffects` 覆盖主题 TS 入口。
4. 更新 `packages/styles/tsdown.config.ts`：`entry` 增加 `src/theme/index.ts`。
5. 从 `packages/compositions` 删除上述文件；`src/index.ts` 移除 `load-theme` 与 `theme` 相关导出；`package.json` 移除 `./theme` export；`tsdown.config.ts` 仅保留 `src/index.ts`。
6. 更新引用：`playgrounds/desktop/App.vue`、`packages/desktop` 的 `theme.vue` 与 `types/theme.ts`：主题 API 改为 `@ultra-ui/styles/theme`，`loadTheme` 从该子路径或与子路径一并导入。
7. 修正 `packages/compositions/AGENTS.md` 与 `packages/styles/AGENTS.md` 中与主题位置相关的描述。
8. 在仓库根执行 `bun install`（如有）、`turbo run build` / `check-types` / `test` 验证。

## 影响范围

- `packages/styles/package.json`、`tsdown.config.ts`
- `packages/styles/src/load-theme.ts`、`packages/styles/src/theme/**`
- `packages/compositions/package.json`、`tsdown.config.ts`、`src/index.ts`（移除主题导出；删除原 `load-theme` / `theme` 源码）
- `packages/desktop/src/components/theme/theme.vue`、`packages/desktop/src/types/theme.ts`
- `playgrounds/desktop/App.vue`
- `AGENTS.md`、`packages/compositions/AGENTS.md`、`packages/styles/AGENTS.md`、`packages/utils/AGENTS.md`
- `bun.lock`（workspace 依赖更新）

## 历史补丁
