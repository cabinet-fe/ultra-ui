<template>
  <div class="smart-table">
    <!-- 顶栏：标题 + 保存状态 + 视图切换 + 行/字段管理入口 -->
    <div class="smart-table__bar">
      <span class="smart-table__title">智慧表格</span>
      <u-segment v-model="view" :items="viewModeItems" />
      <span class="smart-table__status" :data-state="saveState">
        <span class="smart-table__status-dot" />
        {{ statusText }}
      </span>
      <span
        v-if="aiState.status !== 'idle'"
        class="smart-table__ai"
        :data-state="aiState.status"
        :title="aiState.error || undefined"
      >
        {{ aiText }}
      </span>
      <u-button class="smart-table__bar-btn" @click="appendRow()">新增行</u-button>
      <u-button class="smart-table__bar-btn" type="primary" @click="fieldDialogOpen = true">
        新增字段
      </u-button>
      <u-button class="smart-table__bar-btn" @click="chatOpen = !chatOpen">AI 对话</u-button>
    </div>

    <div class="smart-table__body">
      <!-- 主内容（表格/看板视图）：面板打开时压缩为左列，网格仍可见 -->
      <div class="smart-table__main">
        <KanbanView
          v-if="view === 'kanban'"
          :fields="doc?.fields ?? []"
          :rows="doc?.rows ?? []"
          @update-cell="onKanbanUpdateCell"
        />

        <!-- 网格视图：u-sheet 表格主体（虚拟滚动、选区键盘、undo/redo、拖拽调宽），
             工具栏 / 公式栏 / sheet 标签栏在多维表格形态下全部隐藏；列底统计行贴网格底部 -->
        <template v-else>
          <!-- 工具栏：搜索/筛选/排序/分组/字段隐藏，作用后的视图行集与列集驱动网格 -->
          <Toolbar v-if="doc" :fields="doc.fields" :state="toolbarState" />
          <div class="smart-table__grid-wrap">
            <div ref="sheetHostRef" class="smart-table__grid">
              <u-sheet
                v-if="doc"
                ref="sheetRef"
                :workbook="workbook"
                :rows="gridRows"
                :cols="gridCols"
                :header="header"
                :editors="editors"
                :resolve-cell-renderer="resolveCellRenderer"
                :show-toolbar="false"
                :show-formula-bar="false"
                :show-tabs="false"
                class="smart-table__sheet"
              />
            </div>
            <StatsBar :fields="viewFields" :rows="viewRows" />
          </div>
        </template>
      </div>

      <!-- 右侧 AI 对话面板（非全屏遮盖，可关闭），当前 doc 注入表格上下文 -->
      <AiChatPanel v-if="chatOpen" :doc="doc" @close="chatOpen = false" />
    </div>

    <FieldDialog v-model="fieldDialogOpen" @confirm="onFieldConfirm" />
    <FieldPanel :field="configField" @close="configFieldId = null" @apply="onFieldApply" />
    <RowPanel
      :fields="doc?.fields ?? []"
      :row="activeRow"
      @close="activeRowId = null"
      @update="onRowUpdate"
    />
  </div>
</template>

<script lang="ts" setup>
import type { SheetExposed } from '@veltra/sheet'
import { computed, nextTick, onMounted, reactive, ref, useTemplateRef, watch } from 'vue'

import AiChatPanel from './ai-chat-panel.vue'
import { useAiField, type AiFieldInput } from './ai-field'
import FieldDialog from './field-dialog.vue'
import FieldPanel from './field-panel.vue'
import KanbanView from './kanban-view.vue'
import RowPanel from './row-panel.vue'
import StatsBar from './stats-bar.vue'
import Toolbar, { type FilterCondition, type ToolbarState } from './toolbar.vue'
import { cellText, type CellValue, type FieldType, type TableField, type TableRow } from './types'
import { useSmartSheet, type ViewItem } from './use-smart-sheet'
import { useTableDoc, type FieldPatch } from './use-table-doc'

