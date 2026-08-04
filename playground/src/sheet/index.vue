<template>
  <div class="sheet-demo">
    <div class="sheet-demo__hint">
      USheet：工具栏图标化（history / cell / text / edit / file）。输入 =
      开头即公式；拖选后可合并或右键菜单；
      单元格右下角拖填充柄可复制/数字序列/公式相对引用；行边界可拖行高。快捷键：Ctrl/Cmd+Z 撤销，
      Ctrl/Cmd+Shift+Z 或 Ctrl+Y 重做；编辑中方向键只移光标。行列插入/删除与冻结见行列头右键菜单。
    </div>
    <u-sheet ref="sheetRef" :workbook="workbook" :rows="30" class="sheet-demo__sheet" />

    <!-- 数据结构观察区（仅演示页，非组件内部）：实时展示活动表模型 -->
    <div class="sheet-demo__inspector">
      <div class="sheet-demo__inspector-head" @click="collapsed = !collapsed">
        <strong class="sheet-demo__inspector-title">
          <span class="sheet-demo__inspector-arrow">{{ collapsed ? '▸' : '▾' }}</span>
          <span class="sheet-demo__inspector-dot" />
          数据结构观察（实时）
        </strong>
        <span class="sheet-demo__inspector-meta">
          活动表：{{ activeSheetName }} · 存储 {{ inspect.storeCount }} 格 / 高水位
          {{ inspect.rowCount }}×{{ inspect.colCount }} · 样式池 {{ inspect.styleCount }} 条
        </span>
      </div>
      <div v-show="!collapsed" class="sheet-demo__inspector-grid">
        <section class="sheet-demo__inspector-block">
          <h4
            class="sheet-demo__inspector-block-title sheet-demo__inspector-block-title--selection"
          >
            选区 selection · activeCell 恒为锚点
          </h4>
          <div class="sheet-demo__inspector-code">
            <div class="sheet-demo__inspector-code-bar">
              <span class="sheet-demo__inspector-code-lang">json</span>
              <span class="sheet-demo__inspector-code-source">sheet.getSelection()</span>
              <button
                type="button"
                class="sheet-demo__inspector-code-copy"
                :class="{ 'is-copied': copied === 'selection' }"
                @click="copyJson('selection', inspect.selection)"
              >
                {{ copied === 'selection' ? '已复制' : '复制' }}
              </button>
              <button
                type="button"
                class="sheet-demo__inspector-code-zoom"
                title="放大展示"
                @click="enlarge('selection', '选区 selection · sheet.getSelection()')"
              >
                放大
              </button>
            </div>
            <pre class="sheet-demo__inspector-pre" v-html="highlight(inspect.selection)" />
          </div>
        </section>
        <section class="sheet-demo__inspector-block">
          <h4 class="sheet-demo__inspector-block-title sheet-demo__inspector-block-title--cells">
            单元格存储 cell-store · 稀疏 Map，空格不占位
          </h4>
          <div class="sheet-demo__inspector-code">
            <div class="sheet-demo__inspector-code-bar">
              <span class="sheet-demo__inspector-code-lang">json</span>
              <span class="sheet-demo__inspector-code-source">sheet.store.entries()</span>
              <button
                type="button"
                class="sheet-demo__inspector-code-copy"
                :class="{ 'is-copied': copied === 'cells' }"
                @click="copyJson('cells', inspect.cells)"
              >
                {{ copied === 'cells' ? '已复制' : '复制' }}
              </button>
              <button
                type="button"
                class="sheet-demo__inspector-code-zoom"
                title="放大展示"
                @click="enlarge('cells', '单元格存储 cell-store · sheet.store.entries()')"
              >
                放大
              </button>
            </div>
            <pre class="sheet-demo__inspector-pre" v-html="highlight(inspect.cells)" />
          </div>
        </section>
        <section class="sheet-demo__inspector-block">
          <h4 class="sheet-demo__inspector-block-title sheet-demo__inspector-block-title--styles">
            样式池 style-pool · 单元格只持 StyleId
          </h4>
          <div class="sheet-demo__inspector-code">
            <div class="sheet-demo__inspector-code-bar">
              <span class="sheet-demo__inspector-code-lang">json</span>
              <span class="sheet-demo__inspector-code-source">sheet.stylePool.snapshot()</span>
              <button
                type="button"
                class="sheet-demo__inspector-code-copy"
                :class="{ 'is-copied': copied === 'styles' }"
                @click="copyJson('styles', inspect.styles)"
              >
                {{ copied === 'styles' ? '已复制' : '复制' }}
              </button>
              <button
                type="button"
                class="sheet-demo__inspector-code-zoom"
                title="放大展示"
                @click="enlarge('styles', '样式池 style-pool · sheet.stylePool.snapshot()')"
              >
                放大
              </button>
            </div>
            <pre class="sheet-demo__inspector-pre" v-html="highlight(inspect.styles)" />
          </div>
        </section>
        <section class="sheet-demo__inspector-block">
          <h4 class="sheet-demo__inspector-block-title sheet-demo__inspector-block-title--meta">
            合并 / 冻结 / 行高 / 历史 / 公式节点
          </h4>
          <div class="sheet-demo__inspector-code">
            <div class="sheet-demo__inspector-code-bar">
              <span class="sheet-demo__inspector-code-lang">json</span>
              <span class="sheet-demo__inspector-code-source"
                >merges / frozen / getRowHeights() / history</span
              >
              <button
                type="button"
                class="sheet-demo__inspector-code-copy"
                :class="{ 'is-copied': copied === 'meta' }"
                @click="copyJson('meta', inspect.meta)"
              >
                {{ copied === 'meta' ? '已复制' : '复制' }}
              </button>
              <button
                type="button"
                class="sheet-demo__inspector-code-zoom"
                title="放大展示"
                @click="enlarge('meta', '合并 / 冻结 / 行高 / 历史 / 公式节点')"
              >
                放大
              </button>
            </div>
            <pre class="sheet-demo__inspector-pre" v-html="highlight(inspect.meta)" />
          </div>
        </section>
        <section class="sheet-demo__inspector-block sheet-demo__inspector-block--wide">
          <h4 class="sheet-demo__inspector-block-title sheet-demo__inspector-block-title--api">
            提交给后端 / 后端返回 · workbook 级 JSON（sheet.snapshot() 拼装）
          </h4>
          <div class="sheet-demo__inspector-api">
            <div class="sheet-demo__inspector-api-col">
              <span class="sheet-demo__inspector-api-tag sheet-demo__inspector-api-tag--req">
                请求体（提交）
              </span>
              <div class="sheet-demo__inspector-code">
                <div class="sheet-demo__inspector-code-bar">
                  <span class="sheet-demo__inspector-code-lang">json</span>
                  <span class="sheet-demo__inspector-code-source">
                    workbook.getSheets().map(s =&gt; s.snapshot())
                  </span>
                  <button
                    type="button"
                    class="sheet-demo__inspector-code-copy"
                    :class="{ 'is-copied': copied === 'payload' }"
                    @click="copyJson('payload', inspect.payload)"
                  >
                    {{ copied === 'payload' ? '已复制' : '复制' }}
                  </button>
                  <button
                    type="button"
                    class="sheet-demo__inspector-code-zoom"
                    title="放大展示"
                    @click="enlarge('payload', '请求体（提交）· workbook JSON')"
                  >
                    放大
                  </button>
                </div>
                <pre class="sheet-demo__inspector-pre" v-html="highlight(inspect.payload)" />
              </div>
            </div>
            <div class="sheet-demo__inspector-api-col">
              <span class="sheet-demo__inspector-api-tag sheet-demo__inspector-api-tag--res">
                响应体（返回，与请求同构）
              </span>
              <div class="sheet-demo__inspector-code">
                <div class="sheet-demo__inspector-code-bar">
                  <span class="sheet-demo__inspector-code-lang">json</span>
                  <span class="sheet-demo__inspector-code-source"
                    >sheet.restore(snapshot) 恢复</span
                  >
                  <button
                    type="button"
                    class="sheet-demo__inspector-code-copy"
                    :class="{ 'is-copied': copied === 'response' }"
                    @click="copyJson('response', inspect.response)"
                  >
                    {{ copied === 'response' ? '已复制' : '复制' }}
                  </button>
                  <button
                    type="button"
                    class="sheet-demo__inspector-code-zoom"
                    title="放大展示"
                    @click="enlarge('response', '响应体（返回）· sheet.restore(snapshot) 恢复')"
                  >
                    放大
                  </button>
                </div>
                <pre class="sheet-demo__inspector-pre" v-html="highlight(inspect.response)" />
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>

    <!-- 放大展示弹窗：desktop UDialog（modal=false 无遮罩；header 自带拖拽；Esc/关闭按钮退出） -->
    <u-dialog
      v-model="enlargedVisible"
      :modal="false"
      :title="enlarged?.title ?? ''"
      class="sheet-demo__zoom-dialog"
    >
      <!-- default slot 的 maximized 状态：最大化时内容宽高跟随弹窗撑满 -->
      <template #default="{ maximized }">
        <div class="sheet-demo__zoom-body" :class="{ 'is-maximized': maximized }">
          <div class="sheet-demo__zoom-toolbar">
            <button
              type="button"
              class="sheet-demo__inspector-code-copy"
              :class="{ 'is-copied': copied === 'zoom' }"
              @click="copyJson('zoom', enlargedValue)"
            >
              {{ copied === 'zoom' ? '已复制' : '复制' }}
            </button>
          </div>
          <pre
            class="sheet-demo__inspector-pre sheet-demo__zoom-pre"
            v-html="highlight(enlargedValue)"
          />
        </div>
      </template>
    </u-dialog>
  </div>
