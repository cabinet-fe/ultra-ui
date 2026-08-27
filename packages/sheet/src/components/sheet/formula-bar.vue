<template>
  <div :class="cls.e('formula-bar')">
    <input
      v-model="nameDraft"
      :class="cls.e('name-box')"
      spellcheck="false"
      autocomplete="off"
      title="单元格地址或区域（如 B3 或 B3:D5），回车跳转"
      @focus="nameFocused = true"
      @blur="handleNameBlur"
      @keydown="handleNameKeydown"
    />
    <span :class="cls.e('fx-label')">fx</span>
    <div
      :class="cls.e('fx-editor')"
      @mouseenter="handleFxMouseEnter"
      @mouseleave="handleFxMouseLeave"
    >
      <!-- 文档流只占单行；面板绝对定位向下浮起，不撑开公式栏 -->
      <div :class="[cls.e('fx-input-panel'), bem.is('expanded', fxExpanded)]">
        <textarea
          ref="fxRef"
          v-model="fxDraft"
          :class="cls.e('fx-input')"
          :disabled="fxDisabled"
          :readonly="mirroring"
          rows="1"
          spellcheck="false"
          autocomplete="off"
          title="活动单元格内容（'=' 开头为公式）；Enter 提交，Esc 取消"
          @focus="handleFxFocus"
          @blur="handleFxBlur"
          @keydown="handleFxKeydown"
          @input="handleFxInput"
          @click="syncFxCursor"
          @keyup="syncFxCursor"
          @select="syncFxCursor"
        />
        <u-formula-suggest-list
          :items="suggestItems"
          :active-index="suggestIndex"
          @select="confirmSuggest"
          @hover="(i) => (suggestIndex = i)"
        />
      </div>
    </div>
    <button
      v-if="editing"
      type="button"
      :class="cls.e('fx-btn')"
      title="提交（Enter）"
      @mousedown.prevent
      @click="commitEdit"
    >
      ✓
    </button>
    <button
      v-if="editing"
      type="button"
      :class="cls.e('fx-btn')"
      title="取消（Esc）"
      @mousedown.prevent
      @click="cancelEdit"
    >
      ✗
    </button>
  </div>
</template>

<script lang="ts" setup>
import { message } from '@veltra/desktop'
import {
  formatAddress,
  formatRange,
  parseRange,
  type CellAddress,
  type CellRange
} from '@veltra/sheet-core/core/address'
import type { SelectionState } from '@veltra/sheet-core/core/selection'
import type { Sheet } from '@veltra/sheet-core/core/sheet'
import { bem } from '@veltra/utils'
import {
  computed,
  nextTick,
  onBeforeUnmount,
  onMounted,
  ref,
  shallowRef,
  useTemplateRef,
  watch
} from 'vue'

import type { SheetContext } from '../../tools/context'
import UFormulaSuggestList from './formula-suggest-list.vue'
import { insertRefText, isRefSelectContext } from './use-formula-ref-select'
import {
  applySuggest,
  filterFormulaSuggestions,
  getSuggestContext,
  moveSuggestIndex,
  type FormulaSuggestItem
} from './use-formula-suggest'

defineOptions({ name: 'UFormulaBar' })

/**
 * 公式栏（名称框 + fx 输入栏），USheet 顶部结构之一。
 *
 * - 名称框：显示当前选区（单格 A1 / 区域 A1:B2）；合法地址回车跳转。
 * - fx 输入栏：活动格内容；Enter/✓ 提交、Esc/✗ 取消、失焦提交。
 * - 函数补全：`=` 开头且光标在函数名 token 上时弹出候选（↑↓ / Tab / Enter / 点击）。
 * - 引用选择：光标在运算符/`(`/`,` 后时，画布点选/拖选插入引用（blur 抑制防误提交）。
 * - 网格编辑镜像：只读显示网格编辑器文本。
 */
const props = defineProps<{ sheet: Sheet; context: SheetContext }>()

const cls = bem('sheet')

