# Monorepo 基础设施 + 工具链升级

> 状态: 已执行

## 目标

建立 Turborepo monorepo 基础设施，创建 `@veltra/*` 六包结构（含包配置和入口声明），升级 TypeScript 6.x、oxc 工具链，更新全部依赖到最新版本。完成后 monorepo 工具链就绪、各包 workspace 可被正确解析，为 Plan 5 的源码迁移奠定基础。

> `ui/` 源码在本计划中保持原位不动，`@ui/` tsconfig 别名保留供 `ui/` 内部编译使用。Plan 5 迁移源码时彻底消除 `@ui/`。

## 内容

### 0. SCSS 跨包导入方案（技术决策）

拆包后 `styles/` 将位于 `@veltra/utils`，71 个组件 SCSS 将位于 `@veltra/desktop`。当前组件使用相对路径 `@use '../../styles/mixins' as m;` 引用样式基础设施，拆包后路径断裂。

**评估并验证以下方案（推荐方案 A）**：

- **方案 A（推荐）**：Dart Sass `pkg:` importer（需 sass-embedded ≥ 1.71）。组件 SCSS 中写 `@use 'pkg:@veltra/utils/styles/mixins' as m;`。`@veltra/utils` 的 `package.json` 添加 `exports` 的 `"sass"` condition 指向 `.scss` 源文件。
- **方案 B（备选）**：tsdown SCSS 插件配置 `loadPaths` 包含 `node_modules/@veltra/utils/src/`。
- **方案 C（最后手段）**：在 `@veltra/desktop` 内保留样式转发文件。

**PoC 验证**：创建最小化测试——在 `packages/desktop/` 下写一个引用 `packages/utils/` 中 SCSS 的测试文件，用当前版本 `sass-embedded` 编译，确认方案 A 可行。PoC 验证后删除测试文件。

完成标准：方案选定并 PoC 通过。

### 1. 创建 monorepo 目录结构

将 `sample/` 移动到 `apps/sample/`，将 `build/` 移动到 `tools/build/`，将 `cli/` 移动到 `tools/cli/`。在 `packages/` 下创建 6 个包目录：

| 包目录                   | npm 包名                 | 说明                         |
| ------------------------ | ------------------------ | ---------------------------- |
| `packages/utils/`        | `@veltra/utils`        | 共享工具函数、类型、样式基础 |
| `packages/compositions/` | `@veltra/compositions` | 共享组合式函数               |
| `packages/directives/`   | `@veltra/directives`   | 共享自定义指令               |
| `packages/desktop/`      | `@veltra/desktop`      | PC 端组件库                  |
| `packages/mobile/`       | `@veltra/mobile`       | 移动端组件库（仅骨架）       |
| `packages/icons/`        | `@veltra/icons`        | 图标库（仅骨架）             |

每个包创建：`package.json`、`tsconfig.json`、`src/index.ts`。

**移动后路径修正**：

- `tools/build/shared.ts`：将 `resolve(__dirname, '..')` 修正为 `resolve(__dirname, '../..')`，确保 `ROOT` 仍指向项目根。
- 逐一检查 `tools/build/` 和 `tools/cli/` 中使用 `__dirname` 或相对路径的文件，修正路径。

完成标准：`ls packages/*/package.json` 输出 6 个路径；`apps/sample/package.json`、`tools/build/package.json`、`tools/cli/package.json` 均存在；`tools/build/shared.ts` 的 ROOT 指向项目根。

### 2. 编写各包 package.json

每个 package.json 包含：`name`（@veltra/xxx）、`version`（0.1.0）、`type`（module）、`exports`、依赖声明。依赖拓扑：

```
@veltra/utils         → peerDeps: vue
@veltra/compositions  → peerDeps: vue; deps: @veltra/utils
@veltra/directives    → peerDeps: vue; deps: @veltra/utils
@veltra/desktop       → peerDeps: vue, @veltra/icons; deps: @veltra/utils, @veltra/compositions, @veltra/directives, @cat-kit/core, @cat-kit/fe, @floating-ui/dom, @tanstack/vue-virtual, codemirror 系列, lexical 系列
@veltra/mobile        → peerDeps: vue（仅骨架）
@veltra/icons         → 无 peerDeps（仅骨架）
```

