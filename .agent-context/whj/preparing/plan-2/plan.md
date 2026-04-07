# 源码迁移 & 包拆分

> 状态: 未执行

## 目标

将 `ui/` 中的全部源码按职责拆分到 `packages/` 下的 6 个包中，完成 `cat-kit` → `@cat-kit/*` 的 import 迁移（覆盖全仓库），配置各包独立构建，最终移除旧的 `ui/` 目录。确保拆分后所有组件、工具函数、组合式函数和指令功能完整，测试通过，dev server 和构建流程正常工作。

## 内容

### 1. 迁移 @ultra-ui/utils

将以下源码从 `ui/` 移入 `packages/utils/src/`：

| 源路径 | 目标路径 | 说明 |
|--------|----------|------|
| `ui/utils/` | `packages/utils/src/utils/` | 工具函数（dom、form、reactive、helper） |
| `ui/types/utils/` | `packages/utils/src/types/utils/` | 工具类型 |
| `ui/types/component-common.ts` | `packages/utils/src/types/component-common.ts` | 共享组件类型基础 |
| `ui/types/helper.ts` | `packages/utils/src/types/helper.ts` | 辅助类型 |
| `ui/types/index.ts` | `packages/utils/src/types/index.ts` | 类型入口（仅保留共享类型的导出） |
| `ui/shared/` | `packages/utils/src/shared/` | 共享常量 |
| `ui/styles/` | `packages/utils/src/styles/` | SCSS mixins、CSS 变量、主题系统 |

**cat-kit 迁移**（utils 范围内）：
- `ui/styles/theme/ui-theme.ts`：`import { isObj, kebabCase, merge } from 'cat-kit/fe'` → `import { isObj, kebabCase, merge } from '@cat-kit/fe'`
- `packages/utils/package.json` 添加 `dependencies: { "@cat-kit/fe": "latest" }`

更新 `packages/utils/src/index.ts` 统一导出所有公共 API。
更新 `packages/utils/package.json` 的 `exports` 字段，提供子路径导出（`./styles`、`./types`、`./shared`）。

完成标准：`packages/utils/` 可独立编译（`tsc --build packages/utils`）无报错。

### 2. 迁移 @ultra-ui/compositions

将 `ui/compositions/` 整体移入 `packages/compositions/src/`。

**import 更新**：
- `@ui/utils` → `@ultra-ui/utils`
- `cat-kit` / `cat-kit/fe` 导入（如 `use-config/index.ts` 中的引用）→ `@cat-kit/core` / `@cat-kit/fe`

更新 `packages/compositions/package.json` 依赖：`@ultra-ui/utils: "workspace:*"`，按需添加 `@cat-kit/core` / `@cat-kit/fe`。
更新 `packages/compositions/src/index.ts` 导出。

完成标准：`tsc --build packages/compositions` 无报错。

### 3. 迁移 @ultra-ui/directives

将 `ui/directives/` 整体移入 `packages/directives/src/`。

**import 更新**：
- `@ui/utils` → `@ultra-ui/utils`
- `ripple.ts` 中的 `import { pick } from 'cat-kit'` → `import { pick } from '@cat-kit/core'`

更新 `packages/directives/package.json` 依赖：`@ultra-ui/utils: "workspace:*"`、`@cat-kit/core`。

完成标准：`tsc --build packages/directives` 无报错。

### 4. 迁移 @ultra-ui/desktop

分步执行：

**4a. 移动组件源码**
将 `ui/components/` 全部 71 个组件目录移入 `packages/desktop/src/components/`。
将 `ui/types/components/` 移入 `packages/desktop/src/types/`。
将 `ui/index.ts`（组件注册入口）和 `ui/install.ts`（全量注册）迁移并改造为 `packages/desktop/src/index.ts` 和 `packages/desktop/src/install.ts`。

**4b. 批量替换 import 路径**
全局替换 `packages/desktop/` 下的 import，精确映射表：

