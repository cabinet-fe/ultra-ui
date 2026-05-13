# UGroupInput — 分组输入

> `import type { GroupInputProps, GroupInputEmits, GroupInputExposed } from '@veltra/desktop'`

动态分组输入组件。通过 `v-model` 绑定 `GroupItem[]` 数组，每条记录自动生成唯一 ID 并响应式追踪。支持增加、删除条目，可通过默认插槽自定义条目内容，也可通过 `itemStyle` 设定条目样式。`readonly` 模式下仅展示纯文本，`creatable` 模式下空列表显示「新增」按钮。`size`、`disabled`、`readonly` 在表单上下文（`UForm`）中会自动继承。

组件使用 `generic="GroupItem extends Record<string, any>"`，可通过 `v-model` 的类型推导泛型参数。

## Import

```ts
// UGroupInput 由 Vite 自动导入，无需手动 import
```

## Props

| prop | type | default | 说明 |
|------|------|---------|------|
| `modelValue` | `GroupItem[]` | `[]` | 分组数据，通过 `v-model` 绑定 |
| `max` | `number` | — | 最大条目数，超出限制后无法新增 |
| `creatable` | `boolean` | `true` | 是否允许新建条目，关闭后隐藏 `+` 按钮 |
| `itemDefault` | `Record<string, any>` | — | 新建条目时的默认值，与已有数据合并 |
| `itemStyle` | `StyleValue` | — | 条目样式，作用于每个 `<li>` 元素，支持 CSS 字符串、CSS 对象、响应式样式 |
| `size` | `ComponentSize` | `'default'` | 尺寸（回退到表单上下文 → `'default'`） |
| `disabled` | `boolean` | `false` | 禁用（回退到表单上下文 → `false`），隐藏 `+` / `-` 操作按钮 |
| `readonly` | `boolean` | `false` | 只读（回退到表单上下文 → `false`），开启后隐藏操作按钮并以纯文本展示 |
| `label` | `string` | — | 表单标签文字 |
| `field` | `string` | — | 表单项字段 |
| `tips` | `string` | — | 表单控件内的提示信息 |
| `span` | `number \| 'full' \| { default: number \| 'full'; xs?: number \| 'full'; sm?: number \| 'full'; md?: number \| 'full'; lg?: number \| 'full'; xl?: number \| 'full' }` | — | 所占列大小 |

> `size`、`disabled`、`readonly` 在表单上下文（`UForm`）中会自动继承。`itemDefault` 用于设定新条目的初始字段结构，配合插槽渲染对应字段的输入控件。

## Emits

| event | 参数 | 说明 |
|-------|------|------|
| `update:modelValue` | `(value: GroupItem[])` | 条目增删或数据变更时触发 |

## Slots

| slot | 作用域 | 说明 |
|------|--------|------|
| `default` | `{ item: GroupItem; index: number }` | 自定义每个条目的渲染内容，`item` 为当前行的数据对象，`index` 为当前行索引 |

> 插槽内通常放置输入组件（如 `UInput`、`USelect` 等），通过 `v-model` 绑定 `item.xxx` 实现双向编辑。不提供插槽时只显示「新增」按钮（`creatable` 模式下）。

## Exposed

```ts
interface GroupInputExposed {}
```

当前无暴露属性或方法。

## Examples

### 基础用法

```vue
<script setup lang="ts">
import { ref } from 'vue'

interface User {
  name: string
  age: number
}

const users = ref<User[]>([])
</script>

<template>
  <u-group-input v-model="users">
    <template #default="{ item, index }">
      <u-input v-model="item.name" placeholder="姓名" />
      <u-number-input v-model="item.age" placeholder="年龄" :min="0" />
    </template>
  </u-group-input>
</template>
```

### 设置默认值与最大数量

```vue
<script setup lang="ts">
import { ref } from 'vue'

interface Tag {
  name: string
  color?: string
}

const tags = ref<Tag[]>([])
</script>

<template>
  <u-group-input
    v-model="tags"
    :max="5"
    :item-default="{ name: '', color: '#1677ff' }"
  >
    <template #default="{ item }">
      <u-input v-model="item.name" placeholder="标签名" />
      <u-color-picker v-model="item.color" />
    </template>
  </u-group-input>
</template>
```

### 自定义条目样式

```vue
<script setup lang="ts">
import { computed, ref } from 'vue'

interface Item {
  content: string
}

const items = ref<Item[]>([])

const itemStyle = computed(() => ({
  padding: '12px',
  border: '1px solid var(--u-border-color)',
  borderRadius: '6px',
  marginBottom: items.value.length > 3 ? '4px' : '12px'
}))
</script>

<template>
  <u-group-input v-model="items" :item-style="itemStyle">
    <template #default="{ item }">
      <u-input v-model="item.content" placeholder="内容" />
    </template>
  </u-group-input>
</template>
```

### 在 UForm 中使用

`size`、`disabled`、`readonly` 会从表单上下文继承。

```vue
<script setup lang="ts">
import { reactive } from 'vue'

interface OrderItem {
  name: string
  quantity: number
}

const form = reactive({
  items: [] as OrderItem[]
})

const rules = {
  items: [{ required: true, message: '请至少添加一个条目' }]
}
</script>

<template>
  <u-form :model="form" :rules="rules" label-width="80px">
    <u-group-input field="items" label="订单明细" :max="10" :item-default="{ name: '', quantity: 1 }">
      <template #default="{ item }">
        <u-input v-model="item.name" placeholder="商品名称" />
        <u-number-input v-model="item.quantity" :min="1" placeholder="数量" />
      </template>
    </u-group-input>
  </u-form>
</template>
```
