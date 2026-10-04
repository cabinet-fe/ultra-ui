---
title: 'ULoading / vLoading 加载（@veltra/mobile 移动端）'
description: '@veltra/mobile 导出的加载组件与指令：ULoading 渲染四种加载动画（dual-ring/dot/ring/bars），vLoading 在任意元素上覆盖半透明加载遮罩，值为真显示、为假移除，指令参数选择动画类型，用于移动端局部加载与全屏加载。'
aliases: [ULoading, vLoading, Loading, 加载中, 加载遮罩, loading 指令, 移动端加载]
keywords:
  [
    LoadingType,
    dual-ring,
    dot,
    ring,
    bars,
    v-loading,
    加载中,
    加载遮罩,
    局部加载,
    全屏加载,
    数据加载,
    触屏加载,
    指令遮罩,
    加载动画,
    下拉数据加载
  ]
---

# ULoading / vLoading 加载（@veltra/mobile 移动端）

`@veltra/mobile` 导出组件 `ULoading` 与指令 `vLoading`。`ULoading` 渲染一个加载动画（`dual-ring` / `dot` / `ring` / `bars` 四种）；`vLoading` 以 `v-loading` 使用时在宿主元素上覆盖半透明加载遮罩，绑定值为真即显示、为假即移除，指令参数选择动画类型。

## 快速上手

```vue
<script setup lang="ts">
import { shallowRef } from 'vue'
// script setup 中名为 vLoading 的变量会被模板识别为 v-loading 指令
import { vLoading } from '@veltra/mobile'
import '@veltra/mobile/components/loading/style'

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

视觉初始化前提：应用入口需要 `import '@veltra/styles/normalize'` 并调用 `@veltra/styles/theme` 的 `loadTheme()`，否则 `--u-*` token 为空、遮罩与动画无颜色。组件样式按需引入：`import '@veltra/mobile/components/loading/style'`。

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

- `@veltra/mobile` 没有插件形态的 `install`，不会全局注册指令；模板使用 `v-loading` 前必须在 `<script setup>` 中 `import { vLoading } from '@veltra/mobile'`。
- 组件根元素是 `position: absolute; width: 100%; height: 100%` 的半透明遮罩层（背景色 `--u-bg-color-top` 透明度档），内部 loader 居中，遮罩 `z-index` 取全局自增计数（1000 起）。
- 类型文件中的 `LoadingEmits`（`update:modelValue`）未被组件使用，组件不声明任何事件；`LoadingExposed` 无暴露成员。
- 动画尺寸是固定值，无 `size` 属性也无全局尺寸配置：`dual-ring` / `ring` 外环 36px（边框 3px），`dot` 圆点 9px，`bars` 竖条宽 6px、高在 10px~26px 间伸缩。

## 参数说明

### ULoading 组件 props

| 参数   | 类型                                       | 默认          | 必填 | 约束                                                   |
| ------ | ------------------------------------------ | ------------- | :--: | ------------------------------------------------------ |
| `type` | `'dual-ring' \| 'dot' \| 'ring' \| 'bars'` | `'dual-ring'` |  否  | 四种动画：双环反向旋转、三点呼吸、单环旋转、三竖条跳动 |

### v-loading 指令绑定

| 部分               | 类型                                       | 默认          | 必填 | 约束                                                            |
| ------------------ | ------------------------------------------ | ------------- | :--: | --------------------------------------------------------------- |
| 值 `binding.value` | `boolean`（truthy / falsy）                | —             |  是  | `true` 渲染遮罩，`false` 移除遮罩                               |
| 参数 `binding.arg` | `'dual-ring' \| 'dot' \| 'ring' \| 'bars'` | `'dual-ring'` |  否  | 写法 `v-loading:dual-ring`；支持动态参数 `v-loading:[typeExpr]` |
| 修饰符             | —                                          | —             |  —   | 不支持任何修饰符                                                |

指令生命周期：宿主挂载且值为真时渲染遮罩；值变化时按真假渲染 / 移除；宿主卸载时移除遮罩。渲染时给宿主元素追加 `um-loading__container` 类（`position: relative`），移除时撤销，因此宿主无需自己写 `position: relative`。

## 典型示例

### 局部加载 + 动态参数切换动画

```vue
<script setup lang="ts">
import { shallowRef } from 'vue'
import { vLoading } from '@veltra/mobile'
import '@veltra/mobile/components/loading/style'

const loading = shallowRef(false)
const type = shallowRef<'dual-ring' | 'ring'>('dual-ring')

async function reload() {
  loading.value = true
  await new Promise((r) => setTimeout(r, 1500))
  loading.value = false
}
</script>

<template>
  <div v-loading:[type]="loading" style="height: 240px; border: 1px solid #eee">
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
import { vLoading } from '@veltra/mobile'
import '@veltra/mobile/components/loading/style'

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
  <div v-loading:dual-ring="fullscreenLoading" style="position: fixed; inset: 0; z-index: 2000" />
</template>
```

### ULoading 组件单独使用

```vue
<script setup lang="ts">
import { ULoading } from '@veltra/mobile'
import '@veltra/mobile/components/loading/style'
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
>
> - 移动端是具名导出 `vLoading`（模板写 `v-loading`），`@veltra/mobile` 没有插件 `install`，不会像桌面端那样经 `app.use` 全局注册指令；不导入 `vLoading` 时模板报指令解析错误。
> - 移动端动画尺寸固定（环 36px、点 9px、条 6px×10~26px），没有 `size` prop，也没有桌面端「全局配置统一切尺寸」的联动；`<ULoading size="large" />` 无效。
> - 本库加载指令没有 `text` 文案、spinner 自定义等配置项；`v-loading.config` 这类带修饰符的写法不支持。
> - 单独使用 `ULoading` 组件时禁止放在无 `position: relative` 的定位祖先之外，否则遮罩会相对最近的定位祖先铺满。
> - 遮罩与动画颜色依赖 `--u-*` 主题 token：入口必须调用 `@veltra/styles/theme` 的 `loadTheme()`，否则无颜色。
> - 移动端按需样式路径是 `@veltra/mobile/components/loading/style`，不是 `@veltra/desktop/components/loading/style`。

## 常见问题

### 写了 `v-loading` 但遮罩不出现

原因：`<script setup>` 中未导入 `vLoading`（移动端包不提供全局注册）。修复：

```vue
<script setup lang="ts">
import { vLoading } from '@veltra/mobile'
import '@veltra/mobile/components/loading/style'
</script>

<template>
  <div v-loading:dual-ring="true" style="height: 200px">内容</div>
</template>
```

### 遮罩只有一小条或撑不开

原因：宿主元素高度为 0 或内容塌陷。修复：给宿主元素设置明确高度（如 `style="height: 200px"`）。