const fxRef = useTemplateRef<HTMLTextAreaElement>('fxRef')

const selection = shallowRef<SelectionState>({ activeCell: null, ranges: [] })
const nameDraft = ref('')
const nameFocused = ref(false)
const editing = ref(false)
let editAddr: CellAddress | null = null
const mirroring = ref(false)
let mirrorAddr: CellAddress | null = null
const fxDraft = ref('')
/** 鼠标是否悬停在公式栏输入区 */
const fxHovered = ref(false)
/** 输入框是否处于 focus 状态 */
const fxFocused = ref(false)
/** 输入面板是否因内容增高而浮出（文档流仍保持单行） */
const fxExpanded = ref(false)
/** textarea 光标（selectionStart）；输入/点击/方向键后同步 */
const fxCursor = ref(0)

/** 画布 pointerdown 置位：下一帧 blur 跳过提交（引用选择模式） */
let suppressBlurCommit = false

const suggestItems = shallowRef<FormulaSuggestItem[]>([])
const suggestIndex = ref(0)
const suggestOpen = computed(() => suggestItems.value.length > 0)

const fxDisabled = computed(() => selection.value.activeCell == null)

/** 编排层查询：fx 编辑中且光标处于可插入引用位置 */
function isRefSelecting(): boolean {
  return editing.value && !mirroring.value && isRefSelectContext(fxDraft.value, fxCursor.value)
}

/** 网格 pointerdown（capture）→ 挂起即将到来的 blur 提交 */
function beginBlurSuppress(): void {
  if (!isRefSelecting()) return
  suppressBlurCommit = true
}

/** 选区拦截回调：插入 A1 / A1:B2 到光标处 */
function handleRefSelect(range: CellRange): void {
  if (!editing.value || mirroring.value) return
  const rangeText = formatRange(range)
  const el = fxRef.value
  const selEnd = el?.selectionEnd ?? fxCursor.value
  const result = insertRefText(fxDraft.value, fxCursor.value, rangeText, selEnd)
  fxDraft.value = result.text
  fxCursor.value = result.cursor
  closeSuggest()
  void nextTick(() => {
    const input = fxRef.value
    if (!input) return
    input.focus()
    input.setSelectionRange(result.cursor, result.cursor)
    autosizeFx()
  })
}

// ─── 显示文本 ──────────────────────────────────────────────

function nameText(state: SelectionState): string {
  const range = state.ranges[0]
  if (range) {
    if (state.activeCell) {
      const merge = props.sheet.merges.getMergeAt(state.activeCell)
      if (
        merge &&
        range.start.row === merge.start.row &&
        range.start.col === merge.start.col &&
        range.end.row === merge.end.row &&
        range.end.col === merge.end.col
      ) {
        return formatAddress(state.activeCell)
      }
    }
    return formatRange(range)
  }
  return state.activeCell ? formatAddress(state.activeCell) : ''
}

function cellText(addr: CellAddress): string {
  const data = props.context.getCellData(addr)
  if (data?.f != null) return `=${data.f}`
  if (data?.v != null) return String(data.v)
  return ''
}

function refreshName(): void {
  nameDraft.value = nameText(selection.value)
}

function refreshFx(): void {
  const active = selection.value.activeCell
  fxDraft.value = active ? cellText(active) : ''
  fxCursor.value = fxDraft.value.length
  closeSuggest()
  if (fxHovered.value || fxFocused.value || editing.value) {
    scheduleAutosize()
  } else {
    collapseFx()
  }
}

/** 恢复单行高度并重置展开状态 */
function collapseFx(): void {
  const el = fxRef.value
  if (!el) return
  el.style.height = ''
  el.scrollTop = 0
  fxExpanded.value = false
}

/** 每帧合并一次的 autosizeFx（批量 cell-change 同帧 N 次 nextTick → 1 次强制布局） */
let autosizePending = false
function scheduleAutosize(): void {
  if (autosizePending) return
  autosizePending = true
  nextTick(() => {
    autosizePending = false
    autosizeFx()
  })
}

