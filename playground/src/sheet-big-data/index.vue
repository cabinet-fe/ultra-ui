<template>
  <div class="big-data-demo">
    <div class="big-data-demo__hint">
      Phase 6 大数据量演示：seeded 伪随机生成 1 万 / 5 万 / 10 万行 × 12 列数据，一次
      <code>setCells</code> 批量写入（数据初始化不进 undo 历史），随后挂载 USheet 由 VTable
      虚拟滚动渲染。数据中每格混入 20 种循环填充色——样式经 StylePool 按内容去重， 池条目数 ≪
      单元格数。同一「规模 + 种子」生成结果完全一致，可复现压测。
    </div>

    <div class="big-data-demo__toolbar">
      <span class="big-data-demo__label">规模</span>
      <u-radio-group v-model="scale" :items="scaleOptions" block />
      <span class="big-data-demo__label">种子</span>
      <u-input v-model="seedText" class="big-data-demo__seed" placeholder="42" />
      <u-button type="primary" :disabled="busy === 'generating'" @click="generate">
        {{ workbook ? '重新生成' : '生成数据' }}
      </u-button>
      <u-button :disabled="!workbook" @click="freezeFirstRow">冻结首行</u-button>
      <u-button :disabled="!workbook" @click="unfreeze">取消冻结</u-button>
      <u-input v-model="keyword" class="big-data-demo__keyword" placeholder="查找关键词" />
      <u-button :disabled="!workbook" @click="runFind">查找计时</u-button>
      <u-button
        :disabled="!workbook || busy === 'exporting'"
        :loading="busy === 'exporting'"
        @click="runExport"
      >
        导出 xlsx
      </u-button>
    </div>

    <div class="big-data-demo__metrics">
      <div class="big-data-demo__metric">
        <div class="big-data-demo__metric-label">单元格数</div>
        <div class="big-data-demo__metric-value">{{ fmtNum(cellCount) }}</div>
      </div>
      <div class="big-data-demo__metric">
        <div class="big-data-demo__metric-label">样式池条目</div>
        <div class="big-data-demo__metric-value">{{ fmtNum(stylePoolSize) }}</div>
        <div class="big-data-demo__metric-sub">去重率 ×{{ dedupeRatio }}</div>
      </div>
      <div class="big-data-demo__metric">
        <div class="big-data-demo__metric-label">数据生成</div>
        <div class="big-data-demo__metric-value">{{ fmtMs(dataGenMs) }}</div>
        <div class="big-data-demo__metric-sub">ms</div>
      </div>
      <div class="big-data-demo__metric">
        <div class="big-data-demo__metric-label">批量写入</div>
        <div class="big-data-demo__metric-value">{{ fmtMs(writeMs) }}</div>
        <div class="big-data-demo__metric-sub">ms · 目标 &lt;10s</div>
      </div>
      <div class="big-data-demo__metric">
        <div class="big-data-demo__metric-label">首次渲染</div>
        <div class="big-data-demo__metric-value">{{ fmtMs(renderMs) }}</div>
        <div class="big-data-demo__metric-sub">ms · 挂载到首帧</div>
      </div>
      <div class="big-data-demo__metric">
        <div class="big-data-demo__metric-label">查找</div>
        <div class="big-data-demo__metric-value">{{ fmtMs(findMs) }}</div>
        <div class="big-data-demo__metric-sub">{{ findHits }} 处命中 · 目标 &lt;2s</div>
      </div>
      <div class="big-data-demo__metric">
        <div class="big-data-demo__metric-label">导出 xlsx</div>
        <div class="big-data-demo__metric-value">{{ fmtMs(exportMs) }}</div>
        <div class="big-data-demo__metric-sub">{{ fmtBytes(exportBytes) }}</div>
      </div>
      <div class="big-data-demo__metric">
        <div class="big-data-demo__metric-label">冻结首行</div>
        <div class="big-data-demo__metric-value">{{ frozenText }}</div>
        <div class="big-data-demo__metric-sub">setFrozen(1, 0)</div>
      </div>
    </div>

    <u-sheet
      v-if="showSheet && workbook"
      :key="sheetKey"
      :workbook="workbook"
      :rows="rowCount"
      :cols="COLS"
      class="big-data-demo__sheet"
      :show-formula-bar="false"
      :show-tabs="false"
    />
    <div v-else class="big-data-demo__empty">
      点击「生成数据」开始（写入期间页面会短暂阻塞，属预期）
    </div>
  </div>
