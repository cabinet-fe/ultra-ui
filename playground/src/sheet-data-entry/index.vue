<template>
  <div class="budget-entry">
    <!-- 顶栏：标题 + 保存状态 + 提交；sheet 切换直接用 USheet 内置标签栏 -->
    <div class="budget-entry__bar">
      <span class="budget-entry__title">2026 年度预算填报</span>
      <span class="budget-entry__status" :data-state="statusState">
        <span class="budget-entry__status-dot" />
        {{ statusText }}
      </span>
      <button v-if="!submitted" type="button" class="budget-entry__submit" @click="submit">
        校验并提交预算
      </button>
      <button v-else type="button" class="budget-entry__withdraw" @click="withdraw">
        撤回提交
      </button>
    </div>

    <!-- 提交前校验错误面板：点击条目跳转到对应 sheet 的出错格 -->
    <div v-if="errors.length > 0" class="budget-entry__errors">
      <div class="budget-entry__errors-title">
        提交前请修正以下 {{ errors.length }} 处问题（点击定位到单元格）：
      </div>
      <button
        v-for="(err, i) in errors"
        :key="i"
        type="button"
        class="budget-entry__error-item"
        @click="jumpToError(err)"
      >
        <span class="budget-entry__error-cell"
          >{{ err.sheetName }}!{{ formatAddress(err.addr) }}</span
        >
        {{ err.message }}
      </button>
    </div>

    <u-sheet
      ref="sheetRef"
      :workbook="workbook"
      :show-toolbar="false"
      :show-formula-bar="false"
      :resolve-cell-style="resolveCellStyle"
      class="budget-entry__sheet"
      @active-sheet-change="onActiveSheetChange"
    />
  </div>
</template>

<script lang="ts" setup>
import { type SheetExposed } from '@veltra/sheet'
import {
  Workbook,
  formatAddress,
  type CellAddress,
  type CellValue,
  type Sheet
} from '@veltra/sheet-core'
import type { ResolveCellStyleHook } from '@veltra/sheet-core/grid'
import { computed, nextTick, onBeforeUnmount, onMounted, ref, useTemplateRef } from 'vue'

/**
 * 在线预算填报演示：多 sheet（内置标签栏切换）+ 跨表公式联动 + 提交前校验。
 * - 预算汇总 + 费用/人力/采购三张明细表：明细表第一列为编制项目，其后各列为
 *   部门预算金额（填写区），项目合计 / 部门合计由公式自动计算；汇总页经跨表
 *   公式（=费用预算!F11 …）自动汇总，无需填写；
 * - 单元格级只读：整表 setRangeReadonly 锁定，仅项目名列与金额格放开；
 *   提交成功后整表重锁；
 * - 提交前校验：编制项目必填 / 金额须为 ≥0 数字 / 每行至少填一个部门金额 /
 *   总计不超年度额度上限；出错格红色高亮 + 面板点击定位；
 * - 持久化按「sheet + 单元格」粒度：cell-change → 脏格队列 → 防抖 PUT 到
 *   playground 契约服务（SQLite 表 data_entry_cells，见 server/data-entry.ts）。
 *
 * 注：公式栏不校验格级只读（可绕过锁定写合计格），故本演示关闭公式栏。
 */

const SUMMARY = '预算汇总'

/** 预算明细表结构：第一列编制项目，其后各部门金额列，最后一列项目合计 */
const DEPARTMENTS = ['研发部', '市场部', '销售部', '行政部']
const DETAIL_DEFS = [
  {
    name: '费用预算',
    items: ['办公费', '差旅费', '业务招待费', '广告宣传费', '培训费', '其他费用']
  },
  { name: '人力预算', items: ['工资薪酬', '社保公积金', '绩效奖金', '招聘费', '员工福利'] },
  { name: '采购预算', items: ['设备采购', '软件订阅', '办公用品', '外包服务'] }
]
const SHEET_NAMES = [SUMMARY, ...DETAIL_DEFS.map((def) => def.name)]

