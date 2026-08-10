<template>
  <!-- 下拉排列：每行一个字号；滚动用 desktop UScroll（自定义滚动条） -->
  <u-scroll :height="280" :class="cls.e('popup-size-scroll')">
    <div :class="cls.e('popup-size-list')">
      <button
        v-for="size in FONT_SIZES"
        :key="size"
        type="button"
        :class="[cls.e('popup-size-item'), bem.is('active', currentSize === size)]"
        @click="applyFontSize(size)"
      >
        {{ size }}
      </button>
    </div>
  </u-scroll>
</template>

<script lang="ts" setup>
import { UScroll } from '@veltra/desktop'
import { bem } from '@veltra/utils'
import { onMounted, ref } from 'vue'

import type { SheetContext } from '../../../tools/context'
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
