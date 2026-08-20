<template>
  <div v-if="cell && visible" :class="cls.b" :style="highlightStyle" aria-hidden="true" />
  <div v-else-if="showFallback" :class="cls.e('fallback')" role="status">
    松开将绑定到当前选区 {{ fallbackLabel }}
  </div>
</template>

<script lang="ts" setup>
import type { CellAddress } from '@veltra/sheet-core'
import type { SheetGrid } from '@veltra/sheet-core/grid'
import { bem } from '@veltra/utils'
import { computed, ref, toRef } from 'vue'

import { readCellOverlayRect, useGridOverlaySync } from './use-grid-overlay'

defineOptions({ name: 'UReportDropHighlightOverlay' })

const props = defineProps<{
  cell: CellAddress | null
  hostEl: HTMLElement | null
  getGrid: () => SheetGrid | undefined
  /** 字段拖拽进行中（dragover 时为 true） */
  dragging: boolean
  /** hit-test 落空时提示回退的选区标签（如 A1） */
  fallbackLabel: string
}>()

const cls = bem('report-drop-highlight')

const hostEl = toRef(props, 'hostEl')

const rectLeft = ref(0)
const rectTop = ref(0)
const rectWidth = ref(0)
const rectHeight = ref(0)
const inView = ref(false)

const visible = computed(() => !!props.cell && inView.value)
const showFallback = computed(() => props.dragging && !props.cell)

const highlightStyle = computed(() => ({
  left: `${rectLeft.value}px`,
  top: `${rectTop.value}px`,
  width: `${rectWidth.value}px`,
  height: `${rectHeight.value}px`
}))

function updateHighlight(): void {
  const cell = props.cell
  const host = props.hostEl
  if (!cell || !host) {
    inView.value = false
    return
  }

  const rect = readCellOverlayRect(cell, host, props.getGrid)
  if (!rect) {
    inView.value = false
    return
  }

  inView.value = true
  rectLeft.value = Math.round(rect.left)
  rectTop.value = Math.round(rect.top)
  rectWidth.value = Math.round(rect.width)
  rectHeight.value = Math.round(rect.height)
}

useGridOverlaySync({
  hostEl,
  getGrid: () => props.getGrid(),
  watchSources: () => [props.cell?.row, props.cell?.col, props.hostEl, props.dragging] as const,
  update: updateHighlight
})
</script>
