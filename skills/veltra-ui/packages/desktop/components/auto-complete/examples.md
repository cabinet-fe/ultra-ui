# UAutoComplete 示例

## 基础用法

```vue
<script setup lang="ts">
import { ref } from 'vue'

const query = ref('')
const fruits = ['Apple', 'Banana', 'Cherry', 'Durian', 'Grape', 'Mango', 'Orange', 'Peach']
</script>

<template>
  <u-auto-complete v-model="query" :suggestions="fruits" placeholder="输入水果名称" />
</template>
```

## 异步建议

```vue
<script setup lang="ts">
import { ref } from 'vue'

const query = ref('')

async function fetchSuggestions(keyword?: string): Promise<string[]> {
  if (!keyword) return []
  const res = await fetch(`/api/search?q=${encodeURIComponent(keyword)}`)
  return res.json()
}
</script>

<template>
  <u-auto-complete v-model="query" :suggestions="fetchSuggestions" placeholder="搜索..." />
</template>
```

## 自定义选项模板

```vue
<script setup lang="ts">
import { ref } from 'vue'

const query = ref('')
const users = ['Alice', 'Bob', 'Charlie', 'Diana']
</script>

<template>
  <u-auto-complete v-model="query" :suggestions="users">
    <template #default="{ option }">
      <span style="font-weight: bold;">👤 {{ option }}</span>
    </template>
  </u-auto-complete>
</template>
```

## 只读模式

```vue
<script setup lang="ts">
import { ref } from 'vue'

const query = ref('Apple')
const fruits = ['Apple', 'Banana', 'Cherry']
</script>

<template>
  <u-auto-complete v-model="query" :suggestions="fruits" readonly />
</template>
```
