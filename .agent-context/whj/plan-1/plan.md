# Monorepo 基础设施 & 工具链升级

> 状态: 未执行

## 目标

建立 Turborepo monorepo 骨架，升级 TypeScript 6.x 和 oxc 工具链，更新基础依赖到最新版本。为后续源码拆分（Plan 2）奠定可靠的基础设施层，确保在不移动任何组件源码的前提下，新的目录结构、构建管线和工具链均可正常运转。

## 内容

### 0. 确定 SCSS 跨包导入方案（技术决策）

拆包后 `styles/` 位于 `@ultra-ui/utils`，71 个组件 SCSS 位于 `@ultra-ui/desktop`。当前组件使用相对路径 `@use '../../styles/mixins' as m;` 引用样式基础设施，拆包后该路径断裂。SCSS 不原生理解 npm 包解析，需要提前确定方案。

**评估并验证以下方案（推荐方案 A）**：

- **方案 A（推荐）**：使用 Dart Sass `pkg:` importer（需 sass-embedded ≥ 1.71）。组件 SCSS 中写 `@use 'pkg:@ultra-ui/utils/styles/mixins' as m;`。需在 `@ultra-ui/utils` 的 `package.json` 中添加 `exports` 的 `"sass"` condition，指向 `.scss` 源文件。
- **方案 B（备选）**：在 tsdown SCSS 插件中配置 `loadPaths` 包含 `node_modules/@ultra-ui/utils/src/`。
- **方案 C（最后手段）**：在 `@ultra-ui/desktop` 内保留样式转发文件。

**PoC 验证**：创建一个最小化测试——在 `packages/desktop/` 下写一个引用 `packages/utils/` 中 SCSS 的测试文件，用当前版本的 `sass-embedded` 编译，确认方案 A 可行。

完成标准：方案选定并验证通过，文档记录在本步骤产出中。

### 1. 创建 monorepo 目录结构

将 `sample/` 移动到 `apps/sample/`，将 `build/` 移动到 `tools/build/`，将 `cli/` 移动到 `tools/cli/`。在 `packages/` 下创建以下 6 个包目录（仅骨架，不移动源码）：

| 包目录 | npm 包名 | 说明 |
|--------|----------|------|
| `packages/utils/` | `@ultra-ui/utils` | 共享工具函数、类型、样式基础 |
| `packages/compositions/` | `@ultra-ui/compositions` | 共享组合式函数 |
| `packages/directives/` | `@ultra-ui/directives` | 共享自定义指令 |
| `packages/desktop/` | `@ultra-ui/desktop` | PC 端组件库 |
| `packages/mobile/` | `@ultra-ui/mobile` | 移动端组件库（仅骨架） |
| `packages/icons/` | `@ultra-ui/icons` | 图标库（仅骨架） |

每个包创建：`package.json`、`tsconfig.json`、`src/index.ts`（空入口）。

**移动后路径修正**：
- `tools/build/shared.ts`：将 `resolve(__dirname, '..')` 修正为 `resolve(__dirname, '../..')`，确保 `ROOT` 仍指向项目根目录。
- 检查 `tools/build/` 和 `tools/cli/` 中其他使用 `__dirname` 或相对路径的文件，逐一修正。

完成标准：`ls packages/*/package.json` 输出 6 个路径；`ls apps/sample/package.json`、`ls tools/build/package.json`、`ls tools/cli/package.json` 均存在；`tools/build/shared.ts` 中 ROOT 变量指向项目根目录。

### 2. 编写各包的 package.json

每个 package.json 包含：`name`（@ultra-ui/xxx）、`version`（0.1.0）、`type`（module）、`exports`、`peerDependencies`。依赖拓扑：

```
@ultra-ui/utils         → peerDeps: vue
@ultra-ui/compositions  → peerDeps: vue; deps: @ultra-ui/utils
@ultra-ui/directives    → peerDeps: vue; deps: @ultra-ui/utils
@ultra-ui/desktop       → peerDeps: vue, @ultra-ui/icons; deps: @ultra-ui/utils, @ultra-ui/compositions, @ultra-ui/directives, @cat-kit/core, @cat-kit/fe, @floating-ui/dom, @tanstack/vue-virtual, codemirror 系列, lexical 系列
@ultra-ui/mobile        → peerDeps: vue（仅骨架）
@ultra-ui/icons         → 无 peerDeps（仅骨架）
```

`@ultra-ui/utils` 的 `package.json` 额外配置 `exports` 的 `"sass"` condition（基于 Step 0 的 SCSS 方案决策），例如：
```json
"exports": {
  "./styles/*": { "sass": "./src/styles/*", "default": "./dist/styles/*" }
}
```

完成标准：每个 package.json 的 `name` 字段正确，依赖拓扑无循环。

### 3. 更新根 package.json 和 workspaces

