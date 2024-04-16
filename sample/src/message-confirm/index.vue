<template>
  <div>
    <div class="config">
      <u-input v-model="config.title" prefix="title:"></u-input>
      <u-input v-model="config.message" prefix="message:"></u-input>
      <u-input v-model="config.buttonText" prefix="buttonText:"></u-input>
      <u-radio-group
        radioType="btn"
        :items="[
          { label: 'primary', value: 'primary' },
          { label: 'info', value: 'info' },
          { label: 'success', value: 'success' },
          { label: 'warning', value: 'warning' },
          { label: 'danger', value: 'danger' }
        ]"
        v-model="config.buttonType"
      />
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
  buttonType: 'primary' as any,
  title: 'this is a title',
  message: 'this is a message',
  buttonText: '确定'
})

const showMsg = () => {
  MessageConfirm({
    title: config.title,
    message: config.message,
    buttonType: config.buttonType,
    buttonText: config.buttonText,
    onClose: () => {
      console.log(123)
    }
  })
}
</script>