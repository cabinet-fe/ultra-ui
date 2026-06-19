# ULoading 示例

## 四种动画类型

```vue
<template>
  <u-loading type="dual-ring" />
  <u-loading type="dot" />
  <u-loading type="ring" />
  <u-loading type="bars" />
</template>
```

## 通过 UConfig 统一控制尺寸

```vue
<script setup>
// UConfig、ULoading 由 Vite 自动导入，无需手动 import
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

## 指令遮罩用法

```vue
<script setup lang="ts">
import { shallowRef } from 'vue'
import { vLoading } from '@veltra/desktop'

const loading = shallowRef(false)
const loadType = shallowRef<'dual-ring' | 'ring'>('dual-ring')

const fetchData = async () => {
  loading.value = true
  await new Promise((r) => setTimeout(r, 2000))
  loading.value = false
}
</script>

<template>
  <div v-loading:[loadType]="loading" style="height: 200px; border: 1px solid #eee;">
    <p>内容区域，加载时显示半透明遮罩</p>
  </div>
  <u-button type="primary" @click="fetchData">重新加载</u-button>
</template>
```

## 全屏加载

```vue
<script setup lang="ts">
import { shallowRef } from 'vue'
import { vLoading } from '@veltra/desktop'

const fullscreenLoading = shallowRef(false)

const loadAll = async () => {
  fullscreenLoading.value = true
  await new Promise((r) => setTimeout(r, 3000))
  fullscreenLoading.value = false
}
</script>

<template>
  <u-button type="primary" @click="loadAll">全屏加载</u-button>
  <div
    v-loading:dual-ring="fullscreenLoading"
    style="position: fixed; inset: 0; z-index: 2000; pointer-events: none;"
  />
</template>
```
