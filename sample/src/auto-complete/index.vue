<template>
  <div>
    <u-checkbox v-model="config.multiple">multiple</u-checkbox>
    <u-checkbox v-model="config.disabled">disabled</u-checkbox>
    <u-checkbox v-model="config.readonly">readonly</u-checkbox>
    <u-input v-model="config.linker" prefix="linker："></u-input>
    <u-auto-complete
      v-model="config.val"
      :suggestions="suggestions"
      :multiple="config.multiple"
      :disabled="config.disabled"
      :readonly="config.readonly"
      :linker="config.linker"
    ></u-auto-complete>
  </div>
</template>

<script setup lang="ts">
import { reactive } from 'vue'

const suggestions = Array.from({ length: 100 }, (v, i) => `${i + 1}`)

const config = reactive({
  multiple: false,
  disabled: false,
  readonly: false,
  val: 'test',
  linker: '===>'
})
</script>
