<template>
  <div>
    右下角查看

    <u-float-button :items="items"> </u-float-button>
  </div>
</template>

<script lang="ts" setup>
import type { FloatButtonItem } from 'ultra-ui'

const items: FloatButtonItem[] = [
  { key: 'a', name: '你' },
  { key: 'b', name: '好', type: 'danger' },
  { key: 'c', name: '世' },
  { key: 'd', name: '界' }
]
</script>
