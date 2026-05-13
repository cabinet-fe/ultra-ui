# UPasswordInput — 密码输入框

> 密码输入框，在 `UInput` 基础上封装，提供密码显示/隐藏切换功能。输入时密码以 `●` 遮罩显示。

## Import

```ts
// UPasswordInput 由 Vite 自动导入，无需手动 import
import type { PasswordInputProps, PasswordInputEmits, PasswordInputExposed } from '@veltra/desktop'
```

## Props

| prop | type | default | 说明 |
|------|------|---------|------|
| `modelValue` | `string` | — | 密码值（v-model） |
| `placeholder` | `string` | — | 占位符 |
| `clearable` | `boolean` | `false` | 是否显示清除按钮 |
| `disabled` | `boolean` | `false` | 是否禁用 |
| `readonly` | `boolean` | `false` | 是否只读 |
| `size` | `'small' \| 'default' \| 'large'` | `'default'` | 组件尺寸 |
| `prefix` | `string` | — | 前缀文本 |
| `suffix` | `string` | — | 后缀文本 |
| `nativeReadonly` | `boolean` | — | 原生只读 |
| `pattern` | `RegExp` | — | 输入模式，需保证有一个符合模式的默认值 |
| `tips` | `string` | — | 在表单控件内时的提示 |
| `span` | `number \| 'full' \| ResponsiveSpan` | — | 表单中所占列的大小 |
| `label` | `string` | — | 表单标签文字 |
| `field` | `string` | — | 表单项字段名 |

### 类型扩展

```ts
interface PasswordInputProps extends InputProps {
  modelValue?: string
}
```

其中 `ResponsiveSpan` 类型：

```ts
type ResponsiveSpan = number | 'full' | ({
  [key in 'xs' | 'sm' | 'md' | 'lg' | 'xl']?: 'full' | number
} & { default: number | 'full' })
```

## Emits

| event | 参数 | 说明 |
|-------|------|------|
| `update:modelValue` | `(value: string)` | 输入值变化时触发 |

## Slots

| slot | 作用域 | 说明 |
|------|--------|------|
| `prefix` | — | 输入框前缀区域（点击会触发 `prefix:click` 事件） |

> 后缀插槽已被组件内部占用（显示/隐藏密码图标），不可覆盖。

## Exposed

```ts
interface PasswordInputExposed {}
```

## Examples

### 基础用法

```vue
<template>
  <u-password-input v-model="password" placeholder="请输入密码" />
</template>

<script setup lang="ts">
import { ref } from 'vue'

const password = ref('')
</script>
```

### 带清除按钮

```vue
<template>
  <u-password-input v-model="password" placeholder="请输入密码" clearable />
</template>

<script setup lang="ts">
import { ref } from 'vue'

const password = ref('')
</script>
```

### 禁用与只读

```vue
<template>
  <u-password-input v-model="password" label="密码" disabled />
  <u-password-input v-model="password" label="密码" readonly />
</template>

<script setup lang="ts">
import { ref } from 'vue'

const password = ref('mySecret')
</script>
```

### 表单场景

```vue
<template>
  <u-form>
    <u-password-input
      v-model="password"
      label="新密码"
      field="password"
      placeholder="至少 8 位"
      tips="密码长度至少 8 位，包含字母和数字"
    />
  </u-form>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const password = ref('')
</script>
```
