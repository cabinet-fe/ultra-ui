# UTreeSelect 示例

## 基础

```vue
<script setup lang="ts">
import { shallowRef } from 'vue'

const selected = shallowRef<string>()
const treeData = [
  {
    label: '北京',
    value: 'beijing',
    children: [
      { label: '朝阳区', value: 'chaoyang' },
      { label: '海淀区', value: 'haidian' }
    ]
  },
  { label: '上海', value: 'shanghai', children: [{ label: '浦东新区', value: 'pudong' }] }
]
</script>

<template>
  <u-tree-select v-model="selected" :data="treeData" placeholder="请选择地区" />
</template>
```

## 可搜索 + 自定义字段名 + 禁用节点

```vue
<script setup lang="ts">
import { shallowRef } from 'vue'

const deptId = shallowRef<number>()
const departments = [
  {
    name: '技术部',
    id: 1,
    subs: [
      { name: '前端组', id: 11 },
      { name: '后端组', id: 12, disabled: true }
    ]
  }
]
</script>

<template>
  <u-tree-select
    v-model="deptId"
    :data="departments"
    label-key="name"
    value-key="id"
    children-key="subs"
    filterable
    :disabled-node="(item) => item.disabled === true"
    placeholder="搜索部门"
  />
</template>
```

## 在 UForm 中使用

```vue
<script setup lang="ts">
import { reactive } from 'vue'

const formData = reactive({ region: '' })
const regionData = [
  { label: '华东', value: 'east', children: [{ label: '上海', value: 'sh' }] },
  { label: '华南', value: 'south', children: [{ label: '广州', value: 'gz' }] }
]
</script>

<template>
  <u-form :model="formData">
    <u-tree-select label="地区" field="region" :data="regionData" />
  </u-form>
</template>
```
