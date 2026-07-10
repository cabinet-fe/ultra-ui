# UGridInput 示例

## 基础用法

```vue
<script setup lang="ts">
import { ref } from 'vue'

const code = ref('')
</script>

<template>
  <!-- 默认 6 格、分隔符 `-`、不可输入 0 -->
  <u-grid-input v-model="code" />
  <p>当前值：{{ code }}</p>
</template>
```

## 数据回显

`modelValue` 需与 `separator` 拼装格式一致：有分隔符时为 `1-2-3-4-5-6`，无分隔符时为 `123456`。

```vue
<script setup lang="ts">
import { ref } from 'vue'

const withSep = ref('1-2-3-4-5-6')
const joined = ref('102030')
</script>

<template>
  <u-grid-input v-model="withSep" separator="-" />
  <u-grid-input v-model="joined" separator="" :zero="true" />
</template>
```

## 自定义长度

```vue
<script setup lang="ts">
import { ref } from 'vue'

const pin = ref('')
</script>

<template>
  <u-grid-input v-model="pin" :length="4" separator="" />
</template>
```

## 自定义分隔符

```vue
<script setup lang="ts">
import { ref } from 'vue'

const spaced = ref('')
const joined = ref('')
</script>

<template>
  <!-- 空格分隔：输入后形如 "1 2 3 4" -->
  <u-grid-input v-model="spaced" :length="4" separator=" " />

  <!-- 无分隔符：输入后形如 "123456" -->
  <u-grid-input v-model="joined" :length="6" separator="" />
</template>
```

## 验证码（允许输入 0）

```vue
<script setup lang="ts">
import { ref } from 'vue'

const otp = ref('')
</script>

<template>
  <u-grid-input v-model="otp" :length="6" :zero="true" separator="" />
</template>
```

## 组织编码结构（禁止输入 0）

结构 `3-3-2` 表示最多 3 层树；编码长度可为 3 / 6 / 8 位，每位只能是 1–9。

```vue
<script setup lang="ts">
import { ref } from 'vue'

const level1 = ref('') // 3 位，一级编码
const level2 = ref('') // 6 位，二级编码
const level3 = ref('') // 8 位，三级编码
</script>

<template>
  <u-grid-input v-model="level1" :length="3" separator="" />
  <u-grid-input v-model="level2" :length="6" separator="" />
  <u-grid-input v-model="level3" :length="8" separator="" />
</template>
```

## 监听 input 事件

```vue
<script setup lang="ts">
import { ref } from 'vue'

const code = ref('')

const onInput = (val: string) => {
  console.log('当前输入:', val)
}
</script>

<template>
  <u-grid-input v-model="code" :length="6" :zero="true" separator="" @input="onInput" />
</template>
```

## 调用 clear 清空

```vue
<script setup lang="ts">
import { ref, useTemplateRef } from 'vue'
import type { GridInputExposed } from '@veltra/desktop'

const code = ref('')
const inputRef = useTemplateRef<GridInputExposed>('input')

const handleClear = () => {
  inputRef.value?.clear()
  code.value = ''
}
</script>

<template>
  <u-button @click="handleClear">清空</u-button>
  <u-grid-input ref="input" v-model="code" :zero="true" separator="" />
</template>
```
