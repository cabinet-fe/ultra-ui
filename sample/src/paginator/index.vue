<template>
  <div>
    <div class="config">
      <!-- <u-radio-group
        radioType="btn"
        :items="[
          { label: 'small', value: 'small' },
          { label: 'default', value: 'default' },
          { label: 'large', value: 'large' }
        ]"
        v-model="config.size"
      />
      <br /> -->
      <u-checkbox v-model="config.simple">simple</u-checkbox>
      <u-checkbox v-model="config.disabled">disabled</u-checkbox>
    </div>
    <u-paginator
      v-model:page-number="pageState.current"
      v-model:page-size="pageState.size"
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
import { reactive } from 'vue'

const pageState = reactive({
  current: 3,
  size: 40
})

const config = reactive({
  size: 'default' as any,
  simple: false,
  disabled: false
})

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
