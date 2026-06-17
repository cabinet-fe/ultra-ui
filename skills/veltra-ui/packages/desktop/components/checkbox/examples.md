# UCheckbox 示例

## 基础用法

```vue
<script setup lang="ts">
import { ref } from 'vue'
const agreed = ref(false)
</script>

<template>
  <u-checkbox v-model="agreed">我已阅读并同意</u-checkbox>
</template>
```

## 半选状态（全选场景）

```vue
<script setup lang="ts">
import { computed, ref } from 'vue'
const checkedItems = ref<string[]>([])
const options = ['苹果', '香蕉', '橙子']

const isChecked = computed(() => checkedItems.value.length === options.length)
const isIndeterminate = computed(
  () => checkedItems.value.length > 0 && checkedItems.value.length < options.length
)

function handleCheckAll(checked: boolean) {
  checkedItems.value = checked ? [...options] : []
}
</script>

<template>
  <u-checkbox :model-value="isChecked" :indeterminate="isIndeterminate" @change="handleCheckAll">
    全选
  </u-checkbox>
</template>
```

## 禁用与只读

```vue
<template>
  <u-checkbox v-model="checked" disabled>禁用状态</u-checkbox>
  <u-checkbox v-model="checked" readonly>只读状态</u-checkbox>
</template>
```

## 在 UForm 中使用

```vue
<script setup lang="ts">
import { reactive } from 'vue'

const formData = reactive({ remember: false })
</script>

<template>
  <u-form :model="formData" disabled>
    <u-checkbox label="记住登录" field="remember">30 天内免登录</u-checkbox>
  </u-form>
</template>
```
