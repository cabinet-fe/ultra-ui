<template>
  <div>
    <div>普通: <u-input v-model="value" /></div>
    <div>
      前缀和后缀以及可清空:
      <u-input v-model="value" @suffix:click="console.log" prefix="前缀" clearable>
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
import { Search } from '@veltra/icons/normal'
import { shallowRef } from 'vue'

const value = shallowRef('abc')
</script>