- `workspaces` 更新为 `["packages/*", "apps/*", "tools/*", "ui"]`
  - `ui` 作为显式命名项保留（过渡期，Plan 2 完成后移除）
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
- 创建 `turbo.json`，定义以下 pipeline：
  - `build`：dependsOn `^build`，outputs `["dist/**"]`
  - `lint`：无依赖
  - `format`：无依赖
  - `test`：dependsOn `^build`
  - `dev`：cache false，persistent true
- 配置 `.gitignore` 添加 `.turbo/`

完成标准：`bunx turbo build --dry-run` 可正常输出任务拓扑图。

### 5. 升级 TypeScript 到 6.x

- **前置试编译**：在升级前用 `bunx tsc@latest --build --dry` 对现有 `ui/` 代码做一次试编译，记录所有错误类型和数量作为修复清单
- 更新根 devDependencies 中 `typescript` 到 6.x 最新稳定版
- 更新 `@cat-kit/tsconfig` 到 2.x
- 重构根 `tsconfig.json`（solution style），添加所有新包的 `references`
- 为每个包创建 `tsconfig.json`：`extends` 对应的 `@cat-kit/tsconfig` 预设，启用 `composite`、`declaration`、`declarationMap`
- `ui/tsconfig.json` 保持现有配置（过渡期），确认在 TS 6.x 下可编译
- 根据试编译产出的修复清单，逐项修复 TS 6.x breaking changes

完成标准：`bunx tsc --build --dry` 无报错；`ui/` 下代码在 TS 6.x 下无类型错误。

### 6. 配置 oxc 工具链

**oxlint**：
- `bun add -D oxlint`
- 在根目录创建 `oxlint.json` 配置文件：使用 `recommended` 基线，关闭与 oxfmt 冲突的格式类规则，评估是否有 Vue 专用规则集可启用
- 在根 `package.json` scripts 中添加 `lint` 命令

**oxfmt**：
- 当前 `.oxfmtrc.json` 已存在且 CLI 工具中已使用 oxfmt，确认配置完整
- 在 `turbo.json` 中注册 `format` pipeline
- 评估是否将 oxfmt 集成到 `simple-git-hooks` 的 pre-commit hook 中（当前仅有 commit-msg hook）

完成标准：`bunx oxlint ui/` 可正常运行并输出结果（允许有存量 warning，不应有配置错误）；`turbo.json` 中 `lint` 和 `format` pipeline 已注册。

### 7. 更新基础依赖到最新版本

**注意**：`cat-kit` peerDependency 不在本步骤更新，其迁移到 `@cat-kit/*` 完全由 Plan 2 处理。

更新以下依赖到最新版本：
- `vue`：当前 ^3.5.29
- `vitest`：当前 ^4.0.18
- `@vitejs/plugin-vue`：当前 ^6.0.4
- `sass-embedded`：当前 ^1.97.3（需确保 ≥ 1.71 以支持 `pkg:` importer）
- `tsdown`：当前 ^0.20.1
- `rolldown`：当前 ^1.0.0-rc.2
- `vite`：sample 中当前 ^7.3.1
- `simple-git-hooks`：当前 ^2.13.1
- `fast-glob`：当前 ^3.3.3
- `@types/bun`：当前 ^1.3.9
- `unplugin-vue`：当前 ^7.1.1
- `unplugin-vue-jsx`：当前 ^0.8.1
- `vue-tsc`：当前 ^3.2.4
- `execa`：当前 ^9.6.1
- `@inquirer/prompts`：当前 ^8.2.0
- `vite-plugin-inspect`：当前 ^11.3.3
- `vite-plugin-vue-devtools`：sample 中 ^8.0.5
- `unocss`：sample 中 ^66.5.12
- `@cat-kit/cli`：当前 ^1.0.3
- `@cat-kit/be`：build/package.json 中当前 ^1.0.0

完成标准：`bun install` 无冲突；所有上述依赖均已更新到最新稳定版。

### 8. 验证现有功能完整性

- `bun vitest --run`：所有现有测试通过
- `cd apps/sample && bun play`：dev server 可启动，页面可访问
- `cd tools/build && bun index.ts`：构建流程可正常完成（允许输出到旧的 dist 路径）
- 验证 Step 0 的 SCSS PoC 仍然通过

完成标准：测试全绿、dev server 启动无报错、构建产物正常生成。

## 回滚策略

在执行 Step 1（目录移动）之前打 git tag `pre-monorepo-migration`。若任何步骤导致不可恢复的问题，可通过 `git reset --hard pre-monorepo-migration` 回退。

## 影响范围

- `build/shared.ts`：ROOT 路径计算逻辑
- `tsconfig.json`、`tsconfig.node.json`：references 和 include 路径
- `package.json`（根）：workspaces、scripts、devDependencies
- `build/package.json`、`sample/package.json`：devDependencies 版本
- `.gitignore`：新增 `.turbo/`
- 新增文件：`turbo.json`、`oxlint.json`、`packages/*/package.json`、`packages/*/tsconfig.json`、`packages/*/src/index.ts`

## 历史补丁
