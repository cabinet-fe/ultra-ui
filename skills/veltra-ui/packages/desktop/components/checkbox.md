# UCheckbox / UCheckboxGroup / URadioGroup — 选择组件

> `import type { CheckboxProps, CheckboxGroupProps, RadioGroupProps } from '@veltra/desktop'`

## UCheckbox — 单个复选框

```ts
import { UCheckbox } from '@veltra/desktop'
```

| prop | type | default | 说明 |
|------|------|---------|------|
| `modelValue` | `boolean` | — | 选中状态 |
| `indeterminate` | `boolean` | — | 半选状态 |

### 示例

```vue
<!-- 基础 -->
<u-checkbox v-model="agreed">我已阅读并同意</u-checkbox>

<!-- 半选状态（全选场景） -->
<u-checkbox v-model="checkAll" :indeterminate="isIndeterminate" @change="handleCheckAll">
  全选
</u-checkbox>

<!-- 按钮样式 -->
<u-checkbox-button v-model="checked" type="success">深度思考</u-checkbox-button>
```

---

## UCheckboxGroup — 复选框组

```ts
import { UCheckboxGroup } from '@veltra/desktop'
```

| prop | type | default | 说明 |
|------|------|---------|------|
| `modelValue` | `any[]` | — | 选中值数组 |
| `items` | `Record[]` | **必填** | 选项列表 |
| `labelKey` | `string` | `'label'` | 标签字段 |
| `valueKey` | `string` | `'value'` | 值字段 |
| `block` | `boolean` | — | 块级布局（每行一个） |
| `disabled` | `boolean` | — | 禁用 |

### 示例

```vue
<script setup>
import { ref } from 'vue'

const hobbies = ref<string[]>([])
const options = [
  { label: '篮球', value: 'basketball' },
  { label: '足球', value: 'football' },
  { label: '游泳', value: 'swimming' }
]
</script>

<template>
  <u-checkbox-group v-model="hobbies" :items="options" />

  <!-- 块级布局 + 禁用 -->
  <u-checkbox-group v-model="selected" :items="permissions" block disabled />
</template>
```

---

## URadioGroup — 单选框组

```ts
import { URadioGroup } from '@veltra/desktop'
```

| prop | type | default | 说明 |
|------|------|---------|------|
| `modelValue` | `any` | — | 当前选中值 |
| `items` | `Record[]` | **必填** | 选项列表 |
| `valueKey` | `string` | `'value'` | 值字段 |
| `labelKey` | `string` | `'label'` | 标签字段 |
| `disabled` | `boolean` | — | 全部禁用 |
| `block` | `boolean` | — | 块级布局 |

### 示例

```vue
<script setup>
import { ref } from 'vue'

const gender = ref('')
const options = [
  { label: '男', value: 'male' },
  { label: '女', value: 'female' }
]
</script>

<template>
  <u-radio-group v-model="gender" :items="options" @change="handleChange" />

  <!-- 按钮样式 -->
  <u-radio-group v-model="gender" :items="options" radio-type="btn" />

  <!-- 禁用特定选项 + 块级 -->
  <u-radio-group v-model="plan" :items="plans" block :disabled-item="(item) => item.disabled" />
</template>
```