/**
 * 智慧表格演示页（v2）：网格视图以 `u-sheet` 为表格主体（类型化列渲染、列头
 * 字段名 + 类型图标 + 配置入口、行头行号 + 勾选 + 展开行详情、拖拽调宽、
 * 虚拟滚动、undo/redo），doc ↔ Sheet 双向数据流与编辑持久化见
 * `use-smart-sheet` / `use-table-doc`；工具栏五能力（搜索/筛选/排序/分组/
 * 字段隐藏）的视图管线产出 `viewFields`/`viewItems` 驱动网格；新增字段可选
 * AI 场景，整列流式逐格回填见 `ai-field`（顶栏展示进度与结果）；右侧
 * `ai-chat-panel` AI 对话面板（表格上下文注入，见 `ai-chat.ts`）；看板视图
 * 沿用 `kanban-view`（卡片跨列拖拽写回同一 doc）。
 * 数据契约见 `types.ts` 与参考服务 `server/smart-table.ts`。
 */
const { doc, saveState, load, addRow: appendRow, addField, updateField } = useTableDoc()

const sheetRef = useTemplateRef<SheetExposed>('sheetRef')
const sheetHostRef = useTemplateRef<HTMLElement>('sheetHostRef')

/** 列设置面板当前字段（null = 关闭） */
const configFieldId = ref<string | null>(null)
const configField = computed(
  () => doc.value?.fields.find((f) => f.id === configFieldId.value) ?? null
)

/** 行详情侧边栏当前行（null = 关闭；行被删后自动收起） */
const activeRowId = ref<string | null>(null)
const activeRow = computed(() => doc.value?.rows.find((r) => r.id === activeRowId.value) ?? null)

// ─── 工具栏视图管线（搜索/筛选/排序/分组/字段隐藏 → 视图行集与列集） ───

const toolbarState = reactive<ToolbarState>({
  keyword: '',
  filters: [],
  sort: null,
  groupFieldId: '',
  hiddenFieldIds: []
})

/** 可见字段序（字段隐藏作用后的列集） */
const viewFields = computed<TableField[]>(() =>
  (doc.value?.fields ?? []).filter((field) => !toolbarState.hiddenFieldIds.includes(field.id))
)

/** 视图行集：五项能力依次作用；值编辑实时重算，行集/行序/列集变化驱动网格重装配 */
const viewItems = computed<ViewItem[]>(() => {
  const table = doc.value
  if (!table) return []
  const fieldsById = new Map(table.fields.map((field) => [field.id, field]))
  let rows = table.rows
  const keyword = toolbarState.keyword.trim()
  if (keyword !== '') {
    rows = rows.filter((row) =>
      table.fields.some((field) => cellText(row.values[field.id] ?? null).includes(keyword))
    )
  }
  for (const cond of toolbarState.filters) {
    if (!conditionReady(cond)) continue
    const field = fieldsById.get(cond.fieldId)
    if (!field) continue // 条件引用的字段已删除：跳过
    rows = rows.filter((row) => matchesCondition(row.values[field.id] ?? null, cond))
  }
  const sort = toolbarState.sort
  const sortField = sort ? fieldsById.get(sort.fieldId) : undefined
  if (sort && sortField) {
    rows = [...rows].sort((a, b) =>
      compareCell(a.values[sortField.id] ?? null, b.values[sortField.id] ?? null, sort.dir)
    )
  }
  const groupField = fieldsById.get(toolbarState.groupFieldId)
  return groupField ? groupViewItems(rows, groupField) : rows.map((row) => ({ kind: 'row', row }))
})

/** 视图数据行（统计行随管线联动；分组段头不参与统计） */
const viewRows = computed<TableRow[]>(() =>
  viewItems.value.flatMap((item) => (item.kind === 'row' ? [item.row] : []))
)

/** 需要值输入的筛选操作符必须已填值才生效 */
function conditionReady(cond: FilterCondition): boolean {
  return ['empty', 'notEmpty', 'checked', 'unchecked'].includes(cond.op) || cond.value.trim() !== ''
}

function isEmptyValue(value: CellValue): boolean {
  return value == null || value === '' || (Array.isArray(value) && value.length === 0)
}

/** 单条件匹配：文案类按子串，数值/日期按数值或字典序比较 */
function matchesCondition(value: CellValue, cond: FilterCondition): boolean {
  const text = cellText(value)
  switch (cond.op) {
    case 'contains':
      return text.includes(cond.value)
    case 'notContains':
      return !text.includes(cond.value)
    case 'eq':
      return compareLoose(value, cond.value) === 0
    case 'ne':
      return compareLoose(value, cond.value) !== 0
    case 'gt':
      return compareLoose(value, cond.value) > 0
    case 'lt':
      return compareLoose(value, cond.value) < 0
    case 'empty':
      return isEmptyValue(value)
    case 'notEmpty':
      return !isEmptyValue(value)
    case 'checked':
      return value === true
    case 'unchecked':
      return value !== true
  }
}

