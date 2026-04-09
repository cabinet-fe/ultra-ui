# AGENTS.md — @ultra-ui/desktop

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
    ├── index.ts          # 先 re-export @ultra-ui/utils/types，再导出各组件类型
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
import { bem } from '@ultra-ui/utils'
import type { XxxProps } from '@ultra-ui/desktop/types'

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

export interface _ButtonExposed {    // 内部用（带下划线）
  el: ShallowRef<HTMLButtonElement | undefined>
}

export type ButtonExposed = DeconstructValue<_ButtonExposed>  // 导出用
```

命名规则：`<Name>Props`、`<Name>Emits`、`_<Name>Exposed`（内部）、`<Name>Exposed`（导出）。

## 表单组件模式

表单组件在基础模式上额外使用：

```ts
import { useFormComponent, useFormFallbackProps } from '@ultra-ui/compositions'
import { FORM_EMPTY_CONTENT } from '@ultra-ui/utils/shared'

// Props 继承 FormComponentProps
interface InputProps extends FormComponentProps { /* ... */ }

// 组件内
const { inForm, formProps } = useFormComponent()
const { size, disabled, readonly } = useFormFallbackProps([formProps, props])

// 只读时显示占位符
// FORM_EMPTY_CONTENT = '-'
```

## 依赖注入（di.ts）

部分复杂组件（table、menu、grid、tree、dialog 等 18 个）使用 `di.ts` 定义 `InjectionKey`，在父子组件间共享上下文：

```ts
// di.ts
export const TableDIKey: InjectionKey<{ /* context type */ }> = Symbol('TableDIKey')

// 父组件中 provide
provide(TableDIKey, context)

// 子组件中 inject
const context = inject(TableDIKey)!
```

## install.ts 全局注册

```ts
import { UltraUI } from '@ultra-ui/desktop/install'
app.use(UltraUI)
```

注册所有 `U*` 组件、`@ultra-ui/directives` 中的 `v*` 指令、以及 `vLoading` 指令。同时导入全量样式。

## 导出子路径

| 子路径 | 用途 |
| ------ | ---- |
| `@ultra-ui/desktop` | 全部组件 + 类型 |
| `@ultra-ui/desktop/install` | 全局注册函数 |
| `@ultra-ui/desktop/*` | 深度子路径（按需引入组件/类型） |

## 依赖

- **workspace**：`@ultra-ui/utils`、`@ultra-ui/styles`、`@ultra-ui/compositions`、`@ultra-ui/directives`、`@ultra-ui/icons`
- **外部**：`@floating-ui/dom`、`@tanstack/vue-virtual`、CodeMirror 系列、Lexical 系列、`@cat-kit/core`
- **peer**：`vue ^3.5.0`、`@ultra-ui/icons`
