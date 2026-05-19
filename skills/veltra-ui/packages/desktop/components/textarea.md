# UTextarea — 文本域

> `import type { TextareaProps, TextareaEmits, TextareaExposed } from '@veltra/desktop'`

多行文本输入组件，支持字数统计、清除按钮、自适应高度、缩放控制。继承 `FormComponentProps`，可在 UForm 中自动联动 `size`/`disabled`/`readonly`。当 `readonly` 为 `true` 时，整个文本域替换为纯文本展示。

## Import

```ts
// UTextarea 由 Vite 自动导入，无需手动 import
```

## Props

| prop             | type                                                                            | default     | 说明                                                                                                       |
| ---------------- | ------------------------------------------------------------------------------- | ----------- | ---------------------------------------------------------------------------------------------------------- |
| `modelValue`     | `string`                                                                        | —           | 文本域的值                                                                                                 |
| `placeholder`    | `string`                                                                        | `'请输入'`  | 占位符                                                                                                     |
| `height`         | `string`                                                                        | —           | 文本域的高度（CSS 值，如 `'200px'`）                                                                       |
| `rows`           | `number`                                                                        | —           | 文本域的行数（原生 rows 属性）                                                                             |
| `cols`           | `number`                                                                        | —           | 文本域的列数（原生 cols 属性）                                                                             |
| `maxlength`      | `number`                                                                        | —           | 最大字数，超出时自动截断                                                                                   |
| `showCount`      | `boolean`                                                                       | —           | 是否显示字符数（仅在设置了 `maxlength` 时生效）                                                            |
| `resize`         | `boolean`                                                                       | `true`      | 是否能被用户拖拽缩放                                                                                       |
| `clearable`      | `boolean`                                                                       | `true`      | 是否显示清除按钮（hover 且有值时出现）                                                                     |
| `nativeReadonly` | `boolean`                                                                       | —           | 原生只读（保留输入框外观，设置 `<textarea readonly>`）                                                     |
| `autosize`       | `boolean`                                                                       | `false`     | 是否自适应内容高度                                                                                         |
| `size`           | `ComponentSize`                                                                 | `'default'` | 尺寸（继承自 `ComponentProps`，回退到全局配置 → `'default'`）                                              |
| `disabled`       | `boolean`                                                                       | `false`     | 禁用（继承自 `FormComponentProps`，回退到表单上下文 → 全局配置 → `false`）                                 |
| `readonly`       | `boolean`                                                                       | `false`     | 只读（继承自 `FormComponentProps`，回退到表单上下文 → 全局配置 → `false`）。开启后文本域隐藏，显示纯文本。 |
| `label`          | `string`                                                                        | —           | 表单标签文字（继承自 `FormComponentProps`）                                                                |
| `field`          | `string`                                                                        | —           | 表单项字段（继承自 `FormComponentProps`）                                                                  |
| `tips`           | `string`                                                                        | —           | 表单控件内的提示信息（继承自 `FormComponentProps`）                                                        |
| `span`           | `number \| 'full' \| { default: number \| 'full'; xs?: number \| 'full'; ... }` | —           | 所占列大小（继承自 `FormComponentProps`）                                                                  |

## Emits

| event               | 参数              | 说明             |
| ------------------- | ----------------- | ---------------- |
| `update:modelValue` | `(value: string)` | 输入时实时更新   |
| `change`            | `(value: string)` | 失焦或回车时触发 |
| `focus`             | `()`              | 获得焦点         |
| `blur`              | `()`              | 失去焦点         |
| `clear`             | `()`              | 点击清除按钮     |

## Slots

无插槽。

## Exposed

```ts
interface TextareaExposed {}
```

组件当前无对外暴露的属性或方法。

## Examples

### 基础用法

```vue
<script setup>
import { shallowRef } from 'vue'
const text = shallowRef('')
</script>

<template>
  <u-textarea v-model="text" placeholder="请输入内容" />
</template>
```

### 字数统计与限制

```vue
<script setup>
import { shallowRef } from 'vue'
const remark = shallowRef('')
</script>

<template>
  <u-textarea v-model="remark" placeholder="请输入备注" :maxlength="200" show-count />
</template>
```

### 自适应高度

```vue
<script setup>
import { shallowRef } from 'vue'
const content = shallowRef('')
</script>

<template>
  <u-textarea v-model="content" placeholder="输入内容，高度会自动扩展" autosize />
</template>
```

### 在 UForm 中使用

```vue
<script setup>
import { reactive } from 'vue'
const form = reactive({ description: '' })
</script>

<template>
  <u-form :model="form">
    <u-textarea
      label="描述"
      field="description"
      placeholder="请输入描述信息"
      :maxlength="500"
      show-count
    />
  </u-form>
</template>
```
