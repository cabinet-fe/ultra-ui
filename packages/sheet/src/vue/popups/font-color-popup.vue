<template>
  <u-palette :model-value="fontColor" @update:model-value="applyFontColor" />
</template>

<script lang="ts" setup>
import { UPalette } from '@veltra/desktop'
import { onMounted, ref } from 'vue'

import type { SheetContext } from '../../tools/context'
import { currentRange } from '../popup-helpers'

defineOptions({ name: 'USheetFontColorPopup' })

/**
 * 字体颜色面板（UPalette；空值 = 清除 color 保留其它字体字段）。
 * 面板打开期间的写入由 use-tool-popup 事务包裹为一个 undo 单元。
 */
const props = defineProps<{
  /** 工具上下文（写入走命令系统，天然可撤销） */
  context: SheetContext
}>()

/** 字体颜色（'' = 自动/默认） */
const fontColor = ref('')

// 打开时初始化为活动格当前字体色
onMounted(() => {
  const active = props.context.getSelection().activeCell
  const style = active ? props.context.getCellStyle(active) : undefined
  fontColor.value = style?.font?.color ?? ''
})

/** 字体颜色变化（'' = 清除 color） */
function applyFontColor(color: string): void {
  const range = currentRange(props.context)
  if (!range) return
  props.context.setCellStyle(range, color ? { font: { color } } : { font: { color: null } })
}
</script>
