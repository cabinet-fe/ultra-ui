# 源码迁移 + 包拆分

> 状态: 已执行

## 目标

将 `ui/` 全部源码迁移到 `packages/` 下对应包中，消除 `@ui/` 路径别名，完成 `cat-kit` → `@cat-kit/*` 导入迁移，配置各包独立构建，更新 sample 应用和 CLI 工具。完成后 `ui/` 目录不再存在，`@ui/` 路径别名被彻底移除，整个项目统一使用 `@veltra/*` 包结构和 `@cat-kit/*` 依赖。

## 内容

### 1. 迁移 @veltra/utils

将以下源码从 `ui/` 移入 `packages/utils/src/`：

| 源路径                         | 目标路径                                                  |
| ------------------------------ | --------------------------------------------------------- |
| `ui/utils/`                    | `packages/utils/src/utils/`                               |
| `ui/types/utils/`              | `packages/utils/src/types/utils/`                         |
| `ui/types/component-common.ts` | `packages/utils/src/types/component-common.ts`            |
| `ui/types/helper.ts`           | `packages/utils/src/types/helper.ts`                      |
| `ui/types/index.ts`            | `packages/utils/src/types/index.ts`（仅保留共享类型导出） |
| `ui/shared/`                   | `packages/utils/src/shared/`                              |
| `ui/styles/`                   | `packages/utils/src/styles/`                              |

更新 `packages/utils/src/index.ts` 统一导出所有公共 API。
更新 `packages/utils/package.json` 的 `exports` 子路径导出（`./styles/*`、`./types`、`./shared`）。

**utils 范围内的 cat-kit 迁移**：

- `styles/theme/ui-theme.ts`：`import { ... } from 'cat-kit/fe'` → `import { ... } from '@cat-kit/fe'`
- `packages/utils/package.json` 添加 `dependencies: { "@cat-kit/fe": "latest" }`

完成标准：`tsc --build packages/utils` 无报错。

### 2. 迁移 @veltra/compositions

将 `ui/compositions/` 整体移入 `packages/compositions/src/`。

**import 更新**：

- `@ui/utils` → `@veltra/utils`
- `cat-kit` / `cat-kit/fe` → `@cat-kit/core` / `@cat-kit/fe`

更新 `packages/compositions/package.json` 依赖：`@veltra/utils: "workspace:*"`，按需添加 `@cat-kit/core` / `@cat-kit/fe`。
更新 `packages/compositions/src/index.ts` 导出。

完成标准：`tsc --build packages/compositions` 无报错。

### 3. 迁移 @veltra/directives

将 `ui/directives/` 整体移入 `packages/directives/src/`。

**import 更新**：

- `@ui/utils` → `@veltra/utils`
- `cat-kit` → `@cat-kit/core`

更新 `packages/directives/package.json` 依赖：`@veltra/utils: "workspace:*"`、`@cat-kit/core`。

完成标准：`tsc --build packages/directives` 无报错。

### 4. 迁移 @veltra/desktop

**4a. 移动源码**

- `ui/components/` 全部组件目录 → `packages/desktop/src/components/`
- `ui/types/components/` → `packages/desktop/src/types/`
- `ui/index.ts` 和 `ui/install.ts` → 改造为 `packages/desktop/src/index.ts` 和 `packages/desktop/src/install.ts`

**4b. 批量替换 import 路径**

全局替换 `packages/desktop/` 下的 import，精确映射表：

| 旧 import                    | 新 import                                | 说明                 |
| ---------------------------- | ---------------------------------------- | -------------------- |
| `@ui/utils`                  | `@veltra/utils`                        | 工具函数             |
| `@ui/compositions/*`         | `@veltra/compositions`                 | 组合式函数           |
| `@ui/directives/*`           | `@veltra/directives`                   | 指令                 |
| `@ui/types/components/*`     | `../types/*` 或 `../../types/*`          | desktop 内部相对路径 |
| `@ui/types/utils/*`          | `@veltra/utils/types/utils/*`          | 工具类型             |
| `@ui/types/component-common` | `@veltra/utils/types/component-common` | 共享组件基础类型     |
| `@ui/types/helper`           | `@veltra/utils/types/helper`           | 辅助类型             |
| `@ui/types`（barrel）        | 按实际导入内容分流到上述规则             | 需逐文件检查         |
| `@ui/styles/*`               | `@veltra/utils/styles/*`               | 样式工具             |
| `@ui/shared/*`               | `@veltra/utils/shared/*`               | 共享常量             |

**4c. 改写 SCSS 跨包引用**

基于 Plan 4 Step 0 确定的方案（预期为 `pkg:` importer），批量替换组件 `style.scss` 中的 SCSS 引用：

