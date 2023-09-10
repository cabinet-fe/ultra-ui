<template>
  <div>
    <div>值: {{ number }}</div>

    <!-- <div>
      普通
      <u-number-input disabled v-model="number" :precision="2" />
    </div>

    <div>
      货币
      <u-number-input v-model="number" currency :max-precision="2" />
    </div> -->

    <div>
      步进
      <u-number-input v-model="number" currency :step="100.12" clearable />
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue'
import {} from 'ultra-ui'

const number = ref(2.999)
</script>
