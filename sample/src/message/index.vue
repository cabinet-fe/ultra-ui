<template>
  <div>
    <u-button type="primary" @click="showMsg">showMessage</u-button>
    <!-- <u-message message="tttttttttttt"></u-message> -->
  </div>
</template>

<script setup lang="ts">
import { Message } from '@ui/components'
import '@ui/components/message/style.scss'

const showMsg = () => {
  Message({ message: 'asdasdasd!' })
}
</script>

<style lang="scss" scoped></style>
