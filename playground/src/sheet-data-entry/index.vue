<template>
  <div class="budget-entry">
    <!-- 顶栏：分页切换（隐藏 USheet 自带 tabs，模板结构由宿主锁定）+ 保存状态 + 提交 -->
    <div class="budget-entry__bar">
      <div class="budget-entry__tabs" role="tablist">
        <button
          v-for="name in SHEET_NAMES"
          :key="name"
          type="button"
          role="tab"
          class="budget-entry__tab"
          :class="{ 'is-active': activeSheetName === name }"
          @click="switchSheet(name)"
        >
          {{ name }}
        </button>
      </div>
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
      :show-tabs="false"
      :show-row-header="false"
      :show-col-header="false"
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
 * 在线预算填报演示：多 sheet + 跨表公式联动 + 提交前校验。
 * - 三个 sheet：预算汇总（跨表公式 =费用预算!H9 自动汇总）/ 费用预算 / 人力预算（明细行小计公式）；
 * - 单元格级只读：模板先 setRangeReadonly 整表锁定，再对输入格 setCellReadonly(false) 放开；
 *   提交成功后重新整表锁定，全表只读；
 * - 提交前校验：必填 / 数字范围 / 总额不超年度额度上限；出错格红色高亮 + 面板点击定位；
 * - 持久化按「sheet + 单元格」粒度：cell-change → 脏格队列 → 防抖 PUT 到
 *   playground 契约服务（SQLite 表 data_entry_cells，见 server/data-entry.ts）。
 */

const SUMMARY = '预算汇总'
const EXPENSE = '费用预算'
const HR = '人力预算'
const SHEET_NAMES = [SUMMARY, EXPENSE, HR] as const

const FORM_ID = 'budget-2026'
const API_BASE = `/report-api/data-entry/forms/${FORM_ID}/cells`
/** 年度额度上限（预算总计不可超过） */
const BUDGET_CAP = 500_000
/** 明细行范围（费用 / 人力同为 r4~r7） */
const DETAIL_ROWS = [4, 5, 6, 7]
/** 提交状态格（预算汇总页；只读但随填报数据持久化） */
const STATUS_ADDR: CellAddress = { row: 3, col: 4 }

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
const summary = workbook.activeSheet
const expense = workbook.addSheet(EXPENSE)
const hr = workbook.addSheet(HR)
const sheets: Record<string, Sheet> = { [SUMMARY]: summary, [EXPENSE]: expense, [HR]: hr }

// ─── 模板：预算汇总（填报信息 + 跨表公式汇总） ───────────────