</template>

<script lang="ts" setup>
import { UDialog } from '@veltra/desktop'
import {
  USheet,
  Workbook,
  formatAddress,
  formatRange,
  type Sheet,
  type SheetExposed
} from '@veltra/sheet'
import '@veltra/desktop/components/dialog/style'
import '@veltra/sheet/vue/style'
import { computed, onBeforeUnmount, onMounted, ref, shallowRef, useTemplateRef } from 'vue'

// 工作簿：两个 sheet 共享公式依赖图（跨表引用与联动重算的中枢）
const workbook = new Workbook()
const sheet1 = workbook.activeSheet // 默认 Sheet1
const sheet2 = workbook.addSheet('Sheet2')

// 预置 Sheet2 数据源
sheet2.setCellValue({ row: 0, col: 0 }, '项目')
sheet2.setCellValue({ row: 0, col: 1 }, '数量')
sheet2.setCellValue({ row: 1, col: 0 }, '苹果')
sheet2.setCellValue({ row: 1, col: 1 }, 42)
sheet2.setCellValue({ row: 2, col: 0 }, '香蕉')
sheet2.setCellValue({ row: 2, col: 1 }, 35)
sheet2.setCellValue({ row: 3, col: 0 }, '橙子')
sheet2.setCellValue({ row: 3, col: 1 }, 58)

