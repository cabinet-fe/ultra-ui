<template>
  <div ref="rootRef" :class="cls.b">
    <div v-if="showToolbar" :class="cls.e('toolbar')">
      <template v-for="(group, groupIndex) in toolGroups" :key="group.name">
        <span v-if="groupIndex > 0" :class="cls.e('toolbar-divider')" />
        <button
          v-for="item in group.tools"
          :key="item.tool.id"
          type="button"
          :class="[cls.e('tool'), bem.is('active', item.active)]"
          :disabled="item.disabled"
          :title="item.tool.tooltip ?? item.tool.title"
          @click="handleToolClick(item.tool)"
        >
          <component :is="item.tool.icon" v-if="item.tool.icon" :class="cls.e('tool-icon')" />
          <span>{{ item.tool.title }}</span>
        </button>
      </template>
    </div>

    <!-- 弹层型工具面板（填充颜色 / 边框）：面板交互走 SheetContext 命令入口 -->
    <div v-if="popupTool" :class="cls.e('popup')" @click.stop>
      <template v-if="popupTool.popup === 'fill-color'">
        <u-palette :model-value="fillColor" @update:model-value="applyFillColor" />
      </template>
      <template v-else-if="popupTool.popup === 'border'">
        <div :class="cls.e('popup-row')">
          <span :class="cls.e('popup-label')">线型</span>
          <button
            v-for="line in BORDER_LINE_STYLES"
            :key="line"
            type="button"
            :class="[cls.e('popup-line'), bem.is('active', borderLineStyle === line)]"
            :title="BORDER_LINE_TITLES[line]"
            @click="borderLineStyle = line"
          >
            <span :class="cls.e('popup-line-swatch')" :style="lineSwatchStyle(line)" />
          </button>
        </div>
        <div :class="cls.e('popup-row')">
          <span :class="cls.e('popup-label')">颜色</span>
          <u-palette
            :model-value="borderColor"
            @update:model-value="(value) => (borderColor = value || borderColor)"
          />
        </div>
        <div :class="cls.e('popup-row')">
          <button
            v-for="preset in BORDER_PRESETS"
            :key="preset.id"
            type="button"
            :class="cls.e('popup-preset')"
            @click="applyBorderPreset(preset.id)"
          >
            {{ preset.title }}
          </button>
        </div>
      </template>
      <template v-else-if="popupTool.popup === 'find'">
        <div :class="cls.e('find-row')">
          <u-input
            v-model="findQuery"
            :placeholder="'查找内容'"
            size="small"
            :class="cls.e('find-input')"
            @keydown="handleFindKeydown"
          />
          <span :class="cls.e('find-count')">{{ findCountText }}</span>
          <button
            type="button"
            :class="cls.e('find-nav')"
            :disabled="!canFind"
            title="上一个（Shift+Enter）"
            @click="findPrevious"
          >
            ↑
          </button>
          <button
            type="button"
            :class="cls.e('find-nav')"
            :disabled="!canFind"
            title="下一个（Enter）"
            @click="findForward"
          >
            ↓
          </button>
          <button type="button" :class="cls.e('find-close')" title="关闭" @click="closePopup">
            ✕
          </button>
        </div>
        <div :class="cls.e('find-row')">
          <u-input
            v-model="findReplace"
            placeholder="替换为"
            size="small"
            :class="cls.e('find-input')"
            @keydown="handleFindKeydown"
          />
          <button
            type="button"
            :class="cls.e('find-btn')"
            :disabled="!canReplace"
            @click="replaceCurrent"
          >
            替换
          </button>
          <button
            type="button"
            :class="cls.e('find-btn')"
            :disabled="!canReplace"
            @click="replaceAll"
          >
            全部替换
          </button>
        </div>
        <div :class="cls.e('find-row')">
          <label :class="cls.e('find-option')">
            <input v-model="caseSensitive" type="checkbox" />区分大小写
          </label>
          <label :class="cls.e('find-option')">
            <input v-model="wholeCell" type="checkbox" />整格匹配
          </label>
          <label :class="cls.e('find-option')">
            查找
            <select v-model="searchIn" :class="cls.e('find-select')">
              <option value="value">按显示值</option>
              <option value="formula">按公式</option>
            </select>
          </label>
        </div>
      </template>
      <template v-else-if="popupTool.popup === 'import'">
        <u-file-picker accept=".xlsx,.csv" :class="cls.e('import-picker')" @pick="handleImportPick">
          <div :class="cls.e('import-hint')">
            选择 .xlsx / .csv 文件
            <div :class="cls.e('import-sub')">
              xlsx 将替换当前工作簿（需确认），csv 写入当前工作表
            </div>
          </div>
        </u-file-picker>
      </template>
    </div>

    <u-formula-bar
      v-if="showFormulaBar"
      ref="formulaBarRef"
      :sheet="activeSheet"
      :context="context"
    />

    <div ref="gridRef" :class="cls.e('grid')" />

    <div v-if="showTabs" :class="cls.e('tabs')">
      <div
        v-for="(sheet, index) in sheetList"
        :key="sheet"
        :class="[cls.e('tab'), bem.is('active', index === activeIndex)]"
        title="右键重命名 / 删除"
        @click="handleTabClick(index)"
        @contextmenu.prevent="handleTabContextMenu($event, sheet, index)"
      >
        <input
          v-if="renamingIndex === index"
          ref="renameInputRef"
          v-model="renameDraft"
          :class="cls.e('tab-rename-input')"
          :maxlength="31"
          @click.stop
          @keydown.enter.prevent="commitRename"
          @keydown.esc.prevent="cancelRename"
          @blur="commitRename"
        />
        <span v-else>{{ sheet.name }}</span>
      </div>
      <button type="button" :class="cls.e('tab-add')" title="添加工作表" @click="handleAddSheet">
        +
      </button>
    </div>
  </div>