summary.ensureTableSize(12, 6)
summary.mergeCellsBatch([
  { start: { row: 0, col: 0 }, end: { row: 0, col: 5 } },
  { start: { row: 1, col: 0 }, end: { row: 1, col: 5 } },
  { start: { row: 2, col: 1 }, end: { row: 2, col: 2 } },
  { start: { row: 5, col: 0 }, end: { row: 5, col: 2 } },
  { start: { row: 5, col: 3 }, end: { row: 5, col: 5 } },
  ...[6, 7, 8, 9, 10].flatMap((row) => [
    { start: { row, col: 0 }, end: { row, col: 2 } },
    { start: { row, col: 3 }, end: { row, col: 5 } }
  ])
])
summary.setCellValue({ row: 0, col: 0 }, '2026 年度预算填报单')
summary.setCellStyle({ start: { row: 0, col: 0 }, end: { row: 0, col: 5 } }, TITLE_STYLE)
summary.setRowHeight(0, 40)
summary.setCellValue(
  { row: 1, col: 0 },
  '浅黄色为填写区；明细请在「费用预算 / 人力预算」分页填写，本页公式自动汇总'
)
summary.setCellStyle({ start: { row: 1, col: 0 }, end: { row: 1, col: 5 } }, HINT_STYLE)
for (const [addr, label] of [
  [{ row: 2, col: 0 }, '填报部门'],
  [{ row: 2, col: 3 }, '负责人'],
  [{ row: 3, col: 0 }, '预算年度'],
  [{ row: 3, col: 3 }, '提交状态']
] as [CellAddress, string][]) {
  summary.setCellValue(addr, label)
  summary.setCellStyle({ start: addr, end: addr }, LABEL_STYLE)
}
summary.setCellValue(STATUS_ADDR, '草稿')
summary.setCellStyle(
  { start: STATUS_ADDR, end: STATUS_ADDR },
  { font: { bold: true, color: '#667085' } }
)
// 信息输入格下划线
for (const range of [
  { start: { row: 2, col: 1 }, end: { row: 2, col: 2 } },
  { start: { row: 2, col: 4 }, end: { row: 2, col: 4 } },
  { start: { row: 3, col: 1 }, end: { row: 3, col: 1 } }
]) {
  summary.setCellStyle(range, { border: { bottom: { style: 'thin', width: 1, color: '#667085' } } })
}
// 汇总表（跨表公式联动：费用预算!H9 / 人力预算!E9 为各自合计格）
summary.setCellValue({ row: 5, col: 0 }, '预算项目')
summary.setCellValue({ row: 5, col: 3 }, '金额（元）')
summary.setCellStyle({ start: { row: 5, col: 0 }, end: { row: 5, col: 5 } }, HEADER_STYLE)
const SUMMARY_ROWS: [number, string, string | number][] = [
  [6, '费用预算合计', '=费用预算!H9'],
  [7, '人力预算合计', '=人力预算!E9'],
  [8, '预算总计', '=D7+D8'],
  [9, '年度额度上限', BUDGET_CAP],
  [10, '额度结余', '=D10-D9']
]
for (const [row, label, value] of SUMMARY_ROWS) {
  summary.setCellValue({ row, col: 0 }, label)
  if (typeof value === 'string') summary.setCellFormula({ row, col: 3 }, value)
  else summary.setCellValue({ row, col: 3 }, value)
  summary.setCellStyle({ start: { row, col: 0 }, end: { row, col: 2 } }, BODY_BORDER)
  summary.setCellStyle(
    { start: { row, col: 3 }, end: { row, col: 5 } },
    { align: { horizontal: 'right' }, ...BODY_BORDER }
  )
}
// 总计 / 结余强调
summary.setCellStyle({ start: { row: 8, col: 0 }, end: { row: 8, col: 5 } }, TOTAL_STYLE)
summary.setCellStyle({ start: { row: 10, col: 0 }, end: { row: 10, col: 5 } }, TOTAL_STYLE)
summary.setCellStyle(
  { start: { row: 8, col: 3 }, end: { row: 8, col: 5 } },
  { align: { horizontal: 'right' } }
)
summary.setCellStyle(
  { start: { row: 10, col: 3 }, end: { row: 10, col: 5 } },
  { align: { horizontal: 'right' } }
)
;[130, 120, 120, 120, 110, 110].forEach((width, col) => summary.setColWidth(col, width))

// ─── 模板：费用预算（季度明细 + 行小计 / 列合计公式） ─────────

expense.ensureTableSize(10, 8)
expense.mergeCellsBatch([
  { start: { row: 0, col: 0 }, end: { row: 0, col: 7 } },
  { start: { row: 1, col: 0 }, end: { row: 1, col: 7 } },
  { start: { row: 3, col: 1 }, end: { row: 3, col: 2 } },
  ...DETAIL_ROWS.map((row) => ({ start: { row, col: 1 }, end: { row, col: 2 } })),
  { start: { row: 8, col: 0 }, end: { row: 8, col: 2 } }
])
expense.setCellValue({ row: 0, col: 0 }, '费用预算明细')
expense.setCellStyle({ start: { row: 0, col: 0 }, end: { row: 0, col: 7 } }, TITLE_STYLE)
expense.setRowHeight(0, 40)
expense.setCellValue({ row: 1, col: 0 }, '逐行填写费用类别与季度预算；全年小计、合计自动计算')
expense.setCellStyle({ start: { row: 1, col: 0 }, end: { row: 1, col: 7 } }, HINT_STYLE)
const EXPENSE_HEADER = ['费用类别', '事项摘要', '', 'Q1', 'Q2', 'Q3', 'Q4', '全年小计']
EXPENSE_HEADER.forEach((title, col) => {
  if (title) expense.setCellValue({ row: 3, col }, title)
})
expense.setCellStyle({ start: { row: 3, col: 0 }, end: { row: 3, col: 7 } }, HEADER_STYLE)
for (const row of DETAIL_ROWS) {
  // 行小计：=SUM(D5:G5)（1-based 行号 = 0-based + 1）
  expense.setCellFormula({ row, col: 7 }, `=SUM(D${row + 1}:G${row + 1})`)
}
expense.setCellValue({ row: 8, col: 0 }, '费用预算合计')
for (let col = 3; col <= 7; col++) {
  const letter = String.fromCharCode(68 + col - 3) // D..H
  expense.setCellFormula({ row: 8, col }, `=SUM(${letter}5:${letter}8)`)
}
expense.setCellStyle({ start: { row: 4, col: 0 }, end: { row: 8, col: 7 } }, BODY_BORDER)
expense.setCellStyle(
  { start: { row: 4, col: 3 }, end: { row: 8, col: 7 } },
  { align: { horizontal: 'right' } }
)
expense.setCellStyle({ start: { row: 8, col: 0 }, end: { row: 8, col: 7 } }, TOTAL_STYLE)
expense.setCellStyle(
  { start: { row: 8, col: 3 }, end: { row: 8, col: 7 } },
  { align: { horizontal: 'right' } }
)
;[120, 110, 110, 85, 85, 85, 85, 100].forEach((width, col) => expense.setColWidth(col, width))

