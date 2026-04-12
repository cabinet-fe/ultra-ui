# Monorepo tsconfig 与工具链统一

> 状态: 已执行

## 目标

统一根目录开发工具链版本（TypeScript 6.x、Vite、Oxc、Vitest、Turbo、`@cat-kit/tsconfig` 2.x）；各包仅声明运行时依赖并保持同包版本一致；移除冗余的 `@veltra/ts-config`，各包 `extends` 直接使用 `@cat-kit/tsconfig` 的 web / vue / bun 预设。

## 内容

1. **删除 `packages/ts-config` 包**：移除目录及 workspace 中的该包；更新所有原 `extends` 该包或相对路径的 tsconfig，改为 `@cat-kit/tsconfig/tsconfig.web.json`（纯 TS 浏览器向库：utils、compositions、directives、mobile）、`@cat-kit/tsconfig/tsconfig.vue.json`（desktop、icons 相关 tsconfig）、`@cat-kit/tsconfig/tsconfig.bun.json`（`tools/build`、`tools/cli`、根 `tsconfig.node.json` 等 Bun 执行的脚本侧）。保留各包原有的 `compilerOptions`（composite、declaration 等）与 include/exclude；根与各包不再使用 `references`（见 patch-3）；浏览器向包不应用 `strict: false` / `types: ["bun"]` 等与预设冲突项（见 patch-2）。
2. **修正根 `tsconfig.node.json`**：`include` 改为现存路径（如 `playgrounds/desktop/vite.config.ts`），`extends` 改为 `@cat-kit/tsconfig/tsconfig.bun.json`（与 Bun 运行 Vite 配置一致）。
3. **根 `package.json` 工具链**：补充 `vite@^8.0.7`（与 playground 一致）；从 `playgrounds/icons`、`playgrounds/desktop` 移除已在根声明的 `vite` / `typescript` / `@vitejs/plugin-vue`（若有重复）；从 `tools/cli` 移除重复的 `oxfmt`。
4. **同步锁文件**：运行 `bun install` 更新 `bun.lock`。
5. **验证**：`bun vitest --run`、`bun run lint` 等惯用命令；更新根目录 `AGENTS.md` 目录说明，去掉 `ts-config` 包描述。（不以 `tsc -b` 为必选验证；见 patch-3。）

## 影响范围

- `package.json`、`bun.lock`（含各 `@veltra/*` 与 `tools/cli` 的 `build` 脚本，见 patch-4）
- `tsconfig.node.json`
- `packages/utils`、`packages/compositions`、`packages/directives`、`packages/mobile`、`packages/desktop`、`packages/icons` 下各 `tsconfig*.json`
- `tools/build/tsconfig.json`、`tools/cli/tsconfig.json`
- `playgrounds/desktop/package.json`、`playgrounds/desktop/tsconfig.json`、`playgrounds/icons/package.json`、`playgrounds/icons/tsconfig.json`
- `AGENTS.md`、`.gitignore`
- 删除 `packages/ts-config/` 目录
- `.oxlintrc.json`、`vitest.config.ts`
- `packages/utils/src/styles/theme/ui-theme.ts`
- `packages/desktop/src/types/tree.ts`、`packages/desktop/src/types/cascade.ts`、`packages/desktop/src/types/table.ts`
- `packages/desktop/src/components/table/node/col.ts`、`packages/desktop/src/components/table/node/row.ts`、`packages/desktop/src/components/table/use-columns.ts`
- `packages/desktop/src/components/tree/tree-node.ts`、`packages/desktop/src/components/tree/use-tree-nodes.ts`
- `tsconfig.json`

## 历史补丁

- patch-1: 验证闭环：Vitest TSX + Oxlint 配置
- patch-2: tsconfig 收紧与 TreeNode parent 类型对齐
- patch-3: 移除 project references 与全量 skipLibCheck
- patch-4: 移除各包 `tsc -b` 构建脚本