</template>

<script lang="ts" setup>
import {
  USheet,
  Workbook,
  exportWorkbookXlsx,
  findAll,
  type CellData,
  type CellValue,
  type SetCellValueItem,
  type Sheet
} from '@veltra/sheet'
import '@veltra/sheet/components/sheet/style'
import { nextTick, ref, shallowRef, computed } from 'vue'

/** 列数固定 12（A..L） */
const COLS = 12

/** 规模选项（行数） */
const SCALES = [10000, 50000, 100000] as const
const scaleOptions = SCALES.map((rows) => ({ label: `${rows / 10000} 万行`, value: String(rows) }))
const scale = ref('100000')

const seedText = ref('42')
const keyword = ref('NEEDLE')
const busy = ref<'idle' | 'generating' | 'exporting'>('idle')

const workbook = shallowRef<Workbook | null>(null)
const showSheet = ref(false)
const sheetKey = ref(0)

const rowCount = computed(() => Number(scale.value))
const activeSheet = computed(() => workbook.value?.activeSheet ?? null)
const frozenText = computed(() => {
  const frozen = activeSheet.value?.frozen
  return frozen && frozen.rows > 0 ? `已冻结 ${frozen.rows} 行` : '未冻结'
})

// ─── 指标 ────────────────────────────────────────────────

const cellCount = ref(0)
const stylePoolSize = ref(0)
const dedupeRatio = ref('0')
const dataGenMs = ref(0)
const writeMs = ref(0)
const renderMs = ref(0)
const findMs = ref(0)
const findHits = ref(0)
const exportMs = ref(0)
const exportBytes = ref(0)

function fmtNum(value: number): string {
  return value.toLocaleString('zh-CN')
}

function fmtMs(value: number): string {
  return value <= 0 ? '—' : `${value.toFixed(1)}`
}

