<template>
  <svg v-if="visible" :class="cls.b" :width="svgWidth" :height="svgHeight" aria-hidden="true">
    <defs>
      <marker
        :id="arrowMarkerId"
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
      :class="cls.e('arc')"
      :d="path"
      :marker-end="`url(#${arrowMarkerId})`"
    />
  </svg>
</template>

<script lang="ts" setup>
import type { CellAddress, SheetGrid } from '@veltra/sheet-core'
import { bem } from '@veltra/utils'
import { computed, ref, toRef } from 'vue'

import type { ReportBinding } from '../../../report/types'
import { buildTopologyArcPath, collectTopologyLinks, type TopologyBindingEntry } from './topology'
import { readCellOverlayRect, readGridOverlaySize, useGridOverlaySync } from './use-grid-overlay'

defineOptions({ name: 'UReportTopologyOverlay' })

const props = defineProps<{
  cell: CellAddress | null
  binding: ReportBinding | null
  entries: TopologyBindingEntry[]
  metaTick: number
  hostEl: HTMLElement | null
  getGrid: () => SheetGrid | undefined
  getBindingAt: (addr: CellAddress) => ReportBinding | undefined
}>()

const cls = bem('report-topology')

/** 箭头 marker id 按实例隔离，避免多设计器同页时 marker 引用串扰 */
const arrowMarkerId = `u-report-topology-arrow-${Math.random().toString(36).slice(2, 8)}`

const hostEl = toRef(props, 'hostEl')

const svgWidth = ref(0)
const svgHeight = ref(0)
const arcPaths = ref<string[]>([])
const inView = ref(false)

const visible = computed(
  () => !!props.binding && !!props.cell && inView.value && arcPaths.value.length > 0
)

function updateOverlay(): void {
  const cell = props.cell
  const binding = props.binding
  const host = props.hostEl
  if (!cell || !binding || !host) {
    inView.value = false
    arcPaths.value = []
    return
  }

  const size = readGridOverlaySize(host)
  if (!size) {
    inView.value = false
    arcPaths.value = []
    return
  }

  svgWidth.value = size.width
  svgHeight.value = size.height

  const links = collectTopologyLinks(cell, binding, props.entries, props.getBindingAt)
  const paths: string[] = []

  for (const link of links) {
    const fromRect = readCellOverlayRect(link.from, host, props.getGrid)
    const toRect = readCellOverlayRect(link.to, host, props.getGrid)
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

useGridOverlaySync({
  hostEl,
  getGrid: () => props.getGrid(),
  watchSources: () =>
    [props.cell?.row, props.cell?.col, props.binding, props.metaTick, props.hostEl] as const,
  update: updateOverlay
})
</script>
