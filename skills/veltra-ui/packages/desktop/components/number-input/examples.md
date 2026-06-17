# UNumberInput 示例

## 基础用法

```vue
<script setup lang="ts">
import { ref } from 'vue'

const num = ref<number>()
</script>

<template>
  <u-number-input v-model="num" :min="0" :max="100" placeholder="请输入数字" />
</template>
```

## 货币模式

```vue
<script setup lang="ts">
import { ref } from 'vue'

const price = ref(1234.5)
</script>

<template>
  <u-number-input v-model="price" currency :precision="2" />
</template>
```

## 步进按钮

```vue
<script setup lang="ts">
import { ref } from 'vue'

const count = ref(5)
</script>

<template>
  <u-number-input v-model="count" :step="1" :min="0" :max="10" />
</template>
```

## 精度控制

```vue
<script setup lang="ts">
import { ref } from 'vue'

const weight = ref<number>()
</script>

<template>
  <!-- 固定在两位小数 -->
  <u-number-input v-model="weight" :precision="2" placeholder="请输入重量" />

  <!-- 最少两位、最多四位小数 -->
  <u-number-input v-model="weight" :min-precision="2" :max-precision="4" />
</template>
```

## 倍数模式（分↔元）

```vue
<script setup lang="ts">
import { ref } from 'vue'

// 内部以"分"为单位存储 12345 → 显示 ¥123.45
const amountInCents = ref(12345)
</script>

<template>
  <u-number-input v-model="amountInCents" currency :multiple="100" :step="100" />
</template>
```

## 在 UForm 中使用

```vue
<script setup lang="ts">
import { reactive } from 'vue'

const formData = reactive({ quantity: 0, price: 0 })
</script>

<template>
  <u-form :model="formData">
    <u-number-input field="quantity" label="数量" :min="0" :step="1" />
    <u-number-input field="price" label="单价" currency :precision="2" :step="0.01" />
  </u-form>
</template>
```
