---
title: UNumber 数字
description: "@veltra/desktop 导出的数字展示组件。用 Intl.NumberFormat（zh-CN）格式化数字，支持货币（默认 CNY ¥）、百分比、十进制三种格式，精度控制与数值补间动画（默认 800ms easeInOutQuad），用于金额、占比、统计值的展示。"
aliases: [UNumber, Number, 数字, 数字格式化, NumberText]
keywords: [UNumber, NumberProps, value, format, currency, percent, decimal, tween, duration, precision, maxPrecision, minPrecision, 数字格式化, 货币格式, 百分比, 千分位, 补间动画, 数字动画]
---

# UNumber 数字

`@veltra/desktop` 导出组件 `UNumber`，把 `value` 经 `Intl.NumberFormat('zh-CN')` 格式化后作为纯文本输出（组件本身不渲染包裹元素）。`format` 选 `'currency'`（人民币 ¥）/ `'percent'` / `'decimal'`（默认），`precision` / `maxPrecision` / `minPrecision` 控制小数位，`tween` 开启数值变化时的补间动画。它是展示组件，不是表单控件，没有 `v-model`。

## 快速上手

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { UNumber } from '@veltra/desktop'

const amount = ref(12345.678)
</script>

<template>
  <u-number :value="amount" format="currency" />
  <!-- => ¥12,345.68 -->
</template>
```

视觉初始化前提：入口需要 `import '@veltra/styles/normalize'` 并调用 `@veltra/styles/theme` 的 `loadTheme()`。注意 UNumber 输出纯文本，本身无颜色样式，颜色由父容器决定。

## API 签名

```ts
/** 数字组件属性 */
export interface NumberProps {
  /** 数字数值，必填 */
  value: number
  /** 格式化样式，默认 'decimal'；currency 货币、percent 百分比、decimal 十进制 */
  format?: 'currency' | 'percent' | 'decimal'
  /** 对齐方式；当前版本组件未使用该 prop，无实际效果 */
  align?: 'left' | 'center' | 'right'
  /** 开启补间动画，默认 false */
  tween?: boolean
  /** 动画持续时间毫秒，默认 800 */
  duration?: number
  /** 精度：同时限定最大与最小小数位数 */
  precision?: number
  /** 最大小数位数；与 precision 同时传时优先生效 */
  maxPrecision?: number
  /** 最小小数位数；与 precision 同时传时优先生效 */
  minPrecision?: number
}

/** 数字组件：无事件、无暴露方法 */
export interface NumberEmits {}

export interface NumberExposed {}
```

## 参数说明

| 参数 | 类型 | 默认 | 必填 | 约束 |
| --- | --- | --- | :---: | --- |
| `value` | `number` | — | 是 | 初始渲染与后续变化都会重新格式化；组件挂载时立即按当前值输出 |
| `format` | `'currency' \| 'percent' \| 'decimal'` | `'decimal'` | 否 | `currency` 输出 `¥` 前缀千分位（币种固定 CNY，组件未暴露币种 prop）；`percent` 把数值乘 100 再加 `%`（`0.856` → `85.6%`）；`decimal` 千分位 |
| `align` | `'left' \| 'center' \| 'right'` | — | 否 | 当前版本模板只输出格式化文本，`align` 不产生任何效果；对齐由父容器布局控制 |
| `tween` | `boolean` | `false` | 否 | `true` 时 `value` 变化用补间动画过渡到新值；缓动固定 easeInOutQuad |
| `duration` | `number` | `800` | 否 | 补间时长，毫秒；仅 `tween: true` 时有意义 |
| `precision` | `number` | — | 否 | 同时作为最大与最小小数位数（不足补 0、超出四舍五入）；被 `maxPrecision` / `minPrecision` 覆盖 |
| `maxPrecision` | `number` | — | 否 | 对应 `maximumFractionDigits`；未传且未传 `precision` 时用 Intl 默认（decimal 最多 3 位、currency 2 位） |
| `minPrecision` | `number` | — | 否 | 对应 `minimumFractionDigits`；未传且未传 `precision` 时用 Intl 默认（0 位） |

## 方法与事件

无事件（`NumberEmits` 为空）、无暴露方法（`NumberExposed` 为空）。`value` 变化是唯一输入：`tween: false` 时同步直接赋值；`tween: true` 时启动补间动画（异步过渡 800ms 或 `duration` 指定值），输出值随动画帧更新。

## 典型示例

### 三种格式与精度控制

```vue
<script setup lang="ts">
import { UNumber } from '@veltra/desktop'
</script>

