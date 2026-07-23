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
      <u-button type="primary" @click="showMsg">showMessageConfirm</u-button>
      <u-button type="danger" @click="showDanger">messageConfirm.danger</u-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { messageConfirm } from '@veltra/desktop'
import { reactive } from 'vue'

const config = reactive({
  confirmButtonType: 'primary' as any,
  title: 'this is a title',
  message: 'this is a message',
  confirmButtonText: '确定',
  cancelButtonText: '取消'
})

const showMsg = () => {
  messageConfirm({
    title: config.title,
    message: config.message,
    confirmButtonType: config.confirmButtonType,
    confirmButtonText: config.confirmButtonText,
    cancelButtonText: config.cancelButtonText,
    onClose: (action) => {
      console.log('onClose:', action)
    }
  }).onClosed.then((action) => {
    console.log('onClosed:', action)
  })
}

const showDanger = () => {
  messageConfirm
    .danger('确认删除该文件吗？此操作不可撤销', { cancelButtonText: '取消' })
    .onClosed.then((action) => {
      console.log('danger closed:', action)
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
  gap: 10px;
}
</style>
