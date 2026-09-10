---
title: UDatePanel 日期面板
description: "从 `@veltra/desktop` 导出的无输入框日期面板：直接铺在页面里选日 / 月 / 年或一段区间，值类型为 `@cat-kit/core` 的 `Dater`；UDatePicker 与 UDateRangePicker 的下拉面板内嵌的就是它。"
aliases: [date-panel, u-date-panel, DatePanel, 日期面板, 日历面板]
keywords: [modelValue, "select:date", "select:range-date", type, range, rangeDate, disabledDate, PanelType, Dater, 日期面板, 范围选择, 月份选择, 年份选择, 禁用日期, 内嵌面板, 钻取]
---

# UDatePanel 日期面板

`@veltra/desktop` 导出日期面板 `UDatePanel`：无输入框的日 / 月 / 年选择面板，单选值与范围值都是 `@cat-kit/core` 的 `Dater` 对象（不是字符串或原生 `Date`）；`UDatePicker` 与 `UDateRangePicker` 的下拉面板内嵌的就是它。需要把日期选择直接铺在页面里、或用自定义触发器弹出时单独使用。

四个日期组件的分工：常规输入框选日期用 `UDatePicker`、选范围用 `UDateRangePicker`（两者内嵌本面板）；面板要直接铺在页面或自定义触发器用 `UDatePanel`；仅按月展示网格、不参与选择用 `UCalendar`。

## 快速上手

```vue
<script setup lang="ts">
import type { Dater } from '@cat-kit/core'
import { UDatePanel } from '@veltra/desktop'
import { shallowRef } from 'vue'

const selected = shallowRef<Dater>()
</script>

<template>
  <!-- 受控选中值用 date prop，选中结果从 select:date 事件拿（payload 是 Dater） -->
  <u-date-panel :date="selected" @select:date="selected = $event" />
</template>
```

本组件无 `field` / `v-model` 绑定，选中结果只通过事件回传，由调用方保存。

## API 签名

```ts
export type ComponentSize = 'small' | 'default' | 'large'

/** @cat-kit/core 的日期对象；常用成员：timestamp（毫秒数）、raw（原生 Date）、year、month、format(fmt) */
export interface Dater {
  year: number
  month: number
  date: number
  [key: string]: any
}

/** 面板形态：日面板 / 月面板 / 年面板 */
export type PanelType = 'day' | 'month' | 'year'

/** 日期面板属性 */
export interface DatePanelProps {
  /** 受控选中值（单选模式）；面板用它回显选中态 */
  date?: Dater
  /** 受控选中范围（range 模式），[start, end] 按时间先后 */
  rangeDate?: [Dater, Dater]
  /** 范围模式：两次点击选出一段区间。默认 false */
  range?: boolean
  /** 禁用日期：返回 true 的单元格不可点击；date 为 Dater，raw 为原生 Date */
  disabledDate?: (date: Dater, raw: Date) => boolean
  /** 选择粒度。默认 'date'（日面板）；'month' / 'year' 直接呈现月 / 年面板 */
  type?: 'date' | 'month' | 'year'
  /** 面板尺寸。默认 'default'；仅复用 FormComponentProps['size']，本组件不含 field / label 等其余表单属性 */
  size?: ComponentSize
}

export interface DatePanelEmits {
  /** 点击与 type 匹配层级的单元格时触发；payload 为选中日期的 Dater */
  (e: 'select:date', date: Dater): void
  /** range 模式第二次点击完成选择时触发；两端按时间先后排序 */
  (e: 'select:range-date', rangeDate?: [Dater, Dater]): void
}
```

## 参数说明

| 参数 | 类型 | 默认 | 必填 | 约束 |
| --- | --- | --- | :---: | --- |
| `date` | `Dater` | `undefined` | 否 | 单选模式的受控选中值；`type="month"` / `"year"` 时传月 / 年任意一天的 `Dater` 即可回显 |
| `rangeDate` | `[Dater, Dater]` | `undefined` | 否 | 范围模式的受控选中范围；两端按时间先后 |
| `range` | `boolean` | `false` | 否 | `true` 时切换为两次点击的范围选择，触发 `select:range-date` 而非 `select:date` |
| `disabledDate` | `(date: Dater, raw: Date) => boolean` | — | 否 | 返回 `true` 的单元格不可点击、不参与悬停预览 |
| `type` | `'date' \| 'month' \| 'year'` | `'date'` | 否 | 初始面板：日 / 月 / 年；更高层级单元格用于钻取 |
| `size` | `ComponentSize` | `'default'` | 否 | `'small' \| 'default' \| 'large'`，只影响面板类名与尺寸样式 |

## 方法与事件

| 事件 | payload | 触发时机 |
| --- | --- | --- |
| `select:date` | `date: Dater` | 单选模式下点击与 `type` 匹配层级的单元格：`type="date"` 点日期、`type="month"` 点月份、`type="year"` 点年份 |
| `select:range-date` | `rangeDate?: [Dater, Dater]` | `range` 模式第二次点击完成选择时；两端按时间先后排序，早于起点的第二次点击会自动交换 |

