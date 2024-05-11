<template>
  <div>
    <div class="config">
      <u-radio-group
        radioType="btn"
        :items="[
          { label: 'primary', value: 'primary' },
          { label: 'info', value: 'info' },
          { label: 'success', value: 'success' },
          { label: 'warning', value: 'warning' },
          { label: 'danger', value: 'danger' }
        ]"
        v-model="config.type"
      />
      <u-number-input v-model="config.duration" :step="1000" :min="0"></u-number-input>
      <u-checkbox v-model="config.closable">closable</u-checkbox>
    </div>
    <div class="btn">
      <u-button type="primary" @click="showMsg">showMessage</u-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Message } from '@ui/components'
import '@ui/components/message/style.scss'
import { reactive } from 'vue'
import { Edit, CircleCheckFilled } from 'icon-ultra'

const config = reactive({
  type: 'primary' as any,
  duration: 3000,
  closable: false
})

const showMsg = () => {
  // console.log(Message)
  Message({
    message: 'asdasdasdasda!',
    type: config.type,
    duration: config.duration,
    closable: config.closable,
    // icon: CircleCheckFilled,
    onClose: (vm) => {
      console.log(123, vm)
    }
  })
  // Message.danger('aaa')
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
