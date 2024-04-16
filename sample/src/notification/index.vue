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
          { label: 'top-left', value: 'top-left' },
        ]"
        v-model="config.position"
      />
      <u-number-input v-model="config.duration" :step="1000" :min="0"></u-number-input>
      <u-checkbox v-model="config.closable">closable</u-checkbox>
    </div>
    <div class="btn">
      <u-button type="primary" @click="showMsg">showNotification</u-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Notification } from '@ui/components'
import '@ui/components/notification/style.scss'
import { reactive, ref } from 'vue'

const config = reactive({
  type: 'primary' as any,
  duration: 0,
  closable: false,
  position: 'bottom-right',
  buttonText: ''
})

let count = ref(0)

const showMsg = () => {
  count.value ++
  Notification({
    title: `${count.value}-Event has been created`,
    message:
      'Sunday, December 03, 2023 at 9:00 AMSunday, December 03, 2023 at 9:00 AMSunday, December 03, 2023 at 9:00 AMSunday, December 03, 2023 at 9:00 AM',
    type: config.type,
    duration: config.duration,
    closable: config.closable,
    onClose: (vm) => {},
    buttonText: config.buttonText,
    onClick: (vm) => {},
    position: config.position as any
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