// 预置 Sheet1：跨表公式 + 同表联动 + 合并示例
sheet1.setCellValue({ row: 0, col: 0 }, '跨表汇总')
sheet1.setCellFormula({ row: 0, col: 1 }, '=SUM(Sheet2!B2:B4)')
sheet1.setCellValue({ row: 1, col: 0 }, 'Sheet2 首项×2')
sheet1.setCellFormula({ row: 1, col: 1 }, '=Sheet2!B2*2')
sheet1.setCellValue({ row: 2, col: 0 }, '本表 B1÷2')
sheet1.setCellFormula({ row: 2, col: 1 }, '=B1/2')
sheet1.mergeCells({ start: { row: 4, col: 1 }, end: { row: 5, col: 2 } })
sheet1.setCellValue({ row: 4, col: 1 }, '合并区(B5:C6)')
// 填充柄演示：数字序列 / 文本 tile
sheet1.setCellValue({ row: 0, col: 3 }, '序列')
sheet1.setCellValue({ row: 1, col: 3 }, 1)
sheet1.setCellValue({ row: 2, col: 3 }, 2)
sheet1.setCellValue({ row: 0, col: 4 }, 'tile')
sheet1.setCellValue({ row: 1, col: 4 }, 'a')
sheet1.setCellValue({ row: 2, col: 4 }, 'b')
// 预置数据作为初始状态，不进入 undo 历史
sheet1.history.clear()
sheet2.history.clear()

const sheetRef = useTemplateRef<SheetExposed>('sheetRef')

// 观察区默认收起，点击头部展开/收起
const collapsed = ref(true)

// 代码块复制反馈：记录最近复制的区块 key，1.5s 后恢复
const copied = ref('')
let copyTimer: number | undefined
async function copyJson(key: string, value: unknown): Promise<void> {
  await navigator.clipboard.writeText(JSON.stringify(value, null, 2))
  copied.value = key
  window.clearTimeout(copyTimer)
  copyTimer = window.setTimeout(() => {
    if (copied.value === key) copied.value = ''
  }, 1500)
}

