<template>
  <div
    v-if="binding && cell"
    v-show="visible"
    ref="panelRef"
    class="binding-float-panel"
    :class="{
      'binding-float-panel--expanded': expanded,
      [`binding-float-panel--${placement}`]: true
    }"
    :style="panelStyle"
    @mousedown.stop
    @pointerdown.stop
  >
    <div class="binding-float-panel__bar">
      <div class="binding-float-panel__summary" :title="summaryText">
        {{ summaryText }}
      </div>
      <div class="binding-float-panel__toolbar">
        <u-select
          size="small"
          class="binding-float-panel__select binding-float-panel__select--role"
          :model-value="currentRole"
          :options="roleOptions"
          @update:model-value="onRole"
        />
        <u-select
          size="small"
          class="binding-float-panel__select binding-float-panel__select--aggregate"
          :model-value="binding.aggregate"
          :options="aggregateOptions"
          @update:model-value="onAggregate"
        />
        <u-button size="small" plain @click="emit('open-rules')">条件样式</u-button>
        <u-button
          size="small"
          text
          class="binding-float-panel__expand"
          :title="expanded ? '收起' : '展开更多'"
          @click="expanded = !expanded"
        >
          {{ expanded ? '收起' : '展开' }}
        </u-button>
      </div>
    </div>

    <div v-if="expanded" class="binding-float-panel__body">
      <section class="binding-float-panel__section">
        <div class="binding-float-panel__section-label">数据集</div>
        <p class="binding-float-panel__hint">{{ binding.dataset }}</p>
      </section>

      <section class="binding-float-panel__section">
        <div class="binding-float-panel__section-label">排序</div>
        <u-radio-group
          size="small"
          :items="sortOptions"
          :model-value="binding.sort ?? 'none'"
          @update:model-value="onSort"
        />
      </section>

      <section class="binding-float-panel__section">
        <div class="binding-float-panel__section-label">父分组</div>
        <p class="binding-float-panel__hint">解析结果：{{ resolvedLeftParentLabel }}</p>
      </section>

      <footer class="binding-float-panel__footer">
        <u-button size="small" type="danger" plain @click="emit('remove')">删除绑定</u-button>
      </footer>
    </div>
  </div>
</template>

<script lang="ts" setup>
import type { CellAddress } from '@veltra/sheet-core'
import type { SheetGrid } from '@veltra/sheet-core/grid/sheet-grid'
import { computed, nextTick, ref, toRef, watch } from 'vue'

import { aggregateDefaultExpand, formatBindingPlaceholder, resolveReportRole } from '../binding'
import type { ReportAggregate, ReportBinding, ReportRole, ReportSort } from '../types'
import { resolveGridOverlayLayout } from './cell-coords'
import { REPORT_ROLE_OPTIONS, roleBindingDefaults } from './role'
import {
  readCellOverlayRect,
  resolveBindingFloatPanelPosition,
  useGridOverlaySync
} from './use-grid-overlay'

defineOptions({ name: 'SheetReportBindingFloatPanel' })

const props = defineProps<{
  cell: CellAddress | null
  binding: ReportBinding | null
  resolvedLeftParentLabel: string
  resolveFieldLabel?: (datasetId: string, fieldName: string) => string
  hostEl: HTMLElement | null
  getGrid: () => SheetGrid | undefined
}>()

const emit = defineEmits<{ patch: [patch: Partial<ReportBinding>]; remove: []; 'open-rules': [] }>()

const hostEl = toRef(props, 'hostEl')
const panelRef = ref<HTMLElement | null>(null)
const expanded = ref(false)
const placement = ref<'above' | 'below'>('above')

const roleOptions = REPORT_ROLE_OPTIONS

const aggregateOptions = [
  { value: 'select' as const, label: '明细' },
  { value: 'group' as const, label: '分组' },
  { value: 'sum' as const, label: '求和' },
  { value: 'avg' as const, label: '平均' },
  { value: 'count' as const, label: '计数' }
]

const sortOptions = [
  { value: 'none' as const, label: '无' },
  { value: 'asc' as const, label: '升序' },
  { value: 'desc' as const, label: '降序' }
]

