<template>
  <div>
    <div>值: {{ number }}</div>
    <u-checkbox v-model="currency">货币</u-checkbox>
    <div>
      普通
      <u-number-input
        disabled
        v-model="number"
        :currency="currency"
        :precision="2"
      />
    </div>

    <div>
      货币
      <u-number-input
        v-model="number"
        :currency="currency"
        :max-precision="2"
      />
    </div>

    <div>
      步进
      <u-number-input
        v-model="number"
        :currency="currency"
        :step="100.89"
        clearable
      />
    </div>

    <div>
      最小值0, 最大值1000
      <u-number-input
        v-model="number"
        :currency="currency"
        :step="100"
        :min="0"
        :max="1000"
      />
    </div>
  </div>
</template>

<script lang="ts" setup>
import { shallowRef } from 'vue'

const number = shallowRef(2.999)
const currency = shallowRef(false)
</script>