// 放大展示弹窗：desktop UDialog（modal=false 无遮罩、header 自带拖拽；Esc/关闭按钮退出）
const enlarged = ref<{ key: string; title: string } | null>(null)
const enlargedVisible = computed({
  get: () => enlarged.value !== null,
  set: (visible: boolean) => {
    if (!visible) enlarged.value = null
  }
})
const enlargedValue = computed(() => {
  const key = enlarged.value?.key
  return key ? (inspect.value as Record<string, unknown>)[key] : null
})
function enlarge(key: string, title: string): void {
  enlarged.value = { key, title }
}

// ─── 数据结构观察区（演示页调试用）：订阅活动表事件实时刷新 ──────

const activeSheet = shallowRef<Sheet>(workbook.activeSheet)
const tick = ref(0)
let unsubs: Array<() => void> = []
const bump = () => tick.value++

/** 订阅 sheet 全部模型事件（任一变化 → 观察区刷新） */
function subscribeSheet(sheet: Sheet): void {
  unsubs.forEach((fn) => fn())
  unsubs = [
    sheet.on('selection-change', bump),
    sheet.on('history-change', bump),
    sheet.on('cell-change', bump),
    sheet.on('merge-change', bump),
    sheet.on('frozen-change', bump),
    sheet.on('structure-change', bump)
  ]
  bump()
}

// tab 切换 → 观察区跟随活动表；增删表 → 提交体刷新
const unsubActive = workbook.on('active-sheet-change', (event) => {
  activeSheet.value = event.sheet
  subscribeSheet(event.sheet)
})
const unsubSheets = workbook.on('sheets-change', bump)

onMounted(() => subscribeSheet(activeSheet.value))

const activeSheetName = computed(() => activeSheet.value.name)

const inspect = computed(() => {
  void tick.value
  const sheet = activeSheet.value

  // 存储：稀疏 entries → { 'A1': CellData, ... }
  const cells: Record<string, unknown> = {}
  for (const [addr, data] of sheet.store.entries()) cells[formatAddress(addr)] = data

  // 样式池：按 id 升序定义数组（单元格 CellData.s 引用这里）
  const styles = sheet.stylePool.snapshot()

  const meta = {
    merges: sheet.merges.getMerges().map(formatRange),
    frozen: sheet.frozen,
    rowHeights: Object.fromEntries(sheet.getRowHeights()),
    history: {
      canUndo: sheet.history.canUndo,
      canRedo: sheet.history.canRedo,
      undoSize: sheet.history.undoSize,
      redoSize: sheet.history.redoSize
    },
    formulaNodes: sheet.formulaGraph.nodeCount
  }

  // 提交给后端：所有 sheet 快照合并为一个 workbook JSON；返回体 data 同构
  const payload = buildWorkbookPayload()

  return {
    selection: sheet.getSelection(),
    cells,
    styles,
    meta,
    payload,
    response: { code: 0, message: 'ok', data: payload },
    storeCount: Object.keys(cells).length,
    styleCount: styles.length,
    rowCount: sheet.store.rowCount,
    colCount: sheet.store.colCount
  }
})

/** 工作簿 → 提交体：{ sheets: [{ name, ...SheetSnapshot }], activeIndex } */
function buildWorkbookPayload(): unknown {
  return {
    sheets: workbook.getSheets().map((item) => Object.assign({ name: item.name }, item.snapshot())),
    activeIndex: workbook.activeIndex
  }
}

/**
 * JSON 语法高亮（仅演示页）：先转义 HTML 再着色，避免模型内容注入标签。
 * key → 蓝、字符串值 → 绿、数字 → 橙、true/false/null → 紫。
 */
function highlight(value: unknown): string {
  const escaped = JSON.stringify(value, null, 2).replace(
    /[&<>]/g,
    (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[ch]!
  )
  return escaped.replace(
    /("(?:\\u[a-fA-F0-9]{4}|\\[^u]|[^\\"])*")(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?/g,
    (match, str, colon, keyword) => {
      if (str) {
        return colon
          ? `<span class="j-key">${str}</span>${colon}`
          : `<span class="j-str">${str}</span>`
      }
      if (keyword) return `<span class="j-kw">${keyword}</span>`
      return `<span class="j-num">${match}</span>`
    }
  )
}

