# UTable 示例

## 列宽

叶子列默认 `minWidth` 为 100；`width` 不能小于 `minWidth`。`fixed` 且未设 `width` 的列只按 `minWidth` 占位、不参与剩余宽度均分。

```ts
import { defineTableColumns } from '@veltra/desktop'

const columns = defineTableColumns([
  // 窄列需同时设 minWidth；fixed 列建议显式 width
  { key: 'name', name: '姓名', width: 60, minWidth: 60, fixed: 'left' },
  { key: 'age', name: '年龄', width: 80, minWidth: 80, align: 'center' },
  { key: 'address', name: '地址', minWidth: 200 }
])
```

## 基础 + 多选

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { defineTableColumns } from '@veltra/desktop'

const checked = ref<any[]>([])
const columns = defineTableColumns(
  [
    { key: 'name', name: '姓名', width: 120 },
    { key: 'age', name: '年龄', width: 80, minWidth: 80, align: 'center' },
    { key: 'address', name: '地址', minWidth: 200 }
  ],
  { align: 'center' }
)

const data = [
  { id: 1, name: '张三', age: 28, address: '北京市海淀区' },
  { id: 2, name: '李四', age: 32, address: '上海市浦东新区' },
  { id: 3, name: '王五', age: 25, address: '广州市天河区' }
]
</script>

<template>
  <u-table
    checkable
    row-key="id"
    :columns="columns"
    :data="data"
    v-model:checked="checked"
    border
    stripe
  />
</template>
```

## 列插槽

列插槽统一命名为 `#column:{key}`，可以拿到当前行数据进行自定义渲染。和自定义列渲染函数相比，更推荐使用列插槽，因为更匹配 Vue 单文件的开发习惯，同时还能应用组件自动导入插件，减少引入其它组件的麻烦。

```vue
<script setup lang="ts">
import { defineTableColumns } from '@veltra/desktop'

const columns = defineTableColumns([
  { key: 'name', name: '名称', minWidth: 150 },
  { key: 'action', name: '操作', width: 200, align: 'center' }
])

const data = [
  { id: 1, name: '示例数据 A' },
  { id: 2, name: '示例数据 B' }
]

function handleEdit(row: Record<string, any>) {
  console.log('编辑:', row)
}

function handleDelete(row: Record<string, any>) {
  console.log('删除:', row)
}
</script>

<template>
  <u-table :columns="columns" :data="data" row-key="id" border>
    <template #column:action="{ rowData }">
      <u-action-group :max="4">
        <u-action @run="handleEdit(rowData)">编辑</u-action>
        <u-action need-confirm type="danger" @run="handleDelete(rowData)">删除</u-action>
      </u-action-group>
    </template>
  </u-table>
</template>
```

## 自定义列渲染函数

```vue
<script setup lang="ts">
import { h } from 'vue'
import { UTag } from '@veltra/desktop'
import type { TableColumn } from '@veltra/desktop'

const columns: TableColumn[] = [
  { key: 'name', name: '名称', minWidth: 150 },
  {
    key: 'status',
    name: '状态',
    width: 100,
    align: 'center',
    render: ({ val }) =>
      h(UTag, { type: val === 1 ? 'success' : 'danger' }, () => (val === 1 ? '启用' : '禁用'))
  },
  { key: 'createTime', name: '创建时间', width: 180 }
]

const data = [
  { id: 1, name: '示例数据 A', status: 1, createTime: '2026-08-01 10:00:00' },
  { id: 2, name: '示例数据 B', status: 0, createTime: '2026-08-02 11:00:00' }
]
</script>

<template>
  <u-table :columns="columns" :data="data" border />
</template>
```

## 树形表格

```vue
<script setup lang="ts">
import { defineTableColumns } from '@veltra/desktop'

const columns = defineTableColumns([
  { key: 'name', name: '名称' },
  { key: 'size', name: '大小', width: 100, align: 'right' }
])

// tree=true 用 children；tree="subItems" 自定义子节点字段名
const data = [
  {
    id: 1,
    name: 'src',
    children: [
      { id: 2, name: 'components', children: [{ id: 3, name: 'Button.vue', size: '3.2 KB' }] }
    ]
  }
]
</script>

<template>
  <u-table tree :columns="columns" :data="data" border />
</template>
```

## 行展开 + 表尾合计

