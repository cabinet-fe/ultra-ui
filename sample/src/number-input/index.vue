<template>
  <div>
    <div>值: {{ number }}</div>

    <div>
      普通
      <u-number-input disabled v-model="number" :precision="2" />
    </div>

    <div>
      货币
      <u-number-input v-model="number" currency :max-precision="2" />
    </div>

    <div>
      步进
      <u-number-input v-model="number" currency :step="100.89" clearable />
    </div>

    <div>
      最小值0, 最大值1000
      <u-number-input v-model="number" currency :step="100" :min="0" :max="1000" />
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue'
import {} from 'ultra-ui'

const number = ref(2.999)
</script>
