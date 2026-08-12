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
          :model-value="currentPresetValue"
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
        <u-select
          size="small"
          :class="[cls.e('select'), cls.em('select', 'expand')]"
          :model-value="binding.expand"
          :options="expandOptions"
          @update:model-value="onExpand"
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
        <div :class="cls.e('section-label')">扩展实例合并单元格</div>
        <u-switch
          size="small"
          :model-value="binding.mergeSpan !== false"
          @update:model-value="onMergeSpan"
        />
      </section>

      <section :class="cls.e('section')">
        <div :class="cls.e('section-label')">行方向父格</div>
        <p :class="cls.e('hint')">当前：{{ resolvedRowParentLabel }}</p>
        <div :class="cls.e('parent-actions')">
          <u-button
            size="small"
            plain
            :type="parentPickMode === 'row' ? 'primary' : undefined"
            @click="emit('start-parent-pick', 'row')"
          >
            {{ parentPickMode === 'row' ? '点选目标格…' : '设置行方向父格' }}
          </u-button>
          <u-select
            v-if="rowParentOptions.length > 0"
            size="small"
            :class="cls.e('parent-select')"
            placeholder="候选格"
            :model-value="rowParentSelectValue"
            :options="rowParentOptions"
            @update:model-value="onRowParentSelect"
          />
          <u-button
            v-if="binding.rowParent"
            size="small"
            text
            type="danger"
            @click="emit('clear-parent', 'row')"
          >
            清除
          </u-button>
        </div>
      </section>

      <section :class="cls.e('section')">
        <div :class="cls.e('section-label')">列方向父格</div>
        <p :class="cls.e('hint')">当前：{{ resolvedColParentLabel }}</p>
        <div :class="cls.e('parent-actions')">
          <u-button
            size="small"
            plain
            :type="parentPickMode === 'col' ? 'primary' : undefined"
            @click="emit('start-parent-pick', 'col')"
          >
            {{ parentPickMode === 'col' ? '点选目标格…' : '设置列方向父格' }}
          </u-button>
          <u-select
            v-if="colParentOptions.length > 0"
            size="small"
            :class="cls.e('parent-select')"
            placeholder="候选格"
            :model-value="colParentSelectValue"
            :options="colParentOptions"
            @update:model-value="onColParentSelect"
          />
          <u-button
            v-if="binding.colParent"
            size="small"
            text
            type="danger"
            @click="emit('clear-parent', 'col')"
          >
            清除
          </u-button>
        </div>
      </section>

      <footer :class="cls.e('footer')">
        <u-button v-if="parentPickMode" size="small" plain @click="emit('cancel-parent-pick')">
          取消点选
        </u-button>
        <u-button size="small" type="danger" plain @click="emit('remove')">删除绑定</u-button>
      </footer>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { UButton, URadioGroup, USelect, USwitch } from '@veltra/desktop'
import type { CellAddress, SheetGrid } from '@veltra/sheet-core'
import { bem } from '@veltra/utils'
import { computed, nextTick, ref, toRef, watch } from 'vue'

import {
  formatBindingPlaceholder,
  formatCellAddress,
  inferReportPreset
} from '../../../report/binding'
import type {
  ReportAggregate,
  ReportBinding,
  ReportExpand,
  ReportPreset,
  ReportSort
} from '../../../report/types'
import type { ParentPickMode } from '../use-report-designer'
import { resolveGridOverlayLayout } from './cell-coords'
import { REPORT_PRESET_OPTIONS, presetBindingDefaults } from './role'
import {
  readCellOverlayRect,
  resolveBindingFloatPanelPosition,
  useGridOverlaySync
} from './use-grid-overlay'

defineOptions({ name: 'UReportFloatPanel' })

const CUSTOM_PRESET_VALUE = '__custom__'

const props = defineProps<{
  cell: CellAddress | null
  binding: ReportBinding | null
  resolvedRowParentLabel: string
  resolvedColParentLabel: string
  parentPickMode: ParentPickMode | null
  rowParentCandidates: CellAddress[]
  colParentCandidates: CellAddress[]
  resolveFieldLabel?: (datasetId: string, fieldName: string) => string
  hostEl: HTMLElement | null
  getGrid: () => SheetGrid | undefined
}>()

