<template>
  <div>
    <u-button @click="clear" type="primary">clear</u-button>
    <u-grid-input separator="" ref="inputRef" @input="change" />
  </div>
</template>

<script lang="ts" setup>
import { shallowRef } from 'vue'
import type { GridInputExposed } from 'ultra-ui'

const inputRef = shallowRef<GridInputExposed>()

const clear = () => {
  inputRef.value?.clear()
}

const change = (val: string) => {
  console.log(val)
}
</script>
