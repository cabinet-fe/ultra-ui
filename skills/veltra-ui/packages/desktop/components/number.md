# UNumber — 数字展示

> `import type { NumberProps } from '@veltra/desktop'`

将数值渲染为格式化文本，支持货币、百分比、十进制三种格式，可选补间动画过渡。

## Import

```ts
// UNumber 由 Vite 自动导入，无需手动 import
```

## Props

| prop           | type                                       | default     | 说明                                                           |
| -------------- | ------------------------------------------ | ----------- | -------------------------------------------------------------- |
| `value`        | `number`                                   | —           | 要显示的数值                                                   |
| `format`       | `'currency'` \| `'percent'` \| `'decimal'` | `'decimal'` | 格式化方式：货币（CNY）、百分比、十进制                        |
| `align`        | `'left'` \| `'center'` \| `'right'`        | —           | 文本对齐方式                                                   |
| `tween`        | `boolean`                                  | `false`     | 是否启用补间动画过渡                                           |
| `duration`     | `number`                                   | `800`       | 补间动画持续时间（ms），`tween` 为 `true` 时生效               |
| `precision`    | `number`                                   | —           | 小数精度（固定小数位数）                                       |
| `maxPrecision` | `number`                                   | —           | 最大小数位数（`Intl.NumberFormat` 的 `maximumFractionDigits`） |
| `minPrecision` | `number`                                   | —           | 最小小数位数（`Intl.NumberFormat` 的 `minimumFractionDigits`） |

## Emits

无事件。

## Slots

无插槽。

## Exposed

当前无暴露成员。

## Examples

### 格式化

```vue
<u-number :value="12345.678" format="currency" />
<!-- ¥12,345.68 -->

<u-number :value="0.856" format="percent" />
<!-- 85.6% -->

<u-number :value="12345.678" format="decimal" />
<!-- 12,345.678 -->
```

### 补间动画

```vue
<script setup>
import { ref } from 'vue'

const count = ref(0)
</script>

<template>
  <u-number :value="count" tween :duration="1000" />
  <u-button type="primary" @click="count += 5000">增加</u-button>
</template>
```

### 精度控制

```vue
<u-number :value="3.14159" :precision="2" />
<!-- 3.14 -->

<u-number :value="12345.678" format="currency" :max-precision="0" />
<!-- ¥12,346 -->

<u-number :value="100" format="percent" :min-precision="2" />
<!-- 100.00% -->

<u-number :value="12345.678" :max-precision="1" />
<!-- 12,345.7 -->
```

### 对齐方式

```vue
<u-number :value="99.9" align="left" />
<u-number :value="99.9" align="center" />
<u-number :value="99.9" align="right" />
```
