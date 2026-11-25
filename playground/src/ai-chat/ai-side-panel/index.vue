<template>
  <div>
    <CustomCard title="侧边面板（切换内容 · 刷新实例 · 全屏 · 关闭重开）">
      <div class="demo-controls">
        <USegment v-model="activeMode" :items="modeItems" size="small" />
        <UButton v-if="!panelOpen" size="small" type="primary" plain @click="panelOpen = true">
          重新打开面板
        </UButton>
        <span class="demo-hint"
          >刷新次数：{{ refreshCount }} · 全屏：{{ fullscreen ? '是' : '否' }}</span
        >
      </div>

      <div class="panel-stage">
        <div class="panel-stage__left">
          <div class="panel-stage__title">主内容区占位</div>
          <p class="panel-stage__desc">
            外层容器设置了 <code>position: relative; height: 480px; overflow: hidden;</code>。
            点击面板右上角全屏按钮，<code>UAiSidePanel</code> 会铺满整个演示容器。
          </p>
        </div>

        <UAiSidePanel
          v-if="panelOpen"
          v-model:fullscreen="fullscreen"
          class="panel-stage__right"
          :tool-call="activeToolCall"
          :tool="activeToolMeta"
          @refresh="refreshCount += 1"
          @close="panelOpen = false"
        />
      </div>
    </CustomCard>
  </div>
</template>

<script lang="ts" setup>
import { type ChatToolCall, type ChatToolMeta, UAiSidePanel } from '@veltra/ai'
import { UButton, USegment } from '@veltra/desktop'
import { Monitor, Search } from '@veltra/icons/normal'
import { computed, ref } from 'vue'

import CustomCard from '../../desktop/card/custom-card.vue'
import AdminPanel from '../admin-panel.vue'

type PanelMode = 'user-form' | 'sales-chart' | 'order-list' | 'fallback'

const activeMode = ref<PanelMode>('user-form')
const panelOpen = ref(true)
const fullscreen = ref(false)
const refreshCount = ref(0)

const modeItems = [
  { label: '用户表单', value: 'user-form' },
  { label: '销售图表', value: 'sales-chart' },
  { label: '订单列表', value: 'order-list' },
  { label: '无 render 兜底', value: 'fallback' }
]

const adminToolMeta: ChatToolMeta = {
  name: 'openAdminPage',
  label: '后台页面',
  icon: Monitor,
  render: AdminPanel,
  renderTo: 'panel',
  panelTitle: (call) => {
    try {
      const page = JSON.parse(call.arguments || '{}').page as string
      const titles: Record<string, string> = {
        'user-form': '编辑用户信息',
        'sales-chart': '查看销售图表',
        'order-list': '管理订单列表'
      }
      return titles[page] ?? '后台页面'
    } catch {
      return '后台页面'
    }
  }
}

const fallbackToolMeta: ChatToolMeta = {
  name: 'inspectNode',
  label: '节点巡检快照',
  icon: Search,
  renderTo: 'panel'
}

const activeToolCall = computed<ChatToolCall>(() => {
  if (activeMode.value === 'fallback') {
    return {
      id: 'panel-fallback',
      name: 'inspectNode',
      arguments: '{"cluster":"prod-east","node":"worker-03"}',
      status: 'success',
      result: JSON.stringify(
        { healthy: true, cpuPercent: 28, memPercent: 61, uptime: '14d 6h' },
        null,
        2
      )
    }
  }
  return {
    id: `panel-${activeMode.value}`,
    name: 'openAdminPage',
    arguments: JSON.stringify({ page: activeMode.value }),
    status: 'success',
    result: JSON.stringify({ page: activeMode.value, opened: true })
  }
})

const activeToolMeta = computed(() =>
  activeMode.value === 'fallback' ? fallbackToolMeta : adminToolMeta
)
</script>

<style scoped lang="scss">
.demo-controls {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.demo-hint {
  font-size: 13px;
  color: var(--u-text-color-second);
}

.panel-stage {
  position: relative;
  display: flex;
  height: 480px;
  overflow: hidden;
  border: 1px solid var(--u-border-color);
  border-radius: var(--u-radius-large);
  background-color: var(--u-bg-color-bottom);
}

.panel-stage__left {
  flex: 1;
  min-width: 0;
  padding: 20px;
}

.panel-stage__title {
  font-size: 14px;
  font-weight: 600;
  color: var(--u-text-color-title);
  margin-bottom: 8px;
}

.panel-stage__desc {
  margin: 0;
  font-size: 13px;
  line-height: 1.6;
  color: var(--u-text-color-second);
}

.panel-stage__right {
  width: 440px;
  flex-shrink: 0;
}
</style>
