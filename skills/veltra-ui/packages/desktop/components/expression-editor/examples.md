# UExpressionEditor 示例

## 基础使用

```vue
<script setup lang="ts">
import { shallowRef } from 'vue'
import type { VariableItem } from '@veltra/desktop'

const expression = shallowRef('你好{form.user.name}')

const variables: VariableItem[] = [
  {
    label: '表单数据',
    value: 'form',
    children: [
      {
        label: '用户信息',
        value: 'form.user',
        children: [
          { label: '姓名', value: 'form.user.name', type: 'string' },
          { label: '年龄', value: 'form.user.age', type: 'number' }
        ]
      }
    ]
  }
]
</script>

<template>
  <u-expression-editor v-model="expression" :variables="variables" />
</template>
```

## 允许选择分支变量

```vue
<template>
  <u-expression-editor v-model="expression" :variables="variables" selectable-levels="any" />
</template>
```

## 禁用与只读

```vue
<template>
  <u-expression-editor v-model="expression" :variables="variables" disabled />
  <u-expression-editor v-model="expression" :variables="variables" readonly />
</template>
```

## 平坦变量列表

```vue
<script setup lang="ts">
import { ref } from 'vue'
import type { VariableItem } from '@veltra/desktop'

const expression = ref('')

const variables: VariableItem[] = [
  { label: '当前用户', value: 'user.name', type: 'string' },
  { label: '当前日期', value: 'date.today', type: 'date' },
  { label: '订单金额', value: 'order.amount', type: 'number' },
  { label: '是否会员', value: 'user.vip', type: 'boolean' }
]
</script>

<template>
  <u-expression-editor
    v-model="expression"
    :variables="variables"
    placeholder="输入表达式，@ 可插入变量"
  />
</template>
```
