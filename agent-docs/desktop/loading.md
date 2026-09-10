---
title: ULoading / vLoading 加载
description: 从 @veltra/desktop 导入 ULoading 组件与 vLoading 指令：组件渲染四种加载动画（dual-ring/dot/ring/bars），指令在任意元素上覆盖半透明加载遮罩，支持局部加载与全屏加载，值切换时自动显示与移除。
aliases: [ULoading, vLoading, Loading, 加载中, 加载动画, loading 遮罩]
keywords: [LoadingType, dual-ring, dot, ring, bars, v-loading, ObjectDirective, 加载中, 加载遮罩, 局部加载, 全屏加载, 数据加载, 指令遮罩, 加载动画]
---

# ULoading / vLoading 加载

`@veltra/desktop` 导出组件 `ULoading` 与指令 `vLoading`。`ULoading` 渲染一个加载动画（`dual-ring` / `dot` / `ring` / `bars` 四种）；`vLoading` 以 `v-loading` 使用时在宿主元素上覆盖半透明加载遮罩，绑定值为真即显示、为假即移除，指令参数选择动画类型。

## 快速上手

```vue
<script setup lang="ts">
import { shallowRef } from 'vue'
// script setup 中名为 vLoading 的变量会被模板识别为 v-loading 指令
import { vLoading } from '@veltra/desktop'

const loading = shallowRef(false)

async function fetchData() {
  loading.value = true
  await new Promise((r) => setTimeout(r, 2000)) // 模拟请求
  loading.value = false // 值为 false 时遮罩自动移除
}
</script>

<template>
  <div v-loading:dual-ring="loading" style="height: 200px">内容区域</div>
  <button @click="fetchData">加载</button>
</template>
```

指令参数 `dual-ring` 是动画类型；省略参数时为 `dual-ring`。宿主元素尺寸必须非零，遮罩按宿主大小覆盖。

## API 签名

```ts
import type { ObjectDirective } from 'vue'

/** 加载动画类型 */
export type LoadingType = 'dual-ring' | 'dot' | 'ring' | 'bars'

/** loading 组件属性 */
export interface LoadingProps {
  /** 加载动画类型。默认 'dual-ring' */
  type: LoadingType
}

/** 加载遮罩指令：v-loading:[type]="value" */
export const vLoading: ObjectDirective<HTMLElement>
```

说明：

- `ULoading` 的 `size` 不在 props 上，尺寸跟随全局配置：`useConfig().setConfig({ size })` 设为 `'small' | 'default' | 'large'` 后所有加载动画统一变化，缺省 `'default'`。
- 类型文件中的 `LoadingEmits`（`update:modelValue`）未被组件使用，组件不声明任何事件。
- 组件根元素是 `position: absolute; width: 100%; height: 100%` 的半透明遮罩层，内部 loader 居中，遮罩 `z-index` 取全局自增计数（1000 起）。

## 参数说明

### ULoading 组件 props

| 参数 | 类型 | 默认 | 必填 | 约束 |
| --- | --- | --- | :---: | --- |
| `type` | `'dual-ring' \| 'dot' \| 'ring' \| 'bars'` | `'dual-ring'` | 否 | 四种动画：双环反向旋转、三点呼吸、单环旋转、三竖条跳动 |

### v-loading 指令绑定

| 部分 | 类型 | 默认 | 必填 | 约束 |
| --- | --- | --- | :---: | --- |
| 值 `binding.value` | `boolean`（truthy/falsy） | — | 是 | `true` 渲染遮罩，`false` 移除遮罩 |
| 参数 `binding.arg` | `'dual-ring' \| 'dot' \| 'ring' \| 'bars'` | `'dual-ring'` | 否 | 写法 `v-loading:dual-ring`；支持动态参数 `v-loading:[typeExpr]` |
| 修饰符 | — | — | — | 不支持任何修饰符 |

指令生命周期：宿主挂载且值为真时渲染遮罩；值变化时按真假渲染 / 移除；宿主卸载时移除遮罩。渲染时给宿主元素追加 `u-loading__container` 类（`position: relative`），移除时撤销，因此宿主无需自己写 `position: relative`。

## 典型示例

### 表格局部加载 + 动态参数切换动画

```vue
<script setup lang="ts">
import { shallowRef } from 'vue'
import { vLoading } from '@veltra/desktop'

const loading = shallowRef(false)
const type = shallowRef<'dual-ring' | 'ring'>('dual-ring')

async function reload() {
  loading.value = true
  await new Promise((r) => setTimeout(r, 1500))
  loading.value = false
}
</script>

<template>
  <div
    v-loading:[type]="loading"
    style="height: 240px; border: 1px solid #eee"
  >
    <p>列表内容，加载时显示半透明遮罩</p>
  </div>
  <button @click="type = 'ring'">换 ring 动画</button>
  <button @click="reload">重新加载</button>
</template>
```

### 全屏加载

```vue
<script setup lang="ts">
import { shallowRef } from 'vue'
import { vLoading } from '@veltra/desktop'

const fullscreenLoading = shallowRef(false)

async function loadAll() {
  fullscreenLoading.value = true
  await new Promise((r) => setTimeout(r, 3000))
  fullscreenLoading.value = false
}
</script>

<template>
  <button @click="loadAll">全屏加载</button>
  <!-- 铺满视口的宿主元素，遮罩即全屏 -->
  <div
    v-loading:dual-ring="fullscreenLoading"
    style="position: fixed; inset: 0; z-index: 2000"
  />
</template>
```

### ULoading 组件单独使用

```vue
<script setup lang="ts">
import { ULoading } from '@veltra/desktop'
</script>

<template>
  <!-- 组件是 absolute 遮罩，必须放在有尺寸且 position: relative 的容器内 -->
  <div style="position: relative; height: 120px">
    <ULoading type="dot" />
  </div>
  <div style="position: relative; height: 120px">
    <ULoading type="bars" />
  </div>
</template>
```

## 注意事项

> [!WARNING]
> - 本库加载指令是 `vLoading`（模板写 `v-loading`），不是 `v-loading.config` 这类带修饰符的配置式用法；没有文案（`text`）、spinner 自定义等配置项。
> - `app.use(UltraUI)` 已全局注册 `v-loading`（`install` 内 `app.directive('loading', vLoading)`），此时模板可直接用而无需导入；未安装插件时必须在 `<script setup>` 中 `import { vLoading } from '@veltra/desktop'`，否则指令不生效且模板报解析错误。
> - 单独使用 `ULoading` 组件时禁止直接放在无 `position: relative` 的容器外，否则遮罩会相对最近的定位祖先铺满。
> - `size` 不是 props，写 `<ULoading size="large" />` 无效；用 `useConfig().setConfig({ size: 'large' })` 全局调整。
> - 需要主题 token：入口必须调用 `@veltra/styles/theme` 的 `loadTheme()`，否则遮罩与动画无颜色。

## 常见问题

### 写了 `v-loading` 但遮罩不出现

原因：既没有 `app.use(UltraUI)` 全局注册，也没有在 `<script setup>` 中导入 `vLoading`。修复：

```vue
<script setup lang="ts">
import { vLoading } from '@veltra/desktop'
</script>
```

### 遮罩只有一小条或撑不开

原因：宿主元素高度为 0 或内容塌陷。修复：给宿主元素设置明确高度（如 `style="height: 200px"`）。
