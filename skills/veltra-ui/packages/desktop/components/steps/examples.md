# USteps 示例

## 基础用法

```vue
<script setup lang="ts">
import { ref } from 'vue'

const current = ref(0)
const items = [{ label: '步骤一' }, { label: '步骤二' }, { label: '步骤三' }]
</script>

<template>
  <u-steps v-model:current="current" :items="items" />
</template>
```

## 垂直方向 + 自定义颜色

```vue
<template>
  <u-steps
    v-model:current="current"
    :items="items"
    direction="vertical"
    current-step-type="warning"
    finished-step-type="primary"
  />
</template>
```

## 通过 currentKey 匹配步骤

```vue
<script setup lang="ts">
const current = ref('review')
const items = [
  { name: '填写信息', key: 'info' },
  { name: '审核中', key: 'review' },
  { name: '完成', key: 'done' }
]
</script>

<template>
  <u-steps v-model:current="current" :items="items" label-key="name" current-key="key" />
</template>
```

## 自定义插槽

```vue
<template>
  <u-steps v-model:current="current" :items="items">
    <template #icon="{ item, index }">
      <u-icon>
        <component :is="item.icon" />
      </u-icon>
    </template>
    <template #content="{ item }">
      <strong>{{ item.label }}</strong>
      <small>{{ item.desc }}</small>
    </template>
    <template #tip="{ item }">
      {{ item.help }}
    </template>
  </u-steps>
</template>
```