function compareLoose(value: CellValue, raw: string): number {
  if (typeof value === 'number') {
    const num = Number(raw)
    if (Number.isFinite(num)) return value - num
  }
  return cellText(value).localeCompare(raw, 'zh')
}

/** 排序比较：数值按大小，其余按文案；空值恒排尾 */
function compareCell(a: CellValue, b: CellValue, dir: 'asc' | 'desc'): number {
  const emptyA = isEmptyValue(a)
  const emptyB = isEmptyValue(b)
  if (emptyA || emptyB) return emptyA && emptyB ? 0 : emptyA ? 1 : -1
  const order =
    typeof a === 'number' && typeof b === 'number'
      ? a - b
      : cellText(a).localeCompare(cellText(b), 'zh')
  return dir === 'asc' ? order : -order
}

/** 分组分段：单选按选项序、其余按首现序，空值归「未分组」段置尾 */
function groupViewItems(rows: TableRow[], field: TableField): ViewItem[] {
  const order: string[] = field.type === 'select' ? [...(field.options ?? [])] : []
  const buckets = new Map<string, TableRow[]>()
  for (const row of rows) {
    const key = cellText(row.values[field.id] ?? null)
    if (key !== '' && !order.includes(key)) order.push(key)
    const bucket = buckets.get(key)
    if (bucket) bucket.push(row)
    else buckets.set(key, [row])
  }
  const orderedKeys = order.filter((key) => buckets.has(key))
  const ungrouped = buckets.get('')
  if (ungrouped) orderedKeys.push('')
  const items: ViewItem[] = []
  for (const key of orderedKeys) {
    const bucket = buckets.get(key)!
    items.push({ kind: 'band', label: `${key === '' ? '未分组' : key} · ${bucket.length}` })
    for (const row of bucket) items.push({ kind: 'row', row })
  }
  return items
}

const { workbook, header, editors, resolveCellRenderer, gridRows, gridCols, bindGrid, writeCell } =
  useSmartSheet({
    doc,
    fields: viewFields,
    items: viewItems,
    onFieldConfig,
    onRowExpand,
    getGrid: () => sheetRef.value?.getGrid(),
    getHost: () => sheetHostRef.value ?? null
  })

/** 列头配置入口点击：打开该字段的列设置面板（改名 / 改类型 / 选项管理） */
function onFieldConfig(fieldId: string): void {
  configFieldId.value = fieldId
}

/** 行头展开入口点击：打开该行的详情侧边栏 */
function onRowExpand(rowId: string): void {
  activeRowId.value = rowId
}

/** 列设置确定：写回 doc（类型/选项变化时既有值同步清洗），网格随字段签名重建 */
function onFieldApply(patch: FieldPatch): void {
  const fieldId = configFieldId.value
  if (fieldId) updateField(fieldId, patch)
  configFieldId.value = null
}

/** 行详情编辑：经 writeCell 写网格模型，cell-change 通路回写 doc 并持久化 */
function onRowUpdate(fieldId: string, value: CellValue): void {
  const rowId = activeRowId.value
  if (rowId) writeDocCell(fieldId, rowId, value)
}

/**
 * 外部编辑兜底通路（行详情 / 看板卡片共用）：优先写网格模型（可撤销，
 * cell-change 回写 doc）；行被过滤或字段被隐藏时直写 doc，改动不丢。
 */
function writeDocCell(fieldId: string, rowId: string, value: CellValue): void {
  if (writeCell(fieldId, rowId, value)) return
  const row = doc.value?.rows.find((r) => r.id === rowId)
  if (row) row.values[fieldId] = value
}

/** 看板卡片编辑（跨列拖拽改分组值）：与网格共享同一 doc，一侧编辑另一侧可见 */
function onKanbanUpdateCell(payload: { rowId: string; fieldId: string; value: CellValue }): void {
  writeDocCell(payload.fieldId, payload.rowId, payload.value)
}

/** 视图切换（本地记忆即可，不持久化） */
type ViewMode = 'table' | 'kanban'
const view = ref<ViewMode>('table')

/** 右侧 AI 对话面板开关（默认收起，打开时网格压缩为左列仍可见） */
const chatOpen = ref(false)
const viewModeItems = [
  { label: '表格', value: 'table' },
  { label: '看板', value: 'kanban' }
]