const FORM_ID = 'budget-2026-v2'
const API_BASE = `/report-api/data-entry/forms/${FORM_ID}/cells`
/** 年度额度上限（预算总计不可超过） */
const BUDGET_CAP = 500_000
/** 表头行（0-based）；项目行紧随其后 */
const HEADER_ROW = 3
const FIRST_ITEM_ROW = HEADER_ROW + 1
/** 项目合计列（0-based）：A=编制项目，B..E=部门金额，F=项目合计 */
const TOTAL_COL = 1 + DEPARTMENTS.length
/** 提交状态格（预算汇总页；只读但随填报数据持久化） */
const STATUS_ADDR: CellAddress = { row: 2, col: 1 }

const GRID_EDGE = { style: 'thin' as const, width: 1, color: '#c9cdd4' }
const TITLE_STYLE = {
  font: { bold: true, size: 16 },
  align: { horizontal: 'center' as const },
  fill: { color: '#eef2ff' }
}
const HINT_STYLE = {
  font: { size: 10, color: '#98a2b3' },
  align: { horizontal: 'center' as const }
}
const LABEL_STYLE = { font: { bold: true }, fill: { color: '#f2f4f7' } }
const HEADER_STYLE = {
  font: { bold: true },
  align: { horizontal: 'center' as const },
  fill: { color: '#e9edf5' },
  border: { top: GRID_EDGE, right: GRID_EDGE, bottom: GRID_EDGE, left: GRID_EDGE }
}
const BODY_BORDER = {
  border: { top: GRID_EDGE, right: GRID_EDGE, bottom: GRID_EDGE, left: GRID_EDGE }
}
const TOTAL_STYLE = { font: { bold: true }, fill: { color: '#f2f4f7' }, ...BODY_BORDER }

const workbook = new Workbook()
workbook.renameSheet('Sheet1', SUMMARY)
const sheets: Record<string, Sheet> = { [SUMMARY]: workbook.activeSheet }
for (const def of DETAIL_DEFS) sheets[def.name] = workbook.addSheet(def.name)
const summary = sheets[SUMMARY]!

/** 各明细表布局：项目行（0-based）与合计行 */
const DETAIL_LAYOUT = DETAIL_DEFS.map((def) => ({
  name: def.name,
  itemRows: def.items.map((_, i) => FIRST_ITEM_ROW + i),
  totalRow: FIRST_ITEM_ROW + def.items.length
}))

// ─── 模板：预算明细表（编制项目 × 部门金额，行/列合计公式） ────

/** 各明细表合计格引用（如 费用预算!F11），供汇总页跨表公式使用 */
const detailTotalRefs = new Map<string, string>()

