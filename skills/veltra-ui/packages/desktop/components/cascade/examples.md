# UCascade 示例

## 基础单选

```vue
<script setup lang="ts">
import { ref } from 'vue'

const value = ref<string>()
const options = [
  {
    value: '1',
    label: '北京',
    children: [
      { value: '11', label: '朝阳区' },
      { value: '12', label: '海淀区' }
    ]
  },
  {
    value: '2',
    label: '上海',
    children: [
      { value: '21', label: '浦东新区' },
      { value: '22', label: '徐汇区' }
    ]
  }
]
</script>

<template>
  <u-cascade v-model="value" :data="options" />
</template>
```

## 多选模式

```vue
<script setup lang="ts">
import { ref } from 'vue'

const value = ref<string[]>([])

const options = [
  {
    value: '1',
    label: '技术部',
    children: [
      { value: '11', label: '前端组' },
      { value: '12', label: '后端组' }
    ]
  },
  {
    value: '2',
    label: '产品部',
    children: [
      { value: '21', label: '移动端' },
      { value: '22', label: 'PC 端' }
    ]
  }
]
</script>

<template>
  <u-cascade v-model="value" :data="options" multiple />
</template>
```

## 搜索过滤

```vue
<template>
  <u-cascade v-model="value" :data="options" filterable placeholder="搜索地区" />
</template>
```

## 严格模式 + 自定义字段

```vue
<template>
  <u-cascade
    v-model="value"
    :data="data"
    strict
    label-key="name"
    value-key="id"
    children-key="subs"
  />
</template>
```

## 仅绑定叶子节点

默认 `show-full-path` 为 `true`（显示与 `modelValue` 均为完整路径，用 `separator` 拼接）；设为 `false` 时显示、`modelValue`、`update:label` 均只体现叶子节点。

```vue
<script setup lang="ts">
import { ref } from 'vue'

const leaf = ref<string>()
const options = [
  {
    value: '1',
    label: '北京',
    children: [
      { value: '11', label: '朝阳区' },
      { value: '12', label: '海淀区' }
    ]
  }
]
</script>

<template>
  <u-cascade v-model="leaf" :data="options" :show-full-path="false" />
</template>
```