// ─── 模板：人力预算（岗位 × 人数 × 成本 × 月数） ─────────────

hr.ensureTableSize(10, 5)
hr.mergeCellsBatch([
  { start: { row: 0, col: 0 }, end: { row: 0, col: 4 } },
  { start: { row: 1, col: 0 }, end: { row: 1, col: 4 } }
])
hr.setCellValue({ row: 0, col: 0 }, '人力预算明细')
hr.setCellStyle({ start: { row: 0, col: 0 }, end: { row: 0, col: 4 } }, TITLE_STYLE)
hr.setRowHeight(0, 40)
hr.setCellValue({ row: 1, col: 0 }, '逐行填写岗位编制与成本；年度小计自动计算')
hr.setCellStyle({ start: { row: 1, col: 0 }, end: { row: 1, col: 4 } }, HINT_STYLE)
const HR_HEADER = ['岗位名称', '编制人数', '月均成本（元）', '预算月数', '年度小计']
HR_HEADER.forEach((title, col) => hr.setCellValue({ row: 3, col }, title))
hr.setCellStyle({ start: { row: 3, col: 0 }, end: { row: 3, col: 4 } }, HEADER_STYLE)
for (const row of DETAIL_ROWS) {
  // 年度小计 = 人数 × 月均成本 × 月数
  hr.setCellFormula({ row, col: 4 }, `=B${row + 1}*C${row + 1}*D${row + 1}`)
}
hr.setCellValue({ row: 8, col: 0 }, '人力预算合计')
hr.setCellFormula({ row: 8, col: 4 }, '=SUM(E5:E8)')
hr.setCellStyle({ start: { row: 4, col: 0 }, end: { row: 8, col: 4 } }, BODY_BORDER)
hr.setCellStyle(
  { start: { row: 4, col: 1 }, end: { row: 8, col: 4 } },
  { align: { horizontal: 'right' } }
)
hr.setCellStyle({ start: { row: 8, col: 0 }, end: { row: 8, col: 4 } }, TOTAL_STYLE)
hr.setCellStyle(
  { start: { row: 8, col: 4 }, end: { row: 8, col: 4 } },
  { align: { horizontal: 'right' } }
)
;[150, 100, 130, 100, 120].forEach((width, col) => hr.setColWidth(col, width))

// ─── 单元格级只读：各表整锁后放开输入格 ─────────────────────

