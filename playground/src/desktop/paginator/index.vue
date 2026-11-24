<template>
  <div>
    <div class="config">
      <u-checkbox v-model="config.simple">simple</u-checkbox>
      <u-checkbox v-model="config.disabled">disabled</u-checkbox>
    </div>
    <u-paginator
      v-model:page-number="pageState.current"
      v-model:page-size="pageState.size"
      @change:page-number="console.log"
      @update:page-size="console.log('input', $event)"
      @change:page-size="console.log(pageState.size)"
      :total="120"
      :simple="config.simple"
      :disabled="config.disabled"
      @first-click="handleFirstClick"
      @last-click="handleLastClick"
    />
    {{ pageState }}
  </div>
</template>

<script lang="ts" setup>
import { UCheckbox, UPaginator, URadioGroup } from '@veltra/desktop'
import { reactive } from 'vue'

const pageState = reactive({ current: 3, size: 40 })

const config = reactive({ size: 'default' as any, simple: false, disabled: false })

const handleFirstClick = (val: number) => {
  console.log(val)
}
const handleLastClick = (val: number) => {
  console.log(val)
}
</script>

<style lang="scss" scoped>
.config {
  border: 1px dashed #eee;
  padding: 10px;
  margin: 10px;
}
</style>