// 调试句柄：浏览器控制台/自动化可直接读取模型与组件暴露
;(window as unknown as Record<string, unknown>).__sheetDemo = {
  workbook,
  sheet1,
  sheet2,
  getSheet: () => sheetRef.value
}

onBeforeUnmount(() => {
  unsubs.forEach((fn) => fn())
  unsubActive()
  unsubSheets()
  delete (window as unknown as Record<string, unknown>).__sheetDemo
})
</script>

<style scoped>
.sheet-demo__hint {
  margin-bottom: 12px;
  font-size: 13px;
  color: var(--u-text-color-second);
}

.sheet-demo__sheet {
  height: 620px;
}

/* ─── 数据结构观察区 ─────────────────────────────── */

.sheet-demo__inspector {
  margin-top: 16px;
  border: 1px solid var(--u-border-muted-color);
  border-radius: 10px;
  background: var(--u-bg-color-top);
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
  overflow: hidden;
}

.sheet-demo__inspector-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 14px;
  background: linear-gradient(180deg, var(--u-bg-color-hover), transparent);
  border-bottom: 1px solid var(--u-border-muted-color);
  cursor: pointer;
  user-select: none;
  transition: background-color 0.15s ease;
}

.sheet-demo__inspector-head:hover {
  background: var(--u-bg-color-hover);
}

.sheet-demo__inspector-arrow {
  font-size: 12px;
  color: var(--u-text-color-second);
  transition: transform 0.15s ease;
}

.sheet-demo__inspector-title {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
}

/* 实时指示点（呼吸动画） */
.sheet-demo__inspector-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--u-color-success);
  box-shadow: 0 0 0 0 color-mix(in srgb, var(--u-color-success) 50%, transparent);
  animation: sheet-demo-dot-pulse 2s infinite;
}

@keyframes sheet-demo-dot-pulse {
  0% {
    box-shadow: 0 0 0 0 color-mix(in srgb, var(--u-color-success) 45%, transparent);
  }
  70% {
    box-shadow: 0 0 0 6px color-mix(in srgb, var(--u-color-success) 0%, transparent);
  }
  100% {
    box-shadow: 0 0 0 0 color-mix(in srgb, var(--u-color-success) 0%, transparent);
  }
}

.sheet-demo__inspector-meta {
  font-size: 12px;
  color: var(--u-text-color-second);
}

.sheet-demo__inspector-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  padding: 12px;
}

.sheet-demo__inspector-block {
  min-width: 0;
  padding: 10px;
  border: 1px solid var(--u-border-muted-color);
  border-radius: 8px;
  background: var(--u-bg-color-hover);
}

.sheet-demo__inspector-block-title {
  display: flex;
  align-items: center;
  gap: 6px;
  margin: 0 0 8px;
  font-size: 12px;
  font-weight: 600;
  color: var(--u-text-color-main);
}

/* 区块标题前的彩色小竖条 */
.sheet-demo__inspector-block-title::before {
  content: '';
  width: 3px;
  height: 12px;
  border-radius: 2px;
  background: var(--u-color-primary);
}

.sheet-demo__inspector-block-title--selection::before {
  background: var(--u-color-primary);
}

.sheet-demo__inspector-block-title--cells::before {
  background: var(--u-color-success);
}

.sheet-demo__inspector-block-title--styles::before {
  background: var(--u-color-warning);
}

.sheet-demo__inspector-block-title--meta::before {
  background: var(--u-color-info);
}

.sheet-demo__inspector-block-title--api::before {
  background: var(--u-color-info);
}

/* 整行宽的区块（提交/返回格式） */
.sheet-demo__inspector-block--wide {
  grid-column: 1 / -1;
}