</template>

<script lang="ts" setup>
import {
  contextmenu,
  message,
  messageConfirm,
  UFilePicker,
  UInput,
  UPalette
} from '@veltra/desktop'
import { bem } from '@veltra/utils'
import { computed, onBeforeUnmount, onMounted, ref, shallowRef, useTemplateRef, watch } from 'vue'

import { iterateRange, rangeContainsAddress, type CellRange } from '../core/address'
import { inferCellType, type CellData } from '../core/cell-store'
import type { SetCellStyleItem } from '../core/command/set-cell-style'
import { findAll, findNext, findPrev, type FindMatch, type FindOptions } from '../core/find'
import { importCsv, importXlsx, replaceWorkbook } from '../core/io/import'
import type { Sheet } from '../core/sheet'
import {
  BORDER_STYLE_WIDTH,
  type BorderEdge,
  type BorderLineStyle,
  type CellStylePatch
} from '../core/style/types'
import { Workbook } from '../core/workbook'
import { SheetGrid, type SheetGridContextMenuInfo } from '../grid/sheet-grid'
import { createSheetContext } from '../tools/context'
import { defaultToolRegistry, type SheetTool } from '../tools/registry'
import type { SheetEmits, SheetProps, _SheetExposed } from '../types'
import UFormulaBar from './formula-bar.vue'

defineOptions({ name: 'USheet' })

const props = withDefaults(defineProps<SheetProps>(), {
  rows: 100,
  cols: 26,
  showToolbar: true,
  showFormulaBar: true,
  showTabs: true
})

const emit = defineEmits<SheetEmits>()

const cls = bem('sheet')

/** 工作簿：外部传入或内部自建（单 sheet） */
const internalWorkbook = new Workbook()
const workbook = computed(() => props.workbook ?? internalWorkbook)

/** 激活 sheet 索引（镜像 workbook.activeSheetIndex，经事件同步） */
const activeIndex = ref(workbook.value.activeSheetIndex)
/** sheet 列表（tabs 渲染；由 sheets-change 同步） */
const sheetList = shallowRef<Sheet[]>(workbook.value.getSheets())
const activeSheet = computed(() => sheetList.value[activeIndex.value] ?? workbook.value.activeSheet)

