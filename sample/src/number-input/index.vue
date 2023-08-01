<template>
  <div>
    <u-number-input v-model="number" :min-precision="2" />
  </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue'
import {  } from 'ultra-ui'

const number = ref()
</script>
