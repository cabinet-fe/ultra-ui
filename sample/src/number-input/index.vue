<template>
  <div>
    <div>值: {{ number }}</div>

    <div>
      普通
      <u-number-input v-model="number" />
    </div>

    <div>
      货币
      <u-number-input v-model="number" currency :max-precision="2" />
    </div>

    <div>
      步进
      <u-number-input v-model="number" currency :step="100.12" />
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue'
import {} from 'ultra-ui'

const number = ref()
</script>
