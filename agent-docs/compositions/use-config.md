---
title: useConfig 全局配置
description: 读写 Ultra UI 全局配置的组合式函数：返回只读 config 与深合并写入的 setConfig，可配置全局动画开关、组件尺寸、表单标签宽度与分页器默认值；首次调用后 config.size 变化自动同步尺寸 class 到 html 根节点，适用于管理后台全局紧凑度与字号切换。
aliases: [use-config, setConfig, setDocumentSize, 组件库全局配置, 全局设置]
keywords: [config, setConfig, setDocumentSize, animation, size, labelWidth, pageSize, pageSizeOptions, ComponentSize, 全局尺寸, 深合并, 紧凑模式, 全局默认值, html class]
---

# useConfig 全局配置

`@veltra/compositions` 导出 `useConfig` 与 `setDocumentSize`。`useConfig` 返回全局配置的只读对象 `config` 与深合并写入函数 `setConfig`，配置为模块级单例，任意位置调用共享同一份数据；首次调用后 `config.size` 变化会自动把尺寸 class 同步到 `<html>` 根节点。桌面组件用 `config.form.labelWidth`、`config.paginator.pageSize` 等作为未显式传参时的全局默认值。

## 快速上手

```ts
import { useConfig } from '@veltra/compositions'

const { config, setConfig } = useConfig()

setConfig({
  animation: false, // 关闭全局动画换取性能
  size: 'small', // 全局组件尺寸
  form: { labelWidth: 120 }, // 表单标签宽度，深合并进 form
  paginator: { pageSize: 100 } // 只改 pageSize，pageSizeOptions 保持默认
})

console.log(config.size) // => 'small'
console.log(config.paginator.pageSizeOptions) // => [40, 100, 200, 500, 1000] 未被覆盖
```

应用入口（如 `main.ts`）调用一次 `setConfig` 即可全局生效，无需在每个组件里重复调用。

## API 签名

```ts
import type { ComponentSize } from '@veltra/utils'

interface State {
  /** 是否开启动画；机器性能差时可置 false */
  animation: boolean
  /** 全局组件尺寸 */
  size: ComponentSize // 'small' | 'default' | 'large'
  /** 表单全局配置 */
  form: {
    /** 标签宽度，值为数字时组件按 px 处理 */
    labelWidth?: number | string
  }
  /** 分页器全局配置 */
  paginator: {
    pageSize: number
    pageSizeOptions: number[]
  }
}

export function useConfig(): {
  /** 全局配置，readonly 代理，只读 */
  config: Readonly<State>
  /** 深合并写入全局配置。同步 */
  setConfig: (conf: Partial<State>) => void
}

/** 手动把尺寸 class 写到 <html>：移除 oldSize 对应 class、添加 size 对应 class */
export function setDocumentSize(size: ComponentSize, oldSize?: ComponentSize): void
```

## 参数说明

`useConfig()` 无参数。`setConfig` 的 `conf` 为 `Partial<State>`，各字段默认值与约束：

| 字段 | 类型 | 默认 | 必填 | 约束 |
| --- | --- | --- | :---: | --- |
| `animation` | `boolean` | `true` | 否 | 组件是否播放动画 |
| `size` | `'small' \| 'default' \| 'large'` | `'default'` | 否 | 仅这三个值；变化自动同步到 `<html>` class |
| `form.labelWidth` | `number \| string` | `100` | 否 | `UFormItem` 未显式传 `labelWidth` 时使用 |
| `paginator.pageSize` | `number` | `40` | 否 | `UPaginator` 未传 `pageSize` 时使用 |
| `paginator.pageSizeOptions` | `number[]` | `[40, 100, 200, 500, 1000]` | 否 | `UPaginator` 未传 `pageSizeOptions` 时使用 |

`setConfig` 深合并规则：`state` 中为对象的字段（`form`、`paginator`）递归合并，未提到的键保持原值；若给对象字段传了非对象值，控制台告警 `` extend['<key>']应该是一个对象 `` 并忽略该键。

## 方法与事件

- `config`：`readonly(state)` 深只读代理。直接给 `config.size` 等字段赋值无效（开发环境 Vue 会告警），必须通过 `setConfig` 写入。
- `setConfig(conf)`：同步，立即生效；多处调用共享同一单例，后调用覆盖同名字段。
- 尺寸 class 同步：首次调用 `useConfig()` 后，模块内部建立一次性 `watch`，`config.size` 每次变化自动调用 `setDocumentSize(size, oldSize)`——把 size 原值（`small` / `default` / `large`）作为 class 加到 `document.documentElement`，并移除上一个 size 对应的 class。
- `setDocumentSize(size, oldSize?)`：独立导出，可不经 `useConfig` 手动调用；`typeof document === 'undefined'` 时为 no-op。

## 典型示例

### 入口统一设置全局默认值

```ts
// src/main.ts
import { loadTheme } from '@veltra/styles/theme'
import { useConfig } from '@veltra/compositions'

import '@veltra/styles/normalize'

loadTheme() // 主题必须初始化，否则 --u-* token 为空

const { setConfig } = useConfig()
setConfig({
  size: 'large', // 全局大尺寸
  form: { labelWidth: 140 },
  paginator: { pageSize: 100, pageSizeOptions: [50, 100, 200] }
})
```

### 运行时切换全局尺寸

```vue
<script setup lang="ts">
import { useConfig } from '@veltra/compositions'

const { config, setConfig } = useConfig()

const sizes = ['small', 'default', 'large'] as const

function applySize(size: (typeof sizes)[number]) {
  // 首次 useConfig 已建立 watch，这里只改 size，html class 自动跟随
  setConfig({ size })
}
</script>

<template>
  <div>
    <button
      v-for="s in sizes"
      :key="s"
      :disabled="config.size === s"
      @click="applySize(s)"
    >
      {{ s }}
    </button>
  </div>
</template>
```

### 手动控制 html 尺寸 class

```ts
import { setDocumentSize } from '@veltra/compositions'

// 不经 config watch，直接操作 <html> class：
// 移除 'small' class，添加 'large' class
setDocumentSize('large', 'small')

// 不传 oldSize 时只添加不移除
setDocumentSize('large')
```

## 注意事项

> [!WARNING]
> - `config` 是只读代理，禁止直接 `config.size = 'small'` 赋值，写入必须走 `setConfig`。
> - `setConfig` 是深合并不是整体替换；想重置 `paginator.pageSizeOptions` 必须显式传完整数组。
> - `form` 只有 `labelWidth`，没有 `labelPosition` 等字段；标签位置由 `UForm` 组件自身属性控制，写进 `setConfig` 不会生效。
> - `<html>` 上的尺寸 class 是 size 原值（`small` / `default` / `large`），不是 `u-size-small` 形式。
> - 尺寸 class 的同步 `watch` 在首次调用 `useConfig()` 时建立、模块级仅建立一次；从不调用 `useConfig` 就不会有同步，直接改 `document.documentElement.classList` 也不会联动组件默认值。
> - SSR 安全：`useConfig` 与 `setDocumentSize` 内部都有 `typeof document === 'undefined'` 守卫，服务端调用不报错、不操作 DOM。
