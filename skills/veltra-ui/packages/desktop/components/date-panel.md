# UDatePanel — 日期面板

> `import type { DatePanelProps, DatePanelEmits } from '@veltra/desktop'`

底部日期选择面板。支持单选/范围选择、日期/月份/年份三种选择模式，通过面板级联（年→月→日）实现逐级导航。

## Import

```ts
import { UDatePanel } from '@veltra/desktop'
import type { Dater } from '@cat-kit/core'
```

## Props

| prop | type | default | 说明 |
|------|------|---------|------|
| `date` | `Dater` | — | 当前选中的单个日期 |
| `rangeDate` | `[Dater, Dater]` | — | 当前选中的日期范围 `[开始, 结束]`（仅在 `range` 为 `true` 时生效） |
| `range` | `boolean` | `false` | 是否启用范围选择模式。为 `true` 时：第一次点击设置起始日期，悬停预览范围，第二次点击设置结束日期并触发 `select:range-date` |
| `disabledDate` | `(date: Dater) => boolean` | — | 禁用日期的判断函数，返回 `true` 则禁用该日期 |
| `type` | `'date' \| 'month' \| 'year'` | `'date'` | 选择模式。`'date'` 以日面板起步（年级联），`'month'` 以月面板起步，`'year'` 以年面板起步。面板导航顺序：年 → 月 → 日 |
| `size` | `'small' \| 'default' \| 'large'` | `'default'` | 组件尺寸，对应 CSS 修饰类 `u-date-panel--small` / `u-date-panel--default` / `u-date-panel--large` |

## Emits

| event | 参数 | 说明 |
|-------|------|------|
| `select:date` | `(date: Dater)` | 选择单个日期时触发（`range` 为 `false` 时），或选择月份/年份时触发（`type` 为 `'month'` / `'year'` 时） |
| `select:range-date` | `(rangeDate?: [Dater, Dater])` | 范围选择完成时触发（第二次点击），返回 `[起始, 结束]`。外部传入 `rangeDate` 后，面板会优先展示外部值 |

## Slots

无插槽。

## Exposed

无暴露属性或方法。

## Examples

### 基础日期选择

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { UDatePanel } from '@veltra/desktop'
import type { Dater } from '@cat-kit/core'

const date = ref<Dater>()
</script>

<template>
  <u-date-panel
    :date="date"
    @select:date="date = $event"
  />
</template>
```

### 禁用日期（禁用过去日期）

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { date } from '@cat-kit/core'
import { UDatePanel } from '@veltra/desktop'
import type { Dater } from '@cat-kit/core'

const date = ref<Dater>()

function disabledDate(d: Dater): boolean {
  return d.timestamp < date().timestamp
}
</script>

<template>
  <u-date-panel
    :date="date"
    :disabled-date="disabledDate"
    @select:date="date = $event"
  />
</template>
```

### 日期范围选择

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { UDatePanel } from '@veltra/desktop'
import type { Dater } from '@cat-kit/core'

const rangeDate = ref<[Dater, Dater]>()

function onRangeSelect(val?: [Dater, Dater]) {
  rangeDate.value = val
}
</script>

<template>
  <u-date-panel
    range
    :range-date="rangeDate"
    @select:range-date="onRangeSelect"
  />
</template>
```

### 年份选择（type="year"）

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { UDatePanel } from '@veltra/desktop'
import type { Dater } from '@cat-kit/core'

const year = ref<Dater>()
</script>

<template>
  <u-date-panel
    type="year"
    :date="year"
    @select:date="year = $event"
  />
</template>
```
