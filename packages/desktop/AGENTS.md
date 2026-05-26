# AGENTS.md — @veltra/desktop

桌面端 UI 组件库主包，包含 70+ 个 Vue 3 组件。

## 目录结构

```
src/
├── index.ts              # export * from './components' + export type * from './types'
├── install.ts            # UltraUI 全局注册函数（组件 + 指令 + 样式）
├── components/           # 组件目录（~70 个子目录）
│   ├── <name>/           # 单个组件
│   │   ├── <name>.vue    # 主组件 SFC
│   │   ├── index.ts      # 导出 U<PascalName>
│   │   ├── style.scss    # BEM 样式
│   │   ├── style.ts      # 样式入口（导入依赖样式 + style.scss）
│   │   ├── use-*.ts      # 可选，组合式逻辑拆分
│   │   └── di.ts         # 可选，依赖注入 key（InjectionKey）
│   └── index.ts          # barrel 聚合导出所有组件
└── types/                # 类型定义目录（~77 个文件）
    ├── index.ts          # 先 re-export @veltra/utils，再导出各组件类型
    └── <name>.ts         # 组件 Props/Emits/Exposed 定义
```

## 组件编写模式

```vue
<template>
  <div :class="cls.b">
    <span :class="cls.e('icon')">...</span>
  </div>
</template>

<script setup lang="ts">
import { bem } from '@veltra/utils'
import type { XxxProps } from '@veltra/desktop/types'

defineOptions({ name: 'Xxx' })

const props = defineProps<XxxProps>()

const cls = bem('xxx')
</script>
```

## 类型定义约定

类型**不在**组件目录内，统一放在 `src/types/<name>.ts`：

```ts
// types/button.ts
export interface ButtonProps extends ComponentProps {
  type?: ButtonType
  // ...
}

export interface ButtonEmits {
  (name: 'click', e: MouseEvent): void
}

export interface _ButtonExposed {
  // 内部用（带下划线）
  el: ShallowRef<HTMLButtonElement | undefined>
}

export type ButtonExposed = DeconstructValue<_ButtonExposed> // 导出用
```

命名规则：`<Name>Props`、`<Name>Emits`、`_<Name>Exposed`（内部）、`<Name>Exposed`（导出）。

## 依赖注入（di.ts）

部分复杂组件（table、menu、grid、tree、dialog 等 18 个）使用 `di.ts` 定义 `InjectionKey`，在父子组件间共享上下文：

```ts
// di.ts
export const TableDIKey: InjectionKey<{
  /* context type */
}> = Symbol('TableDIKey')

// 父组件中 provide
provide(TableDIKey, context)

// 子组件中 inject
const context = inject(TableDIKey)!
```

## install.ts 全局注册

```ts
import { UltraUI } from '@veltra/desktop/install'
app.use(UltraUI)
```

注册所有 `U*` 组件、`@veltra/directives` 中的 `v*` 指令、以及 `vLoading` 指令。同时导入全量样式。

## 导出子路径

| 子路径                    | 用途                            |
| ------------------------- | ------------------------------- |
| `@veltra/desktop`         | 全部组件 + 类型                 |
| `@veltra/desktop/install` | 全局注册函数                    |
| `@veltra/desktop/style`   | 全量组件样式                    |
| `@veltra/desktop/*`       | 深度子路径（按需引入组件/类型） |

## 依赖

- **workspace**：`@veltra/utils`、`@veltra/styles`、`@veltra/compositions`、`@veltra/directives`、`@veltra/icons`
- **外部**：`@floating-ui/dom`、CodeMirror 系列、Lexical 系列、`@cat-kit/core`
- **peer**：`vue ^3.5.0`、`@veltra/icons`