| 旧引用                                 | 新引用                                               |
| -------------------------------------- | ---------------------------------------------------- |
| `@use '../../styles/mixins' as m;`     | `@use 'pkg:@veltra/utils/styles/mixins' as m;`     |
| `@use '../../styles/vars';`            | `@use 'pkg:@veltra/utils/styles/vars';`            |
| `@use '../../styles/functions' as fn;` | `@use 'pkg:@veltra/utils/styles/functions' as fn;` |

注意：部分组件可能有额外的 `@use` 引用（如引用其他组件样式），需逐文件检查完整的 `@use` 列表。

**4d. cat-kit → @cat-kit/\***

全局替换 `packages/desktop/` 下的 cat-kit 导入：

| 旧 import                     | 新 import                           |
| ----------------------------- | ----------------------------------- |
| `from 'cat-kit'`              | `from '@cat-kit/core'`              |
| `from 'cat-kit/fe'`           | `from '@cat-kit/fe'`                |
| `type { ... } from 'cat-kit'` | `type { ... } from '@cat-kit/core'` |

使用 use-cat-kit 技能的 API 类型定义验证导入映射正确性。

**4e. 配置 sideEffects 和入口**

在 `packages/desktop/package.json` 中配置 `sideEffects`：

```json
"sideEffects": [
  "components/**/style.js",
  "directives/**/style.js",
  "*.css",
  "*.scss"
]
```

完成标准：`tsc --build packages/desktop` 无报错；所有组件可被正确导入。

### 5. 迁移 tools/ 和 apps/ 中的 cat-kit 导入

| 文件                                     | 旧 import     | 新 import     |
| ---------------------------------------- | ------------- | ------------- |
| `tools/cli/export/index.ts`              | `cat-kit/be`  | `@cat-kit/be` |
| `tools/cli/gen-component/render-file.ts` | `cat-kit/be`  | `@cat-kit/be` |
| `tools/cli/rename/types.ts`              | `cat-kit/be`  | `@cat-kit/be` |
| `tools/build/release.ts`                 | `@cat-kit/be` | 确认已正确    |
| `tools/build/prepare.ts`                 | `@cat-kit/be` | 确认已正确    |
| `apps/sample/vite.config.ts`             | `cat-kit/be`  | `@cat-kit/be` |

更新对应 `package.json` 依赖：移除 `cat-kit`，添加 `@cat-kit/be`。

完成标准：全仓库 `rg "from 'cat-kit" --glob '!node_modules'` 返回 0 结果。

### 6. 配置各包独立构建

为每个包在 `package.json` 中添加 `build` script，配置 tsdown：

- `@veltra/utils`：entry `src/index.ts`，输出 `dist/`，包含 SCSS 源文件复制
- `@veltra/compositions`：entry `src/index.ts`，输出 `dist/`
- `@veltra/directives`：entry `src/index.ts`，输出 `dist/`，包含样式构建
- `@veltra/desktop`：entry `src/index.ts` + 组件 `style.ts` 入口，输出 `dist/`，包含 SCSS 编译

**构建脚本改造**：

- 从 `tools/build/build-styles.ts` 提取 `scssPlugin` 为独立共享模块 `tools/build/plugins/scss-plugin.ts`
- 移除 `scssPlugin` 对 `UI_ROOT` 的硬编码依赖，改为接受 `rootDir` 参数
- 配置 SCSS 编译的 `pkg:` importer 以支持跨包引用
- 每个包的 build script 调用 tsdown 并传入共享的 SCSS 插件配置

Turborepo 按拓扑顺序执行 `turbo build`（utils → compositions/directives → desktop）。

完成标准：`bunx turbo build` 全链路构建成功，各包 `dist/` 均有产物。

### 7. 更新 sample 应用

更新 `apps/sample/` 中的导入：

| 旧 import                | 新 import                                                   |
| ------------------------ | ----------------------------------------------------------- |
| `from 'ultra-ui'`        | `from '@veltra/desktop'`                                  |
| `from 'ultra-ui/types'`  | `from '@veltra/desktop/types'` 或 `@veltra/utils/types` |
| `from 'ultra-ui/styles'` | `from '@veltra/utils/styles'`                             |

更新 `apps/sample/package.json`：移除 `ultra-ui`，添加 `@veltra/desktop: "workspace:*"`、`@veltra/utils: "workspace:*"`。

更新 `apps/sample/vite.config.ts`：

- 移除旧 `ultra-ui` 别名
- 更新 `autoResolveComponent` 中的 `lib` 参数和 `sideEffects` 路径
- 确认 `@builder/vite` 对新包结构的兼容性，不兼容则编写自定义解析逻辑

完成标准：`cd apps/sample && bun dev` 启动成功，页面正常展示。

### 8. 删除 ui/ 目录