/**
 * 仅在鼠标悬停、获得焦点或编辑时按内容增高浮出面板，不超过 CSS max-height。
 * 增高走绝对定位，公式栏文档流高度始终单行。
 */
function autosizeFx(): void {
  const el = fxRef.value
  if (!el) return
  if (!fxHovered.value && !fxFocused.value && !editing.value) {
    collapseFx()
    return
  }
  el.style.height = '0px'
  const styles = getComputedStyle(el)
  const max = Number.parseFloat(styles.maxHeight)
  const min = Number.parseFloat(styles.minHeight)
  const hasMultipleLines = fxDraft.value.includes('\n')
  const content = el.scrollHeight
  const next = Number.isFinite(max) && max > 0 ? Math.min(content, max) : content
  el.style.height = `${next}px`
  fxExpanded.value = (Number.isFinite(min) ? next > min + 1 : next > 1) || hasMultipleLines
}

function handleFxMouseEnter(): void {
  fxHovered.value = true
  if (fxDraft.value) {
    autosizeFx()
  }
}

function handleFxMouseLeave(): void {
  fxHovered.value = false
  if (!fxFocused.value && !editing.value) {
    collapseFx()
  }
}

function syncFxCursor(): void {
  const el = fxRef.value
  if (!el) return
  fxCursor.value = el.selectionStart
  refreshSuggest()
}

function handleFxInput(): void {
  syncFxCursor()
  autosizeFx()
}

// ─── 函数补全 ──────────────────────────────────────────────

function closeSuggest(): void {
  suggestItems.value = []
  suggestIndex.value = 0
}

function refreshSuggest(): void {
  if (!editing.value || mirroring.value) {
    closeSuggest()
    return
  }
  const ctx = getSuggestContext(fxDraft.value, fxCursor.value)
  if (!ctx) {
    closeSuggest()
    return
  }
  const items = filterFormulaSuggestions(ctx.prefix)
  suggestItems.value = items
  if (suggestIndex.value >= items.length) suggestIndex.value = 0
}

function confirmSuggest(item?: FormulaSuggestItem): void {
  const pick = item ?? suggestItems.value[suggestIndex.value]
  if (!pick) return
  const ctx = getSuggestContext(fxDraft.value, fxCursor.value)
  if (!ctx) return
  const result = applySuggest(fxDraft.value, ctx.start, ctx.end, pick.name)
  fxDraft.value = result.text
  fxCursor.value = result.cursor
  closeSuggest()
  void nextTick(() => {
    const el = fxRef.value
    if (!el) return
    el.focus()
    el.setSelectionRange(result.cursor, result.cursor)
    autosizeFx()
    // 替换为 NAME() 后通常进入引用选择上下文，不再弹补全
    refreshSuggest()
  })
}

// ─── 名称框 ────────────────────────────────────────────────

function handleNameKeydown(event: KeyboardEvent): void {
  if (event.key === 'Enter') {
    event.preventDefault()
    commitName()
  } else if (event.key === 'Escape') {
    event.preventDefault()
    refreshName()
  }
}

function handleNameBlur(): void {
  nameFocused.value = false
  refreshName()
}

function commitName(): void {
  const range = parseRange(nameDraft.value)
  if (!range) {
    message.warn('无效的单元格地址')
    refreshName()
    return
  }
  if (range.start.row === range.end.row && range.start.col === range.end.col) {
    props.context.selectCell(range.start)
  } else {
    props.context.selectRange(range)
  }
  refreshName()
}

// ─── fx 输入栏 ─────────────────────────────────────────────

function handleFxFocus(): void {
  if (fxDisabled.value) return
  fxFocused.value = true
  mirroring.value = false
  mirrorAddr = null
  editing.value = true
  editAddr = selection.value.activeCell
  syncFxCursor()
  scheduleAutosize()
}

/**
 * 失焦提交；引用选择期间（画布 pointerdown 已挂起）跳过。
 * ✓/✗ / 候选列表用 mousedown.prevent 拦截失焦。
 */
