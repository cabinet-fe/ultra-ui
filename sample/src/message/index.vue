<template>
  <div>
    <div class="config">
      <u-radio-group
        radioType="btn"
        :items="[
          { label: 'default', value: 'default' },
          { label: 'info', value: 'info' },
          { label: 'success', value: 'success' },
          { label: 'warn', value: 'warn' },
          { label: 'error', value: 'error' }
        ]"
        v-model="config.type"
      />
      <u-number-input
        v-model="config.duration"
        :step="1000"
        :min="0"
      ></u-number-input>
      <div>
        <u-checkbox v-model="config.closable">closable</u-checkbox>
      </div>
      <div>
        <u-checkbox v-model="config.html">渲染html</u-checkbox>
      </div>
    </div>
    <div class="btn">
      <u-button @click="message.closeAll()">关闭全部</u-button>
      <u-button type="primary" @click="showMsg">showMessage</u-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { message, type MessageType } from '@ui/components'
import '@ui/components/message/style.scss'
import { reactive } from 'vue'

const config = reactive({
  type: 'default' as MessageType,
  duration: 3000,
  closable: false,
  html: false
})

const showMsg = () => {
  message({
    message: '测试消息测试消息abcdABCD<h1>22</h1>',
    ...config,

    onClose: () => {
      // console.log(123)
    }
  })
}
</script>

<style lang="scss" scoped>
.config {
  display: flex;
  flex-direction: column;
}
.btn {
  display: flex;
  justify-content: flex-end;
}
</style>
