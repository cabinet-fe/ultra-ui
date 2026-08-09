<template>
  <div v-show="visible" class="action-pill" :style="pillStyle" @mousedown.stop @pointerdown.stop>
    <u-select
      size="small"
      class="action-pill__select"
      :model-value="currentRole"
      :options="roleOptions"
      @update:model-value="onRole"
    />
    <u-select
      size="small"
      class="action-pill__select"
      :model-value="binding!.aggregate"
      :options="aggregateOptions"
      @update:model-value="onAggregate"
    />
    <u-button size="small" plain @click="emit('open-rules')">条件格式</u-button>
  </div>
</template>

<script lang="ts" setup>
import type { CellAddress } from '@veltra/sheet-core'
import type { SheetGrid } from '@veltra/sheet-core/grid/sheet-grid'
import { computed, onBeforeUnmount, ref, watch } from 'vue'

import { resolveReportRole, aggregateDefaultExpand } from '../binding'
import type { ReportAggregate, ReportBinding, ReportRole } from '../types'
import { getCellOverlayRect, resolveGridOverlayLayout } from './cell-coords'
import { REPORT_ROLE_OPTIONS, roleBindingDefaults } from './role'

defineOptions({ name: 'SheetReportActionPill' })

const props = defineProps<{
  cell: CellAddress | null
  binding: ReportBinding | null
  hostEl: HTMLElement | null
  getGrid: () => SheetGrid | undefined
}>()

const emit = defineEmits<{ patch: [patch: Partial<ReportBinding>]; 'open-rules': [] }>()

const roleOptions = REPORT_ROLE_OPTIONS

const aggregateOptions = [
  { value: 'select' as const, label: '明细' },
  { value: 'group' as const, label: '分组' },
  { value: 'sum' as const, label: '求和' },
  { value: 'avg' as const, label: '平均' },
  { value: 'count' as const, label: '计数' }
]

const pillLeft = ref(0)
const pillTop = ref(0)
const inView = ref(false)

let offScroll: (() => void) | undefined
let rafId = 0

const currentRole = computed((): ReportRole => {
  if (!props.binding) return 'detail'
  return resolveReportRole(props.binding)
})

const visible = computed(() => !!props.binding && !!props.cell && inView.value)

const pillStyle = computed(() => ({ left: `${pillLeft.value}px`, top: `${pillTop.value}px` }))

watch(
  () => [props.cell, props.binding, props.hostEl] as const,
  () => {
    bindScroll()
    scheduleUpdate()
  },
  { immediate: true, flush: 'post' }
)

function onRole(role: ReportRole): void {
  emit('patch', roleBindingDefaults(role))
}

function onAggregate(aggregate: ReportAggregate): void {
  emit('patch', { aggregate, expand: aggregateDefaultExpand(aggregate) })
}

function scheduleUpdate(): void {
  cancelAnimationFrame(rafId)
  rafId = requestAnimationFrame(updatePosition)
}

function updatePosition(): void {
  const cell = props.cell
  const host = props.hostEl
  const grid = props.getGrid()
  if (!cell || !host || !grid) {
    inView.value = false
    return
  }

  const resolved = resolveGridOverlayLayout(host)
  if (!resolved) {
    inView.value = false
    return
  }

  const rect = getCellOverlayRect(grid, cell, resolved.layout)
  if (!rect) {
    inView.value = false
    return
  }

  inView.value = true
  // 胶囊居中悬浮于单元格正上方
  pillLeft.value = Math.round(rect.centerX)
  pillTop.value = Math.round(rect.top - 8)
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
.action-pill {
  position: absolute;
  z-index: 18;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 8px;
  border: 1px solid var(--u-border-color, #e2e8f0);
  border-radius: 999px;
  background: var(--u-bg-color, #fff);
  box-shadow: 0 6px 20px rgb(15 23 42 / 14%);
  transform: translate(-50%, -100%);
  pointer-events: auto;
  white-space: nowrap;
}

.action-pill__select {
  width: 92px;
}
</style>