`@veltra/utils` 额外配置 SCSS exports（基于 Step 0 决策）：

```json
"exports": {
  ".": { "import": "./src/index.ts" },
  "./styles/*": { "sass": "./src/styles/*", "default": "./dist/styles/*" }
}
```

各实体包的 `src/index.ts` 写入预期导出声明（占位），以 `export {}` 为基线。骨架包（mobile、icons）仅 `export {}`。

完成标准：每个 package.json 的 `name` 正确，依赖拓扑无循环，`bun install` 可识别全部 workspace。

### 3. 更新根 package.json 和 workspaces

- `workspaces` 更新为 `["packages/*", "apps/*", "tools/*", "ui"]`
  - `ui` 保留（Plan 5 迁移源码后移除）
- 更新 `scripts`：
  - `gen`：`bun cli/gen-component/index.ts` → `bun tools/cli/gen-component/index.ts`
  - `export`：`bun cli/export/index.ts` → `bun tools/cli/export/index.ts`
  - `rename:types`：`bun cli/rename/types` → `bun tools/cli/rename/types`
  - 新增 `lint`：`oxlint .`
  - 新增 `format`：`oxfmt .`
- 更新 `tsconfig.node.json`：`include` 中 `sample/vite.config.ts` → `apps/sample/vite.config.ts`

完成标准：`bun install` 成功，所有 workspace 可被识别。

### 4. 安装并配置 Turborepo

- `bun add -D turbo`
- 创建 `turbo.json`，定义 pipeline：
  - `build`：dependsOn `^build`，outputs `["dist/**"]`
  - `lint`：无依赖
  - `format`：无依赖
  - `test`：dependsOn `^build`
  - `dev`：cache false，persistent true
- `.gitignore` 添加 `.turbo/`

完成标准：`bunx turbo build --dry-run` 正常输出任务拓扑。

### 5. 升级 TypeScript 6.x

- **试编译**：`bunx tsc@latest --build --dry` 对 `ui/` 做一次试编译，记录错误类型和数量
- 更新根 devDependencies 中 `typescript` 到 6.x 最新稳定版
- 更新 `@cat-kit/tsconfig` 到 2.x
- 重构根 `tsconfig.json`（solution style），添加所有新包的 `references`
- 为每个包创建 `tsconfig.json`：extends `@cat-kit/tsconfig` 预设，启用 `composite`、`declaration`、`declarationMap`
- `ui/tsconfig.json` 保持现有配置，确认 TS 6.x 下可编译
- 根据试编译错误清单逐项修复 breaking changes

完成标准：`bunx tsc --build` 无报错；`ui/` 下代码在 TS 6.x 下无类型错误。

### 6. 配置 oxc 工具链

**oxlint**：

- `bun add -D oxlint`
- 根目录创建 `oxlint.json`：`recommended` 基线，关闭与 oxfmt 冲突的格式类规则，评估 Vue 专用规则集
- 根 scripts 添加 `lint` 命令

**oxfmt**：

- 确认 `.oxfmtrc.json` 配置完整
- `turbo.json` 注册 `format` pipeline
- 评估是否集成到 `simple-git-hooks` 的 pre-commit hook

完成标准：`bunx oxlint ui/` 正常运行（允许存量 warning）；`turbo.json` 中 `lint` 和 `format` pipeline 已注册。

### 7. 更新依赖到最新版本

**不在本步骤更新**：`cat-kit` peerDependency（迁移到 `@cat-kit/*` 由 Plan 5 处理）。

更新以下依赖到最新稳定版：

