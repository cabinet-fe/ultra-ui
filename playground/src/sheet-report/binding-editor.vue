<template>
  <div v-show="visible" class="binding-editor" :style="cardStyle" @mousedown.stop @pointerdown.stop>
    <template v-if="binding && cell">
      <header class="binding-editor__header">
        <span class="binding-editor__addr">{{ formatCellAddress(cell) }}</span>
        <span class="binding-editor__placeholder">{{ formatBindingPlaceholder(binding) }}</span>
      </header>

      <section class="binding-editor__section">
        <div class="binding-editor__label">聚合方式</div>
        <u-radio-group
          size="small"
          :items="aggregateOptions"
          :model-value="binding.aggregate"
          @update:model-value="onAggregate"
        />
      </section>

      <section class="binding-editor__section">
        <div class="binding-editor__label">扩展方向</div>
        <u-radio-group
          size="small"
          :items="expandOptions"
          :model-value="binding.expand"
          :disabled-item="disableExpandItem"
          @update:model-value="onExpand"
        />
      </section>

      <section class="binding-editor__section">
        <div class="binding-editor__label">左父格</div>
        <u-radio-group
          size="small"
          :items="leftParentModeOptions"
          :model-value="leftParentMode"
          @update:model-value="onLeftParentMode"
        />
        <u-input
          v-if="leftParentMode === 'specify'"
          v-model="addressInput"
          size="small"
          class="binding-editor__address"
          placeholder="如 B2"
          @change="commitAddress"
        />
        <p v-if="leftParentMode === 'default'" class="binding-editor__hint">
          解析结果：{{ resolvedLeftParentLabel }}
        </p>
      </section>

      <footer class="binding-editor__footer">
        <u-button size="small" type="danger" plain @click="emit('remove')">删除绑定</u-button>
      </footer>
    </template>
  </div>
</template>

<script lang="ts" setup>
import type { CellAddress } from '@veltra/sheet-core'
import type { SheetGrid } from '@veltra/sheet-core/grid/sheet-grid'
import { computed, onBeforeUnmount, ref, watch } from 'vue'

import {
  aggregateDefaultExpand,
  formatBindingPlaceholder,
  formatCellAddress,
  parseCellAddress
} from './binding'
import type { ReportAggregate, ReportBinding, ReportExpand, ReportLeftParent } from './types'

defineOptions({ name: 'SheetReportBindingEditor' })

type LeftParentMode = 'none' | 'default' | 'specify'

const props = defineProps<{
  cell: CellAddress | null
  binding: ReportBinding | null
  resolvedLeftParentLabel: string
  /** 网格宿主（相对定位容器） */
  hostEl: HTMLElement | null
  getGrid: () => SheetGrid | undefined
}>()

const emit = defineEmits<{ patch: [patch: Partial<ReportBinding>]; remove: [] }>()

const aggregateOptions = [
  { value: 'select' as const, label: '列表' },
  { value: 'group' as const, label: '分组' },
  { value: 'sum' as const, label: '求和' }
]

const expandOptions = [
  { value: 'down' as const, label: '纵向' },
  { value: 'none' as const, label: '不扩展' }
]

const leftParentModeOptions = [
  { value: 'none' as const, label: '无' },
  { value: 'default' as const, label: '默认' },
  { value: 'specify' as const, label: '指定' }
]

const addressInput = ref('')
const cardLeft = ref(0)
const cardTop = ref(0)
const inView = ref(false)

let offScroll: (() => void) | undefined
let rafId = 0

const leftParentMode = computed((): LeftParentMode => {
  const binding = props.binding
  if (!binding) return 'default'
  if (binding.leftParent === 'none') return 'none'
  if (binding.leftParent === 'default') return 'default'
  return 'specify'
})

const visible = computed(() => !!props.binding && !!props.cell && inView.value)

const cardStyle = computed(() => ({ left: `${cardLeft.value}px`, top: `${cardTop.value}px` }))

watch(
  () => props.binding,
  (binding) => {
    if (!binding || binding.leftParent === 'none' || binding.leftParent === 'default') {
      addressInput.value = ''
      return
    }
    addressInput.value = formatCellAddress(binding.leftParent)
  },
  { immediate: true }
)

