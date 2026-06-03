# UPalette 示例

## 基础用法

```vue
<script setup lang="ts">
import { ref } from 'vue'

const color = ref('#FF0000')
</script>

<template>
  <u-palette v-model="color" />
</template>
```

## 禁用与只读

```vue
<template>
  <u-palette v-model="color1" disabled />
  <u-palette v-model="color2" readonly />
</template>

<script setup lang="ts">
import { ref } from 'vue'

const color1 = ref('#409EFF')
const color2 = ref('#67C23A')
</script>
```

## 在 UForm 中使用

```vue
<script setup lang="ts">
import { reactive } from 'vue'

const model = reactive({ themeColor: '' })
</script>

<template>
  <u-form :model="model">
    <u-palette label="主题色" field="themeColor" v-model="model.themeColor" />
  </u-form>
</template>
```

## 带透明度的颜色

```vue
<script setup lang="ts">
import { ref } from 'vue'

const color = ref('#FF000080')
</script>

<template>
  <u-palette v-model="color" />
</template>
```
