# UInput 示例

## 基础用法

```vue
<script setup>
import { shallowRef } from 'vue'
const keyword = shallowRef('')
</script>

<template>
  <u-input v-model="keyword" placeholder="请输入关键词" />
</template>
```

## 前后缀图标

```vue
<script setup>
import { shallowRef } from 'vue'
import { Search } from '@veltra/icons/normal'

const keyword = shallowRef('')
function handleSearch() {
  console.log('搜索:', keyword.value)
}
</script>

<template>
  <u-input v-model="keyword" placeholder="搜索" @suffix:click="handleSearch">
    <template #suffix>
      <u-icon :size="16"><Search /></u-icon>
    </template>
  </u-input>
</template>
```

## 输入防呆（pattern）

```vue
<script setup>
import { shallowRef } from 'vue'
const phone = shallowRef('')
</script>

<template>
  <u-input v-model="phone" placeholder="手机号" :pattern="/^\d*$/" />
</template>
```

## 在 UForm 中使用

```vue
<script setup>
import { reactive } from 'vue'

const formData = reactive({ username: '' })
</script>

<template>
  <u-form :model="formData">
    <u-input
      label="用户名"
      field="username"
      placeholder="请输入用户名"
      :rules="{ required: true }"
    />
  </u-form>
</template>
```
