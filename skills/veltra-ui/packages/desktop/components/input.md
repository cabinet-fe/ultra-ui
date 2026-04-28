# UInput — 文本输入

> `import type { InputProps } from '@veltra/desktop'`

继承 `FormComponentProps`，支持在 UForm 中自动联动 `size`/`disabled`/`readonly`。

## Import

```ts
import { UInput } from '@veltra/desktop'
// 或按需
import { UInput } from '@veltra/desktop'
```

## Props

| prop | type | default | 说明 |
|------|------|---------|------|
| `modelValue` | `string` | — | 输入值 |
| `placeholder` | `string` | `'请输入'` | 占位符 |
| `prefix` | `string` | — | 前缀文本 |
| `suffix` | `string` | — | 后缀文本 |
| `clearable` | `boolean` | `true` | 可清除 |
| `nativeReadonly` | `boolean` | — | 原生只读（保留输入框外观） |
| `pattern` | `RegExp` | — | 正则校验 |
| `size` | `ComponentSize` | — | 尺寸 |
| `disabled` | `boolean` | — | 禁用 |
| `readonly` | `boolean` | — | 只读 |

## Emits

| event | 参数 | 说明 |
|-------|------|------|
| `update:modelValue` | `(value: string)` | 值变化 |
| `change` | `(value: string)` | 失焦或回车时触发 |
| `suffix:click` | `(value?: string)` | 后缀点击 |
| `prefix:click` | `(value?: string)` | 前缀点击 |
| `focus` | `()` | 获得焦点 |
| `blur` | `()` | 失去焦点 |
| `clear` | `()` | 点击清除 |

## Slots

| slot | 说明 |
|------|------|
| `prefix` | 前缀图标/内容 |
| `suffix` | 后缀图标/内容 |

## Exposed

| 属性 | 类型 |
|------|------|
| `el` | `ShallowRef<HTMLInputElement \| undefined>` |

## Examples

### 基础输入

```vue
<script setup>
import { shallowRef } from 'vue'
const keyword = shallowRef('')
</script>

<template>
  <u-input v-model="keyword" placeholder="搜索..." />
</template>
```

### 带前后缀图标

```vue
<script setup>
import { Search } from '@veltra/icons/normal'
const keyword = shallowRef('')
</script>

<template>
  <u-input v-model="keyword" placeholder="搜索" clearable @suffix:click="handleSearch">
    <template #suffix>
      <u-icon :size="16"><Search /></u-icon>
    </template>
  </u-input>
</template>
```

### 带正则校验

```vue
<u-input v-model="phone" placeholder="手机号" :pattern="/^1[3-9]\d{9}$/" />
```

### 在 UForm 中使用

```vue
<u-form :model="model">
  <u-input label="用户名" field="username" placeholder="请输入用户名" />
</u-form>
```

### 原生只读（保留外观）

```vue
<u-input v-model="readonlyVal" native-readonly />
```
