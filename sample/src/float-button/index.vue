<template>
  <div>
    右下角查看

    <u-float-button :icon="Dialog" :items="items"> </u-float-button>
  </div>
</template>

<script lang="ts" setup>
import { Dialog } from 'icon-ultra'
import type { FloatButtonItem } from 'ultra-ui'

const items: FloatButtonItem[] = [
  {
    key: 'a'
  }
]
</script>
