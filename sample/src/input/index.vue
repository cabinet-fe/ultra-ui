<template>
  <div>
    <u-input  />
    {{ value }}
    <u-button @click="value += '1'">点击</u-button>
  </div>
</template>

<script lang="ts" setup>
import { shallowRef } from 'vue'

const value = shallowRef('')

useFormComponent
</script>