for (const def of DETAIL_DEFS) {
  const sheet = sheets[def.name]!
  const totalRow = FIRST_ITEM_ROW + def.items.length
  sheet.ensureTableSize(totalRow + 1, TOTAL_COL + 1)
  sheet.mergeCellsBatch([
    { start: { row: 0, col: 0 }, end: { row: 0, col: TOTAL_COL } },
    { start: { row: 1, col: 0 }, end: { row: 1, col: TOTAL_COL } }
  ])
  sheet.setCellValue({ row: 0, col: 0 }, `${def.name}明细`)
  sheet.setCellStyle({ start: { row: 0, col: 0 }, end: { row: 0, col: TOTAL_COL } }, TITLE_STYLE)
  sheet.setRowHeight(0, 40)
  sheet.setCellValue({ row: 1, col: 0 }, '浅黄色为填写区：逐行填写各部门预算金额，合计自动计算')
  sheet.setCellStyle({ start: { row: 1, col: 0 }, end: { row: 1, col: TOTAL_COL } }, HINT_STYLE)

  sheet.setCellValue({ row: HEADER_ROW, col: 0 }, '编制项目')
  DEPARTMENTS.forEach((dept, i) => {
    sheet.setCellValue({ row: HEADER_ROW, col: 1 + i }, `${dept}（元）`)
  })
  sheet.setCellValue({ row: HEADER_ROW, col: TOTAL_COL }, '项目合计（元）')
  sheet.setCellStyle(
    { start: { row: HEADER_ROW, col: 0 }, end: { row: HEADER_ROW, col: TOTAL_COL } },
    HEADER_STYLE
  )

  def.items.forEach((item, i) => {
    const row = FIRST_ITEM_ROW + i
    sheet.setCellValue({ row, col: 0 }, item)
    // 项目合计 = 各部门金额之和（1-based 行号 = 0-based + 1）
    sheet.setCellFormula({ row, col: TOTAL_COL }, `=SUM(B${row + 1}:E${row + 1})`)
  })
  sheet.setCellValue({ row: totalRow, col: 0 }, `${def.name}合计`)
  for (let col = 1; col <= TOTAL_COL; col++) {
    const letter = String.fromCharCode(65 + col) // B..F
    sheet.setCellFormula(
      { row: totalRow, col },
      `=SUM(${letter}${FIRST_ITEM_ROW + 1}:${letter}${totalRow})`
    )
  }

  sheet.setCellStyle(
    { start: { row: FIRST_ITEM_ROW, col: 0 }, end: { row: totalRow, col: TOTAL_COL } },
    BODY_BORDER
  )
  sheet.setCellStyle(
    { start: { row: FIRST_ITEM_ROW, col: 1 }, end: { row: totalRow, col: TOTAL_COL } },
    { align: { horizontal: 'right' } }
  )
  sheet.setCellStyle(
    { start: { row: totalRow, col: 0 }, end: { row: totalRow, col: TOTAL_COL } },
    TOTAL_STYLE
  )
  sheet.setCellStyle(
    { start: { row: totalRow, col: 1 }, end: { row: totalRow, col: TOTAL_COL } },
    { align: { horizontal: 'right' } }
  )
  sheet.setColWidth(0, 140)
  for (let col = 1; col <= TOTAL_COL; col++) sheet.setColWidth(col, 110)
  detailTotalRefs.set(def.name, `F${totalRow + 1}`)
}

// ─── 模板：预算汇总（跨表公式联动，无需填写） ─────────────────

const SUMMARY_FIRST_ROW = 5 // 首个「类别合计」行（0-based）
const SUMMARY_TOTAL_ROW = SUMMARY_FIRST_ROW + DETAIL_DEFS.length
const SUMMARY_CAP_ROW = SUMMARY_TOTAL_ROW + 1
const SUMMARY_BALANCE_ROW = SUMMARY_TOTAL_ROW + 2

summary.ensureTableSize(SUMMARY_BALANCE_ROW + 1, 2)
summary.mergeCellsBatch([
  { start: { row: 0, col: 0 }, end: { row: 0, col: 1 } },
  { start: { row: 1, col: 0 }, end: { row: 1, col: 1 } }
])
summary.setCellValue({ row: 0, col: 0 }, '2026 年度预算汇总')
summary.setCellStyle({ start: { row: 0, col: 0 }, end: { row: 0, col: 1 } }, TITLE_STYLE)
summary.setRowHeight(0, 40)
summary.setCellValue({ row: 1, col: 0 }, '各明细表经跨表公式自动汇总；请在明细标签页填写部门金额')
summary.setCellStyle({ start: { row: 1, col: 0 }, end: { row: 1, col: 1 } }, HINT_STYLE)
summary.setCellValue({ row: 2, col: 0 }, '提交状态')
summary.setCellStyle({ start: { row: 2, col: 0 }, end: { row: 2, col: 0 } }, LABEL_STYLE)
summary.setCellValue(STATUS_ADDR, '草稿')
summary.setCellStyle(
  { start: STATUS_ADDR, end: STATUS_ADDR },
  { font: { bold: true, color: '#667085' } }
)

