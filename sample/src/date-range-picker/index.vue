<template>
  <div>
    <u-date-range-picker v-model="value" />
  </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue'
const value = ref<[string, string]>(['', ''])
</script>