/** 工具上下文：动态解析活动 sheet，tab 切换后自动指向当前 sheet */
const context = createSheetContext(() => activeSheet.value, workbook.value)

const gridRef = useTemplateRef<HTMLElement>('gridRef')
const formulaBarRef = useTemplateRef<InstanceType<typeof UFormulaBar>>('formulaBarRef')
let grid: SheetGrid | undefined

// ─── 工具栏状态刷新 ─────────────────────────────────────────
// 工具 visible/disabled 是 (ctx) => boolean 纯函数，状态源变化时 bump 触发重算

const stateTick = ref(0)
const bump = (): void => {
  stateTick.value++
}

let disposeSheetEvents: (() => void)[] = []
/** 订阅活动 sheet 的状态源（tab 切换 / 工作簿变更时重绑） */
function bindSheetEvents(sheet: Sheet): void {
  for (const dispose of disposeSheetEvents) dispose()
  disposeSheetEvents = [
    sheet.on('selection-change', bump),
    sheet.on('history-change', bump),
    sheet.on('cell-change', bump),
    sheet.on('merge-change', bump),
    sheet.on('frozen-change', bump)
  ]
}

let disposeWorkbookEvents: (() => void)[] = []
function bindWorkbookEvents(wb: Workbook): void {
  for (const dispose of disposeWorkbookEvents) dispose()
  disposeWorkbookEvents = [
    wb.on('sheets-change', ({ sheets }) => {
      sheetList.value = sheets
      bump()
    }),
    wb.on('sheet-rename', () => {
      // sheet 对象未变（浅引用），换新数组引用触发 tab 文本重渲染
      sheetList.value = workbook.value.getSheets()
      bump()
    }),
    wb.on('active-sheet-change', ({ sheet, index }) => {
      closePopup() // tab 切换：关闭弹层并提交面板事务
      activeIndex.value = index
      bindSheetEvents(sheet)
      rebuildGrid()
      bump()
      emit('active-sheet-change', { sheet, index })
    })
  ]
}

const offRegistryChange = defaultToolRegistry.onChange(bump)

// ─── 工具栏 ────────────────────────────────────────────────

const toolGroups = computed(() => {
  void stateTick.value // 依赖状态源：选区 / 历史 / 单元格 / 合并 / 注册表
  return defaultToolRegistry
    .getGroups()
    .map((group) => ({
      name: group.name,
      tools: group.tools
        .map((tool) => ({
          tool,
          visible: tool.visible?.(context) ?? true,
          disabled: tool.disabled?.(context) ?? false,
          active: tool.active?.(context) ?? false
        }))
        .filter((item) => item.visible)
    }))
    .filter((group) => group.tools.length > 0)
})

function handleToolClick(tool: SheetTool): void {
  if (tool.disabled?.(context)) return
  if (tool.popup) {
    // 弹层工具：同 id 再点 = 关闭；否则异步打开（避开本次 click 冒泡到 window）
    if (popupTool.value?.id === tool.id) {
      closePopup()
      return
    }
    queueMicrotask(() => openPopup(tool))
    return
  }
  tool.onClick(context)
}

// ─── 弹层型工具（填充颜色 / 边框）────────────────────────────

const rootRef = useTemplateRef<HTMLElement>('rootRef')

const BORDER_LINE_STYLES: BorderLineStyle[] = ['thin', 'medium', 'thick', 'dashed', 'dotted']
const BORDER_LINE_TITLES: Record<BorderLineStyle, string> = {
  thin: '细线',
  medium: '中粗线',
  thick: '粗线',
  dashed: '虚线',
  dotted: '点线'
}
const BORDER_PRESETS = [
  { id: 'all', title: '全边框' },
  { id: 'outer', title: '外边框' },
  { id: 'bottom', title: '下边框' },
  { id: 'none', title: '无边框' }
] as const
type BorderPresetId = (typeof BORDER_PRESETS)[number]['id']

