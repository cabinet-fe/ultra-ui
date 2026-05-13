# UGridInput — 网格输入框

> `import type { GridInputProps, GridInputEmits, GridInputExposed } from '@veltra/desktop'`

## Import

```ts
import { UGridInput } from '@veltra/desktop'
```

## Props

| prop         | type      | default | 说明               |
| ------------ | --------- | ------- | ------------------ |
| `modelValue` | `string`  | —       | 输入值             |
| `length`     | `number`  | `6`     | 格子数量           |
| `zero`       | `boolean` | `false` | 是否允许输入 `0`   |
| `separator`  | `string`  | `'-'`   | 输入值的分隔符     |

## Emits

| event               | 参数                        |
| ------------------- | --------------------------- |
| `update:modelValue` | `(value: string)` — 值变化  |
| `input`             | `(value: string)` — 输入中  |

## Slots

无。

## Exposed

```ts
interface GridInputExposed {
  clear: () => void
}
```

| 方法    | 说明         |
| ------- | ------------ |
| `clear` | 清空所有输入 |

## Examples

### 基础用法

默认 6 位数字，使用 `-` 作为分隔符。

```vue
<script setup lang="ts">
import { UGridInput } from '@veltra/desktop'
import { ref } from 'vue'

const code = ref('')
</script>

<template>
  <u-grid-input v-model="code" />
</template>
```

### 自定义长度与分隔符

```vue
<script setup lang="ts">
import { UGridInput } from '@veltra/desktop'
import { ref } from 'vue'

const pin = ref('')

const onInput = (val: string) => {
  console.log('当前输入:', val)
}
</script>

<template>
  <u-grid-input
    v-model="pin"
    :length="4"
    separator=" "
    @input="onInput"
  />
</template>
```

### 允许输入零

```vue
<script setup lang="ts">
import { UGridInput } from '@veltra/desktop'
import { ref } from 'vue'

const code = ref('')
</script>

<template>
  <u-grid-input v-model="code" :length="6" :zero="true" />
</template>
```

### 调用 clear 清空

```vue
<script setup lang="ts">
import { UGridInput } from '@veltra/desktop'
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