summary.setCellValue({ row: 4, col: 0 }, '预算类别')
summary.setCellValue({ row: 4, col: 1 }, '金额（元）')
summary.setCellStyle({ start: { row: 4, col: 0 }, end: { row: 4, col: 1 } }, HEADER_STYLE)
DETAIL_DEFS.forEach((def, i) => {
  const row = SUMMARY_FIRST_ROW + i
  summary.setCellValue({ row, col: 0 }, `${def.name}合计`)
  // 跨表公式：直接引用明细表合计格
  summary.setCellFormula({ row, col: 1 }, `=${def.name}!${detailTotalRefs.get(def.name)}`)
})
summary.setCellValue({ row: SUMMARY_TOTAL_ROW, col: 0 }, '预算总计')
summary.setCellFormula(
  { row: SUMMARY_TOTAL_ROW, col: 1 },
  `=SUM(B${SUMMARY_FIRST_ROW + 1}:B${SUMMARY_TOTAL_ROW})`
)
summary.setCellValue({ row: SUMMARY_CAP_ROW, col: 0 }, '年度额度上限')
summary.setCellValue({ row: SUMMARY_CAP_ROW, col: 1 }, BUDGET_CAP)
summary.setCellValue({ row: SUMMARY_BALANCE_ROW, col: 0 }, '额度结余')
// 结余 = 上限 - 总计（1-based 行号）
summary.setCellFormula(
  { row: SUMMARY_BALANCE_ROW, col: 1 },
  `=B${SUMMARY_CAP_ROW + 1}-B${SUMMARY_TOTAL_ROW + 1}`
)
summary.setCellStyle(
  { start: { row: SUMMARY_FIRST_ROW, col: 0 }, end: { row: SUMMARY_BALANCE_ROW, col: 1 } },
  BODY_BORDER
)
summary.setCellStyle(
  { start: { row: SUMMARY_FIRST_ROW, col: 1 }, end: { row: SUMMARY_BALANCE_ROW, col: 1 } },
  { align: { horizontal: 'right' } }
)
for (const row of [SUMMARY_TOTAL_ROW, SUMMARY_BALANCE_ROW]) {
  summary.setCellStyle({ start: { row, col: 0 }, end: { row, col: 1 } }, TOTAL_STYLE)
  summary.setCellStyle(
    { start: { row, col: 1 }, end: { row, col: 1 } },
    { align: { horizontal: 'right' } }
  )
}
summary.setColWidth(0, 160)
summary.setColWidth(1, 140)

// ─── 单元格级只读：各表整锁后放开填写区 ─────────────────────

/** 各 sheet 的可编辑格：明细表的项目名列 + 部门金额列（合计行/列与汇总页只读） */
const EDITABLE_ADDRS: Record<string, CellAddress[]> = { [SUMMARY]: [] }
for (const { name, itemRows } of DETAIL_LAYOUT) {
  EDITABLE_ADDRS[name] = itemRows.flatMap((row) =>
    Array.from({ length: TOTAL_COL }, (_, col) => ({ row, col }))
  )
}
const editableKeys = new Map(
  Object.entries(EDITABLE_ADDRS).map(([name, addrs]) => [
    name,
    new Set(addrs.map((addr) => `${addr.row},${addr.col}`))
  ])
)
/** 随填报数据持久化的格 = 可编辑格 + 提交状态格 */
const persistableKeys = new Map(
  Object.entries(EDITABLE_ADDRS).map(([name, addrs]) => [
    name,
    new Set(addrs.map((addr) => `${addr.row},${addr.col}`))
  ])
)
persistableKeys.get(SUMMARY)!.add(`${STATUS_ADDR.row},${STATUS_ADDR.col}`)

/** 整表锁定范围 = USheet 默认渲染区（100 行 × 26 列），模板区域外也不可写 */
const FULL_RANGE = { start: { row: 0, col: 0 }, end: { row: 99, col: 25 } }

/** 整表锁定（提交后 / 已提交状态加载后） */
function lockAll(): void {
  for (const name of SHEET_NAMES) sheets[name]!.setRangeReadonly(FULL_RANGE)
}
/** 放开填写区（撤回提交 / 初始模板） */
function unlockEditable(): void {
  for (const name of SHEET_NAMES) {
    for (const addr of EDITABLE_ADDRS[name]!) sheets[name]!.setCellReadonly(addr, false)
  }
}

lockAll()
unlockEditable()
// 模板为基线状态，不进 undo 历史
for (const name of SHEET_NAMES) sheets[name]!.history.clear()

// ─── 动态样式：填写区高亮 / 校验出错格标红 ──────────────────

