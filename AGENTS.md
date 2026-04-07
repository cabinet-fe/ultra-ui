# AGENTS.md — Ultra UI

Vue 3 组件库，完全 TypeScript 开发，BEM + CSS 变量主题系统。

## 常用命令

```bash
bun install                                    # 安装依赖
bun apps/sample/vite.config.ts                # 无效，用下面的方式启动
cd apps/sample && bun dev                      # 启动开发预览 (localhost:7788)
bun tools/cli/gen-component/index.ts         # 交互式生成新组件
bun tools/cli/export/index.ts                # 重新导出组件
cd tools/build && bun index.ts               # 构建产物到 dist/
cd tools/build && bun index.ts --release     # 构建 + 发版
bun vitest                                     # 运行测试
bun run lint                                   # oxlint
bun run format                                 # oxfmt
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
| 核心依赖  | cat-kit, @ultra/icon                       | peer          |

## 目录结构

```
ultra-ui/
├── apps/sample/            # 开发预览应用 (Vite, port 7788)
├── packages/               # @ultra-ui/* 包（utils / compositions / directives / desktop / mobile / icons）
├── tools/build/            # 构建脚本 (tsdown)
├── tools/cli/              # CLI 工具 (组件生成、导出)
├── ui/                     # 组件库源码（Plan 5 迁移前暂保留）
│   ├── components/         # 所有组件 (60+)
│   ├── compositions/       # 组合式函数
│   ├── directives/         # 指令 (click-outside, focus, ripple)
│   ├── shared/             # 共享常量
│   ├── styles/             # 主题、SCSS mixins、CSS 变量
│   ├── types/              # 类型定义 (与组件目录分离)
│   │   ├── components/     # 各组件的 Props/Emits/Exposed
│   │   ├── utils/          # 工具类型
│   │   ├── component-common.ts
│   │   └── helper.ts
│   ├── utils/              # 工具函数 (dom, form, reactive)
│   ├── index.ts            # 库入口
│   ├── install.ts          # 全量注册
│   └── package.json        # 版本 0.4.51
├── package.json            # Monorepo 根 (workspaces)
├── tsconfig.json
└── vitest.config.ts
```

## 组件开发规范

### 文件结构

每个组件目录 `ui/components/<name>/` 包含：

| 文件         | 用途                                  |
| ------------ | ------------------------------------- |
| `<name>.vue` | 主组件 SFC                            |
| `index.ts`   | 导出 `U<PascalName>`                  |
| `style.scss` | BEM 样式                              |
| `style.ts`   | 样式入口（导入依赖样式 + style.scss） |
| `use-*.ts`   | 可选，组合式逻辑拆分                  |

**类型定义放在** `ui/types/components/<name>.ts`，不在组件目录内。

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
import { bem } from '@ui/utils'
import type { XxxProps } from '@ui/types'

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
@use '../../styles/mixins' as m;
@use '../../styles/vars';
@use '../../styles/functions' as fn;

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

- 命名空间变量：`$namespace: 'u-'`（`ui/styles/_vars.scss`）
- BEM mixins：`b/e/m/em/is`（`ui/styles/_mixins.scss`）
- CSS 变量函数：`fn.use-var()`（`ui/styles/_functions.scss`）

### 主题

- `loadTheme(theme?)` 加载主题
- `lightTheme` / `darkTheme` 预设
- `UITheme` 类：将 Theme 对象转为 CSS 变量注入 `:root`
- 主题结构定义在 `ui/styles/type.ts`（color、bg、border、radius、shadow 等）

## 路径别名

| 别名       | 指向                                  |
| ---------- | ------------------------------------- |
| `@ui/*`    | `ui/*`（tsconfig paths + vite alias） |
| `ultra-ui` | `ui/index.ts`（仅 sample）            |

## 约束

- **不使用 ESLint/Prettier/Biome**，无自动格式化配置。
- Commit message 通过 `simple-git-hooks` + `cat-cli verify-commit` 校验。
- `sideEffects` 声明：组件 `style.ts`、指令样式、`styles/` 目录、`.css`、`.scss`。
- 测试文件放在组件目录的 `__test__/` 下，tsconfig 中被 exclude。