| 旧 import | 新 import | 说明 |
|-----------|-----------|------|
| `@ui/utils` | `@ultra-ui/utils` | 工具函数 |
| `@ui/compositions/*` | `@ultra-ui/compositions` | 组合式函数 |
| `@ui/directives/*` | `@ultra-ui/directives` | 指令 |
| `@ui/types/components/*` | `../types/*` 或 `../../types/*` | 组件类型（desktop 内部相对路径） |
| `@ui/types/utils/*` | `@ultra-ui/utils/types/utils/*` | 工具类型 |
| `@ui/types/component-common` | `@ultra-ui/utils/types/component-common` | 共享组件基础类型 |
| `@ui/types/helper` | `@ultra-ui/utils/types/helper` | 辅助类型 |
| `@ui/types`（barrel） | 按实际导入内容分流到上述规则 | 需逐文件检查 |
| `@ui/styles/*` | `@ultra-ui/utils/styles/*` | 样式工具 |
| `@ui/shared/*` | `@ultra-ui/utils/shared/*` | 共享常量 |

**4c. 迁移 SCSS 跨包引用**
基于 Plan 1 Step 0 确定的 SCSS 方案（预期为 `pkg:` importer），批量替换 71 个组件 `style.scss` 中的 SCSS 引用：
- `@use '../../styles/mixins' as m;` → `@use 'pkg:@ultra-ui/utils/styles/mixins' as m;`
- `@use '../../styles/vars';` → `@use 'pkg:@ultra-ui/utils/styles/vars';`
- `@use '../../styles/functions' as fn;` → `@use 'pkg:@ultra-ui/utils/styles/functions' as fn;`