/** 当前打开的弹层工具（null = 未打开） */
const popupTool = shallowRef<SheetTool | null>(null)
/** 填充颜色（'' = 无填充） */
const fillColor = ref('')
/** 边框面板：当前线型 / 颜色 */
const borderLineStyle = ref<BorderLineStyle>('thin')
const borderColor = ref('#000000')

/** 当前选区（ranges[0] 优先；无区域选区时用活动格单格） */
function currentRange(): CellRange | null {
  const { activeCell, ranges } = context.getSelection()
  return ranges[0] ?? (activeCell ? { start: activeCell, end: activeCell } : null)
}

function openPopup(tool: SheetTool): void {
  closePopup()
  popupTool.value = tool
  if (tool.popup === 'find') {
    // 查找条不参与事务：每次替换独立为一个 undo 单元
    resetFind()
    return
  }
  if (tool.popup === 'import') {
    // 导入面板不参与事务：xlsx 替换走 replaceWorkbook，csv 写入自身是单 undo 单元
    return
  }
  // 面板打开期间的所有写入合并为一个 undo 单元（关闭时提交）
  context.beginTransaction()
  const active = context.getSelection().activeCell
  const style = active ? context.getCellStyle(active) : undefined
  fillColor.value = style?.fill?.color ?? ''
  borderLineStyle.value = 'thin'
  borderColor.value = '#000000'
}

/** 关闭弹层并提交面板期间的事务（无写入则空事务，不入历史） */
function closePopup(): void {
  if (!popupTool.value) return
  const isFind = popupTool.value.popup === 'find'
  const isImport = popupTool.value.popup === 'import'
  popupTool.value = null
  if (isFind || isImport) return
  try {
    context.commit()
  } catch {
    context.rollback()
  }
}

/** 填充颜色变化（'' = 无填充：清除 fill 保留边框） */
function applyFillColor(color: string): void {
  const range = currentRange()
  if (!range) return
  context.setCellStyle(range, color ? { fill: { color } } : { fill: {} })
}

function lineSwatchStyle(line: BorderLineStyle): Record<string, string> {
  const dash = line === 'dashed' ? 'dashed' : line === 'dotted' ? 'dotted' : 'solid'
  return { borderBottom: `${BORDER_STYLE_WIDTH[line]}px ${dash} #000` }
}

/**
 * 边框预设应用（Excel 语义，逐格表达）：
 * - 全边框：每格四边；外边框：包围盒外缘边（顶行 top / 底行 bottom / 左列 left / 右列 right）
 * - 下边框：底行 bottom；无边框：清除全部边框（保留填充）
 * 一次 executeCommand（items 批量）= 一个 undo 单元。
 */
function applyBorderPreset(preset: BorderPresetId): void {
  const range = currentRange()
  if (!range) return
  const items: SetCellStyleItem[] = []
  const edge: BorderEdge = {
    style: borderLineStyle.value,
    width: BORDER_STYLE_WIDTH[borderLineStyle.value],
    color: borderColor.value
  }
  if (preset === 'none') {
    for (const addr of iterateRange(range)) items.push({ addr, partial: { border: {} } })
  } else {
    for (const addr of iterateRange(range)) {
      const border: CellStylePatch['border'] = {}
      const onTop = addr.row === range.start.row
      const onBottom = addr.row === range.end.row
      const onLeft = addr.col === range.start.col
      const onRight = addr.col === range.end.col
      if (preset === 'all' || (preset === 'outer' && onTop)) border.top = { ...edge }
      if (preset === 'all' || (preset === 'outer' && onRight)) border.right = { ...edge }
      if (preset === 'all' || ((preset === 'outer' || preset === 'bottom') && onBottom)) {
        border.bottom = { ...edge }
      }
      if (preset === 'all' || (preset === 'outer' && onLeft)) border.left = { ...edge }
      if (Object.keys(border).length > 0) items.push({ addr, partial: { border } })
    }
  }
  if (items.length === 0) return
  context.executeCommand('sheet.command.set-cell-style', { items })
}

