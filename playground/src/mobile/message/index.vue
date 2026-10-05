<template>
  <div class="demo">
    <section>
      <h3>基础用法</h3>
      <div class="row">
        <UButton type="primary" @click="show('基础轻提示')">默认 3 秒</UButton>
        <UButton @click="message.closeAll()">关闭全部</UButton>
      </div>
    </section>

    <section>
      <h3>类型快捷方法</h3>
      <div class="row">
        <UButton
          v-for="item of types"
          :key="item.value"
          size="small"
          @click="message[item.value](`${item.label}消息`)"
        >
          {{ item.value }}
        </UButton>
      </div>
    </section>

    <section>
      <h3>时长与关闭</h3>
      <div class="row">
        <UButton size="small" @click="show('常驻提示，点击右侧关闭', 0)">duration 0</UButton>
        <UButton size="small" @click="show('可手动关闭', 3000, true)">closable</UButton>
        <UButton size="small" @click="showLong">长文本</UButton>
      </div>
    </section>

    <section>
      <h3>回调</h3>
      <div class="row">
        <UButton size="small" @click="showWithCallbacks">onClose / onClosed</UButton>
        <span class="hint">closed 触发 {{ closedCount }} 次</span>
      </div>
    </section>
  </div>
</template>

<script lang="ts" setup>
import { message, UButton } from '@veltra/mobile'
import { shallowRef } from 'vue'
import '@veltra/mobile/components/button/style'
import '@veltra/mobile/components/message/style'

const types = [
  { value: 'success', label: '成功' },
  { value: 'warn', label: '警告' },
  { value: 'info', label: '信息' },
  { value: 'error', label: '错误' },
  { value: 'default', label: '默认' }
] as const

function show(text: string, duration = 3000, closable = false) {
  message({ message: text, duration, closable })
}

function showLong() {
  message.info('顶部长文本轻提示：内容在移动端视口内自动换行且不溢出屏幕')
}

const closedCount = shallowRef(0)

function showWithCallbacks() {
  message({
    message: '带回调的消息',
    onClose() {
      console.log('开始关闭')
    },
    onClosed() {
      closedCount.value++
      console.log('关闭完毕')
    }
  })
}
</script>

<style lang="scss" scoped>
// 手机设备外壳视口内呈现，验证移动端密度与触控热区
.demo {
  display: flex;
  flex-direction: column;
  gap: 20px;

  h3 {
    margin: 0 0 8px;
    font-size: 13px;
    font-weight: 600;
    color: var(--u-text-color-title);
  }
}

.row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px 12px;
}

.hint {
  font-size: 13px;
  color: var(--u-text-color-second);
}
</style>