const statusText = computed(
  () =>
    ({ saved: '已保存', dirty: '待保存', saving: '保存中…', error: '保存失败' })[saveState.value]
)

const fieldDialogOpen = ref(false)

/** AI 字段回填：状态条展示进行中/完成/失败，执行与流式解析见 `ai-field.ts` */
const { state: aiState, start: startAiFill } = useAiField(doc, writeCell)
const aiText = computed(() => {
  switch (aiState.status) {
    case 'running':
      return `AI 回填「${aiState.fieldName}」中 ${aiState.filled}/${aiState.total}`
    case 'done':
      return `AI 回填完成（${aiState.filled} 格）`
    default:
      return 'AI 回填失败'
  }
})

/** 新增字段确认：先落字段（网格装配新列），选了 AI 场景则紧接着整列流式回填 */
function onFieldConfirm(payload: {
  name: string
  type: FieldType
  options?: string[]
  ai?: AiFieldInput
}): void {
  const field = addField(payload)
  if (field && payload.ai) void startAiFill(field, payload.ai)
}

// 视图切回网格：u-sheet 重新挂载，行头控件覆盖层随新网格实例重绑
watch(view, async (mode) => {
  if (mode === 'table') {
    await nextTick()
    bindGrid()
  }
})

onMounted(() => void load())
</script>

<style lang="scss" scoped>
.smart-table {
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-height: 100%;
}

.smart-table__bar {
  display: flex;
  align-items: center;
  gap: 12px;
}

.smart-table__title {
  font-size: 14px;
  font-weight: 600;
  color: var(--u-text-color-main);
}

.smart-table__status {
  flex: 1;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: var(--u-text-color-second);
}

.smart-table__status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--u-color-info);
}

.smart-table__status[data-state='saved'] .smart-table__status-dot {
  background: var(--u-color-success);
}

.smart-table__status[data-state='dirty'] .smart-table__status-dot,
.smart-table__status[data-state='saving'] .smart-table__status-dot {
  background: var(--u-color-warning);
}

