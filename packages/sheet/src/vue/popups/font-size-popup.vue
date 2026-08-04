<template>
  <div :class="cls.e('popup-row')">
    <span :class="cls.e('popup-label')">字号</span>
    <button
      v-for="size in FONT_SIZES"
      :key="size"
      type="button"
      :class="[cls.e('popup-preset'), bem.is('active', currentSize === size)]"
      @click="applyFontSize(size)"
    >
      {{ size }}
    </button>
  </div>
</template>

<script lang="ts" setup>
import { bem } from '@veltra/utils'
import { onMounted, ref } from 'vue'

import type { SheetContext } from '../../tools/context'
import { currentRange } from '../popup-helpers'

defineOptions({ name: 'USheetFontSizePopup' })

/** 预设字号列表（pt，与 Excel 常用档对齐） */
const FONT_SIZES = [9, 10, 11, 12, 14, 16, 18, 20, 24, 28, 32] as const

/**
 * 字号面板（预设列表；点击写入 font.size）。
 * 面板打开期间的写入由 use-tool-popup 事务包裹为一个 undo 单元。
 */
const props = defineProps<{ context: SheetContext }>()

const cls = bem('sheet')
const currentSize = ref<number | undefined>(undefined)

onMounted(() => {
  const active = props.context.getSelection().activeCell
  const style = active ? props.context.getCellStyle(active) : undefined
  currentSize.value = style?.font?.size
})

function applyFontSize(size: number): void {
  const range = currentRange(props.context)
  if (!range) return
  currentSize.value = size
  props.context.setCellStyle(range, { font: { size } })
}
</script>
