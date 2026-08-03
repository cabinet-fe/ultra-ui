# USelect 示例

## 基础用法

```vue
<script setup lang="ts">
import { shallowRef } from 'vue'

const city = shallowRef('')

const cities = [
  { label: '北京', value: 'beijing' },
  { label: '上海', value: 'shanghai' },
  { label: '广州', value: 'guangzhou' }
]
</script>

<template>
  <u-select v-model="city" :options="cities" placeholder="请选择城市" />
</template>
```

## 可搜索 + 可创建 + 自定义字段

```vue
<script setup lang="ts">
import { shallowRef } from 'vue'

const selected = shallowRef()

const users = [
  { name: '张三', id: 1 },
  { name: '李四', id: 2 }
]
</script>

<template>
  <u-select
    v-model="selected"
    :options="users"
    value-key="id"
    label-key="name"
    filterable
    creatable
    placeholder="选择或输入创建"
  />
</template>
```

## 异步远程搜索

```vue
<script setup lang="ts">
import { shallowRef } from 'vue'

const product = shallowRef()

async function searchProducts(qs: string) {
  if (!qs) return []
  const res = await fetch(`/api/products?q=${qs}`)
  return res.json()
}
</script>

<template>
  <u-select
    v-model="product"
    value-key="id"
    label-key="name"
    :options="searchProducts"
    placeholder="搜索产品..."
  />
</template>
```

## 网格布局 + 自定义渲染

```vue
<script setup lang="ts">
import { shallowRef } from 'vue'

const color = shallowRef()

const colorOptions = [
  { label: '红色', value: 'red' },
  { label: '蓝色', value: 'blue' },
  { label: '绿色', value: 'green' },
  { label: '黄色', value: 'yellow' },
  { label: '紫色', value: 'purple' },
  { label: '橙色', value: 'orange' }
]
</script>

<template>
  <u-select v-model="color" :options="colorOptions" :grid="{ cols: 3, gap: 8 }">
    <template #default="{ option }">
      <div style="text-align: center">
        <div
          :style="{ width: '24px', height: '24px', background: option?.value, margin: '0 auto' }"
        />
        <div>{{ option?.label }}</div>
      </div>
    </template>
  </u-select>
</template>
```

## 在 UForm 中使用

> 表单内用 `field` 绑 `model`，勿再写 `v-model`；无 `field` 时 `label` 不生效。

```vue
<script setup lang="ts">
import { reactive } from 'vue'

const formData = reactive({ grade: '' })

const gradeList = [
  { label: '一年级', value: 1 },
  { label: '二年级', value: 2 },
  { label: '三年级', value: 3 }
]
</script>

<template>
  <u-form :model="formData">
    <u-select label="年级" field="grade" :options="gradeList" />
  </u-form>
</template>
```

## 同步冗余文案（@update:text）

```vue
<script setup lang="ts">
import { reactive } from 'vue'

// 展示由 options 推导；父级用事件写冗余 text，勿再 v-model:text
const form = reactive({ code: 'beijing', text: '旧文案' })

const dictOptions = [
  { label: '北京（最新）', value: 'beijing' },
  { label: '上海（最新）', value: 'shanghai' }
]
</script>

<template>
  <u-select v-model="form.code" :options="dictOptions" @update:text="form.text = $event" />
</template>
```
