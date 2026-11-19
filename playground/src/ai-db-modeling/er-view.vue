<template>
  <div class="er-view">
    <div v-if="error" class="er-view__tip">{{ error }}</div>
    <div v-else-if="loading" class="er-view__tip">正在加载 ER 图…</div>
    <template v-else-if="tables.length > 0">
      <!-- 模块过滤 chip：全部 / 库内 module 去重 / 存在无模块表时的「未分组」 -->
      <u-chip-group
        v-model="selectedModule"
        :items="moduleOptions"
        size="small"
        class="er-view__modules"
      />
      <!-- erd-editor 为运行时注册的自定义元素（isCustomElement 见 vite.config.ts），文档经 setInitialValue / value 注入；不设 readonly，允许拖拽调整（不回写服务端） -->
      <erd-editor ref="editor" class="er-view__canvas"></erd-editor>
    </template>
    <div v-else class="er-view__tip">
      库内暂无表——先在会话中让 AI 完成建模落库，再打开 ER 图查看
    </div>
  </div>
</template>

<script lang="ts" setup>
import type { ErdEditorElement } from '@dineug/erd-editor'
import { UChipGroup } from '@veltra/desktop'
import { computed, nextTick, onMounted, ref, watch } from 'vue'

import type { RelationshipDef, TableDef } from './api'
import { getRelationships, getTables } from './api'
import { toErdDocumentValue } from './erd-document'

defineOptions({ name: 'ErView' })

/** chip 选中值：'' = 全部，null = 未分组；模块名 trim 后非空，不会与两个哨兵值冲突 */
const ALL = ''
const UNGROUPED = null

const editor = ref<ErdEditorElement | null>(null)
const loading = ref(false)
const error = ref('')
/** 库内快照：chip 过滤在本地做，切换模块不回源 */
const tables = ref<TableDef[]>([])
const relationships = ref<RelationshipDef[]>([])
const selectedModule = ref<string | null>(ALL)

/** chip 选项：全部 + 库内 module 去重 + 存在无模块表时的「未分组」 */
const moduleOptions = computed(() => {
  const names = [
    ...new Set(
      tables.value.flatMap((table) => (typeof table.module === 'string' ? [table.module] : []))
    )
  ]
  const ungrouped = tables.value.some((table) => !table.module)
  return [
    { label: '全部', value: ALL },
    ...names.map((name) => ({ label: name, value: name })),
    ...(ungrouped ? [{ label: '未分组', value: UNGROUPED }] : [])
  ]
})

/** 按选中模块过滤：只留该模块的表 + 两端表都在该模块的关系 */
function filterByModule(module: string | null): {
  tables: TableDef[]
  relationships: RelationshipDef[]
} {
  if (module === ALL) return { tables: tables.value, relationships: relationships.value }
  const filtered = tables.value.filter((table) =>
    module === UNGROUPED ? !table.module : table.module === module
  )
  const names = new Set(filtered.map((table) => table.name))
  return {
    tables: filtered,
    relationships: relationships.value.filter(
      (relationship) => names.has(relationship.from.table) && names.has(relationship.to.table)
    )
  }
}

/** 过滤后的库 → 编辑器文档（每次重生成，布局重置为初始坐标） */
function currentDocument(): string {
  const filtered = filterByModule(selectedModule.value)
  return toErdDocumentValue(filtered.tables, filtered.relationships)
}

// chip 切换：重新生成文档整体替换（编辑器内手动拖拽 / 布局不保留，不回写服务端）
watch(selectedModule, () => {
  if (editor.value) editor.value.value = currentDocument()
})

onMounted(async () => {
  loading.value = true
  try {
    // erd-editor 包体大：只在 ER 画布挂载（会话卡片打开右侧面板）时动态加载（构建产物落按需 chunk，不进首屏）
    const [tablesRes, relationshipsRes] = await Promise.all([
      getTables(),
      getRelationships(),
      import('@dineug/erd-editor/erd-editor.js')
    ])
    // 空库不渲染编辑器，落「暂无表」提示而不是一张空画布
    if (tablesRes.tables.length === 0) {
      loading.value = false
      return
    }
    tables.value = tablesRes.tables
    relationships.value = relationshipsRes.relationships
    // 先撤 loading 让 erd-editor 进 DOM，再注入文档（模板按 error → loading → 画布链路渲染）
    loading.value = false
    await nextTick()
    if (editor.value) editor.value.setInitialValue(currentDocument())
  } catch (reason) {
    error.value = reason instanceof Error ? reason.message : String(reason)
    loading.value = false
  }
})
</script>

<style scoped lang="scss">
.er-view {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  overflow: hidden;
}

.er-view__modules {
  flex: none;
  margin-bottom: 8px;
}

.er-view__canvas {
  display: block;
  flex: 1;
  min-height: 0;
  width: 100%;
}

.er-view__tip {
  padding: 24px;
  color: var(--u-text-color-second);
  font-size: 13px;
  text-align: center;
}
</style>