watch(
  () => [props.cell, props.binding, props.hostEl] as const,
  () => {
    bindScroll()
    scheduleUpdatePosition()
  },
  { immediate: true, flush: 'post' }
)

function disableExpandItem(item: Record<string, unknown>): boolean {
  return props.binding?.aggregate === 'sum' && item.value === 'down'
}

function onAggregate(value: ReportAggregate): void {
  emit('patch', { aggregate: value, expand: aggregateDefaultExpand(value) })
}

function onExpand(value: ReportExpand): void {
  emit('patch', { expand: value })
}

function onLeftParentMode(mode: LeftParentMode): void {
  if (mode === 'specify') {
    const fallback = props.cell ?? { row: 0, col: 0 }
    addressInput.value = formatCellAddress(fallback)
    emit('patch', { leftParent: fallback satisfies ReportLeftParent })
    return
  }
  emit('patch', { leftParent: mode })
}

function commitAddress(): void {
  const parsed = parseCellAddress(addressInput.value)
  if (!parsed) return
  emit('patch', { leftParent: parsed })
}

function scheduleUpdatePosition(): void {
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

  const table = grid.getTable()
  // VTable 坐标 = 模型地址 + 行号列/列头偏移（通常 +1）
  let cellRect: { left: number; top: number; right: number; bottom: number }
  try {
    cellRect = table.getCellRelativeRect(cell.col + 1, cell.row + 1) as {
      left: number
      top: number
      right: number
      bottom: number
    }
  } catch {
    inView.value = false
    return
  }

  const gridEl = host.querySelector('.u-sheet__grid-instance') as HTMLElement | null
  if (!gridEl) {
    inView.value = false
    return
  }

  const hostBox = host.getBoundingClientRect()
  const gridBox = gridEl.getBoundingClientRect()
  const offsetX = gridBox.left - hostBox.left
  const offsetY = gridBox.top - hostBox.top

  const viewW = gridEl.clientWidth
  const viewH = gridEl.clientHeight
  const outOfView =
    cellRect.bottom < 0 || cellRect.right < 0 || cellRect.top > viewH || cellRect.left > viewW

  if (outOfView) {
    inView.value = false
    return
  }

  inView.value = true
  // 浮卡贴在单元格右侧，略向下偏移
  cardLeft.value = Math.round(offsetX + cellRect.right + 8)
  cardTop.value = Math.round(offsetY + cellRect.top)
}

function bindScroll(): void {
  offScroll?.()
  offScroll = undefined
  const grid = props.getGrid()
  if (!grid) return

  const table = grid.getTable()
  const onScroll = (): void => scheduleUpdatePosition()
  // VTable SCROLL 事件名（避免 playground 直接依赖 @visactor/vtable）
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
.binding-editor {
  position: absolute;
  z-index: 20;
  width: 220px;
  padding: 10px 12px;
  border: 1px solid var(--u-border-color, #e2e8f0);
  border-radius: 8px;
  background: var(--u-bg-color, #fff);
  box-shadow: 0 8px 24px rgb(15 23 42 / 12%);
  pointer-events: auto;
}

.binding-editor__header {
  display: flex;
  flex-direction: column;
  gap: 2px;
  margin-bottom: 10px;
}

.binding-editor__addr {
  font-size: 12px;
  font-weight: 600;
  color: var(--u-text-color-secondary, #64748b);
}

.binding-editor__placeholder {
  font-size: 13px;
  font-weight: 500;
  color: var(--u-color-primary, #2563eb);
  word-break: break-all;
}

.binding-editor__section {
  margin-bottom: 10px;
}

.binding-editor__label {
  margin-bottom: 4px;
  font-size: 12px;
  font-weight: 500;
  color: var(--u-text-color-secondary, #64748b);
}

.binding-editor__address {
  margin-top: 6px;
}

.binding-editor__hint {
  margin: 6px 0 0;
  font-size: 12px;
  color: var(--u-text-color-secondary, #64748b);
}

.binding-editor__footer {
  display: flex;
  justify-content: flex-end;
  padding-top: 4px;
  border-top: 1px solid var(--u-border-color-light, #f1f5f9);
}
</style>