交互规则：

- 钻取：单选模式下点击非匹配层级的单元格不触发事件，而是下钻一级（年 → 月 → 日）；点面板头部「年」「月」文字也可切换面板。
- 头部导航：日面板 ±1 月 / ±1 年；月面板 ±1 年；年面板 ±10 年（一次显示 10 年：当前年 − 当前年 % 10 + 1 起，如 2026 年显示 2021~2030）。
- 日面板固定渲染 6 周 42 格，含上月 / 下月补位；今天有 `is-today` 类与「今天」提示。
- 范围模式：第一次点击记起点（面板临时显示 `[d, d]`），悬停实时预览区间，第二次点击触发 `select:range-date` 并复位临时状态。
- 组件无暴露方法；无 `v-model`。

## 典型示例

### 单选日 + 禁用过去日期

```vue
<script setup lang="ts">
import { date, type Dater } from '@cat-kit/core'
import { UDatePanel } from '@veltra/desktop'
import { shallowRef } from 'vue'

const selected = shallowRef<Dater>()

// 返回 true 的日期不可选
function disabledDate(d: Dater) {
  return d.timestamp < date().timestamp
}

function handleSelect(d: Dater) {
  selected.value = d
  // payload 是 Dater：原生 Date 用 d.raw，毫秒数用 d.timestamp
  console.log(d.raw instanceof Date) // => true
}
</script>

<template>
  <u-date-panel :date="selected" :disabled-date="disabledDate" @select:date="handleSelect" />
</template>
```

### 范围选择

```vue
<script setup lang="ts">
import type { Dater } from '@cat-kit/core'
import { UDatePanel } from '@veltra/desktop'
import { shallowRef } from 'vue'

const rangeDate = shallowRef<[Dater, Dater]>()

function handleRangeSelect(val?: [Dater, Dater]) {
  if (!val) return
  rangeDate.value = val
  // 两端已按时间先后排序
  console.log(val[0].timestamp <= val[1].timestamp) // => true
}
</script>

<template>
  <!-- range 开启两次点击模式；rangeDate 受控回显已选区间 -->
  <u-date-panel range :range-date="rangeDate" @select:range-date="handleRangeSelect" />
</template>
```

### 年 / 月面板与自定义触发器

```vue
<script setup lang="ts">
import type { Dater } from '@cat-kit/core'
import { UDatePanel } from '@veltra/desktop'
import { shallowRef } from 'vue'

const visible = shallowRef(false)
const year = shallowRef<Dater>()
</script>

<template>
  <div>
    <!-- 自定义触发器：自己控制显隐 -->
    <button @click="visible = !visible">{{ year ? year.year + '年' : '选择年份' }}</button>
    <!-- type="month" 呈现 12 个月面板；type="year" 呈现 10 年面板 -->
    <u-date-panel v-if="visible" type="year" :date="year" @select:date="year = $event" />
  </div>
</template>
```

## 注意事项

> [!WARNING]
> - 选中值是 `@cat-kit/core` 的 `Dater`，不是字符串或原生 `Date`；需要原生 `Date` 取 `date.raw`，毫秒数取 `date.timestamp`，格式化用 `date.format('yyyy-MM-dd')`。
> - `type="month"` 时选中的 `Dater` 是该月最后一天 23:59:59，`type="year"` 时是该年 12 月 31 日 23:59:59；只要月 / 年标识时取其 `year` / `month` 字段（或 `date.format('yyyy-MM')`），不要直接当「当天 0 点」用。
> - 本组件不是表单绑定控件：没有 `field` / `label` / `rules` / `v-model`，放进 `UForm` 不参与字段绑定与校验；需要表单绑定用 `UDatePicker` / `UDateRangePicker`。
> - `UDatePicker` / `UDateRangePicker` 的下拉内容就是本组件；覆盖 `.u-date-panel__*` 样式会同时影响两个选择器。
> - `disabledDate` 的第一个参数是 `Dater`（用 `d.timestamp` 取毫秒数），第二个参数才是原生 `Date`。
> - 无暴露方法、无 `v-model`；选中结果只能通过 `select:date` / `select:range-date` 事件获取并自行保存。
> - 独立页面使用前必须初始化主题：`import '@veltra/styles/normalize'`、`import { loadTheme } from '@veltra/styles/theme'` 后调用 `loadTheme()`，否则 `--u-*` token 为空、组件无颜色。

## 常见问题

### 选了月份，拿到的却是月末 23:59:59

这是内置行为：月 / 年面板的单元格值分别是该月最后一天 23:59:59 与该年 12 月 31 日 23:59:59。需要月份标识时读 `date.year` 与 `date.month`，或用 `date.format('yyyy-MM')` 自行格式化。

### 点击月份 / 年份单元格没有触发 `select:date`

单选模式下只有与 `type` 同层级的点击才触发：`type="date"` 时点年份 / 月份是钻取（切到下级面板），不触发事件。要直接选月份须设 `type="month"`，直接选年份设 `type="year"`。