| 依赖                       | 当前版本             |
| -------------------------- | -------------------- |
| `vue`                      | ^3.5.29              |
| `vitest`                   | ^4.0.18              |
| `@vitejs/plugin-vue`       | ^6.0.4               |
| `sass-embedded`            | ^1.97.3（需 ≥ 1.71） |
| `tsdown`                   | ^0.20.1              |
| `rolldown`                 | ^1.0.0-rc.2          |
| `vite`                     | ^7.3.1               |
| `simple-git-hooks`         | ^2.13.1              |
| `fast-glob`                | ^3.3.3               |
| `@types/bun`               | ^1.3.9               |
| `unplugin-vue`             | ^7.1.1               |
| `unplugin-vue-jsx`         | ^0.8.1               |
| `vue-tsc`                  | ^3.2.4               |
| `execa`                    | ^9.6.1               |
| `@inquirer/prompts`        | ^8.2.0               |
| `vite-plugin-inspect`      | ^11.3.3              |
| `vite-plugin-vue-devtools` | ^8.0.5               |
| `unocss`                   | ^66.5.12             |
| `@cat-kit/cli`             | ^1.0.3               |
| `@cat-kit/be`              | ^1.0.0               |

完成标准：`bun install` 无冲突；依赖均为最新稳定版。

### 8. 验证

- `bun vitest --run`：现有测试通过
- `cd apps/sample && bun dev`：dev server 可启动，页面可访问
- `cd tools/build && bun index.ts`：构建流程可完成（输出到旧 dist 路径）
- SCSS PoC 编译通过
- `bunx turbo build --dry-run`：任务拓扑正确

完成标准：测试全绿、dev server 无报错、构建产物正常。

## 回滚策略

在 Step 1（目录移动）之前打 git tag `pre-monorepo-infra`。若不可恢复，`git reset --hard pre-monorepo-infra`。

## 影响范围

- `AGENTS.md`：命令与目录说明
- `package.json`（根）：workspaces、`packageManager`、scripts、devDependencies
- `tsconfig.json`、`tsconfig.node.json`、`turbo.json`、`oxlint.json`
- `.gitignore`：`.turbo/`、`tools/build/dist-tsc/`、`tools/cli/dist-tsc/`、`apps/sample/.tsc-vite-config/`
- `apps/sample/`（自 `sample/` 迁移）：`package.json`、`vite.config.ts`
- `tools/build/`（自 `build/` 迁移）：`package.json`、`tsconfig.json`、`shared.ts`、`build.ts`
- `tools/cli/`（自 `cli/` 迁移）：`package.json`、`tsconfig.json`、`shared.ts`
- `ui/package.json`、`ui/tsconfig.json`、`ui/env.d.ts`
- `ui/components/form/dynamic-form-model.ts`、`ui/components/menu/use-menu-item.ts`
- `packages/utils/`、`packages/compositions/`、`packages/directives/`、`packages/desktop/`、`packages/mobile/`、`packages/icons/`（各 `package.json`、`tsconfig.json`、`src/index.ts`；`packages/utils` 另含 `src/styles/.gitkeep`）
- `bun.lock`

## 实施备注

- **SCSS**：已采用方案 A，`sass ... --pkg-importer=node` PoC 通过后已删除临时 SCSS 文件；`@veltra/utils` 已配置 `exports` 的 `sass` 条件。
- **TS 6 + @cat-kit/tsconfig 2**：`ui/` 在 `tsconfig` 中显式关闭 `strict` / `noUncheckedIndexedAccess` / `noImplicitAny` 以兼容存量代码；新增 `ui/env.d.ts` 声明 `*.vue` / `*.scss`。
- **oxlint**：根脚本为 `oxlint -c oxlint.json --vue-plugin .`；`style` 类规则关闭以减少与 oxfmt 冲突；修正 `apps/sample/src/table/virtualizer.ts` 尾部多余 `)` 导致的解析错误。
- **vite-plugin-inspect**：保持 `^11.3.3`（未跟 npm latest 的 beta）。
- **Turborepo**：各 `@veltra/*` 与 `tools/cli` 增加 `build: tsc -b`；`ultra-ui` 增加 `build: bun ../tools/build/index.ts`，便于 `turbo` 依赖图完整。
- **simple-git-hooks**：未新增 pre-commit 的 `oxfmt`（按计划「评估」结论暂不接入）。

## 历史补丁

- patch-1: tsc 产物目录隔离（`dist-tsc` / `.tsc-vite-config`）
