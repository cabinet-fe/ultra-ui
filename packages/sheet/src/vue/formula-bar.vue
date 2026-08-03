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
      @input="autosizeFx"
    />
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

import { formatAddress, formatRange, parseRange, type CellAddress } from '../core/address'
import type { SelectionState } from '../core/selection'
import type { Sheet } from '../core/sheet'
import type { SheetContext } from '../tools/context'

defineOptions({ name: 'UFormulaBar' })

/**
 * 公式栏（名称框 + fx 输入栏），USheet 顶部结构之一。
 *
 * - 名称框：显示当前选区（单格 A1 / 区域 A1:B2，复用 core/address 序列化）；
 *   输入合法地址/区域回车跳转（Phase 2 选区回驱已就绪），非法提示且不写入。
 * - fx 输入栏：显示活动格内容（公式格 = '=' + f 原文，对齐网格编辑器先例；
 *   普通格 = 原始值文本；无选区禁用）。聚焦进入编辑态，Enter/✓ 提交
 *   （ctx.setCellValue，'=' 前缀自动公式路径），Esc/✗ 取消还原；提交后保持选区。
 * - 双向同步：订阅活动 sheet 的 selection-change / cell-change（tab 切换时
 *   watch sheet 重绑）；编辑期间忽略网格回写事件（编辑态锁，避免输入被打断）。
 * - 网格内编辑（SheetGrid.onEditStart）→ 镜像实时文本（只读，提交/取消/选区
 *   变化后退出）。
 */
const props = defineProps<{
  /** 活动 sheet（订阅 selection-change / cell-change 的事件源） */
  sheet: Sheet
  /** 工具上下文（读写活动格；tab 切换后自动指向当前 sheet） */
  context: SheetContext
}>()

const cls = bem('sheet')

const fxRef = useTemplateRef<HTMLTextAreaElement>('fxRef')

/** 当前选区（由 selection-change 同步） */
const selection = shallowRef<SelectionState>({ activeCell: null, ranges: [] })
/** 名称框草稿（显示 = 选区地址；聚焦输入期间不被选区事件覆盖） */
const nameDraft = ref('')
const nameFocused = ref(false)
/** fx 输入栏编辑态：聚焦即进入；编辑期间忽略网格回写事件（编辑态锁） */
const editing = ref(false)
/** 进入编辑时的活动格（提交写这里；编辑期间选区变化不影响提交目标，同 Excel） */
let editAddr: CellAddress | null = null
/** 网格内编辑镜像：只读显示网格编辑器实时文本 */
const mirroring = ref(false)
let mirrorAddr: CellAddress | null = null
const fxDraft = ref('')

const fxDisabled = computed(() => selection.value.activeCell == null)

// ─── 显示文本 ──────────────────────────────────────────────

/** 选区 → 名称框文本：单格 = A1 风格，区域 = A1:B2（复用 core/address 序列化） */
function nameText(state: SelectionState): string {
  const range = state.ranges[0]
  if (range) return formatRange(range)
  return state.activeCell ? formatAddress(state.activeCell) : ''
}

/** 活动格 → fx 输入栏文本：公式格 = '=' + f 原文（对齐 FormulaAwareInputEditor 先例），普通格 = 原始值 */
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
  void nextTick(autosizeFx)
}

/** 多行输入自动增高（选做 7；CSS min-height 兜底，无头环境下 scrollHeight 为 0） */
function autosizeFx(): void {
  const el = fxRef.value
  if (!el) return
  el.style.height = '0px'
  el.style.height = `${el.scrollHeight}px`
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

/** 失焦：还原为当前选区地址（回车才是跳转入口，避免与网格点击抢选区） */
function handleNameBlur(): void {
  nameFocused.value = false
  refreshName()
}

/** 合法地址/区域回车 → selectCell / selectRange 跳转（选区回驱自动滚动可见）；非法提示且不写入 */
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
  mirroring.value = false
  mirrorAddr = null
  editing.value = true
  editAddr = selection.value.activeCell
}

/**
 * 失焦提交（Excel 语义：点击网格等场景自然提交）；
 * ✓/✗ 按钮用 mousedown.prevent 拦截失焦，避免先提交再取消的竞态。
 */
function handleFxBlur(): void {
  if (!editing.value) return
  commitEdit()
}

function handleFxKeydown(event: KeyboardEvent): void {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault()
    commitEdit()
  } else if (event.key === 'Escape') {
    event.preventDefault()
    cancelEdit()
  }
}

/** 提交：ctx.setCellValue（'=' 前缀自动公式路径）；提交后保持当前选区（不触碰选区） */
function commitEdit(): void {
  if (!editing.value) return
  const addr = editAddr
  editing.value = false
  editAddr = null
  if (addr) props.context.setCellValue(addr, fxDraft.value)
  refreshFx()
}

/** 取消：还原为模型内容（不改模型） */
function cancelEdit(): void {
  if (!editing.value) return
  editing.value = false
  editAddr = null
  refreshFx()
}

// ─── 双向同步（订阅活动 sheet 的 selection-change / cell-change） ──

function handleSelectionChange(state: SelectionState): void {
  selection.value = state
  if (!nameFocused.value) refreshName()
  if (editing.value) return // 编辑态锁：网格选区变化不打断输入
  mirroring.value = false
  mirrorAddr = null
  refreshFx()
}

function handleCellChange({ addr }: { addr: CellAddress }): void {
  if (editing.value) return // 编辑态锁
  if (mirroring.value) {
    // 网格编辑提交（模型已回写活动格）→ 退出镜像并显示模型内容
    if (mirrorAddr && addr.row === mirrorAddr.row && addr.col === mirrorAddr.col) {
      mirroring.value = false
      mirrorAddr = null
      refreshFx()
    }
    return
  }
  refreshFx()
}

/** 网格编辑器打开（SheetGrid.onEditStart）→ 镜像显示公式原文 / 当前文本 */
function mirrorGridEdit(addr: CellAddress): void {
  if (editing.value || fxDisabled.value) return
  mirroring.value = true
  mirrorAddr = addr
  fxDraft.value = cellText(addr)
}

/** 网格编辑结束（SheetGrid.onEditEnd，提交/取消）→ 退出镜像并显示模型内容 */
function exitMirror(addr: CellAddress): void {
  if (!mirroring.value) return
  if (mirrorAddr && addr.row === mirrorAddr.row && addr.col === mirrorAddr.col) {
    mirroring.value = false
    mirrorAddr = null
    refreshFx()
  }
}

defineExpose({ mirrorGridEdit, exitMirror })

// ─── 生命周期：订阅活动 sheet（tab 切换时 watch 重绑并刷新） ──

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
    // 重置编辑态 / 镜像态：避免把编辑草稿提交到新 sheet 的旧坐标（editAddr 是旧 sheet 的），
    // 也避免镜像态残留（编辑中切 tab 时网格 release 不触发 onEnd）
    editing.value = false
    editAddr = null
    mirroring.value = false
    mirrorAddr = null
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
