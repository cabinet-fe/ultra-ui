<template>
  <div>
    <CustomCard title="全局配置与流式开关">
      <div class="demo-row">
        <span>流式返回</span>
        <u-switch v-model="stream" @change="onStreamChange" />
        <span class="demo-hint">
          setConfig({ ai: { url, model, stream } }) 字段级合并，多个 AI 按钮共用一份全局配置
        </span>
      </div>
    </CustomCard>

    <CustomCard title="普通变体">
      <div class="demo-row">
        <u-input v-model="title" placeholder="点击右侧 AI 按钮生成标题" clearable />
        <u-ai-button
          system-prompt="你是一个文案专家，用一句话输出商品推广标题，不超过 20 字"
          prompt="为一款轻量级开源电子表格组件写推广标题"
          @delta="title += $event"
          @success="title = $event"
          @error="onError"
        />
      </div>
    </CustomCard>

    <CustomCard title="pre-input 变体">
      <div class="demo-row">
        <u-input v-model="summary" placeholder="点击右侧 AI 按钮，先补充场景再生成" clearable />
        <u-ai-button
          variant="pre-input"
          system-prompt="你是一个文案专家，用一句话输出场景化摘要，不超过 30 字"
          :prompt="`为以下内容写摘要：${topic}`"
          @delta="summary += $event"
          @success="summary = $event"
          @error="onError"
        >
          <template #pre-input>
            <div class="demo-pre-input">
              <div class="demo-pre-input__label">摘要主题</div>
              <u-input v-model="topic" placeholder="要摘要的主题，如：一次前端组件库发布会" />
            </div>
          </template>
        </u-ai-button>
      </div>
    </CustomCard>
  </div>
</template>

<script lang="ts" setup>
import { useConfig } from '@veltra/compositions'
import { message } from '@veltra/desktop'
import { ref } from 'vue'

import CustomCard from '../card/custom-card.vue'

/** 全局 AI 服务商配置：走 playground 同源 DeepSeek 代理，API Key 只在服务端 */
const { setConfig } = useConfig()
setConfig({ ai: { url: '/ai/chat/completions', model: 'deepseek-v4-flash', stream: false } })

const stream = ref(false)
function onStreamChange() {
  setConfig({ ai: { stream: stream.value } })
}

const title = ref('')
const summary = ref('')
const topic = ref('')

function onError(error: Error) {
  message({ type: 'error', message: error.message })
}
</script>

<style lang="scss" scoped>
.demo-row {
  display: flex;
  gap: 8px;
  align-items: center;

  .u-input {
    flex: 1;
  }
}

.demo-hint {
  color: var(--u-text-color-assist);
  font-size: 12px;
}

.demo-pre-input {
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 240px;

  &__label {
    font-size: 13px;
  }
}
</style>
