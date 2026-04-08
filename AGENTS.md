# AGENTS.md — Ultra UI

Vue 3 组件库，完全 TypeScript 开发，BEM + CSS 变量主题系统。

## 常用命令

```bash
bun install                                    # 安装依赖
bun apps/sample/vite.config.ts                # 无效，用下面的方式启动
cd apps/sample && bun dev                      # 启动开发预览 (localhost:7788)
bun tools/cli/gen-component/index.ts         # 交互式生成新组件
bun tools/cli/export/index.ts                # 重新导出组件
cd tools/build && bun index.ts               # 构建产物到 dist/（入口 packages/desktop/src，样式含 directives/utils）
cd tools/build && bun index.ts --release     # 构建 + 发版
bun vitest                                     # 运行测试
bun run lint                                   # oxlint
bun run format                                 # oxfmt
bun run build                                  # turbo run build（各包 build 拓扑）
bunx turbo build --dry-run                     # Turborepo 任务拓扑（dry-run）
```

## 技术栈

| 类别      | 技术                                       | 版本          |
| --------- | ------------------------------------------ | ------------- |
| 框架      | Vue 3 (Composition API + `<script setup>`) | ^3.5.32       |
| 语言      | TypeScript                                 | ^6.0          |
| 运行时    | Bun                                        | -             |
| 构建      | tsdown + Rolldown                          | -             |
| 样式      | SCSS + BEM + CSS 变量                      | sass-embedded |
| 测试      | Vitest                                     | ^4.1          |
| 格式化    | oxfmt + oxlint                             | -             |
| Monorepo  | Turborepo + workspaces                     | -             |
| Git Hooks | simple-git-hooks (commit-msg)              | -             |
| 核心依赖  | `@cat-kit/core`（日期/数值/定时器、`TreeNode`/`Forest`/`dfs`/`bfs` 等数据结构 API）、`@ultra-ui/utils`（`getChainValue`/`Tween`/`pick` 等与 v3 fe 对齐的辅助）、`@cat-kit/be`（CLI/构建）、`@ultra-ui/icons`（具名：`import { X } from '@ultra-ui/icons/normal'` 等） | peer / deps   |

## 目录结构

```
ultra-ui/
├── apps/sample/            # 开发预览应用 (Vite, port 7788)
├── packages/
│   ├── utils/              # @ultra-ui/utils（工具、共享类型、styles、shared）
│   ├── compositions/     # @ultra-ui/compositions
│   ├── directives/         # @ultra-ui/directives
│   ├── desktop/            # @ultra-ui/desktop（组件、types、入口、install）
│   ├── ts-config/          # 共享 TS 预设（extends，内部包）
│   ├── mobile/ / icons/    # 其他包
├── tools/build/            # 构建脚本 (tsdown)
├── tools/cli/              # CLI 工具 (组件生成、导出)
├── package.json            # Monorepo 根 (workspaces)
├── tsconfig.json
└── vitest.config.ts
```

## 组件开发规范

### 文件结构

每个组件目录 `packages/desktop/src/components/<name>/` 包含：

| 文件         | 用途                                  |
| ------------ | ------------------------------------- |
| `<name>.vue` | 主组件 SFC                            |
| `index.ts`   | 导出 `U<PascalName>`                  |
| `style.scss` | BEM 样式                              |
| `style.ts`   | 样式入口（导入依赖样式 + style.scss） |
| `use-*.ts`   | 可选，组合式逻辑拆分                  |

**类型定义放在** `packages/desktop/src/types/<name>.ts`，不在组件目录内。

### 命名约定

- 组件名：`U` + PascalCase（`UButton`、`USelect`）
- CSS 类前缀：`u-`（BEM：`u-button`、`u-button__icon`、`u-button--primary`）
- 指令名：`v` + camelCase（`vRipple`、`vClickOutside`）
- 目录名：kebab-case（`date-picker`、`number-input`）
- 类型命名：`<Name>Props`、`<Name>Emits`、`_<Name>Exposed`（内部）、`<Name>Exposed`（导出）

### 组件编写模式

```vue
<template>
  <div :class="cls.b">
    <!-- BEM: cls.e('element'), cls.m('modifier'), cls.is('state', condition) -->
  </div>
</template>

<script setup lang="ts">
import { bem } from '@ultra-ui/utils'
import type { XxxProps } from '@ultra-ui/desktop/types'

defineOptions({ name: 'Xxx' })

const props = defineProps<XxxProps>()

const cls = bem('xxx')
</script>
```

### 表单组件

表单组件额外使用：

- `useFormComponent(props)` — 注入表单上下文
- `useFormFallbackProps(props)` — 从 Form 继承 `size`/`disabled`/`readonly`
- Props 继承 `FormComponentProps`
- 只读时显示 `FORM_EMPTY_CONTENT`（`'-'`）

## 样式系统

### BEM + SCSS

```scss
@use 'utils/src/styles/mixins' as m;
@use 'utils/src/styles/vars';
@use 'utils/src/styles/functions' as fn;

@include m.b(component-name) {
  // fn.use-var(text-color, main) → var(--u-text-color-main)
  @include m.e(element) {
  }
  @include m.m(modifier) {
  }
  @include m.is(active) {
  }
}
```

- 命名空间变量：`$namespace: 'u-'`（`packages/utils/src/styles/_vars.scss`）
- BEM mixins：`b/e/m/em/is`（`packages/utils/src/styles/_mixins.scss`）
- CSS 变量函数：`fn.use-var()`（`packages/utils/src/styles/_functions.scss`）
- 构建/预览需配置 Sass `loadPaths` 包含 monorepo `packages/`，以便解析 `utils/src/styles/...`

### 主题

- `loadTheme(theme?)`（`@ultra-ui/compositions`）：不传参时注入内置 light/dark 全量变量并支持系统暗色偏好；传入自定义 `UITheme` 时用单次 `html { }` 注入
- `setTheme('light' | 'dark' | 'auto')`（`@ultra-ui/compositions` / `@ultra-ui/utils/styles/theme`）：在 `<html>` 上设置或清除 `data-theme`，与注入样式中的 `@media (prefers-color-scheme: dark)` 规则配合
- `lightTheme` / `darkTheme` 预设（`UITheme` 实例，`reactive: false`）
- `UITheme`：将 `Theme` 序列化为 `--u-*` CSS 变量；`render()` 优先 `adoptedStyleSheets`，否则回退 `<style id="ultra-ui-theme">`；过渡期同步生成无前缀别名并输出一次性弃用警告
- 全局 `Theme` 类型见 `packages/utils/src/styles/type.ts`（仅全局 token）；菜单、表格等组件 token 在对应组件 `style.scss` 中以 `--u-{component}-*` 声明，可用 `fn.component-var()` 与 `m.dark()` 覆盖

## 路径别名

| 别名 | 指向 |
| ---- | ---- |
| `@ultra-ui/utils` | `packages/utils/src` |
| `@ultra-ui/desktop` | `packages/desktop/src` |
| `@ultra-ui/compositions` | `packages/compositions/src` |
| `@ultra-ui/directives` | `packages/directives/src` |
| `ultra-ui` | 兼容指向 `packages/desktop/src/index.ts`（sample Vite alias） |

## 约束

- **不使用 ESLint/Prettier/Biome**，无自动格式化配置。
- Commit message 通过 `simple-git-hooks` + `cat-cli verify-commit` 校验。
- `sideEffects` 声明：组件 `style.ts`、指令样式、`styles/` 目录、`.css`、`.scss`。
- 测试文件放在组件目录的 `__test__/` 下，tsconfig 中被 exclude。
