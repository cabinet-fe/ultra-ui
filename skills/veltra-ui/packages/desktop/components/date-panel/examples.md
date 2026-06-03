# UDatePanel 示例

## 基础日期选择

```vue
<script setup lang="ts">
import { ref } from 'vue'
import type { Dater } from '@cat-kit/core'

const date = ref<Dater>()
</script>

<template>
  <u-date-panel :date="date" @select:date="date = $event" />
</template>
```

## 禁用日期（禁用过去日期）

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { date } from '@cat-kit/core'
import type { Dater } from '@cat-kit/core'

const date = ref<Dater>()

function disabledDate(d: Dater): boolean {
  return d.timestamp < date().timestamp
}
</script>

<template>
  <u-date-panel :date="date" :disabled-date="disabledDate" @select:date="date = $event" />
</template>
```

## 日期范围选择

```vue
<script setup lang="ts">
import { ref } from 'vue'
import type { Dater } from '@cat-kit/core'

const rangeDate = ref<[Dater, Dater]>()

function onRangeSelect(val?: [Dater, Dater]) {
  rangeDate.value = val
}
</script>

<template>
  <u-date-panel range :range-date="rangeDate" @select:range-date="onRangeSelect" />
</template>
```

## 年份选择（type="year"）

```vue
<script setup lang="ts">
import { ref } from 'vue'
import type { Dater } from '@cat-kit/core'

const year = ref<Dater>()
</script>

<template>
  <u-date-panel type="year" :date="year" @select:date="year = $event" />
</template>
```