const submitted = ref(false)
/** 校验出错格（按 sheet 分组的 'row,col' 集合；随编辑逐个摘除） */
const errorKeys = new Map<string, Set<string>>()
/** 当前展示中的 sheet（USheet 只重绘激活 sheet 的 grid，hook 读取安全） */
const activeSheetName = ref<string>(SUMMARY)

/** 动态样式叠加（不写模型；Set 直查 O(1)，遵守 cell hook 性能契约） */
const resolveCellStyle: ResolveCellStyleHook = (addr, base) => {
  const key = `${addr.row},${addr.col}`
  if (errorKeys.get(activeSheetName.value)?.has(key)) {
    return { ...base, fill: { color: '#fee4e2' } }
  }
  if (!submitted.value && editableKeys.get(activeSheetName.value)?.has(key)) {
    return { ...base, fill: { color: '#fffaeb' } }
  }
  return undefined
}

// ─── 按「sheet + 单元格」自动保存 ───────────────────────────

interface RemoteCell {
  sheet: string
  row: number
  col: number
  value: CellValue
}

const saveState = ref<'idle' | 'dirty' | 'saving' | 'saved' | 'error'>('idle')
const lastSavedAt = ref('')
/** 服务不可达时降级为离线演示（仍可编辑，不阻断页面） */
const offline = ref(false)

const pending = new Map<string, RemoteCell>()
let saveTimer: number | undefined
let saving = false
/** 回放服务端数据时置位，避免加载触发又一轮保存 */
let applyingRemote = false

for (const name of SHEET_NAMES) {
  sheets[name]!.on('cell-change', ({ addr }) => {
    if (applyingRemote) return
    const anchor = sheets[name]!.merges.resolveAnchor(addr)
    const key = `${anchor.row},${anchor.col}`
    if (!persistableKeys.get(name)!.has(key)) return
    pending.set(`${name}!${key}`, {
      sheet: name,
      row: anchor.row,
      col: anchor.col,
      value: sheets[name]!.getCellData(anchor)?.v ?? null
    })
    // 编辑出错格即摘除其标红（错误面板整体保留，重新提交时再全量校验）
    errorKeys.get(name)?.delete(key)
    saveState.value = 'dirty'
    scheduleSave(600)
  })
}

function scheduleSave(delay: number): void {
  window.clearTimeout(saveTimer)
  saveTimer = window.setTimeout(() => {
    void flushPending()
  }, delay)
}

async function flushPending(): Promise<void> {
  if (saving || pending.size === 0) return
  saving = true
  const cells = [...pending.values()]
  pending.clear()
  saveState.value = 'saving'
  try {
    const res = await fetch(API_BASE, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cells })
    })
    const json = (await res.json()) as { ok?: boolean; error?: { message?: string } }
    if (!res.ok || !json.ok) throw new Error(json.error?.message ?? `HTTP ${res.status}`)
    saveState.value = 'saved'
    lastSavedAt.value = new Date().toLocaleTimeString()
  } catch {
    // 失败回到待存队列，稍后自动重试
    for (const cell of cells) pending.set(`${cell.sheet}!${cell.row},${cell.col}`, cell)
    saveState.value = 'error'
    scheduleSave(3000)
  } finally {
    saving = false
    // 保存期间产生的新修改继续下一轮
    if (pending.size > 0 && saveState.value !== 'error') scheduleSave(0)
  }
}

const statusState = computed(() => (offline.value ? 'offline' : saveState.value))
const statusText = computed(() => {
  if (offline.value) return '离线模式：演示服务未启动（bun run dev），修改不会保存'
  switch (saveState.value) {
    case 'dirty':
      return '有未保存修改…'
    case 'saving':
      return '保存中…'
    case 'saved':
      return `已保存 ${lastSavedAt.value}`
    case 'error':
      return '保存失败，3s 后自动重试'
    default:
      return '修改按单元格自动保存'
  }
})

// ─── 提交前校验 / 提交 / 撤回 ───────────────────────────────

interface BudgetError {
  sheetName: string
  addr: CellAddress
  message: string
}

const errors = ref<BudgetError[]>([])

function isBlank(value: CellValue | undefined): boolean {
  return value == null || value === ''
}