/**
 * 点击面板外任意处关闭。面板内部 @click.stop 不冒泡到 window；
 * 触发按钮本身的点击由 handleToolClick 同步处理（打开/关闭 toggle），
 * 冒泡到达这里时 popupTool 已更新，不会误关。
 */
function onWindowClick(): void {
  if (!popupTool.value) return
  closePopup()
}

// ─── 导入（弹层型工具 import：UFilePicker 文件选择） ───────────

/**
 * 文件选择后处理：
 * - .csv → importCsv 直接写入当前活动表（事务 = 单 undo 单元）
 * - .xlsx → importXlsx 解析后经 messageConfirm 确认「替换当前工作簿」再 replaceWorkbook
 */
function handleImportPick(files: File[]): void {
  const file = files[0]
  if (!file) return
  closePopup()
  if (file.name.toLowerCase().endsWith('.csv')) {
    void file.text().then((text) => {
      importCsv(text, activeSheet.value)
      message.success(`已从 ${file.name} 导入到工作表「${activeSheet.value.name}」`)
    })
    return
  }
  void file.arrayBuffer().then((buffer) => {
    void importXlsx(new Uint8Array(buffer)).then((imported) => {
      messageConfirm.danger(
        `导入将替换当前工作簿（共 ${imported.sheetCount} 个工作表），确定吗？`,
        {
          confirmButtonText: '导入',
          onClosed: (action) => {
            if (action !== 'confirm') return
            replaceWorkbook(workbook.value, imported)
            message.success('导入完成')
          }
        }
      )
    })
  })
}

// ─── 查找条（弹层型工具 find：关键词 / 上一个 / 下一个 / 计数 / 替换） ───

const findQuery = ref('')
const findReplace = ref('')
const caseSensitive = ref(false)
const wholeCell = ref(false)
const searchIn = ref<'value' | 'formula'>('value')
/** 全部命中（行主序；core/find 纯逻辑，无头可测） */
const findMatches = shallowRef<FindMatch[]>([])
/** 当前命中在 findMatches 中的下标；-1 = 无命中 */
const findCursor = ref(-1)

const canFind = computed(() => findMatches.value.length > 0)
const canReplace = computed(() => canFind.value && findCursor.value >= 0)

const findCountText = computed(() => {
  const total = findMatches.value.length
  if (total === 0) return '0 / 0'
  return `${Math.min(findCursor.value + 1, total)} / ${total}`
})

function findOptions(): FindOptions {
  return {
    caseSensitive: caseSensitive.value,
    wholeCell: wholeCell.value,
    searchIn: searchIn.value
  }
}

/** 打开 / 关键词或选项变化：重新查找并定位第一个命中 */
function refreshFind(initial: boolean): void {
  const matches = findAll(activeSheet.value, findQuery.value, findOptions())
  findMatches.value = matches
  if (matches.length === 0) {
    findCursor.value = -1
    return
  }
  if (initial) {
    findCursor.value = 0
    context.selectCell(matches[0]!.addr)
  } else {
    findCursor.value = Math.min(findCursor.value, matches.length - 1)
  }
}

/** 定位到 findMatches 中与目标地址相同的命中（找不到则保持） */
function locateMatch(match: FindMatch): void {
  const index = findMatches.value.findIndex(
    (item) => item.addr.row === match.addr.row && item.addr.col === match.addr.col
  )
  if (index >= 0) findCursor.value = index
  context.selectCell(match.addr)
}

function findForward(): void {
  const matches = findMatches.value
  if (matches.length === 0) return
  const active = context.getSelection().activeCell
  const next = active
    ? findNext(activeSheet.value, findQuery.value, active, findOptions())
    : matches[0]
  if (!next) return
  locateMatch(next)
}

function findPrevious(): void {
  const matches = findMatches.value
  if (matches.length === 0) return
  const active = context.getSelection().activeCell
  const prev = active
    ? findPrev(activeSheet.value, findQuery.value, active, findOptions())
    : matches[matches.length - 1]
  if (!prev) return
  locateMatch(prev)
}