确认以下条件全部满足后删除 `ui/`：

- 所有源码已迁移到 `packages/`
- `bunx turbo build` 全链路成功
- `bun vitest --run` 所有测试通过
- `apps/sample` dev server 正常

同步操作：

- 根 `workspaces` 移除 `"ui"`
- 根 `tsconfig.json` 移除 `@ui/` paths 别名
- 根 `tsconfig.json` 移除 `ui/` 相关 references

完成标准：`ui/` 不存在；全仓库 `rg "@ui/" --glob '!node_modules'` 返回 0 结果。

### 9. 更新 AGENTS.md、CLI 模板和配置

**AGENTS.md**：

- 更新目录结构（至少到第二层）
- 更新包命名和构建命令
- 更新路径别名说明（`@ui/` → `@veltra/*`）
- 更新组件开发规范中的文件结构和 import 示例

**CLI 模板（`tools/cli/gen-component/render-file.ts`）**：

- `@ui/types` → 新导入路径
- `@ui/utils` → `@veltra/utils`
- SCSS 中的 `@use '../../styles/...'` → `@use 'pkg:@veltra/utils/styles/...'`

**配置文件**：

- `vitest.config.ts` 路径别名更新
- `tsconfig.json` solution references（移除 `ui/`）
- `.gitignore`（各包 `dist/`）
- `simple-git-hooks` commit-msg 命令路径

完成标准：AGENTS.md 与实际结构一致；CLI 生成正确路径；配置文件引用有效。

### 10. 全量验证

- `bunx turbo build`：全链路构建成功
- `bun vitest --run`：所有测试通过
- `cd apps/sample && bun dev`：dev server 正常，页面可访问
- `bunx tsc --build`：类型检查通过
- 全仓库无 `@ui/` 残留
- 全仓库无 `from 'cat-kit'` 残留

完成标准：全部验证通过。

## 回滚策略

在 Step 1 之前打 git tag `pre-source-migration`。每完成一个大步骤（Step 1-4 各一次）提交 commit 作为中间检查点。

## 影响范围

- 已删除 `ui/` 目录；源码位于 `packages/utils`、`packages/compositions`、`packages/directives`、`packages/desktop`
- 新增 `packages/ts-config`（共享 TS 预设：`browser.json`、`vue-library.json`、`node-tools.json`）；前端库包改为继承浏览器预设，不再误用 `tsconfig.node`
- `@veltra/desktop` 与 `apps/sample` 仅依赖 `@cat-kit/core`（含 `Forest`/`TreeNode`/`dfs`/`bfs`）；树遍历语义差异由 `packages/desktop/src/utils/tree-walk.ts` 辅助函数承担
- `packages/desktop` 全量组件与类型、`packages/utils` 工具与样式、`compositions`/`directives` 的 import 与 SCSS（`utils/src/styles/*` + Vite `loadPaths`）
- `tools/cli`：`export`/`rename` 适配 `@cat-kit/be` 当前 `readDir` / `DirEntry` API；`tsconfig` 排除 `dist-tsc` 避免声明输出被当作输入
- `tools/cli/shared.ts`、`gen-component/render-file.ts` 等；`apps/sample/`：`package.json`、`vite.config.ts`、演示页 import
- 根 `package.json`（`private`、`build`/`dev`/`test` 脚本）、`tsconfig.node.json`、`turbo.json`、`vitest.config.ts`、`bun.lock`
- `tools/build`：`packages/desktop/src` 为主入口，样式构建覆盖 desktop / directives / utils；`bun run build`（turbo）可完整通过
- `packages/directives/src/ripple/ripple.ts`：inline 容器波纹裁剪时的 display 处理
- `packages/desktop/src/components/table/use-columns.ts`：多根列 Forest 表头层序与 leafs 回溯
- `apps/sample/vite.config.ts`：CodeMirror 依赖 dedupe 与 optimizeDeps，避免 sample 中多实例 @codemirror/state

## 历史补丁

- patch-1: 移除 cat-kit-fe-compat、修正 TS 继承与 Turborepo 根脚本
- patch-2: 修复 tools/build 对齐 packages/\* 与 `turbo run build`
- patch-3: 废除 `cat-kit/fe`，拆分 `@cat-kit/core` / `cat-kit` / `@veltra/utils`（树结构暂保留 cat-kit 入口）
- patch-4: 修复 v-ripple 在 inline 容器上 overflow:hidden 导致点击后异常变宽
- patch-5: Tree/Forest/TreeNode 全面迁移至 @cat-kit/core，移除 cat-kit 依赖
- patch-6: 表格表头按 Forest 多根修正层序遍历，修复 leafs 回溯崩溃
- patch-7: sample Vite 对 CodeMirror 做 dedupe，修复 code-editor 演示页多实例崩溃
