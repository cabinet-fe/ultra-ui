<template>
  <div
    v-if="binding && cell"
    v-show="visible"
    ref="panelRef"
    :class="[cls.b, cls.m(placement), expanded ? cls.m('expanded') : '']"
    :style="panelStyle"
    @mousedown.stop
    @pointerdown.stop
  >
    <div :class="cls.e('bar')">
      <div :class="cls.e('summary')" :title="summaryText">
        {{ summaryText }}
      </div>
      <div :class="cls.e('toolbar')">
        <u-select
          size="small"
          :class="[cls.e('select'), cls.em('select', 'role')]"
          :model-value="currentPreset"
          :options="presetOptions"
          @update:model-value="onPreset"
        />
        <u-select
          size="small"
          :class="[cls.e('select'), cls.em('select', 'aggregate')]"
          :model-value="binding.aggregate"
          :options="aggregateOptions"
          @update:model-value="onAggregate"
        />
        <u-button size="small" plain @click="emit('open-rules')">条件样式</u-button>
        <u-button
          size="small"
          text
          :class="cls.e('expand')"
          :title="expanded ? '收起' : '展开更多'"
          @click="expanded = !expanded"
        >
          {{ expanded ? '收起' : '展开' }}
        </u-button>
      </div>
    </div>

    <div v-if="expanded" :class="cls.e('body')">
      <section :class="cls.e('section')">
        <div :class="cls.e('section-label')">数据集</div>
        <p :class="cls.e('hint')">{{ binding.dataset }}</p>
      </section>

      <section :class="cls.e('section')">
        <div :class="cls.e('section-label')">排序</div>
        <u-radio-group
          size="small"
          :items="sortOptions"
          :model-value="binding.sort ?? 'none'"
          @update:model-value="onSort"
        />
      </section>

      <section :class="cls.e('section')">
        <div :class="cls.e('section-label')">父分组</div>
        <p :class="cls.e('hint')">解析结果：{{ resolvedLeftParentLabel }}</p>
      </section>

      <footer :class="cls.e('footer')">
        <u-button size="small" type="danger" plain @click="emit('remove')">删除绑定</u-button>
      </footer>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { UButton, URadioGroup, USelect } from '@veltra/desktop'
import type { CellAddress, SheetGrid } from '@veltra/sheet-core'
import { bem } from '@veltra/utils'
import { computed, nextTick, ref, toRef, watch } from 'vue'

import { formatBindingPlaceholder, inferReportPreset } from '../../../report/binding'
import type {
  ReportAggregate,
  ReportBinding,
  ReportPreset,
  ReportSort
} from '../../../report/types'
import { resolveGridOverlayLayout } from './cell-coords'
import { REPORT_PRESET_OPTIONS, presetBindingDefaults } from './role'
import {
  readCellOverlayRect,
  resolveBindingFloatPanelPosition,
  useGridOverlaySync
} from './use-grid-overlay'

defineOptions({ name: 'UReportFloatPanel' })

const props = defineProps<{
  cell: CellAddress | null
  binding: ReportBinding | null
  resolvedLeftParentLabel: string
  resolveFieldLabel?: (datasetId: string, fieldName: string) => string
  hostEl: HTMLElement | null
  getGrid: () => SheetGrid | undefined
}>()

const emit = defineEmits<{ patch: [patch: Partial<ReportBinding>]; remove: []; 'open-rules': [] }>()

const cls = bem('report-float-panel')

const hostEl = toRef(props, 'hostEl')
const panelRef = ref<HTMLElement | null>(null)
const expanded = ref(false)
const placement = ref<'above' | 'below'>('above')

const presetOptions = REPORT_PRESET_OPTIONS

const aggregateOptions = [
  { value: 'list' as const, label: '明细' },
  { value: 'group' as const, label: '分组' },
  { value: 'sum' as const, label: '求和' },
  { value: 'avg' as const, label: '平均' },
  { value: 'count' as const, label: '计数' },
  { value: 'max' as const, label: '最大' },
  { value: 'min' as const, label: '最小' }
]

const sortOptions = [
  { value: 'none' as const, label: '无' },
  { value: 'asc' as const, label: '升序' },
  { value: 'desc' as const, label: '降序' }
]

const panelLeft = ref(0)
const panelTop = ref(0)
const inView = ref(false)

const currentPreset = computed((): ReportPreset => {
  if (!props.binding) return 'detail'
  return inferReportPreset(props.binding) ?? 'detail'
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

function onPreset(preset: ReportPreset): void {
  emit('patch', presetBindingDefaults(preset))
}

function aggregateDefaultExpand(aggregate: ReportAggregate): ReportBinding['expand'] {
  return aggregate === 'sum' ||
    aggregate === 'avg' ||
    aggregate === 'count' ||
    aggregate === 'max' ||
    aggregate === 'min'
    ? 'none'
    : 'down'
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
