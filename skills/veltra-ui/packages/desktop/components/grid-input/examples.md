# UGridInput 示例

## 基础用法

```vue
<script setup lang="ts">
import { ref } from 'vue'

const code = ref('')
</script>

<template>
  <u-grid-input v-model="code" />
</template>
```

## 自定义长度与分隔符

```vue
<script setup lang="ts">
import { ref } from 'vue'

const pin = ref('')

const onInput = (val: string) => {
  console.log('当前输入:', val)
}
</script>

<template>
  <u-grid-input v-model="pin" :length="4" separator=" " @input="onInput" />
</template>
```

## 允许输入零

```vue
<script setup lang="ts">
import { ref } from 'vue'

const code = ref('')
</script>

<template>
  <u-grid-input v-model="code" :length="6" :zero="true" />
</template>
```

## 调用 clear 清空

```vue
<script setup lang="ts">
import type { GridInputExposed } from '@veltra/desktop'
import { shallowRef } from 'vue'

const inputRef = shallowRef<GridInputExposed>()

const handleClear = () => {
  inputRef.value?.clear()
}
</script>

<template>
  <u-grid-input ref="inputRef" />
  <u-button @click="handleClear">清空</u-button>
</template>
```
