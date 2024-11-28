<template>
  <div>
    <u-palette v-model="color" />
  </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue'

const color = ref('')
</script>

<style lang="scss" scoped></style>
