# UAction 示例

## 基础操作组

```vue
<u-action-group :max="4">
  <u-action @run="handleView">查看</u-action>
  <u-action @run="handleEdit">编辑</u-action>
  <u-action need-confirm type="danger" @run="handleDelete">删除</u-action>
</u-action-group>
```

## 统一默认样式 + 单独覆盖

```vue
<u-action-group type="info" size="default" :text="false">
  <u-action @run="handleCopy">复制</u-action>
  <u-action @run="handlePaste">粘贴</u-action>
  <!-- 覆盖组默认值 -->
  <u-action type="danger" @run="handleRemove">移除</u-action>
</u-action-group>
```

## 在表格操作列中使用

```vue
<u-table :columns="columns" :data="data" row-key="id">
  <template #column:action="{ row }">
    <u-action-group :max="3">
      <u-action @run="handleEdit(row)">编辑</u-action>
      <u-action @run="handleDetail(row)">详情</u-action>
      <u-action need-confirm type="danger" @run="handleDelete(row)">删除</u-action>
      <u-action @run="handleCopy(row)">复制</u-action>
    </u-action-group>
  </template>
</u-table>

<script setup>
import { defineTableColumns } from '@veltra/desktop'

const columns = defineTableColumns([
  { key: 'name', name: '名称' },
  { key: 'action', name: '操作', width: 200, align: 'center' }
])
</script>
```

## 始终在下拉菜单 + 圆形图标（`@veltra/icons`）

```vue
<u-action-group circle>
  <u-action type="primary" :icon="Edit" @run="handleEdit">
    {{ '' }}
  </u-action>
  <!-- in-dropdown 强制收纳到下拉，方便在紧凑场景隐藏次常用操作 -->
  <u-action type="danger" :icon="Delete" in-dropdown @run="handleDelete">
    {{ '' }}
  </u-action>
</u-action-group>
```

## 手动关闭下拉菜单

```vue
<script setup lang="ts">
import { useTemplateRef } from 'vue'

const groupRef = useTemplateRef('group')

const handleRun = () => {
  // ... 执行操作后关闭下拉
  groupRef.value?.closeTip()
}
</script>

<template>
  <u-action-group ref="group" :max="2">
    <u-action @run="handleRun">操作一</u-action>
    <u-action @run="handleRun">操作二</u-action>
    <u-action @run="handleRun">操作三</u-action>
  </u-action-group>
</template>
```