function fmtBytes(value: number): string {
  if (value <= 0) return '—'
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`
  return `${(value / (1024 * 1024)).toFixed(2)} MB`
}

// ─── 确定性伪随机（mulberry32）─────────────────────────────

function mulberry32(seed: number): () => number {
  let state = seed >>> 0
  return () => {
    state = (state + 0x6d2b79f5) | 0
    let t = Math.imul(state ^ (state >>> 15), 1 | state)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** 20 种循环分配的浅色填充（样式池压测：条目数固定 20，不随单元格数增长） */
const STYLE_COLORS = [
  '#FFF3E0',
  '#FFE0B2',
  '#FFCCBC',
  '#FFE4E1',
  '#FFD9E8',
  '#F3E5F5',
  '#E8EAF6',
  '#E3F2FD',
  '#E0F7FA',
  '#E0F2F1',
  '#E8F5E9',
  '#F1F8E9',
  '#F9FBE7',
  '#FFFDE7',
  '#FFF8E1',
  '#FBE9E7',
  '#EFEBE9',
  '#ECEFF1',
  '#FAFAFA',
  '#F5F5F5'
] as const

const PRODUCTS = [
  '智能手表',
  '蓝牙耳机',
  '机械键盘',
  '无线鼠标',
  '便携显示器',
  '人体工学椅',
  '升降桌',
  '台灯',
  '音箱',
  '路由器',
  '空气净化器',
  '加湿器',
  '咖啡机',
  '电水壶',
  '扫地机器人',
  '投影仪',
  '相机',
  '平板电脑',
  '笔记本支架',
  '移动电源'
] as const

const CATEGORIES = [
  '电子产品',
  '家居用品',
  '服装鞋帽',
  '食品饮料',
  '图书文具',
  '运动户外',
  '美妆个护',
  '数码配件'
] as const
const REGIONS = ['华东', '华北', '华南', '华中', '西南', '西北', '东北', '港澳台'] as const
const STATUSES = ['已发货', '处理中', '已取消', '待审核'] as const
const NAMES = [
  '张伟',
  '王芳',
  '李娜',
  '刘洋',
  '陈静',
  '杨帆',
  '赵磊',
  '黄敏',
  '周涛',
  '吴霞'
] as const

function pick<T>(rand: () => number, list: readonly T[]): T {
  return list[Math.floor(rand() * list.length)]!
}

/**
 * 生成 rows × cols 单元格数据（确定性：同一 seed 输出完全一致）。
 * 样式：每格分配 20 色循环中的一色（先 intern 到样式池拿 StyleId，池内去重）。
 * 埋点：第 12 列每 997 行写入 `NEEDLE-{row}`（查找计时用，命中数 ≈ rows / 997）。
 */
function buildItems(sheet: Sheet, rows: number, cols: number, seed: number): SetCellValueItem[] {
  const rand = mulberry32(seed)
  const styleIds = STYLE_COLORS.map((color) => sheet.stylePool.intern({ fill: { color } }))
  const total = rows * cols
  const items: SetCellValueItem[] = Array.from({ length: total })
  let index = 0
  for (let row = 0; row < rows; row++) {
    const product = pick(rand, PRODUCTS)
    const category = pick(rand, CATEGORIES)
    const quantity = 1 + Math.floor(rand() * 500)
    const price = Math.round((10 + rand() * 990) * 100) / 100
    const amount = Math.round(quantity * price * 100) / 100
    const year = 2020 + Math.floor(rand() * 6)
    const month = 1 + Math.floor(rand() * 12)
    const day = 1 + Math.floor(rand() * 28)
    const date = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    const values: CellValue[] = [
      row + 1,
      `${product} ${category}`,
      category,
      quantity,
      price,
      amount,
      date,
      pick(rand, STATUSES),
      pick(rand, REGIONS),
      pick(rand, NAMES),
      `订单备注 ${row}`,
      row % 997 === 0 ? `NEEDLE-${row}` : `KEY-${row}`
    ]
    for (let col = 0; col < cols; col++) {
      const value = values[col]!
      const data: CellData = {
        v: value,
        t: typeof value === 'number' ? 'n' : 's',
        s: styleIds[(row * 3 + col) % styleIds.length]!
      }
      items[index++] = { addr: { row, col }, data }
    }
  }
  return items
}

// ─── 生成 + 批量写入 + 渲染 ───────────────────────────────

function parseSeed(): number {
  const parsed = Number.parseInt(seedText.value, 10)
  return Number.isFinite(parsed) ? parsed : 42
}

/**
 * 数据初始化流程（先写模型、后挂载视图）：
 * 1. 生成 items（seeded，可复现）
 * 2. 单次 setCells 批量写入 = 单 undo 单元；作为初始化不进历史，随后 history.clear()
 *    （避免 10 万行补丁长期驻留 undo 栈，也释放补丁内存峰值）
 * 3. 挂载 USheet（rows = 数据行数），双 rAF 后记录首次渲染耗时
 * 写入耗时 = 纯模型路径（无视图逐格同步，cell-change 无订阅者）；
 * 视图由 VTable 一次性构建 records 承担。
 */
async function generate(): Promise<void> {
  if (busy.value === 'generating') return
  busy.value = 'generating'
  showSheet.value = false
  await nextTick()

  const rows = rowCount.value
  const seed = parseSeed()
  const wb = new Workbook()
  const sheet = wb.activeSheet

  const genStart = performance.now()
  const items = buildItems(sheet, rows, COLS, seed)
  const genEnd = performance.now()

  const writeStart = performance.now()
  sheet.setCells(items)
  sheet.history.clear()
  const writeEnd = performance.now()

  workbook.value = wb
  sheetKey.value++
  cellCount.value = sheet.store.size
  stylePoolSize.value = sheet.stylePool.size
  dedupeRatio.value =
    sheet.store.size > 0 && sheet.stylePool.size > 0
      ? Math.round(sheet.store.size / sheet.stylePool.size).toLocaleString('zh-CN')
      : '0'

  showSheet.value = true
  await nextTick()
  await new Promise<void>((resolve) =>
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
  )
  const renderEnd = performance.now()

  dataGenMs.value = genEnd - genStart
  writeMs.value = writeEnd - writeStart
  renderMs.value = renderEnd - writeEnd
  busy.value = 'idle'
}

// ─── 功能冒烟：冻结 / 查找 / 导出 ─────────────────────────

function freezeFirstRow(): void {
  activeSheet.value?.setFrozen(1, 0)
}

function unfreeze(): void {
  activeSheet.value?.setFrozen(0, 0)
}

function runFind(): void {
  const sheet = activeSheet.value
  if (!sheet || keyword.value === '') return
  const start = performance.now()
  const matches = findAll(sheet, keyword.value)
  const end = performance.now()
  findMs.value = end - start
  findHits.value = matches.length
  const first = matches[0]
  if (first) sheet.selectCell(first.addr)
}

async function runExport(): Promise<void> {
  const wb = workbook.value
  if (!wb || busy.value === 'exporting') return
  busy.value = 'exporting'
  const start = performance.now()
  try {
    const bytes = await exportWorkbookXlsx(wb)
    const end = performance.now()
    exportMs.value = end - start
    exportBytes.value = bytes.byteLength
    const url = URL.createObjectURL(
      new Blob([bytes], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      })
    )
    const a = document.createElement('a')
    a.href = url
    a.download = `sheet-big-data-${rowCount.value}rows.xlsx`
    document.body.appendChild(a)
    a.click()
    a.remove()
    setTimeout(() => URL.revokeObjectURL(url), 2000)
  } finally {
    busy.value = 'idle'
  }
}
</script>

<style scoped>
.big-data-demo__hint {
  margin-bottom: 12px;
  font-size: 13px;
  line-height: 1.7;
  color: var(--u-text-color-second);
}

.big-data-demo__hint code {
  padding: 1px 5px;
  border-radius: 4px;
  background: var(--u-bg-color-hover);
  font-family: monospace;
}

.big-data-demo__toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
  padding: 12px;
  border: 1px solid var(--u-border-color);
  border-radius: 8px;
  margin-bottom: 12px;
}

.big-data-demo__label {
  font-size: 13px;
  color: var(--u-text-color-second);
}

.big-data-demo__seed {
  width: 90px;
}

.big-data-demo__keyword {
  width: 140px;
}

.big-data-demo__metrics {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 10px;
  margin-bottom: 12px;
}

.big-data-demo__metric {
  padding: 12px 14px;
  border: 1px solid var(--u-border-color);
  border-radius: 8px;
  background: var(--u-bg-color-top);
}

.big-data-demo__metric-label {
  font-size: 12px;
  color: var(--u-text-color-second);
  margin-bottom: 4px;
}

.big-data-demo__metric-value {
  font-size: 20px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  color: var(--u-text-color-title);
}

.big-data-demo__metric-sub {
  font-size: 12px;
  color: var(--u-text-color-second);
  margin-top: 2px;
}

.big-data-demo__sheet {
  height: 560px;
  border: 1px solid var(--u-border-color);
  border-radius: 8px;
  overflow: hidden;
}

.big-data-demo__empty {
  height: 120px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px dashed var(--u-border-color);
  border-radius: 8px;
  color: var(--u-text-color-second);
  font-size: 13px;
}
</style>