const emit = defineEmits<{
  patch: [patch: Partial<ReportBinding>]
  remove: []
  'open-rules': []
  'start-parent-pick': [mode: ParentPickMode]
  'cancel-parent-pick': []
  'clear-parent': [mode: ParentPickMode]
}>()

const cls = bem('report-float-panel')

const hostEl = toRef(props, 'hostEl')
const panelRef = ref<HTMLElement | null>(null)
const expanded = ref(false)
const placement = ref<'above' | 'below'>('above')

const presetOptions = computed(() => {
  const options = REPORT_PRESET_OPTIONS.map((item) => ({ ...item }))
  if (props.binding && inferReportPreset(props.binding) === null) {
    options.unshift({ value: CUSTOM_PRESET_VALUE as ReportPreset, label: '自定义' })
  }
  return options
})

const aggregateOptions = [
  { value: 'list' as const, label: '明细' },
  { value: 'group' as const, label: '分组' },
  { value: 'sum' as const, label: '求和' },
  { value: 'avg' as const, label: '平均' },
  { value: 'count' as const, label: '计数' },
  { value: 'max' as const, label: '最大' },
  { value: 'min' as const, label: '最小' }
]

const expandOptions = [
  { value: 'down' as const, label: '向下' },
  { value: 'right' as const, label: '向右' },
  { value: 'none' as const, label: '不展开' }
]

const sortOptions = [
  { value: 'none' as const, label: '无' },
  { value: 'asc' as const, label: '升序' },
  { value: 'desc' as const, label: '降序' }
]

const panelLeft = ref(0)
const panelTop = ref(0)
const inView = ref(false)

const currentPresetValue = computed(() => {
  if (!props.binding) return 'detail'
  return inferReportPreset(props.binding) ?? CUSTOM_PRESET_VALUE
})

const summaryText = computed(() => {
  if (!props.binding) return ''
  return formatBindingPlaceholder(props.binding, props.resolveFieldLabel)
})

const rowParentOptions = computed(() =>
  props.rowParentCandidates.map((addr) => ({
    value: formatCellAddress(addr),
    label: formatCellAddress(addr)
  }))
)

const colParentOptions = computed(() =>
  props.colParentCandidates.map((addr) => ({
    value: formatCellAddress(addr),
    label: formatCellAddress(addr)
  }))
)

const rowParentSelectValue = computed(() =>
  props.binding?.rowParent ? formatCellAddress(props.binding.rowParent) : undefined
)

const colParentSelectValue = computed(() =>
  props.binding?.colParent ? formatCellAddress(props.binding.colParent) : undefined
)

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

function onPreset(preset: ReportPreset | typeof CUSTOM_PRESET_VALUE): void {
  if (preset === CUSTOM_PRESET_VALUE) return
  emit('patch', presetBindingDefaults(preset))
}

function aggregateDefaultExpand(aggregate: ReportAggregate): ReportExpand {
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

function onExpand(expand: ReportExpand): void {
  emit('patch', { expand })
}

function onSort(value: ReportSort): void {
  emit('patch', { sort: value })
}

function onMergeSpan(merged: boolean): void {
  emit('patch', { mergeSpan: merged })
}

function onRowParentSelect(label: string): void {
  const addr = props.rowParentCandidates.find((item) => formatCellAddress(item) === label)
  if (!addr) return
  emit('patch', { rowParent: { ...addr } })
}

function onColParentSelect(label: string): void {
  const addr = props.colParentCandidates.find((item) => formatCellAddress(item) === label)
  if (!addr) return
  emit('patch', { colParent: { ...addr } })
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
  const panelHeight = panelEl?.offsetHeight ?? (expanded.value ? 360 : 68)
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
    [
      props.cell?.row,
      props.cell?.col,
      props.binding,
      props.hostEl,
      expanded.value,
      props.parentPickMode
    ] as const,
  update: updatePosition
})
</script>
