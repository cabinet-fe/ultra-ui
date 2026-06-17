# UButton 示例

## 颜色 / 尺寸 / 模式

```vue
<u-button>默认</u-button>
<u-button type="primary">主要</u-button>
<u-button type="success">成功</u-button>
<u-button type="warning">警告</u-button>
<u-button type="danger">危险</u-button>

<u-button size="small" type="primary">小</u-button>
<u-button size="large" type="primary">大</u-button>

<u-button plain type="primary">朴素</u-button>
<u-button text type="success">文本</u-button>
<u-button loading type="primary">加载中</u-button>
<u-button disabled type="danger">禁用</u-button>
```

## 图标 / 圆形 / 自定义加载图标

```vue
<script setup>
import { Search, Edit, Refresh } from '@veltra/icons/normal'
</script>

<template>
  <u-button type="primary" :icon="Search">搜索</u-button>
  <u-button type="primary" :icon="Search" icon-position="right">搜索</u-button>
  <u-button type="primary" circle :icon="Edit" />
  <u-button loading type="primary" :loading-icon="Refresh">刷新</u-button>
</template>
```

## 阻止冒泡 / 获取 DOM

```vue
<script setup lang="ts">
import { useTemplateRef } from 'vue'

const btnRef = useTemplateRef('btn')
// btnRef.value?.el → HTMLButtonElement
</script>

<template>
  <div @click="handleOuter">
    <u-button ref="btn" type="primary" :propagate="false" @click="handleClick">
      不冒泡到外层
    </u-button>
  </div>
</template>
```

## UButtonGroup — 统一 props 透传

```vue
<u-button-group v-slot="{ props }" size="small" disabled>
  <u-button v-bind="props" type="primary">剪切</u-button>
  <u-button v-bind="props" type="primary">复制</u-button>
  <u-button v-bind="props" type="primary">粘贴</u-button>
</u-button-group>
```

## UButtonGroup — 统一 props 透传（续）

```vue
<script setup>
import { shallowRef } from 'vue'
import { bem } from '@veltra/utils'

const buttons = [
  { type: 'primary' as const, text: '选项一' },
  { type: 'primary' as const, text: '选项二' }
]
const active = shallowRef(0)
const cls = bem('button')
</script>

<template>
  <u-button-group v-slot="{ props }">
    <u-button
      v-for="(btn, i) in buttons"
      :key="i"
      v-bind="props"
      :class="cls.is('active', i === active)"
      @click="active = i"
    >
      {{ btn.text }}
    </u-button>
  </u-button-group>
</template>
```
