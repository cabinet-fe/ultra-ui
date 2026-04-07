# AGENTS.md — Ultra UI

Vue 3 组件库，完全 TypeScript 开发，BEM + CSS 变量主题系统。

## 常用命令

```bash
bun install                          # 安装依赖
bun sample/vite.config.ts            # 无效，用下面的方式启动
cd sample && bun dev                 # 启动开发预览 (localhost:7788)
bun cli/gen-component/index.ts       # 交互式生成新组件
bun cli/export/index.ts              # 重新导出组件
cd build && bun index.ts             # 构建各 workspace 包到 packages/*/dist/
cd build && bun index.ts --release   # 构建 + 发版
bun vitest                           # 运行测试
```

## 技术栈

| 类别      | 技术                                       | 版本          |
| --------- | ------------------------------------------ | ------------- |
| 框架      | Vue 3 (Composition API + `<script setup>`) | ^3.5.29       |
| 语言      | TypeScript                                 | 5.9.3         |
| 运行时    | Bun                                        | -             |
| 构建      | tsdown + Rolldown（多包 dist）；发版侧 @cat-kit/maintenance | -             |
| 样式      | SCSS + BEM + CSS 变量                      | sass-embedded |
| 测试      | Vitest                                     | ^4.0.18       |
| 格式化    | oxfmt (CLI 生成代码)                       | -             |
| Git Hooks | simple-git-hooks (commit-msg)              | -             |
| 核心依赖  | `@cat-kit/core`（core 包依赖）+ peer `vue`；`@lucide/vue`（pc 包依赖） | -             |

## 目录结构

```
ultra-ui/
├── build/                     # 构建脚本
├── cli/                       # CLI 工具
├── sample/                    # 开发预览应用
├── packages/
│   ├── core/                  # @ultra-ui/core (utils, compositions, shared, types)
│   ├── styles/                # @ultra-ui/styles (SCSS, 主题系统)
│   ├── pc/                    # @ultra-ui/pc (71 个 PC 端组件)
│   └── directives/            # @ultra-ui/directives (指令)
├── package.json               # Monorepo 根
├── tsconfig.json
└── vitest.config.ts
```

## 组件开发规范

### 文件结构

每个组件目录 `packages/pc/src/components/<name>/` 包含：

| 文件         | 用途                                  |
| ------------ | ------------------------------------- |
| `<name>.vue` | 主组件 SFC                            |
| `index.ts`   | 导出 `U<PascalName>`                  |
| `style.scss` | BEM 样式                              |
| `style.ts`   | 样式入口（导入依赖样式 + style.scss） |
| `use-*.ts`   | 可选，组合式逻辑拆分                  |

**类型定义放在** `packages/pc/src/types/<name>.ts`，不在组件目录内。

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
import { bem } from '@ultra-ui/core'
import type { XxxProps } from '../types/xxx'

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

组件与指令样式通过 **sass `loadPaths`** 解析 `@ultra-ui/styles` 中的 partial，开发与 Vitest 需配置 `loadPaths` 包含 `packages/styles/src`（见 `sample/vite.config.ts`、`vitest.config.ts`、构建脚本 `build/build-styles.ts`）。

```scss
@use 'mixins' as m;
@use 'vars';
@use 'functions' as fn;

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

- 命名空间变量：`$namespace: 'u-'`（`packages/styles/src/_vars.scss`）
- BEM mixins：`b/e/m/em/is`（`packages/styles/src/_mixins.scss`）
- CSS 变量函数：`fn.use-var()`（`packages/styles/src/_functions.scss`）

### 主题

- `loadTheme(theme?)` 加载主题
- `lightTheme` / `darkTheme` 预设
- `UITheme` 类：将 Theme 对象转为 CSS 变量注入 `:root`
- 主题结构定义在 `packages/styles/src/type.ts`（color、bg、border、radius、shadow 等）

## 路径别名

| 别名                 | 指向                                                         |
| -------------------- | ------------------------------------------------------------ |
| `@ultra-ui/core`     | `packages/core/src/`（tsconfig paths + Vite / Vitest alias） |
| `@ultra-ui/styles`   | `packages/styles/src/`                                       |
| `@ultra-ui/pc`       | `packages/pc/src/`                                           |
| `@ultra-ui/directives` | `packages/directives/src/`                                 |

## 约束

- **不使用 ESLint/Prettier/Biome**，无自动格式化配置。
- Commit message 通过 `simple-git-hooks` + `cat-cli verify-commit` 校验。
- **sideEffects**：由各子包 `package.json` 独立声明（如 pc 的组件 `style.js`、styles/directives 的样式入口等）。
- 测试文件放在组件目录的 `__test__/` 下，Vitest `include` 已指向 `packages/pc/src/components/**/__test__/**/*.test.ts`。
