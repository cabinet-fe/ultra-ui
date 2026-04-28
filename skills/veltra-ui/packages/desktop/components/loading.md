# ULoading — 加载指示器

> `import type { LoadingProps } from '@veltra/desktop'`

支持四种加载动画类型的组件和指令。

## Import

```ts
import { ULoading } from '@veltra/desktop'
// 指令
import { vLoading } from '@veltra/desktop'
```

## Props

| prop | type | default | 说明 |
|------|------|---------|------|
| `type` | `'classic'` \| `'line'` \| `'dot'` \| `'spinner'` | `'spinner'` | 动画类型 |
| `size` | `ComponentSize` | `'default'` | 尺寸 |

## v-loading 指令

```vue
<div v-loading:[type]="isLoading">
  <!-- 内容区域，加载时显示半透明遮罩 -->
</div>
```

- `isLoading`: `boolean` — 是否显示加载遮罩
- `type`: 可选参数，指定动画类型

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

### 不同尺寸

```vue
<template>
  <u-loading size="small" />
  <u-loading />  <!-- default -->
  <u-loading size="large" />
</template>
```

### 指令遮罩用法

```vue
<script setup>
import { shallowRef } from 'vue'
import { vLoading } from '@veltra/desktop'

const loading = shallowRef(true)
const loadType = shallowRef<'spinner' | 'line'>('spinner')

const fetchData = async () => {
  loading.value = true
  await new Promise(r => setTimeout(r, 2000))
  loading.value = false
}
</script>

<template>
  <div v-loading:[loadType]="loading" style="height: 200px; border: 1px solid #eee;">
    <p>内容区域</p>
  </div>
  <u-button @click="fetchData">重新加载</u-button>
</template>
```