/** 全量校验：编制项目必填 / 金额须为 ≥0 数字 / 每行至少一个部门金额 / 总计不超上限 */
function validateBudget(): BudgetError[] {
  const result: BudgetError[] = []
  const push = (sheetName: string, addr: CellAddress, message: string) =>
    result.push({ sheetName, addr, message })

  for (const { name, itemRows } of DETAIL_LAYOUT) {
    const sheet = sheets[name]!
    for (const row of itemRows) {
      if (isBlank(sheet.getDisplayValue({ row, col: 0 }))) {
        push(name, { row, col: 0 }, '编制项目必填')
      }
      let hasAmount = false
      for (let col = 1; col < TOTAL_COL; col++) {
        const value = sheet.getDisplayValue({ row, col })
        if (isBlank(value)) continue
        if (typeof value !== 'number' || value < 0) {
          push(name, { row, col }, '预算金额须为 ≥0 的数字')
        } else {
          hasAmount = true
        }
      }
      if (!hasAmount) push(name, { row, col: 1 }, '至少填写一个部门的预算金额（无预算填 0）')
    }
  }

  // 总额不超年度额度上限
  const total = summary.getDisplayValue({ row: SUMMARY_TOTAL_ROW, col: 1 })
  if (typeof total === 'number' && total > BUDGET_CAP) {
    push(
      SUMMARY,
      { row: SUMMARY_TOTAL_ROW, col: 1 },
      `预算总计 ${total} 元超出年度额度上限 ${BUDGET_CAP} 元`
    )
  }
  return result
}

const sheetRef = useTemplateRef<SheetExposed>('sheetRef')

function rebuildErrorKeys(): void {
  errorKeys.clear()
  for (const err of errors.value) {
    const key = `${err.addr.row},${err.addr.col}`
    const set = errorKeys.get(err.sheetName) ?? new Set<string>()
    set.add(key)
    errorKeys.set(err.sheetName, set)
  }
}

async function submit(): Promise<void> {
  if (submitted.value) return
  await flushPending() // 先落库未保存修改，校验以最新模型为准
  errors.value = validateBudget()
  rebuildErrorKeys()
  if (errors.value.length > 0) {
    // 标红立即生效（resolveCellStyle 在重绘时求值）
    sheetRef.value?.getGrid()?.refresh()
    return
  }
  summary.setCellValue(STATUS_ADDR, '已提交') // 经 cell-change 自动持久化
  lockAll()
  for (const name of SHEET_NAMES) sheets[name]!.history.clear() // 提交后为新基线
  submitted.value = true
  await flushPending()
  sheetRef.value?.getGrid()?.refresh()
}

async function withdraw(): Promise<void> {
  if (!submitted.value) return
  unlockEditable()
  summary.setCellValue(STATUS_ADDR, '草稿')
  for (const name of SHEET_NAMES) sheets[name]!.history.clear()
  submitted.value = false
  await flushPending()
  sheetRef.value?.getGrid()?.refresh()
}

/** 错误面板点击定位：切到目标 sheet 并选中出错格（grid 随之滚动到可见） */
function jumpToError(err: BudgetError): void {
  workbook.activateSheet(err.sheetName)
  sheets[err.sheetName]!.selectCell(err.addr)
}

// ─── sheet 切换（内置标签栏点击或宿主 activateSheet 均经此同步状态） ────

function onActiveSheetChange(payload: { sheet: Sheet }): void {
  activeSheetName.value = payload.sheet.name
  // USheet 内部先建/绘 grid 再透传本事件，首帧样式可能按旧 sheet 名求值；
  // 名称落地后强制重绘一次（表单规模小，refresh 代价可忽略）
  void nextTick(() => sheetRef.value?.getGrid()?.refresh())
}

// ─── 加载已存数据 ───────────────────────────────────────────