.smart-table__status[data-state='error'] .smart-table__status-dot {
  background: var(--u-color-danger, #f04438);
}

/* AI 字段回填状态：失败原因经 toast 即时提示 + title 悬浮展示，不挤顶栏布局 */
.smart-table__ai {
  flex: none;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: var(--u-text-color-second);

  &::before {
    content: '';
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--u-color-info);
  }

  &[data-state='done'] {
    color: var(--u-color-success);

    &::before {
      background: var(--u-color-success);
    }
  }

  &[data-state='error'] {
    color: var(--u-color-danger, #f04438);

    &::before {
      background: var(--u-color-danger, #f04438);
    }
  }
}

.smart-table__bar-btn {
  flex: none;
}

/* 主内容 + AI 对话面板成行：面板固定宽，主内容压缩（网格自身可横向滚动） */
.smart-table__body {
  display: flex;
  align-items: stretch;
  gap: 12px;
}

.smart-table__main {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

/* 主内容区不提供确定高度（页面随窗口滚动），网格给固定高度（同 sheet 演示页先例）；
   统计条贴网格底部，与网格合成一个无间距整体 */
.smart-table__grid-wrap {
  display: flex;
  flex-direction: column;
}

.smart-table__grid {
  height: 560px;
}

.smart-table__sheet {
  height: 100%;
}
</style>

<style lang="scss">
/* 网格 DOM 覆盖层（非 scoped）：列头元素、行头控件（勾选 + 展开行详情）与
   类型化编辑器 UI 由 use-smart-sheet / cell-editors 以原生 DOM 创建并挂进
   u-sheet 网格容器，scoped 样式无法命中，统一在此收口。行头覆盖层本身
   pointer-events: none，画布交互（表头拖选、列宽拖拽、行选择）不受影响。 */

.smart-table-col-head {
  display: flex;
  align-items: center;
  gap: 4px;
  height: 100%;
  padding: 0 6px;
  box-sizing: border-box;
  font-size: 12px;
  overflow: hidden;

  &__icon {
    flex: none;
    display: inline-flex;
    width: 14px;
    height: 14px;
    color: var(--u-text-color-second);

    svg {
      width: 100%;
      height: 100%;
    }
  }

  &__name {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-weight: 500;
    color: var(--u-text-color-title);
  }

  &__config {
    flex: none;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 18px;
    height: 18px;
    padding: 0;
    border: none;
    border-radius: 4px;
    background: transparent;
    color: var(--u-text-color-second);
    pointer-events: auto;
    cursor: pointer;

    svg {
      width: 14px;
      height: 14px;
    }

    &:hover {
      background: var(--u-fill-color, #eef0f3);
      color: var(--u-text-color-main);
    }
  }
}

/* 类型化行内编辑器：格内输入框与下拉/多选面板（网格容器 overflow: hidden，
   面板近底缘时由 cell-editors 翻到格上方） */

.smart-table-editor {
  position: absolute;
  z-index: 6; /* 高于行头勾选层（5），低于导入遮罩（10） */
  box-sizing: border-box;
  font-size: 12px;
  color: var(--u-text-color-main, #303233);
  background: var(--u-bg-color-top, #fff);
  border: 1px solid var(--u-border-muted-color, #dcdfe3);
  border-radius: 4px;
  box-shadow: var(--u-shadow-sm, 0 2px 8px rgb(0 0 0 / 12%));

  /* 格内输入框壳：与锚定格重合，主色描边对齐引擎编辑态 */
  &--cell {
    border-color: var(--u-color-primary, #2170e7);
  }

  /* 下拉/多选面板 */
  &--panel {
    display: flex;
    flex-direction: column;
    max-height: 244px;
  }

  &__input {
    display: block;
    width: 100%;
    height: 100%;
    padding: 0 6px;
    box-sizing: border-box;
    border: none;
    outline: none;
    background: transparent;
    font: inherit;
    color: inherit;
  }

  &__list {
    overflow-y: auto;
    padding: 4px;
  }

  &__option,
  &__check {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 5px 8px;
    border-radius: 4px;
    cursor: pointer;
    white-space: nowrap;

    &:hover,
    &.is-active {
      background: var(--u-bg-color-hover, #f2f4f7);
    }
  }

  &__option.is-selected {
    color: var(--u-color-primary, #2170e7);
    font-weight: 500;
  }

  &__check input {
    flex: none;
    margin: 0;
    accent-color: var(--u-color-primary, #2170e7);
  }

  &__empty {
    padding: 10px 8px;
    color: var(--u-text-color-second, #8a919c);
  }

  &__footer {
    display: flex;
    justify-content: flex-end;
    padding: 6px 8px;
    border-top: 1px solid var(--u-border-muted-color, #eceef1);
  }

  &__confirm {
    padding: 3px 12px;
    border: none;
    border-radius: 4px;
    background: var(--u-color-primary, #2170e7);
    color: #fff;
    font-size: 12px;
    cursor: pointer;

    &:hover {
      opacity: 0.9;
    }
  }
}

.smart-table-row-widgets {
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  z-index: 5; /* 低于导入遮罩（10），高于画布层 */
  pointer-events: none;
}

/* 每行一条控件带：左端勾选框，右端展开行详情箭头（行号由画布绘制居中） */
.smart-table-row-widget {
  position: absolute;
  left: 0;
  width: 100%;
  display: flex;
  align-items: stretch;
  justify-content: space-between;

  &__check {
    position: relative;
    flex: none;
    width: 26px;
    padding: 0;
    border: none;
    background: transparent;
    pointer-events: auto;
    cursor: pointer;

    /* 14px 勾选框视觉（居左，避开画布行号绘制区） */
    &::before {
      content: '';
      position: absolute;
      left: 6px;
      top: 50%;
      width: 14px;
      height: 14px;
      box-sizing: border-box;
      transform: translateY(-50%);
      /* 与 cell-renderers 画布色板同源的固定色（画布行号同为固定色系） */
      border: 1.5px solid #c4cad2;
      border-radius: 3px;
      background: #fff;
    }

    &.is-checked::before {
      border-color: var(--u-color-primary);
      background: var(--u-color-primary);
    }

    &.is-checked::after {
      content: '';
      position: absolute;
      left: 10.5px;
      top: 50%;
      width: 4px;
      height: 8px;
      border: solid #fff;
      border-width: 0 1.5px 1.5px 0;
      transform: translateY(-62%) rotate(45deg);
    }
  }

  &__expand {
    flex: none;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 18px;
    margin-right: 2px;
    padding: 0;
    border: none;
    border-radius: 4px;
    background: transparent;
    color: var(--u-text-color-second);
    pointer-events: auto;
    cursor: pointer;

    svg {
      width: 12px;
      height: 12px;
    }

    &:hover {
      background: var(--u-fill-color, #eef0f3);
      color: var(--u-color-primary);
    }
  }
}
</style>
