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
          { label: 'danger', value: 'danger' },
        ]"
        v-model="config.type"
      />
      <u-number-input v-model="config.duration" :step="1000" :min="0"></u-number-input>
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

const config = reactive({
  type: 'primary',
  duration: 0
})

const showMsg = () => {
  Message({ message: 'asdasdasd!', type: config.type, duration: config.duration })
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