onMounted(async () => {
  try {
    const res = await fetch(API_BASE)
    const json = (await res.json()) as { ok?: boolean; cells?: RemoteCell[] }
    if (!res.ok || !json.ok || !Array.isArray(json.cells)) throw new Error()
    applyingRemote = true
    try {
      for (const name of SHEET_NAMES) {
        const items = json.cells
          .filter(
            (cell) =>
              cell.sheet === name && persistableKeys.get(name)!.has(`${cell.row},${cell.col}`)
          )
          .filter((cell) => cell.value !== null && cell.value !== '')
          .map((cell) => ({ addr: { row: cell.row, col: cell.col }, data: { v: cell.value } }))
        if (items.length > 0) sheets[name]!.setCells(items)
        sheets[name]!.history.clear() // 服务端数据同样作为基线
      }
      // 已提交状态恢复：整表只读
      if (summary.getDisplayValue(STATUS_ADDR) === '已提交') {
        lockAll()
        submitted.value = true
        for (const name of SHEET_NAMES) sheets[name]!.history.clear()
      }
    } finally {
      applyingRemote = false
    }
  } catch {
    offline.value = true
  }
})

// 调试句柄：浏览器控制台 / 自动化可直接读写模型
;(window as unknown as Record<string, unknown>).__budgetDemo = {
  workbook,
  sheets,
  FORM_ID,
  submit,
  withdraw
}

onBeforeUnmount(() => {
  window.clearTimeout(saveTimer)
  delete (window as unknown as Record<string, unknown>).__budgetDemo
})
</script>

<style scoped>
.budget-entry__bar {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.budget-entry__title {
  flex: 1;
  min-width: 0;
  font-size: 14px;
  font-weight: 600;
  color: var(--u-text-color-main);
}

.budget-entry__status {
  flex: none;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: var(--u-text-color-second);
}

.budget-entry__status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--u-color-info);
}

.budget-entry__status[data-state='saved'] .budget-entry__status-dot {
  background: var(--u-color-success);
}

.budget-entry__status[data-state='dirty'] .budget-entry__status-dot,
.budget-entry__status[data-state='saving'] .budget-entry__status-dot {
  background: var(--u-color-warning);
}

.budget-entry__status[data-state='error'] .budget-entry__status-dot,
.budget-entry__status[data-state='offline'] .budget-entry__status-dot {
  background: var(--u-color-danger, #f04438);
}

.budget-entry__submit {
  flex: none;
  padding: 5px 18px;
  border: 1px solid var(--u-color-primary);
  border-radius: 6px;
  background: var(--u-color-primary);
  color: #fff;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.15s ease;
}

.budget-entry__submit:hover {
  opacity: 0.88;
}

.budget-entry__withdraw {
  flex: none;
  padding: 5px 18px;
  border: 1px solid var(--u-border-muted-color);
  border-radius: 6px;
  background: var(--u-bg-color-top);
  color: var(--u-text-color-second);
  font-size: 13px;
  cursor: pointer;
}

.budget-entry__withdraw:hover {
  color: var(--u-color-primary);
  border-color: var(--u-color-primary);
}

.budget-entry__errors {
  margin-bottom: 12px;
  padding: 10px 14px;
  border: 1px solid color-mix(in srgb, var(--u-color-danger, #f04438) 35%, transparent);
  border-radius: 8px;
  background: color-mix(in srgb, var(--u-color-danger, #f04438) 6%, var(--u-bg-color-top));
}

.budget-entry__errors-title {
  margin-bottom: 6px;
  font-size: 12px;
  font-weight: 600;
  color: var(--u-color-danger, #f04438);
}

.budget-entry__error-item {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin: 3px 8px 3px 0;
  padding: 2px 10px;
  border: 1px solid color-mix(in srgb, var(--u-color-danger, #f04438) 30%, transparent);
  border-radius: 4px;
  background: var(--u-bg-color-top);
  color: var(--u-text-color-main);
  font-size: 12px;
  cursor: pointer;
}

.budget-entry__error-item:hover {
  border-color: var(--u-color-danger, #f04438);
}

.budget-entry__error-cell {
  font-family: 'JetBrains Mono', Consolas, monospace;
  font-weight: 600;
  color: var(--u-color-danger, #f04438);
}

.budget-entry__sheet {
  height: 560px;
  border: 1px solid var(--u-border-muted-color);
  border-radius: 8px;
  overflow: hidden;
}
</style>
