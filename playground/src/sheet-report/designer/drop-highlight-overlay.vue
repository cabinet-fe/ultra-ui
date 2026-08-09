<template>
  <div v-if="cell && visible" class="drop-highlight" :style="highlightStyle" aria-hidden="true" />
</template>

<script lang="ts" setup>
import type { CellAddress } from '@veltra/sheet-core'
import type { SheetGrid } from '@veltra/sheet-core/grid/sheet-grid'
import { computed, ref, toRef } from 'vue'

import { readCellOverlayRect, useGridOverlaySync } from './use-grid-overlay'

defineOptions({ name: 'SheetReportDropHighlightOverlay' })

const props = defineProps<{
  cell: CellAddress | null
  hostEl: HTMLElement | null
  getGrid: () => SheetGrid | undefined
}>()

const hostEl = toRef(props, 'hostEl')

const rectLeft = ref(0)
const rectTop = ref(0)
const rectWidth = ref(0)
const rectHeight = ref(0)
const inView = ref(false)

const visible = computed(() => !!props.cell && inView.value)

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
  watchSources: () => [props.cell?.row, props.cell?.col, props.hostEl] as const,
  update: updateHighlight
})
</script>

<style scoped lang="scss">
.drop-highlight {
  position: absolute;
  z-index: 16;
  box-sizing: border-box;
  border: 2px dashed var(--u-color-primary, #2563eb);
  border-radius: 2px;
  background: color-mix(in srgb, var(--u-color-primary, #2563eb) 10%, transparent);
  pointer-events: none;
}
</style>