**4d. 迁移 cat-kit → @cat-kit/***
全局替换 `packages/desktop/` 下的 cat-kit 导入：
- `import { ... } from 'cat-kit'` → `import { ... } from '@cat-kit/core'`
- `import { ... } from 'cat-kit/fe'` → `import { ... } from '@cat-kit/fe'`
- `import type { ... } from 'cat-kit'` → `import type { ... } from '@cat-kit/core'`

使用 use-cat-kit 技能的 API 类型定义验证导入映射正确性。

**4e. 配置 sideEffects 和入口**
在 `packages/desktop/package.json` 中配置 `sideEffects`（参照当前 `ui/package.json` 的模式）：
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

覆盖 Plan 2 Step 4 未涉及的范围：

| 文件 | 旧 import | 新 import |
|------|-----------|-----------|
| `tools/cli/export/index.ts` | `cat-kit/be` | `@cat-kit/be` |
| `tools/cli/gen-component/render-file.ts` | `cat-kit/be` | `@cat-kit/be` |
| `tools/cli/rename/types.ts` | `cat-kit/be` | `@cat-kit/be` |
| `tools/build/release.ts` | `@cat-kit/be` | 确认已正确（已是新格式） |
| `tools/build/prepare.ts` | `@cat-kit/be` | 确认已正确（已是新格式） |
| `apps/sample/vite.config.ts` | `cat-kit/be` | `@cat-kit/be` |

更新对应 `package.json` 的 dependencies：
- `tools/cli/package.json`（若存在）或根 devDependencies 中添加 `@cat-kit/be`
- `apps/sample/package.json`：移除 `cat-kit` devDependency，添加 `@cat-kit/be`

完成标准：全仓库 `grep -r "from 'cat-kit'" .` 返回 0 结果（排除 node_modules）。

### 6. 配置各包独立构建

为每个包在 `package.json` 中添加 `build` script，配置 tsdown：

- `@ultra-ui/utils`：entry `src/index.ts`，输出 `dist/`，包含 SCSS 文件复制（`_vars.scss`、`_mixins.scss`、`_functions.scss` 等需要被下游包 `@use` 的源文件）
- `@ultra-ui/compositions`：entry `src/index.ts`，输出 `dist/`
- `@ultra-ui/directives`：entry `src/index.ts`，输出 `dist/`，包含样式构建
- `@ultra-ui/desktop`：entry `src/index.ts`、组件 style.ts 入口，输出 `dist/`，包含 SCSS 编译

**构建脚本改造**：
- 从 `tools/build/build-styles.ts` 中提取 `scssPlugin` 为独立共享模块 `tools/build/plugins/scss-plugin.ts`
- 移除 `scssPlugin` 中对 `UI_ROOT` 的硬编码依赖，改为接受 `rootDir` 参数
- 配置 SCSS 编译的 `loadPaths`（或 `pkg:` importer）以支持跨包引用
- 每个包的 build script 调用 tsdown 并传入共享的 SCSS 插件配置

配置 Turborepo 按依赖拓扑顺序执行 `turbo build`（utils → compositions/directives → desktop）。

完成标准：`bunx turbo build` 全链路构建成功，各包 `dist/` 均有产物。

### 7. 更新 sample 应用

更新 `apps/sample/` 中的导入：
- `import { ... } from 'ultra-ui'` → `import { ... } from '@ultra-ui/desktop'`
- `import { ... } from 'ultra-ui/types'` → `import { ... } from '@ultra-ui/desktop/types'` 或 `@ultra-ui/utils/types`
- `import { ... } from 'ultra-ui/styles'` → `import { ... } from '@ultra-ui/utils/styles'`
- 更新 `apps/sample/package.json` 依赖：移除 `ultra-ui`，添加 `@ultra-ui/desktop: "workspace:*"`、`@ultra-ui/utils: "workspace:*"`

**更新 `apps/sample/vite.config.ts`**：
- 移除旧的 `ultra-ui` 别名配置
- 更新 `@builder/vite` 的 `autoResolveComponent`：
  - `lib` 参数：`'ultra-ui'` → `'@ultra-ui/desktop'`
  - `sideEffects` 回调中的路径模式：更新为新包结构下的组件样式路径
- 确认 `@builder/vite` 对新包结构的兼容性，若不兼容则编写自定义解析逻辑

完成标准：`cd apps/sample && bun play` 启动成功，页面展示正常。

### 8. 移除旧的 ui/ 目录

确认以下条件全部满足后，删除 `ui/` 目录：
- 所有源码已迁移到 `packages/` 下
- `bunx turbo build` 全链路成功
- `bun vitest --run` 所有测试通过
- `apps/sample` dev server 正常
- 从根 `workspaces` 中移除 `"ui"` 项

完成标准：`ui/` 目录不存在；所有功能验证通过。

### 9. 更新 AGENTS.md、CLI 模板和配置文件

**AGENTS.md**：
- 更新目录结构（至少到第二层）
- 更新包命名和构建命令
- 更新路径别名说明
- 更新组件开发规范中的文件结构和 import 示例

**CLI 模板生成器**：
- 更新 `tools/cli/gen-component/render-file.ts` 中所有模板字符串：
  - `@ui/types` → 新的导入路径
  - `@ui/utils` → `@ultra-ui/utils`
  - SCSS 中的 `@use '../../styles/mixins' as m;` → `@use 'pkg:@ultra-ui/utils/styles/mixins' as m;`（或 Plan 1 确定的 SCSS 方案）

**配置文件**：
- 更新 `vitest.config.ts` 中的路径别名
- 更新 `tsconfig.json` solution references（移除 `ui/tsconfig.json`）
- 更新 `.gitignore`（各包 `dist/` 目录）
- 检查 `simple-git-hooks` commit-msg 命令路径是否受影响

完成标准：`AGENTS.md` 内容与实际结构一致；CLI 生成的新组件使用正确的 import 路径；所有配置文件引用的路径有效。

## 回滚策略

在执行 Step 1 之前打 git tag `pre-package-split`。每完成一个 Step（1-4），建议提交一次 commit 作为中间检查点。若出现不可恢复的问题，可回退到最近的 commit 或 tag。

## 影响范围

- `ui/` 目录下全部文件（425+ 文件，迁移后删除）
- `packages/` 下 6 个包的全部源码文件（新建）
- 70+ 文件的 `cat-kit` import 替换为 `@cat-kit/*`
- 71 个组件的 SCSS `@use` 路径重写
- `tools/build/build-styles.ts`：scssPlugin 重构
- `tools/cli/gen-component/render-file.ts`：模板路径更新
- `apps/sample/`：所有 import 和 vite config 更新
- `vitest.config.ts`、`tsconfig.json`、`.gitignore`、`AGENTS.md`

## 历史补丁
