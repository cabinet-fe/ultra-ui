# UMultiSelect 示例

## 基础多选

```vue
<template>
  <u-multi-select v-model="selected" :options="cities" placeholder="请选择城市" />
</template>

<script setup lang="ts">
import { ref } from 'vue'

const selected = ref([])
const cities = [
  { label: '北京', value: 'beijing' },
  { label: '上海', value: 'shanghai' },
  { label: '广州', value: 'guangzhou' },
  { label: '深圳', value: 'shenzhen' },
  { label: '杭州', value: 'hangzhou' }
]
</script>
```

## 带搜索、限制数量、自定义选项内容

```vue
<template>
  <u-multi-select v-model="users" :options="userList" filterable :max="3" :visibility-limit="2">
    <template #default="{ option }">
      <div class="user-option">
        <img :src="option.avatar" class="user-avatar" />
        <span>{{ option.label }}</span>
      </div>
    </template>
  </u-multi-select>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const users = ref([])
const userList = [
  { label: '张三', value: '1', avatar: '/avatars/1.png' },
  { label: '李四', value: '2', avatar: '/avatars/2.png' },
  { label: '王五', value: '3', avatar: '/avatars/3.png' },
  { label: '赵六', value: '4', avatar: '/avatars/4.png' },
  { label: '孙七', value: '5', avatar: '/avatars/5.png' }
]
</script>
```

## 远程搜索 + 可创建

```vue
<template>
  <u-multi-select
    v-model="tags"
    :options="remoteSearch"
    creatable
    label-key="name"
    value-key="id"
    placeholder="搜索或创建标签"
  />
</template>

<script setup lang="ts">
import { ref } from 'vue'

const tags = ref([])

async function remoteSearch(qs: string) {
  if (!qs) return []
  const res = await fetch(`/api/tags?q=${qs}`)
  return res.json()
}
</script>
```

## 禁用 / 只读状态

```vue
<template>
  <u-multi-select v-model="selected" :options="items" disabled />

  <u-multi-select v-model="selected" :options="items" readonly />
</template>

<script setup lang="ts">
import { ref } from 'vue'

const selected = ref([
  { label: '选项一', value: 1 },
  { label: '选项二', value: 2 }
])
const items = [
  { label: '选项一', value: 1 },
  { label: '选项二', value: 2 },
  { label: '选项三', value: 3 }
]
</script>
```
