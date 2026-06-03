# UList 示例

## 基础用法

```vue
<script setup lang="ts">
import { ref } from 'vue'

const items = ref([
  { id: 1, name: '张三' },
  { id: 2, name: '李四' },
  { id: 3, name: '王五' }
])
</script>

<template>
  <u-list :data="items" v-slot="{ item }">
    <div>{{ item.name }}</div>
  </u-list>
</template>
```

## 不同尺寸

```vue
<template>
  <u-list size="small" :data="items" v-slot="{ item }">
    <div>{{ item.name }}</div>
  </u-list>

  <u-list size="default" :data="items" v-slot="{ item }">
    <div>{{ item.name }}</div>
  </u-list>

  <u-list size="large" :data="items" v-slot="{ item }">
    <div>{{ item.name }}</div>
  </u-list>
</template>
```

## 使用 index 控制样式

```vue
<script setup lang="ts">
import { ref } from 'vue'

const items = ref([{ label: '第一项' }, { label: '第二项' }, { label: '第三项' }])
</script>

<template>
  <u-list :data="items" v-slot="{ item, index }">
    <div :style="{ background: index % 2 === 0 ? '#f5f5f5' : '#fff' }">
      {{ index + 1 }}. {{ item.label }}
    </div>
  </u-list>
</template>
```
