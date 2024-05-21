<template>
  <div :class="cls.e('bar')" ref="barRef">
    <select class="ql-size">
      <option value="small"></option>
      <option selected></option>
      <option value="large"></option>
      <option value="huge"></option>
    </select>

    <button class="ql-bold">加粗</button>
    <button class="ql-script" value="sub"></button>
    <button class="ql-script" value="super"></button>
  </div>
</template>
<script lang="ts" setup>
import { bem } from '@ui/utils'
import { shallowRef } from 'vue'

const barRef = shallowRef()

const cls = bem('text-editor')

defineExpose({
  barRef
})
</script>
