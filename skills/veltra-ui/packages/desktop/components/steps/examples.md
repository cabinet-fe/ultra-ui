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
<script setup>
import { ref } from 'vue'

const current = ref(0)
const items = [{ label: '步骤一' }, { label: '步骤二' }, { label: '步骤三' }]
</script>

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
import { ref } from 'vue'

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
<script setup>
import { ref } from 'vue'
import { Edit, Loading, Check } from '@veltra/icons/normal'

const current = ref(0)
const items = [
  { label: '填写信息', desc: '填写基础信息', help: '预计 2 分钟', icon: Edit },
  { label: '审核中', desc: '等待管理员审核', help: '预计 1 个工作日', icon: Loading },
  { label: '完成', desc: '流程全部结束', help: '无需操作', icon: Check }
]
</script>

<template>
  <u-steps v-model:current="current" :items="items">
    <template #icon="{ item }">
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