.sheet-demo__inspector-api {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.sheet-demo__inspector-api-col {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.sheet-demo__inspector-api-tag {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 600;
}

.sheet-demo__inspector-api-tag::before {
  content: '';
  width: 6px;
  height: 6px;
  border-radius: 50%;
}

.sheet-demo__inspector-api-tag--req {
  color: var(--u-color-info);
}

.sheet-demo__inspector-api-tag--req::before {
  background: var(--u-color-info);
}

.sheet-demo__inspector-api-tag--res {
  color: var(--u-color-success);
}

.sheet-demo__inspector-api-tag--res::before {
  background: var(--u-color-success);
}

.sheet-demo__inspector-pre {
  margin: 0;
  max-height: 280px;
  overflow: auto;
  padding: 10px 12px;
  border-radius: 0 0 6px 6px;
  background: var(--u-bg-color-middle);
  color: var(--u-text-color-main);
  font-size: 12px;
  line-height: 1.55;
  font-family: 'JetBrains Mono', Consolas, 'Courier New', monospace;
  scrollbar-width: thin;
  scrollbar-color: color-mix(in srgb, var(--u-text-color-second) 30%, transparent) transparent;
}

/* ─── 代码块（markdown 风格：语言标签 + 来源方法 + 复制按钮） ─── */

.sheet-demo__inspector-code {
  min-width: 0;
  border-radius: 6px;
  overflow: hidden;
  background: var(--u-bg-color-middle);
}

.sheet-demo__inspector-code-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 5px 8px;
  background: var(--u-bg-color-bottom);
  border-bottom: 1px solid var(--u-border-muted-color);
}

.sheet-demo__inspector-code-lang {
  padding: 1px 6px;
  border-radius: 4px;
  background: color-mix(in srgb, var(--u-color-primary) 16%, transparent);
  color: var(--u-color-primary);
  font-size: 11px;
  font-weight: 600;
  font-family: 'JetBrains Mono', Consolas, monospace;
}

.sheet-demo__inspector-code-source {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--u-text-color-second);
  font-size: 11px;
  font-family: 'JetBrains Mono', Consolas, monospace;
}

.sheet-demo__inspector-code-copy {
  flex: none;
  padding: 2px 8px;
  border: 1px solid var(--u-border-muted-color);
  border-radius: 4px;
  background: transparent;
  color: var(--u-text-color-second);
  font-size: 11px;
  cursor: pointer;
  transition:
    background-color 0.15s ease,
    color 0.15s ease;
}

.sheet-demo__inspector-code-copy:hover {
  background: var(--u-bg-color-hover);
  color: #fff;
}

.sheet-demo__inspector-code-copy.is-copied {
  border-color: color-mix(in srgb, var(--u-color-success) 50%, transparent);
  background: color-mix(in srgb, var(--u-color-success) 16%, transparent);
  color: var(--u-color-success);
}

.sheet-demo__inspector-code-zoom {
  flex: none;
  padding: 2px 8px;
  border: 1px solid var(--u-border-muted-color);
  border-radius: 4px;
  background: transparent;
  color: var(--u-text-color-second);
  font-size: 11px;
  cursor: pointer;
  transition:
    background-color 0.15s ease,
    color 0.15s ease;
}

.sheet-demo__inspector-code-zoom:hover {
  background: var(--u-bg-color-hover);
  color: #fff;
}

/* ─── 放大展示弹窗（desktop UDialog：无遮罩 + 头部拖拽） ──────── */

/* 弹窗宽度与 pre 高度（UDialog body 自带 u-scroll 滚动） */

/* 内容区：默认保持原始尺寸（pre max-height 66vh）；最大化时撑满弹窗 */
.sheet-demo__zoom-body {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.sheet-demo__zoom-body.is-maximized {
  height: 100%;
}

.sheet-demo__zoom-body.is-maximized .sheet-demo__zoom-pre {
  flex: 1;
  max-height: none;
}

.sheet-demo__zoom-toolbar {
  display: flex;
  justify-content: flex-end;
  padding-bottom: 8px;
}

.sheet-demo__zoom-pre {
  max-height: 66vh;
  font-size: 13px;
  line-height: 1.6;
  border-radius: 6px;
  border: 1px solid var(--u-border-muted-color);
}

/* JSON 语法高亮 */
.sheet-demo__inspector-pre :deep(.j-key) {
  color: var(--u-color-primary);
}

.sheet-demo__inspector-pre :deep(.j-str) {
  color: var(--u-color-success);
}

.sheet-demo__inspector-pre :deep(.j-num) {
  color: var(--u-color-warning);
}

.sheet-demo__inspector-pre :deep(.j-kw) {
  color: var(--u-color-info);
}
</style>

<!-- 非 scoped：UDialog Teleport 到 body，scoped 属性选择器匹配不到其内部元素 -->
<style>
.sheet-demo__zoom-dialog {
  width: min(900px, 90vw);
}
</style>
