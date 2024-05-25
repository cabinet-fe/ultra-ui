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
      <u-checkbox v-model="config.closable">closable</u-checkbox>
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
import { Edit, CircleCheckFilled } from 'icon-ultra'

const config = reactive({
  type: 'default' as MessageType,
  duration: 3000,
  closable: false
})

const showMsg = () => {
  message({
    message: '测试消息测试消息abcdABCD',
    type: config.type,
    duration: config.duration,
    closable: config.closable,
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
