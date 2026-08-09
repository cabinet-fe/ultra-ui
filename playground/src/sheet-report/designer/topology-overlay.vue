<template>
  <svg
    v-if="visible"
    class="topology-overlay"
    :width="svgWidth"
    :height="svgHeight"
    aria-hidden="true"
  >
    <defs>
      <marker
        id="topology-arrow"
        markerWidth="8"
        markerHeight="8"
        refX="6"
        refY="4"
        orient="auto"
        markerUnits="strokeWidth"
      >
        <path d="M0,0 L8,4 L0,8 Z" fill="var(--u-color-primary, #2563eb)" />
      </marker>
    </defs>
    <path
      v-for="(path, index) in arcPaths"
      :key="index"
      class="topology-overlay__arc"
      :d="path"
      marker-end="url(#topology-arrow)"
    />
  </svg>
</template>

<script lang="ts" setup>
import type { CellAddress } from '@veltra/sheet-core'
import type { SheetGrid } from '@veltra/sheet-core/grid/sheet-grid'
import { computed, onBeforeUnmount, ref, watch } from 'vue'

import type { ReportBinding } from '../types'
import { getCellOverlayRect, resolveGridOverlayLayout } from './cell-coords'
import { buildTopologyArcPath, collectTopologyLinks, type TopologyBindingEntry } from './topology'

defineOptions({ name: 'SheetReportTopologyOverlay' })

const props = defineProps<{
  cell: CellAddress | null
  binding: ReportBinding | null
  entries: TopologyBindingEntry[]
  hostEl: HTMLElement | null
  getGrid: () => SheetGrid | undefined
  getBindingAt: (addr: CellAddress) => ReportBinding | undefined
}>()

const svgWidth = ref(0)
const svgHeight = ref(0)
const arcPaths = ref<string[]>([])
const inView = ref(false)

let offScroll: (() => void) | undefined
let rafId = 0

const visible = computed(
  () => !!props.binding && !!props.cell && inView.value && arcPaths.value.length > 0
)

watch(
  () => [props.cell, props.binding, props.entries, props.hostEl] as const,
  () => {
    bindScroll()
    scheduleUpdate()
  },
  { immediate: true, flush: 'post' }
)

function scheduleUpdate(): void {
  cancelAnimationFrame(rafId)
  rafId = requestAnimationFrame(updateOverlay)
}

function updateOverlay(): void {
  const cell = props.cell
  const binding = props.binding
  const host = props.hostEl
  const grid = props.getGrid()

  if (!cell || !binding || !host || !grid) {
    inView.value = false
    arcPaths.value = []
    return
  }

  const resolved = resolveGridOverlayLayout(host)
  if (!resolved) {
    inView.value = false
    arcPaths.value = []
    return
  }

  const { layout } = resolved
  svgWidth.value = layout.viewW + layout.offsetX
  svgHeight.value = layout.viewH + layout.offsetY

  const links = collectTopologyLinks(cell, binding, props.entries, props.getBindingAt)
  const paths: string[] = []

  for (const link of links) {
    const fromRect = getCellOverlayRect(grid, link.from, layout)
    const toRect = getCellOverlayRect(grid, link.to, layout)
    if (!fromRect || !toRect) continue
    paths.push(
      buildTopologyArcPath(
        { x: fromRect.centerX, y: fromRect.centerY },
        { x: toRect.centerX, y: toRect.centerY }
      )
    )
  }

  arcPaths.value = paths
  inView.value = paths.length > 0
}

function bindScroll(): void {
  offScroll?.()
  offScroll = undefined
  const grid = props.getGrid()
  if (!grid) return

  const table = grid.getTable()
  const onScroll = (): void => scheduleUpdate()
  const scrollEvent = 'scroll'
  table.on(scrollEvent, onScroll)
  offScroll = () => table.off(scrollEvent, onScroll)
}

onBeforeUnmount(() => {
  cancelAnimationFrame(rafId)
  offScroll?.()
})
</script>

<style scoped lang="scss">
.topology-overlay {
  position: absolute;
  inset: 0;
  z-index: 12;
  pointer-events: none;
  overflow: visible;
}

.topology-overlay__arc {
  fill: none;
  stroke: var(--u-color-primary, #2563eb);
  stroke-width: 2;
  stroke-linecap: round;
  opacity: 0.72;
}
</style>
