<template>
  <div>
    <div class="config">
      <u-input v-model="config.title" prefix="title:"></u-input>
      <u-input v-model="config.message" prefix="message:"></u-input>
      <u-input v-model="config.confirmButtonText" prefix="confirmButtonText:"></u-input>
      <u-input v-model="config.cancelButtonText" prefix="cancelButtonText:"></u-input>
      <u-radio-group
        radioType="btn"
        :items="[
          { label: 'primary', value: 'primary' },
          { label: 'info', value: 'info' },
          { label: 'success', value: 'success' },
          { label: 'warning', value: 'warning' },
          { label: 'danger', value: 'danger' }
        ]"
        v-model="config.confirmButtonType"
      ></u-radio-group>
    </div>
    <div class="btn">
      <u-button type="primary" @click="showMsg">showMessage</u-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { MessageConfirm } from '@ui/components'
import '@ui/components/message-confirm/style.scss'
import { reactive } from 'vue'

const config = reactive({
  confirmButtonType: 'primary' as any,
  title: 'this is a title',
  message: 'this is a message',
  confirmButtonText: '确定',
  cancelButtonText: ''
})

const showMsg = () => {
  MessageConfirm({
    title: config.title,
    message: config.message,
    confirmButtonType: config.confirmButtonType,
    confirmButtonText: config.confirmButtonText,
    cancelButtonText: config.cancelButtonText,
    onClose: (action) => {
      console.log(action)
    }
  })
  // MessageConfirm.danger('hahha', (action) => {
  //   console.log(action)
  // })
}
</script>