const panelLeft = ref(0)
const panelTop = ref(0)
const inView = ref(false)

const currentRole = computed((): ReportRole => {
  if (!props.binding) return 'detail'
  return resolveReportRole(props.binding)
})

const summaryText = computed(() => {
  if (!props.binding) return ''
  return formatBindingPlaceholder(props.binding, props.resolveFieldLabel)
})

const visible = computed(() => !!props.binding && !!props.cell && inView.value)

const panelStyle = computed(() => ({ left: `${panelLeft.value}px`, top: `${panelTop.value}px` }))

watch(
  () => [props.cell?.row, props.cell?.col] as const,
  () => {
    expanded.value = false
  }
)

watch(expanded, () => {
  nextTick(() => updatePosition())
})

watch(visible, (show) => {
  if (!show) return
  nextTick(() => updatePosition())
})

function onRole(role: ReportRole): void {
  emit('patch', roleBindingDefaults(role))
}

function onAggregate(aggregate: ReportAggregate): void {
  emit('patch', { aggregate, expand: aggregateDefaultExpand(aggregate) })
}

function onSort(value: ReportSort): void {
  emit('patch', { sort: value })
}

function updatePosition(): void {
  const cell = props.cell
  const host = props.hostEl
  if (!cell || !host) {
    inView.value = false
    return
  }

  const layoutResolved = resolveGridOverlayLayout(host)
  const rect = readCellOverlayRect(cell, host, props.getGrid)
  if (!rect || !layoutResolved) {
    inView.value = false
    return
  }

  inView.value = true

  const panelEl = panelRef.value
  const panelWidth = panelEl?.offsetWidth ?? 340
  const panelHeight = panelEl?.offsetHeight ?? (expanded.value ? 240 : 68)
  const position = resolveBindingFloatPanelPosition(
    rect,
    layoutResolved.layout,
    panelWidth,
    panelHeight,
    host.clientWidth
  )

  placement.value = position.placement
  panelLeft.value = position.left
  panelTop.value = position.top
}

useGridOverlaySync({
  hostEl,
  getGrid: () => props.getGrid(),
  watchSources: () =>
    [props.cell?.row, props.cell?.col, props.binding, props.hostEl, expanded.value] as const,
  update: updatePosition
})
</script>

<style scoped lang="scss">
.binding-float-panel {
  position: absolute;
  z-index: 18;
  display: flex;
  flex-direction: column;
  width: max-content;
  min-width: 400px;
  max-width: min(480px, calc(100% - 20px));
  border: 1px solid var(--u-border-color, #e2e8f0);
  border-radius: 10px;
  background: var(--u-bg-color, #fff);
  box-shadow: 0 8px 24px rgb(15 23 42 / 12%);
  pointer-events: auto;
}

.binding-float-panel--above {
  transform: translate(-50%, -100%);
}

.binding-float-panel--below {
  transform: translate(-50%, 0);
}

.binding-float-panel__bar {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 8px 10px;
}

.binding-float-panel__summary {
  font-size: 12px;
  font-weight: 600;
  line-height: 1.35;
  color: var(--u-color-primary, #2563eb);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.binding-float-panel__toolbar {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}

.binding-float-panel__select {
  flex: none;

  &--role {
    width: 84px;
  }

  &--aggregate {
    width: 76px;
  }
}

.binding-float-panel__expand {
  flex: none;
  margin-left: auto;
  padding-inline: 6px;
}

.binding-float-panel__body {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 10px 12px 12px;
  border-top: 1px solid var(--u-border-color-light, #f1f5f9);
  background: var(--u-fill-color-lighter, #f8fafc);
}

.binding-float-panel__section {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.binding-float-panel__section-label {
  font-size: 12px;
  font-weight: 600;
  color: var(--u-text-color-secondary, #64748b);
}

.binding-float-panel__hint {
  margin: 0;
  font-size: 12px;
  color: var(--u-text-color-secondary, #64748b);
}

.binding-float-panel__footer {
  display: flex;
  justify-content: flex-end;
  padding-top: 4px;
  margin-top: 2px;
  border-top: 1px solid var(--u-border-color-light, #f1f5f9);
}
</style>
