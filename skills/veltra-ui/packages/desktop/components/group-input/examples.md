# UGroupInput 示例

## 基础用法

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

## 设置默认值与最大数量

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
  <u-group-input v-model="tags" :max="5" :item-default="{ name: '', color: '#1677ff' }">
    <template #default="{ item }">
      <u-input v-model="item.name" placeholder="标签名" />
      <u-color-picker v-model="item.color" />
    </template>
  </u-group-input>
</template>
```

## 自定义条目样式

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

## 在 UForm 中使用

```vue
<script setup lang="ts">
import { reactive } from 'vue'

interface OrderItem {
  name: string
  quantity: number
}

const form = reactive({ items: [] as OrderItem[] })

const rules = { items: [{ required: true, message: '请至少添加一个条目' }] }
</script>

<template>
  <u-form :model="form" :rules="rules" label-width="80px">
    <u-group-input
      field="items"
      label="订单明细"
      :max="10"
      :item-default="{ name: '', quantity: 1 }"
    >
      <template #default="{ item }">
        <u-input v-model="item.name" placeholder="商品名称" />
        <u-number-input v-model="item.quantity" :min="1" placeholder="数量" />
      </template>
    </u-group-input>
  </u-form>
</template>
```
