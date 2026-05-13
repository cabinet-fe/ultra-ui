# ULoading — 加载

> `import type { LoadingProps, LoadingEmits, LoadingExposed } from '@veltra/desktop'`

提供四种加载动画的组件和指令，尺寸可通过 `UConfig` 全局配置或逐级继承。

## Import

```ts
import { ULoading, vLoading } from '@veltra/desktop'
```

## Props

| prop | type | default | 说明 |
|------|------|---------|------|
| `type` | `'classic' \| 'line' \| 'dot' \| 'spinner'` | `'spinner'` | 加载动画类型 |

`size` 通过 `useFallbackProps` 从 `UConfig` 继承，默认为 `'default'`，无需手动传入。

## Emits

| emit | payload | 说明 |
|------|---------|------|
| `update:modelValue` | `(value: string)` | modelValue 更新时触发 |

## Slots

无插槽。

## Exposed

| 成员 | 类型 | 说明 |
|------|------|------|
| — | — | 无暴露成员 |

---

## vLoading 指令

在目标元素上渲染全屏加载遮罩，加载期间阻止用户交互。

```vue
<div v-loading:[type]="loading">
  <!-- 内容区域 -->
</div>
```

- `loading`: `boolean` — 是否显示加载遮罩
- `type`（可选 argument）: `'classic' | 'line' | 'dot' | 'spinner'` — 指定动画类型

## Examples

### 四种动画类型

```vue
<template>
  <u-loading type="classic" />
  <u-loading type="line" />
  <u-loading type="dot" />
  <u-loading type="spinner" />
</template>
```

### 通过 UConfig 统一控制尺寸

```vue
<script setup>
import { UConfig, ULoading } from '@veltra/desktop'
</script>

<template>
  <u-config size="small">
    <u-loading />
  </u-config>

  <u-config size="default">
    <u-loading />
  </u-config>

  <u-config size="large">
    <u-loading />
  </u-config>
</template>
```

### 指令遮罩用法

```vue
<script setup lang="ts">
import { shallowRef } from 'vue'
import { vLoading } from '@veltra/desktop'

const loading = shallowRef(false)
const loadType = shallowRef<'spinner' | 'line'>('spinner')

const fetchData = async () => {
  loading.value = true
  await new Promise(r => setTimeout(r, 2000))
  loading.value = false
}
</script>

<template>
  <div
    v-loading:[loadType]="loading"
    style="height: 200px; border: 1px solid #eee;"
  >
    <p>内容区域，加载时显示半透明遮罩</p>
  </div>
  <u-button type="primary" @click="fetchData">重新加载</u-button>
</template>
```

### 全屏加载

```vue
<script setup lang="ts">
import { shallowRef } from 'vue'
import { vLoading } from '@veltra/desktop'

const fullscreenLoading = shallowRef(false)

const loadAll = async () => {
  fullscreenLoading.value = true
  await new Promise(r => setTimeout(r, 3000))
  fullscreenLoading.value = false
}
</script>

<template>
  <u-button type="primary" @click="loadAll">全屏加载</u-button>
  <div
    v-loading:spinner="fullscreenLoading"
    style="position: fixed; inset: 0; z-index: 2000; pointer-events: none;"
  />
</template>
```