/** Enter = 下一个；Shift+Enter = 上一个（UInput 的 keydown 透传到外层容器，冒泡可达） */
function handleFindKeydown(event: KeyboardEvent): void {
  if (event.key !== 'Enter') return
  event.preventDefault()
  if (event.shiftKey) {
    findPrevious()
  } else {
    findForward()
  }
}

/** 替换文本 → CellData（空字符串 = 清除单元格；类型自动推断） */
function replaceData(): CellData | undefined {
  if (findReplace.value === '') return undefined
  const t = inferCellType(findReplace.value)
  return t ? { v: findReplace.value, t } : { v: findReplace.value }
}

/** 公式格不参与替换（写入 {v,t} 会覆盖公式原文 f，导致公式丢失） */
function isReplaceable(match: FindMatch): boolean {
  return !context.getCellData(match.addr)?.f
}

/** 替换当前命中格（一次 setCells = 一个 undo 单元）；替换后重新查找 */
function replaceCurrent(): void {
  const match = findMatches.value[findCursor.value]
  if (!match || !isReplaceable(match)) return
  context.setCells([{ addr: match.addr, data: replaceData() }])
  refreshFind(false)
}

/** 全部替换（一次 setCells 批量 = 单 undo 单元，undo 一次全部还原）；公式格自动跳过 */
function replaceAll(): void {
  const matches = findMatches.value.filter(isReplaceable)
  if (matches.length === 0) return
  context.setCells(matches.map((match) => ({ addr: match.addr, data: replaceData() })))
  refreshFind(false)
}

function resetFind(): void {
  findQuery.value = ''
  findReplace.value = ''
  findMatches.value = []
  findCursor.value = -1
}

// 关键词 / 选项变化 → 重新查找（定位第一个命中）
watch([findQuery, caseSensitive, wholeCell, searchIn], () => {
  if (popupTool.value?.popup === 'find') refreshFind(true)
})

/** Ctrl/Cmd+F 打开 / 关闭查找条（与工具按钮同一 toggle 逻辑） */
function onGlobalKeydown(event: KeyboardEvent): void {
  if (!(event.metaKey || event.ctrlKey) || event.key.toLowerCase() !== 'f') return
  event.preventDefault()
  const findTool = defaultToolRegistry.get('find')
  if (!findTool) return
  if (popupTool.value?.id === findTool.id) {
    closePopup()
    return
  }
  queueMicrotask(() => openPopup(findTool))
}

// ─── sheet tabs ─────────────────────────────────────────────

function handleTabClick(index: number): void {
  if (index === activeIndex.value) return
  const sheet = sheetList.value[index]
  if (sheet) workbook.value.activateSheet(sheet.name)
}

/** 「+」添加 sheet：自动激活新表（激活事件驱动 grid 重建） */
function handleAddSheet(): void {
  const sheet = workbook.value.addSheet()
  workbook.value.activateSheet(sheet.name)
}

// ─── tab 右键菜单（重命名 / 删除）────────────────────────────

/** 正在行内重命名的 tab 下标（-1 = 无） */
const renamingIndex = ref(-1)
const renameDraft = ref('')
const renameInputRef = useTemplateRef<HTMLInputElement>('renameInputRef')

function handleTabContextMenu(event: MouseEvent, sheet: Sheet, index: number): void {
  // 右键菜单操作的是该 tab，不切换激活（与 Excel 一致：菜单动作不影响激活）
  contextmenu.pop({
    mousePosition: { x: event.clientX, y: event.clientY },
    width: 160,
    menus: [
      { label: '重命名', callback: () => startRename(index) },
      {
        label: '删除',
        disabled: sheetList.value.length <= 1,
        callback: () => confirmRemoveSheet(sheet)
      }
    ]
  })
}

/** 进入行内重命名（预填当前名并全选） */
function startRename(index: number): void {
  renamingIndex.value = index
  renameDraft.value = sheetList.value[index]?.name ?? ''
  // 等输入框渲染后聚焦全选
  nextTick(() => renameInputRef.value?.select())
}

