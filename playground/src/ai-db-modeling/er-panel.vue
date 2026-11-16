<template>
  <div class="er-panel">
    <div v-if="toolCall.status === 'error'" class="er-panel__tip">
      ER 图打开失败：{{ toolCall.error }}
    </div>
    <div v-else-if="generating" class="er-panel__tip">正在生成 ER 图…</div>
    <!-- key 取调用 id：面板切换聚焦到另一次调用时重挂载，重新拉取最新库内数据；
         面板头部刷新按钮重挂载整个 render 组件，效果相同 -->
    <er-view v-else :key="toolCall.id" class="er-panel__view" />
  </div>
</template>

<script lang="ts" setup>
import type { ChatToolRenderProps } from '@veltra/ai'
import { computed } from 'vue'

import ErView from './er-view.vue'

defineOptions({ name: 'ErPanel' })

const props = defineProps<ChatToolRenderProps>()

/** 入参流式生成中或本地校验未完成（renderErDiagram 无网络请求，等待极短） */
const generating = computed(() =>
  ['pending', 'running', 'awaiting-confirm'].includes(props.toolCall.status)
)
</script>

<style scoped lang="scss">
// 面板体是 UScroll 的内容层（高度 auto），height: 100% 不生效；
// 绝对定位挂到 UScroll 根（position: relative）铺满面板体，面板拖宽 / 全屏均自适应
.er-panel {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
}

.er-panel__view {
  flex: 1;
  min-height: 0;
}

.er-panel__tip {
  padding: 24px;
  color: var(--u-text-color-second);
  font-size: 13px;
  text-align: center;
}
</style>
