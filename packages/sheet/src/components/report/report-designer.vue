<template>
  <div :class="cls.b">
    <div :class="cls.e('toolbar')">
      <u-button size="small" plain @click="hubVisible = true">数据中枢</u-button>
      <span :class="cls.e('hint')">
        在数据中枢配置连接与 SQL 数据集，再将左侧字段点击或拖拽到单元格完成绑定。
      </span>
    </div>

    <div :class="cls.e('body')">
      <u-report-field-panel
        :class="cls.e('field-panel')"
        :datasets="catalog"
        :selection-label="selectionLabel"
        :bound-keys="boundKeys"
        @bind="bindField"
      />

      <div ref="gridHostRef" :class="cls.e('grid')" @dragover="onGridDragOver" @drop="onGridDrop">
        <u-sheet
          ref="sheetRef"
          :class="cls.e('sheet')"
          :workbook="workbook"
          :rows="24"
          :cols="10"
          :show-tabs="false"
          :resolve-cell-renderer="resolveCellRenderer"
        />
      </div>
    </div>

    <u-drawer v-model="hubVisible" :class="cls.e('hub-drawer')" show-close>
      <u-report-dataset-hub :hub="designer" @close="hubVisible = false" />
    </u-drawer>
  </div>
</template>

<script lang="ts" setup>
import { UButton, UDrawer } from '@veltra/desktop'
import type { CellAddress } from '@veltra/sheet-core'
import { bem } from '@veltra/utils'
import { computed, nextTick, ref, useTemplateRef, watch } from 'vue'

import type { SheetExposed } from '../../types'
import type { ReportDesignerEmits, ReportDesignerProps, _ReportDesignerExposed } from '../../types'
import { USheet } from '../sheet'
import UReportDatasetHub from './designer-hub.vue'
import { FIELD_DRAG_MIME, parseFieldDragPayload } from './field-panel-helpers'
import UReportFieldPanel from './field-panel.vue'
import { useReportDesigner } from './use-report-designer'

defineOptions({ name: 'UReportDesigner' })

const props = withDefaults(defineProps<ReportDesignerProps>(), { connections: () => [] })
const emit = defineEmits<ReportDesignerEmits>()

const cls = bem('report-designer')

/** `v-model:connections` 可写代理（连接为纯序列化对象，仅驻留内存） */
const connections = computed({
  get: () => props.connections,
  set: (value) => emit('update:connections', value)
})

const designer = useReportDesigner({ props, connections })
const {
  workbook,
  catalog,
  boundKeys,
  selectionLabel,
  bindField,
  resolveCellRenderer,
  getTemplate
} = designer

const hubVisible = ref(false)

const sheetRef = useTemplateRef<SheetExposed>('sheetRef')
const gridHostRef = useTemplateRef<HTMLElement>('gridHostRef')

// 徽章文案依赖 catalog（describe 完成 / label 覆盖变更后重绘绑定格；meta 变更由 grid 自行订阅）
watch(catalog, () => {
  void nextTick(() => sheetRef.value?.getGrid()?.refresh())
})

function resolveDropAddress(event: DragEvent): CellAddress | null {
  const grid = sheetRef.value?.getGrid()
  const gridEl = gridHostRef.value?.querySelector('.u-sheet__grid-instance') as HTMLElement | null
  if (!grid || !gridEl) return null
  const rect = gridEl.getBoundingClientRect()
  return grid.hitTestSheetAddr(event.clientX - rect.left, event.clientY - rect.top) ?? null
}

function onGridDragOver(event: DragEvent): void {
  if (!event.dataTransfer?.types.includes(FIELD_DRAG_MIME)) return
  event.preventDefault()
  event.dataTransfer.dropEffect = 'copy'
}

function onGridDrop(event: DragEvent): void {
  event.preventDefault()
  const raw = event.dataTransfer?.getData(FIELD_DRAG_MIME)
  const payload = raw ? parseFieldDragPayload(raw) : null
  if (!payload) return

  // 与旧设计器一致：网格未就绪直接放弃；仅 hit-test 落空时回退当前选区
  const grid = sheetRef.value?.getGrid()
  const gridEl = gridHostRef.value?.querySelector('.u-sheet__grid-instance') as HTMLElement | null
  if (!grid || !gridEl) return

  const dropAddr = resolveDropAddress(event)
  if (dropAddr) {
    bindField(payload.datasetId, payload.fieldName, dropAddr)
    sheetRef.value?.getContext().selectCell(dropAddr)
  } else {
    bindField(payload.datasetId, payload.fieldName)
  }
}

defineExpose<_ReportDesignerExposed>({ getTemplate })
</script>