/** 提交重命名：空名 / 重名（含大小写变体）由 Workbook 拒绝，提示且不写入 */
function commitRename(): void {
  const index = renamingIndex.value
  if (index < 0) return
  renamingIndex.value = -1
  const sheet = sheetList.value[index]
  if (!sheet) return
  const next = renameDraft.value.trim()
  if (next === '' || next === sheet.name) return
  if (!workbook.value.renameSheet(sheet.name, next)) {
    message.warn(`无法重命名：名称“${next}”无效或已被占用`)
  }
}

function cancelRename(): void {
  renamingIndex.value = -1
}

/** 删除确认（message-confirm）；最后一个 sheet 在菜单层已禁用，这里再兜底 */
function confirmRemoveSheet(sheet: Sheet): void {
  if (workbook.value.sheetCount <= 1) return
  messageConfirm.danger(`确定删除工作表“${sheet.name}”吗？删除后不可恢复。`, {
    confirmButtonText: '删除',
    onClosed: (action) => {
      if (action !== 'confirm') return
      workbook.value.removeSheet(sheet.name)
    }
  })
}

// ─── 右键菜单（合并 / 取消合并，语义对齐内置工具）────────────

function handleContextMenu(info: SheetGridContextMenuInfo): void {
  // body 格：若点击落在当前选区外则先选中该格；行号/列头保留当前选区
  if (info.addr) {
    const inSelection = context
      .getSelection()
      .ranges.some((range) => rangeContainsAddress(range, info.addr!))
    if (!inSelection) context.selectCell(info.addr)
  }

  const mergeTool = defaultToolRegistry.get('merge')
  const unmergeTool = defaultToolRegistry.get('unmerge')

  contextmenu.pop({
    mousePosition: { x: info.x, y: info.y },
    width: 180,
    menus: [
      {
        label: '合并单元格',
        disabled: mergeTool?.disabled?.(context) ?? true,
        callback: () => mergeTool?.onClick(context)
      },
      {
        label: '取消合并单元格',
        disabled: unmergeTool?.disabled?.(context) ?? true,
        callback: () => unmergeTool?.onClick(context)
      }
    ]
  })
}

// ─── grid 生命周期 ──────────────────────────────────────────

function rebuildGrid(): void {
  const container = gridRef.value
  if (!container) return
  grid?.release()
  grid = new SheetGrid({
    container,
    sheet: activeSheet.value,
    rows: props.rows,
    cols: props.cols,
    onContextMenu: handleContextMenu,
    // 网格进入编辑 → 公式栏镜像实时文本；编辑结束（提交/取消）→ 退出镜像
    onEditStart: (addr) => formulaBarRef.value?.mirrorGridEdit(addr),
    onEditEnd: (addr) => formulaBarRef.value?.exitMirror(addr)
  })
}

onMounted(() => {
  bindWorkbookEvents(workbook.value)
  bindSheetEvents(activeSheet.value)
  rebuildGrid()
  window.addEventListener('click', onWindowClick)
  window.addEventListener('keydown', onGlobalKeydown)
})

watch(() => [props.rows, props.cols], rebuildGrid)

watch(
  () => props.workbook,
  (wb, prev) => {
    if (wb === prev) return
    closePopup() // 工作簿切换：关闭弹层并提交面板事务
    activeIndex.value = workbook.value.activeSheetIndex
    sheetList.value = workbook.value.getSheets()
    bindWorkbookEvents(workbook.value)
    bindSheetEvents(activeSheet.value)
    rebuildGrid()
    bump()
  }
)

onBeforeUnmount(() => {
  closePopup()
  window.removeEventListener('click', onWindowClick)
  window.removeEventListener('keydown', onGlobalKeydown)
  offRegistryChange()
  for (const dispose of disposeWorkbookEvents) dispose()
  for (const dispose of disposeSheetEvents) dispose()
  grid?.release()
  grid = undefined
})

const exposed: _SheetExposed = {
  workbook,
  getActiveSheet: () => activeSheet.value,
  getContext: () => context,
  getGrid: () => grid
}

defineExpose(exposed)
</script>
