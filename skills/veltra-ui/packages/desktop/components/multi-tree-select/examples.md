# UMultiTreeSelect 示例

## 基础用法

```vue
<script setup lang="ts">
import { ref } from 'vue'

const selected = ref<(string | number)[]>([])

const treeData = [
  {
    label: '亚洲',
    value: 'asia',
    children: [
      { label: '中国', value: 'cn' },
      { label: '日本', value: 'jp' },
      { label: '韩国', value: 'kr' }
    ]
  },
  {
    label: '欧洲',
    value: 'europe',
    children: [
      { label: '英国', value: 'uk' },
      { label: '法国', value: 'fr' }
    ]
  }
]
</script>

<template>
  <u-multi-tree-select v-model="selected" :data="treeData" />
</template>
```

## 带搜索与清空

```vue
<template>
  <u-multi-tree-select
    v-model="selected"
    :data="treeData"
    filterable
    clearable
    placeholder="搜索并选择地区"
    @change="(checked) => console.log('已选:', checked)"
    @clear="() => console.log('已清空')"
  />
</template>
```

## 严格选择模式

```vue
<template>
  <u-multi-tree-select
    v-model="selected"
    :data="treeData"
    check-strictly
    :expand-all="true"
    :visibility-limit="5"
  />
</template>
```

## 禁用与只读

```vue
<template>
  <!-- 禁用：不可交互，不可删除标签 -->
  <u-multi-tree-select v-model="selected" :data="treeData" disabled />

  <!-- 只读：仅展示已选标签列表，无下拉交互 -->
  <u-multi-tree-select v-model="selected" :data="treeData" readonly />
</template>
```