/** 各 sheet 的可编辑格（合并区取锚点地址） */
const EDITABLE_ADDRS: Record<string, CellAddress[]> = {
  [SUMMARY]: [
    { row: 2, col: 1 }, // 填报部门
    { row: 2, col: 4 }, // 负责人
    { row: 3, col: 1 } // 预算年度
  ],
  [EXPENSE]: DETAIL_ROWS.flatMap((row) => [0, 1, 3, 4, 5, 6].map((col) => ({ row, col }))),
  [HR]: DETAIL_ROWS.flatMap((row) => [0, 1, 2, 3].map((col) => ({ row, col })))
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

const SHEET_FULL_RANGES: Record<string, { start: CellAddress; end: CellAddress }> = {
  [SUMMARY]: { start: { row: 0, col: 0 }, end: { row: 11, col: 5 } },
  [EXPENSE]: { start: { row: 0, col: 0 }, end: { row: 9, col: 7 } },
  [HR]: { start: { row: 0, col: 0 }, end: { row: 9, col: 4 } }
}

/** 整表锁定（提交后 / 已提交状态加载后） */
function lockAll(): void {
  for (const name of SHEET_NAMES) sheets[name]!.setRangeReadonly(SHEET_FULL_RANGES[name]!)
}
/** 放开输入格（撤回提交 / 初始模板） */
function unlockEditable(): void {
  for (const name of SHEET_NAMES) {
    for (const addr of EDITABLE_ADDRS[name]!) sheets[name]!.setCellReadonly(addr, false)
  }
}

lockAll()
unlockEditable()
// 模板为基线状态，不进 undo 历史
for (const name of SHEET_NAMES) sheets[name]!.history.clear()

// ─── 动态样式：输入区高亮 / 校验出错格标红 ──────────────────

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

/** 全量校验：必填 / 数字范围 / 总额不超上限（规则按「行有任意填写即需完整」判定明细行） */
function validateBudget(): BudgetError[] {
  const result: BudgetError[] = []
  const push = (sheetName: string, addr: CellAddress, message: string) =>
    result.push({ sheetName, addr, message })

  // 汇总页必填项
  for (const [addr, label] of [
    [{ row: 2, col: 1 }, '填报部门'],
    [{ row: 2, col: 4 }, '负责人'],
    [{ row: 3, col: 1 }, '预算年度']
  ] as [CellAddress, string][]) {
    if (isBlank(summary.getDisplayValue(addr))) push(SUMMARY, addr, `${label}必填`)
  }
  const year = summary.getDisplayValue({ row: 3, col: 1 })
  if (!isBlank(year) && (typeof year !== 'number' || !Number.isInteger(year))) {
    push(SUMMARY, { row: 3, col: 1 }, '预算年度须为整数年份')
  }

  // 费用明细行
  for (const row of DETAIL_ROWS) {
    const quarterCols = [3, 4, 5, 6]
    const used =
      !isBlank(expense.getDisplayValue({ row, col: 0 })) ||
      !isBlank(expense.getDisplayValue({ row, col: 1 })) ||
      quarterCols.some((col) => !isBlank(expense.getDisplayValue({ row, col })))
    if (!used) continue
    if (isBlank(expense.getDisplayValue({ row, col: 0 }))) {
      push(EXPENSE, { row, col: 0 }, '费用类别必填')
    }
    if (isBlank(expense.getDisplayValue({ row, col: 1 }))) {
      push(EXPENSE, { row, col: 1 }, '事项摘要必填')
    }
    let hasAmount = false
    for (const col of quarterCols) {
      const value = expense.getDisplayValue({ row, col })
      if (isBlank(value)) continue
      if (typeof value !== 'number' || value < 0) {
        push(EXPENSE, { row, col }, '季度预算须为 ≥0 的数字')
      } else if (value > 0) {
        hasAmount = true
      }
    }
    if (!hasAmount) push(EXPENSE, { row, col: 3 }, '至少填写一个季度预算金额')
  }

  // 人力明细行
  for (const row of DETAIL_ROWS) {
    const used = [0, 1, 2, 3].some((col) => !isBlank(hr.getDisplayValue({ row, col })))
    if (!used) continue
    if (isBlank(hr.getDisplayValue({ row, col: 0 }))) push(HR, { row, col: 0 }, '岗位名称必填')
    const headcount = hr.getDisplayValue({ row, col: 1 })
    if (typeof headcount !== 'number' || !Number.isInteger(headcount) || headcount <= 0) {
      push(HR, { row, col: 1 }, '编制人数须为正整数')
    }
    const cost = hr.getDisplayValue({ row, col: 2 })
    if (typeof cost !== 'number' || cost < 0) {
      push(HR, { row, col: 2 }, '月均成本须为 ≥0 的数字')
    }
    const months = hr.getDisplayValue({ row, col: 3 })
    if (typeof months !== 'number' || months < 1 || months > 12) {
      push(HR, { row, col: 3 }, '预算月数须为 1~12')
    }
  }

  // 总额不超年度额度上限
  const total = summary.getDisplayValue({ row: 8, col: 3 })
  if (typeof total === 'number' && total > BUDGET_CAP) {
    push(SUMMARY, { row: 8, col: 3 }, `预算总计 ${total} 元超出年度额度上限 ${BUDGET_CAP} 元`)
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

// ─── sheet 切换（宿主自控分页，模板结构不可被用户增删） ─────

function switchSheet(name: string): void {
  workbook.activateSheet(name)
}

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

.budget-entry__tabs {
  flex: 1;
  min-width: 0;
  display: flex;
  gap: 4px;
}

.budget-entry__tab {
  padding: 5px 16px;
  border: 1px solid var(--u-border-muted-color);
  border-radius: 6px;
  background: var(--u-bg-color-top);
  color: var(--u-text-color-second);
  font-size: 13px;
  cursor: pointer;
  transition:
    background-color 0.15s ease,
    color 0.15s ease,
    border-color 0.15s ease;
}

.budget-entry__tab:hover {
  color: var(--u-color-primary);
  border-color: var(--u-color-primary);
}

.budget-entry__tab.is-active {
  background: color-mix(in srgb, var(--u-color-primary) 10%, var(--u-bg-color-top));
  border-color: var(--u-color-primary);
  color: var(--u-color-primary);
  font-weight: 600;
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
  height: 480px;
  border: 1px solid var(--u-border-muted-color);
  border-radius: 8px;
  overflow: hidden;
}
</style>
