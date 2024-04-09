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
  closable: false
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
    onClose: (vm) => {
      console.log(vm)
    },
    button: '确定',
    onClick: (vm) => {
      console.log(vm)
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
