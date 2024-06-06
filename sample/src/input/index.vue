<template>
  <div>
    <div>普通: <u-input v-model="value" /></div>
    <div>
      前缀和后缀以及可清空:
      <u-input v-model="value" @suffix:click="c.log" prefix="前缀" clearable>
        <template #suffix>
          <u-icon :size="14"><Search /></u-icon>
        </template>
      </u-input>
    </div>
    <div>
      <u-input v-model="value" :pattern="/^abc/"></u-input>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { shallowRef } from 'vue'
import { Search } from 'icon-ultra'
import CustomCard from '../card/custom-card.vue'

const value = shallowRef('abc')

const number = shallowRef(0)

setTimeout(() => {
  number.value = 10000
}, 200)
</script>
