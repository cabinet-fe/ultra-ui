<template>
  <div class="sheet-report-demo">
    <div class="sheet-report-demo__hint">
      <strong>UReportDesigner</strong> + 内嵌 <strong>UReportViewer</strong>（预览模式）薄消费演示。
      在工具栏打开<strong>数据中枢</strong>，自行输入 MySQL / PostgreSQL
      连接（无内置默认连接），配置 SQL 数据集后拖拽字段绑定；切<strong>预览模式</strong>经
      <code>createHttpConnector({ endpoint: '/report-api' })</code> 取数，Filter Bar
      按绑定数据集参数并集筛选。 dev 时 vite proxy 联动 hono
      契约参考服务（<code>playground/server</code>）。
    </div>

    <div class="sheet-report-demo__toolbar">
      <template v-if="!standaloneViewer">
        <u-button size="small" plain @click="openStandaloneViewer">在独立查看器中打开</u-button>
      </template>
      <template v-else>
        <u-button size="small" plain @click="standaloneViewer = false">返回设计器</u-button>
      </template>
      <span v-if="viewerTemplate" class="sheet-report-demo__toolbar-hint">
        已载入模板（{{ viewerTemplate.datasets.length }} 个数据集）
      </span>
    </div>

    <u-report-designer
      v-show="!standaloneViewer"
      ref="designerRef"
      class="sheet-report-demo__designer"
      :connector="connector"
      v-model:connections="connections"
    />

    <u-report-viewer
      v-if="standaloneViewer && viewerTemplate"
      class="sheet-report-demo__viewer"
      :connector="connector"
      :template="viewerTemplate"
    />
  </div>
</template>

<script lang="ts" setup>
import {
  createHttpConnector,
  type DataConnection,
  type ReportDesignerExposed,
  type ReportTemplate
} from '@veltra/sheet'
import '@veltra/sheet/components/report/style'
import { ref, useTemplateRef } from 'vue'

/** 契约参考服务：vite dev 经 /report-api 代理到 hono（playground/server） */
const connector = createHttpConnector({ endpoint: '/report-api' })

const connections = ref<DataConnection[]>([])
const designerRef = useTemplateRef<ReportDesignerExposed>('designerRef')
const standaloneViewer = ref(false)
const viewerTemplate = ref<ReportTemplate | undefined>()

function openStandaloneViewer() {
  const template = designerRef.value?.getTemplate()
  if (!template?.datasets.length) return
  viewerTemplate.value = template
  standaloneViewer.value = true
}
</script>

<style scoped lang="scss">
.sheet-report-demo {
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-height: 640px;
  height: calc(100vh - 180px);
}

.sheet-report-demo__hint {
  font-size: 13px;
  line-height: 1.7;
  color: var(--u-text-color-secondary);
}

.sheet-report-demo__toolbar {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.sheet-report-demo__toolbar-hint {
  font-size: 12px;
  color: var(--u-text-color-secondary);
}

.sheet-report-demo__designer,
.sheet-report-demo__viewer {
  flex: 1;
  min-height: 0;
}
</style>
