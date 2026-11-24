<template>
  <div>
    <u-palette v-model="color" />
  </div>
</template>

<script lang="ts" setup>
import { UPalette } from '@veltra/desktop'
import { ref } from 'vue'

const color = ref('#131111')
</script>

<style lang="scss" scoped></style>
