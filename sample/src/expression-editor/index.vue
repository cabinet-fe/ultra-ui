<template>
  <u-expression-editor
    v-model="value"
    :variables="[{ value: 'a', label: 'aaaaa' }]"
  />
</template>

<script lang="ts" setup>
import { shallowRef } from 'vue'

const value = shallowRef()
</script>
