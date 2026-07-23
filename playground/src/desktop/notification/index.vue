<template>
  <div>
    <div class="config">
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
        v-model="config.type"
      />
      <u-radio-group
        radioType="btn"
        :items="[
          { label: 'bottom-right', value: 'bottom-right' },
          { label: 'bottom-left', value: 'bottom-left' },
          { label: 'top-right', value: 'top-right' },
          { label: 'top-left', value: 'top-left' }
        ]"
        v-model="config.position"
      />
      <u-number-input v-model="config.duration" :step="1000" :min="0"></u-number-input>
      <u-checkbox v-model="config.closable">closable</u-checkbox>
    </div>
    <div class="btn">
      <u-button type="primary" @click="showMsg">showNotification</u-button>
      <u-button type="success" @click="showSuccess">notification.success</u-button>
      <u-button plain @click="closeAll">closeAll</u-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { notification, type NotificationPosition } from '@veltra/desktop'
import { reactive, ref } from 'vue'

const config = reactive({
  type: 'primary' as any,
  duration: 4500,
  closable: false,
  position: 'bottom-right' as NotificationPosition,
  buttonText: ''
})

let count = ref(0)

const showMsg = () => {
  count.value++
  notification({
    title: `${count.value}-Event has been created`,
    message: 'Sunday, December 03, 2023 at 9:00 AM, your event has been scheduled successfully.',
    type: config.type,
    duration: config.duration,
    closable: config.closable,
    buttonText: config.buttonText,
    position: config.position,
    onClick: () => console.log('action clicked'),
    onClosed: () => console.log('closed')
  })
}

const showSuccess = () => {
  count.value++
  notification.success(`保存成功 (${count.value})`, {
    title: 'Success',
    position: config.position,
    duration: config.duration
  })
}

const closeAll = () => {
  notification.closeAll(config.position)
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