function handleFxBlur(): void {
  fxFocused.value = false
  if (!editing.value) {
    if (!fxHovered.value) collapseFx()
    return
  }
  if (suppressBlurCommit) {
    suppressBlurCommit = false
    return
  }
  commitEdit()
  if (!fxHovered.value) collapseFx()
}

function handleFxKeydown(event: KeyboardEvent): void {
  if (suggestOpen.value) {
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      suggestIndex.value = moveSuggestIndex(suggestIndex.value, suggestItems.value.length, 1)
      return
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault()
      suggestIndex.value = moveSuggestIndex(suggestIndex.value, suggestItems.value.length, -1)
      return
    }
    if (event.key === 'Enter' || event.key === 'Tab') {
      event.preventDefault()
      confirmSuggest()
      return
    }
    if (event.key === 'Escape') {
      event.preventDefault()
      closeSuggest()
      return
    }
  }

  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault()
    commitEdit()
  } else if (event.key === 'Escape') {
    event.preventDefault()
    cancelEdit()
  }
}

function commitEdit(): void {
  if (!editing.value) return
  const addr = editAddr
  editing.value = false
  editAddr = null
  suppressBlurCommit = false
  closeSuggest()
  if (addr) props.context.setCellValue(addr, fxDraft.value)
  refreshFx()
}

function cancelEdit(): void {
  if (!editing.value) return
  editing.value = false
  editAddr = null
  suppressBlurCommit = false
  closeSuggest()
  refreshFx()
}

// ─── 双向同步 ──────────────────────────────────────────────

function handleSelectionChange(state: SelectionState): void {
  selection.value = state
  if (!nameFocused.value) refreshName()
  if (editing.value) return
  mirroring.value = false
  mirrorAddr = null
  refreshFx()
}

function handleCellChange({ addr }: { addr: CellAddress }): void {
  if (editing.value) return
  if (mirroring.value) {
    if (mirrorAddr && addr.row === mirrorAddr.row && addr.col === mirrorAddr.col) {
      mirroring.value = false
      mirrorAddr = null
      refreshFx()
    }
    return
  }
  // 公式栏只显示活动格：非活动格变更（批量写入的绝大多数补丁）直接忽略，
  // 避免每个 cell-change 都 refreshFx + nextTick(autosizeFx) 强制同步布局（#5）
  const active = selection.value.activeCell
  if (!active || addr.row !== active.row || addr.col !== active.col) return
  refreshFx()
}

function mirrorGridEdit(addr: CellAddress): void {
  if (editing.value || fxDisabled.value) return
  mirroring.value = true
  mirrorAddr = addr
  fxDraft.value = cellText(addr)
  closeSuggest()
}

function exitMirror(addr: CellAddress): void {
  if (!mirroring.value) return
  if (mirrorAddr && addr.row === mirrorAddr.row && addr.col === mirrorAddr.col) {
    mirroring.value = false
    mirrorAddr = null
    refreshFx()
  }
}

defineExpose({ mirrorGridEdit, exitMirror, isRefSelecting, beginBlurSuppress, handleRefSelect })

// ─── 生命周期 ──────────────────────────────────────────────

let dispose: (() => void)[] = []
function bindSheet(sheet: Sheet): void {
  for (const off of dispose) off()
  dispose = [
    sheet.on('selection-change', handleSelectionChange),
    sheet.on('cell-change', handleCellChange)
  ]
}

watch(
  () => props.sheet,
  (sheet, prev) => {
    if (sheet === prev) return
    editing.value = false
    editAddr = null
    mirroring.value = false
    mirrorAddr = null
    suppressBlurCommit = false
    closeSuggest()
    bindSheet(sheet)
    selection.value = sheet.getSelection()
    refreshName()
    refreshFx()
  }
)

onMounted(() => {
  bindSheet(props.sheet)
  selection.value = props.sheet.getSelection()
  refreshName()
  refreshFx()
})

onBeforeUnmount(() => {
  for (const off of dispose) off()
  dispose = []
})
</script>
