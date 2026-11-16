<template>
  <div class="er-view">
    <div v-if="error" class="er-view__tip">{{ error }}</div>
    <div v-else-if="loading" class="er-view__tip">正在加载 ER 图…</div>
    <!-- erd-viewer 为运行时注册的自定义元素（isCustomElement 见 vite.config.ts），文档经 value 属性注入 -->
    <erd-viewer v-else-if="docValue" ref="viewer" class="er-view__canvas"></erd-viewer>
    <div v-else class="er-view__tip">
      库内暂无表——先在会话中让 AI 完成建模落库，再切换回这里查看 ER 图
    </div>
  </div>
</template>

<script lang="ts" setup>
import { nextTick, onMounted, ref } from 'vue'

import { getRelationships, getTables } from './api'
import { toErdDocumentValue } from './erd-document'

defineOptions({ name: 'ErView' })

type ErdViewerElement = HTMLElement & { value: string }

const viewer = ref<ErdViewerElement | null>(null)
const docValue = ref('')
const loading = ref(false)
const error = ref('')

onMounted(async () => {
  loading.value = true
  try {
    // erd-viewer 包体大：只在打开 ER 视图时动态加载（构建产物落按需 chunk，不进首屏）
    const [tablesRes, relationshipsRes] = await Promise.all([
      getTables(),
      getRelationships(),
      import('@dineug/erd-editor/erd-viewer.js')
    ])
    // 空库不给 viewer 喂空文档，落「暂无表」提示而不是一张空画布
    docValue.value =
      tablesRes.tables.length === 0
        ? ''
        : toErdDocumentValue(tablesRes.tables, relationshipsRes.relationships)
    // 先撤 loading 让 erd-viewer 进 DOM，再注入文档（模板按 error → loading → 文档链路渲染）
    loading.value = false
    await nextTick()
    if (docValue.value && viewer.value) viewer.value.value = docValue.value
  } catch (reason) {
    error.value = reason instanceof Error ? reason.message : String(reason)
    loading.value = false
  }
})
</script>

<style scoped lang="scss">
.er-view {
  height: 100%;
  min-height: 0;
  overflow: hidden;
}

.er-view__canvas {
  display: block;
  width: 100%;
  height: 100%;
}

.er-view__tip {
  padding: 24px;
  color: var(--u-text-color-second);
  font-size: 13px;
  text-align: center;
}
</style>