```vue
<script setup lang="ts">
import { defineTableColumns } from '@veltra/desktop'

const columns = defineTableColumns([
  { key: 'name', name: '商品', minWidth: 150 },
  { key: 'price', name: '单价', width: 100, align: 'right', summary: true },
  { key: 'quantity', name: '数量', width: 80, minWidth: 80, align: 'center' },
  {
    key: 'total',
    name: '金额',
    width: 120,
    align: 'right',
    render: ({ rowData }) => `¥${(rowData.price * rowData.quantity).toFixed(2)}`,
    summary: (ctx) => {
      const sum = ctx.rows.reduce((s, r) => s + (r.data as any).price * (r.data as any).quantity, 0)
      return `¥${sum.toFixed(2)}`
    }
  }
])

const data = [
  { id: 1, name: '商品 A', price: 12.5, quantity: 3 },
  { id: 2, name: '商品 B', price: 9.9, quantity: 5 }
]
</script>

<template>
  <u-table expandable :columns="columns" :data="data" row-key="id" border>
    <template #row:expand="{ rowData }">
      <div style="padding: 16px 24px">
        <p>商品详情：{{ rowData.name }}</p>
      </div>
    </template>
  </u-table>
</template>
```

## 多级表头 + 单元格合并

```vue
<script setup lang="ts">
import type { TableColumn, TableColumnRenderContext } from '@veltra/desktop'

// 多级表头：用 children 嵌套
const columns: TableColumn[] = [
  { key: 'category', name: '类别', width: 100 },
  {
    key: 'name',
    name: '基本信息',
    align: 'center',
    children: [
      { key: 'firstName', name: '名', minWidth: 100 },
      { key: 'lastName', name: '姓', minWidth: 100 }
    ]
  },
  {
    key: 'contact',
    name: '联系方式',
    align: 'center',
    children: [
      { key: 'email', name: '邮箱', minWidth: 200 },
      { key: 'phone', name: '电话', width: 140 }
    ]
  }
]

const data = [
  { id: 1, category: '研发', firstName: '三', lastName: '张', email: 'zhangsan@example.com', phone: '13800000001' },
  { id: 2, category: '研发', firstName: '四', lastName: '李', email: 'lisi@example.com', phone: '13800000002' },
  { id: 3, category: '设计', firstName: '五', lastName: '王', email: 'wangwu@example.com', phone: '13800000003' },
  { id: 4, category: '设计', firstName: '六', lastName: '赵', email: 'zhaoliu@example.com', phone: '13800000004' }
]

// 合并单元格
function mergeCell(ctx: TableColumnRenderContext) {
  if (ctx.column.key === 'category' && ctx.row.index % 2 === 0) {
    return { rowspan: 2, colspan: 1 }
  }
}
</script>

<template>
  <u-table :columns="columns" :data="data" :merge-cell="mergeCell" border />
</template>
```

## 配合 UPaginator 分页

```vue
<script setup lang="ts">
import { ref, computed } from 'vue'
import { defineTableColumns } from '@veltra/desktop'

const allData = ref(Array.from({ length: 100 }, (_, i) => ({ id: i + 1, name: `条目 ${i + 1}` })))
const pageNumber = ref(1)
const pageSize = ref(10)
const pagedData = computed(() => {
  const start = (pageNumber.value - 1) * pageSize.value
  return allData.value.slice(start, start + pageSize.value)
})

const columns = defineTableColumns([{ key: 'name', name: '名称', minWidth: 150 }])
</script>

<template>
  <u-table :columns="columns" :data="pagedData" row-key="id" border stripe />
  <u-paginator
    v-model:page-number="pageNumber"
    v-model:page-size="pageSize"
    :total="allData.length"
    :page-size-options="[10, 20, 50]"
  />
</template>
```

## 虚拟滚动（大数据）

```vue
<script setup lang="ts">
import { defineTableColumns } from '@veltra/desktop'

const columns = defineTableColumns([{ key: 'name', name: '名称', minWidth: 150 }])
const data = Array.from({ length: 10000 }, (_, i) => ({ id: i + 1, name: `行 ${i + 1}` }))
</script>

<template>
  <u-table
    :columns="columns"
    :data="data"
    row-key="id"
    :virtual-threshold="50"
    border
    stripe
    style="height: 500px"
  />
</template>
```
