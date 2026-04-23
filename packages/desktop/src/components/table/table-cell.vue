<template>
  <td
    :class="cellClass"
    :style="style"
    :rowspan="rowspan"
    :colspan="colspan"
    v-if="rowspan !== 0 && colspan !== 0"
  >
    <slot />
  </td>
</template>

<script lang="ts" setup>
import { withUnit } from '@veltra/utils'
import { computed } from 'vue'

defineOptions({
  name: 'TableCell'
})

/**
 * B2: TableCell 去 inject 化。
 *
 * 原先每个可见单元格都会执行 `inject(TableDIKey)` 并在模板中调用 `getCellClass(column)`，
 * 在 30 列场景下每次滚动每行产生 30 次 inject / 30 次类名拼接。
 * 父组件 `TableRow` 已经持有注入上下文，直接把 `cellClass` 传下来即可；
 * 这里变成「完全受控」的纯渲染单元。
 */
const { left, right } = defineProps<{
  cellClass: string
  left?: number
  right?: number
  rowspan?: number
  colspan?: number
}>()

const style = computed(() => ({
  left: withUnit(left, 'px'),
  right: withUnit(right, 'px')
}))
</script>
