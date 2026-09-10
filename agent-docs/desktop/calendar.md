---
title: UCalendar 日历
description: "从 `@veltra/desktop` 导出的日历组件：按 `v-model` 的日期字符串渲染一个月视图网格（6 周 42 格，含上下月补位），纯展示、无选中交互与插槽；选日期请用 UDatePicker / UDatePanel。"
aliases: [calendar, u-calendar, Calendar, 日历, 月视图]
keywords: [modelValue, "update:modelValue", CalendarDay, isToday, Dater, 日历, 月视图, 月份网格, 日期展示, 排班, 日程, 补位日期]
---

# UCalendar 日历

`@veltra/desktop` 导出日历组件 `UCalendar`：按 `v-model` 的日期字符串渲染一个月视图网格（固定 6 周 42 格，含上月 / 下月补位），纯展示组件，没有选中交互、禁用日期与自定义单元格插槽。要选日期用 `UDatePicker`，选范围用 `UDateRangePicker`，把选择面板铺在页面里用 `UDatePanel`——`UCalendar` 只负责展示。

## 快速上手

```vue
<script setup lang="ts">
import { UCalendar } from '@veltra/desktop'
import { shallowRef } from 'vue'

// v-model 决定展示哪个月；传可被日期解析的字符串
const month = shallowRef('2026-09-10')
</script>

<template>
  <u-calendar v-model="month" />
</template>
```

未绑定 `v-model` 时展示当月。

## API 签名

```ts
/** @cat-kit/core 的日期对象；网格数据中每格的 date 成员 */
export interface Dater {
  year: number
  month: number
  date: number
  [key: string]: any
}

/** 月视图网格的单格数据 */
export interface CalendarDay {
  date: Dater
  /** 是否今日 */
  isToday?: boolean
  /** 日期归属：'pre' 上月补位、'current' 本月、'next' 下月补位 */
  type: 'pre' | 'current' | 'next'
  /** 是否禁用（本组件不传 disabledDate，恒为 undefined） */
  disabled?: boolean
}

/** 年视图的月份数据（本模块公共类型，UDatePanel 月面板使用） */
export interface CalendarMonth {
  date: Dater
  disabled?: boolean
  /** 年月标识，如 '2026-9' */
  key: string
  /** 月份 1~12 */
  month: number
}

/** 年面板的单年数据（本模块公共类型，UDatePanel 年面板使用） */
export interface CalendarYear {
  date: Dater
  disabled?: boolean
  /** 年份 */
  year: number
}

/** 日历组件属性 */
export interface CalendarProps {
  /** 展示的月份锚点；可被日期解析的字符串，如 '2026-09-10' */
  modelValue?: string
}

/** 日历组件事件 */
export interface CalendarEmits {
  /** 类型上有声明，但组件内部从不触发（无选中交互） */
  (e: 'update:modelValue', value: string): void
}

/** 组件 ref 暴露成员：无（CalendarExposed 为空对象，ref 上无可调用的方法或属性） */
export interface CalendarExposed {}
```

## 参数说明

| 参数 | 类型 | 默认 | 必填 | 约束 |
| --- | --- | --- | :---: | --- |
| `v-model` / `modelValue` | `string` | `undefined` | 否 | 展示的月份锚点，取值须为可被日期解析的字符串（如 `'2026-09-10'`、`'2026-09'`）；未绑定时展示当月 |

无其他 props；不支持 `disabledDate`、`size` 等。

## 方法与事件

`CalendarEmits` 类型上声明了 `update:modelValue`，但组件内部从不触发——它没有任何点击或选中交互，`v-model` 仅作为展示输入。组件 `ref` 无暴露成员。

自定义单元格：无插槽。格子渲染为 `<li class="u-calendar__day u-calendar__day--pre|--current|--next">`，内容是日期数字；定制外观只能覆盖 CSS 类，本日格子悬停可用 `.u-calendar__day--current:hover`。

## 典型示例

### 展示指定月份

```vue
<script setup lang="ts">
import { UCalendar } from '@veltra/desktop'
import { shallowRef } from 'vue'

// 绑定 '2026-05-13' 即展示 2026 年 5 月的网格
const month = shallowRef('2026-05-13')
</script>

<template>
  <u-calendar v-model="month" />
</template>
```

### 按钮切换上 / 下月

```vue
<script setup lang="ts">
import { date } from '@cat-kit/core'
import { UCalendar } from '@veltra/desktop'
import { shallowRef } from 'vue'

const month = shallowRef(date().format('yyyy-MM-dd'))

function shiftMonth(delta: number) {
  // v-model 变化即切换展示的月份
  month.value = date(month.value).calc(delta, 'months').format('yyyy-MM-dd')
}
</script>

<template>
  <div>
    <button @click="shiftMonth(-1)">上个月</button>
    <button @click="shiftMonth(1)">下个月</button>
    <u-calendar v-model="month" />
  </div>
</template>
```

### 覆盖样式定制格子

```vue
<script setup lang="ts">
import { UCalendar } from '@veltra/desktop'
import { shallowRef } from 'vue'

const month = shallowRef('2026-09-10')
</script>

<template>
  <u-calendar v-model="month" />
</template>

<style scoped>
/* 本月格子悬停高亮（--u-color-primary 由主题注入） */
.u-calendar__day--current:hover {
  background-color: var(--u-color-primary);
}

/* 上月 / 下月补位格子弱化 */
.u-calendar__day--pre,
.u-calendar__day--next {
  opacity: 0.4;
}
</style>
```

## 注意事项

> [!WARNING]
> - `UCalendar` 不是日期选择器：没有选中点击、没有 `disabledDate`、没有自定义单元格插槽；需要选择交互用 `UDatePicker`（单个值）或 `UDatePanel`（铺在页面）。
> - `update:modelValue` 虽在 `CalendarEmits` 类型中声明，但组件内部从不触发；`v-model` 只用来指定展示的月份，不要依赖它接收用户操作。
> - 网格固定 6 周 42 格，按周日开始，包含上月 / 下月补位格（类名 `--pre` / `--next`）；数据结构见 `## API 签名` 的 `CalendarDay`。
> - 无周次表头行、无「今天」高亮类；带周表头与今日标记的面板是 `UDatePanel` 的日面板。
> - 主题必须初始化：入口 `import '@veltra/styles/normalize'`、`import { loadTheme } from '@veltra/styles/theme'` 后调用 `loadTheme()`，否则 `--u-*` token 为空、组件无颜色。
