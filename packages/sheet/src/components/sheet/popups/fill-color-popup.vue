<template>
  <u-palette :model-value="fillColor" @update:model-value="applyFillColor" />
</template>

<script lang="ts" setup>
import { UPalette } from '@veltra/desktop'
import { onMounted, ref } from 'vue'

import type { SheetContext } from '../../../tools/context'
import { currentRange } from '../popup-helpers'

defineOptions({ name: 'USheetFillColorPopup' })

/**
 * 填充颜色面板（UPalette 调色板 + 无填充 = 清除 fill 保留边框）。
 * 面板打开期间的写入由 use-tool-popup 事务包裹为一个 undo 单元。
 */
const props = defineProps<{
  /** 工具上下文（写入走命令系统，天然可撤销） */
  context: SheetContext
}>()

/** 填充颜色（'' = 无填充） */
const fillColor = ref('')

// 打开时初始化为活动格当前填充色
onMounted(() => {
  const active = props.context.getSelection().activeCell
  const style = active ? props.context.getCellStyle(active) : undefined
  fillColor.value = style?.fill?.color ?? ''
})

/** 填充颜色变化（'' = 无填充：清除 fill 保留边框） */
function applyFillColor(color: string): void {
  const range = currentRange(props.context)
  if (!range) return
  props.context.setCellStyle(range, color ? { fill: { color } } : { fill: {} })
}
</script>
