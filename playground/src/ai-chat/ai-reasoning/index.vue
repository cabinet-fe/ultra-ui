<template>
  <div>
    <CustomCard title="已完成的思考块（默认折叠 vs 默认展开）">
      <div class="reasoning-stack">
        <UAiReasoning :content="sampleReasoning" :duration="4200" cache-key="demo-collapsed" />
        <UAiReasoning
          :content="sampleReasoning"
          :duration="6800"
          cache-key="demo-expanded"
          default-expanded
        />
      </div>
    </CustomCard>

    <CustomCard title="流式思考中（220px 限高自动吸底 + u-shine 扫光）">
      <div class="demo-actions">
        <UButton size="small" type="primary" plain @click="startStream">模拟流式思考</UButton>
        <span class="demo-hint">状态：{{ thinking ? '思考中…' : '已落定' }}</span>
      </div>

      <UAiReasoning
        :content="streamContent"
        :thinking="thinking"
        cache-key="demo-streaming"
        default-expanded
      />
    </CustomCard>
  </div>
</template>

<script lang="ts" setup>
import { UAiReasoning } from '@veltra/ai'
import { UButton } from '@veltra/desktop'
import { onBeforeUnmount, ref } from 'vue'

import CustomCard from '../../desktop/card/custom-card.vue'

const sampleReasoning = [
  '1. 检查 @veltra/ai 导出边界：主入口导出 17 个独立组件与 UAiChat。',
  '2. 核对独立组件 DI 回落约定：未注入 AiChatDIKey 时需靠显式 props/emits/slots 完整运行。',
  '3. 确认导航路由放置在 /ai-chat/<key>/index，规避 vite.config.ts 的 /ai 接口代理前缀。'
].join('\n')

const streamLines = [
  '步骤 1：解析用户意图与上下文约束。',
  '步骤 2：读取 playground/src/nav-config.ts 与 router.ts。',
  '步骤 3：校验 demoMeta 与 TOP_LEVEL_DEMO_KEYS 过滤逻辑。',
  '步骤 4：检查下拉面板组件 direction="bottom" 避免卡片顶部裁切。',
  '步骤 5：检查 UAiSidePanel 全屏定位祖先的 position: relative。',
  '步骤 6：检查 UAiSessionNav 右侧浮层留白空间。',
  '步骤 7：验证 lint、单元测试与生产构建。'
]

const streamContent = ref(streamLines.slice(0, 3).join('\n'))
const thinking = ref(false)
let timer: ReturnType<typeof setInterval> | undefined

const startStream = () => {
  clearInterval(timer)
  thinking.value = true
  let idx = 0
  streamContent.value = ''
  timer = setInterval(() => {
    if (idx >= streamLines.length) {
      clearInterval(timer)
      thinking.value = false
      return
    }
    streamContent.value = streamContent.value
      ? `${streamContent.value}\n${streamLines[idx]}`
      : streamLines[idx]!
    idx += 1
  }, 400)
}

onBeforeUnmount(() => {
  clearInterval(timer)
})
</script>

<style scoped lang="scss">
.reasoning-stack {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.demo-actions {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.demo-hint {
  font-size: 13px;
  color: var(--u-text-color-second);
}
</style>
