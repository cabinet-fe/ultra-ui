<template>
  <div>
    <u-select :model-value="value" :options="options" @update:model-value="onChange"/>
  </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue'

const value = ref('')
const options = ref([
  { label: '选项1', value: '1' },
  { label: '选项2', value: '2' },
  { label: '选项3', value: '3' },
  { label: '选项4', value: '4' },
  { label: '选项5', value: '5' }
])

const onChange = (val: any) => {
  console.log(val, 'val')
  value.value = val.label
  console.log(value.value, 'value')
}
</script>

<style lang="scss" scoped></style>
