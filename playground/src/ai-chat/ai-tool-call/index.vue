<template>
  <div>
    <CustomCard title="标准工具状态一览（通用 <pre> 数据视图）">
      <div class="demo-actions">
        <UButton size="small" plain @click="resetConfirmCall">重置待确认卡片</UButton>
      </div>

      <div class="tool-stack">
        <UAiToolCall :tool-call="runningCall" :tool="{ name: 'runTests', label: '运行测试' }" />

        <UAiToolCall
          :tool-call="confirmCall"
          :tool="deleteToolMeta"
          @respond="handleConfirmRespond"
        />

        <UAiToolCall
          :tool-call="successCall"
          :tool="{ name: 'readFile', label: '读取配置', icon: Books }"
        />

        <UAiToolCall :tool-call="errorCall" />

        <UAiToolCall :tool-call="rejectedCall" :tool="deleteToolMeta" />
      </div>
    </CustomCard>

    <CustomCard title="自定义渲染组件与面板入口">
      <div class="tool-stack">
        <UAiToolCall :tool-call="weatherCall" :tool="weatherToolMeta" />
        <UAiToolCall
          :tool-call="panelCall"
          :tool="panelToolMeta"
          @open-panel="(id) => message.info(`请求打开侧边面板：${id}`)"
        />
      </div>
    </CustomCard>
  </div>
</template>

<script lang="ts" setup>
import { type ChatToolCall, type ChatToolMeta, UAiToolCall } from '@veltra/ai'
import { UButton, message } from '@veltra/desktop'
import { Books, Delete, Monitor, Sun } from '@veltra/icons/normal'
import { ref } from 'vue'

import CustomCard from '../../desktop/card/custom-card.vue'
import WeatherCard from '../weather-card.vue'

const deleteToolMeta: ChatToolMeta = { name: 'deleteFile', label: '删除文件', icon: Delete }
const weatherToolMeta: ChatToolMeta = {
  name: 'getWeather',
  label: '查天气',
  icon: Sun,
  render: WeatherCard
}
const panelToolMeta: ChatToolMeta = {
  name: 'openAdminPage',
  label: '打开后台页面',
  icon: Monitor,
  renderTo: 'panel'
}

const runningCall: ChatToolCall = {
  id: 'tc-running',
  name: 'runTests',
  arguments: '{"command":"bun run test:changed"}',
  status: 'running'
}

const createConfirmCall = (): ChatToolCall => ({
  id: 'tc-confirm',
  name: 'deleteFile',
  arguments: '{"path":"/tmp/demo.log"}',
  status: 'awaiting-confirm'
})

const confirmCall = ref<ChatToolCall>(createConfirmCall())

const handleConfirmRespond = (approved: boolean) => {
  confirmCall.value = {
    ...confirmCall.value,
    status: approved ? 'success' : 'rejected',
    result: approved ? '{"deleted":"/tmp/demo.log"}' : undefined
  }
  message[approved ? 'success' : 'info'](approved ? '已允许执行工具' : '已拒绝执行工具')
}

const resetConfirmCall = () => {
  confirmCall.value = createConfirmCall()
}

const successCall: ChatToolCall = {
  id: 'tc-success',
  name: 'readFile',
  arguments: '{"path":"packages/ai/package.json"}',
  status: 'success',
  result: '{"name":"@veltra/ai","version":"0.2.0"}'
}

const errorCall: ChatToolCall = {
  id: 'tc-error',
  name: 'fetchSchema',
  arguments: '{"endpoint":"/api/schema"}',
  status: 'error',
  error: 'Request timeout after 5000ms'
}

const rejectedCall: ChatToolCall = {
  id: 'tc-rejected',
  name: 'deleteFile',
  arguments: '{"path":"/etc/hosts"}',
  status: 'rejected'
}

const weatherCall: ChatToolCall = {
  id: 'tc-weather',
  name: 'getWeather',
  arguments: '{"city":"杭州"}',
  status: 'success',
  result: JSON.stringify({
    city: '杭州',
    region: '浙江',
    weather: '晴',
    code: 0,
    temperature: 24,
    feelsLike: 23,
    low: 15,
    high: 26,
    humidity: 42,
    wind: '10 km/h'
  })
}

const panelCall: ChatToolCall = {
  id: 'tc-panel',
  name: 'openAdminPage',
  arguments: '{"page":"sales-chart"}',
  status: 'success',
  result: '{"page":"sales-chart","opened":true}'
}
</script>

<style scoped lang="scss">
.demo-actions {
  margin-bottom: 12px;
}

.tool-stack {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
</style>