<template>
  <u-number :value="12345.678" format="currency" />
  <!-- => ¥12,345.68 -->

  <u-number :value="0.856" format="percent" />
  <!-- => 85.6% -->

  <u-number :value="12345.678" format="decimal" />
  <!-- => 12,345.678 -->

  <u-number :value="3.14159" :precision="2" />
  <!-- => 3.14 -->

  <u-number :value="12345.678" format="currency" :max-precision="0" />
  <!-- => ¥12,346 -->

  <u-number :value="100" format="percent" :min-precision="2" />
  <!-- => 100.00% -->
</template>
```

### 数值增减补间动画

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { UButton, UNumber } from '@veltra/desktop'

const count = ref(1000)
</script>

<template>
  <p>库存：<u-number :value="count" tween :duration="1000" format="decimal" /></p>
  <u-button type="primary" plain size="small" @click="count += 5000">+5000</u-button>
  <u-button type="primary" plain size="small" @click="count -= 1000">-1000</u-button>
</template>
```

### 金额统计卡片

统计卡片的外层容器用 `UCard`（禁止自己写 `div` 加 `--u-*` 手搓卡面样式），`UNumber` 只负责数字本身的格式化与补间：

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { UCard, UCardContent, UNumber, UText } from '@veltra/desktop'

const gmv = ref(9876543.21)
const rate = ref(0.1234)
</script>

<template>
  <u-card size="large">
    <u-card-content>
      <u-text as="additional">本月 GMV</u-text>
      <!-- UNumber 无包裹元素：字号、颜色写在父容器上 -->
      <p style="margin: 4px 0 0; font-size: 24px; color: var(--u-color-danger)">
        <u-number :value="gmv" format="currency" :min-precision="2" tween />
      </p>
      <!-- 禁止把 u-number 嵌进 u-text：UText 只渲染文本节点 -->
      <p style="margin: 4px 0 0">
        <u-text as="content">环比 </u-text>
        <u-number :value="rate" format="percent" :precision="1" />
      </p>
    </u-card-content>
  </u-card>
</template>
```

## 注意事项

> [!WARNING]
> - `UNumber` 不是表单控件，没有 `v-model`；输入数字用 `UNumberInput`，展示格式化数字才用 `UNumber`。
> - 组件输出纯文本、不渲染包裹元素：传给 `<u-number>` 的 `class` / `style` 不会生效（无处可落），字号颜色必须写在父容器上。
> - 货币格式币种固定为 CNY（`¥` 前缀）；组件没有 `currency` prop，需要其它币种时自行用 `Intl.NumberFormat` 格式化。
> - `format="percent"` 遵循 Intl 约定：展示值是 `value × 100`。传 `12.34` 显示 `1,234%`，比例值必须先除以 100。
> - `precision` 与 `maxPrecision` / `minPrecision` 同时传时，后两者优先（`maxPrecision ?? precision`、`minPrecision ?? precision`）。
> - `align` prop 当前版本无效果（见参数说明），禁止依赖它对齐；表格内对齐写在单元格上。
> - 统计卡片、数据卡片的外层容器用 `@veltra/desktop` 的 `UCard`（`UCardContent` 放文本与数字），不要自己写 `div` 加 `background: var(--u-bg-color-top)`、`border`、`border-radius` 拼等价卡面。

## 常见问题

### 传了字符串金额报类型错误或显示 `NaN`

原因：`value` 必须是 `number`。后端返回字符串金额时先转换再传入：

```vue
<script setup lang="ts">
import { computed, ref } from 'vue'
import { UNumber } from '@veltra/desktop'

const rawAmount = ref('12345.678') // 后端字符串
const amount = computed(() => Number(rawAmount.value))
</script>

<template>
  <u-number :value="amount" format="currency" />
  <!-- => ¥12,345.68 -->
</template>
```

### 百分比数值差了 100 倍

原因：Intl 的 percent 样式会自动把数值乘 100。修复：源数据是 `85.6`（已乘 100 的百分数）时传 `:value="85.6 / 100"`，或直接用 `decimal` 格式后缀写 `%`。
