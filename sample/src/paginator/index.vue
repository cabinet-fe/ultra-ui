<template>
  <div>
    <div class="config">
      <u-radio-group
        radioType="btn"
        :items="[
          { label: 'small', value: 'small' },
          { label: 'default', value: 'default' },
          { label: 'large', value: 'large' }
        ]"
        v-model="config.size"
      />
      <br />
      <u-checkbox v-model="config.simple">simple</u-checkbox>
    </div>
    <u-paginator
      v-model:page-number="pageState.current"
      v-model:page-size="pageState.size"
      :total="120"
      :page-size-options="[10, 20, 50, 200]"
      :size="config.size"
      :simple="config.simple"
    />
  </div>
</template>

<script lang="ts" setup>
import { reactive } from 'vue'

const pageState = reactive({
  current: 1,
  size: 10
})

const config = reactive({
  size: 'default' as any,
  simple: false
})
</script>

<style lang="scss" scoped>
.config {
  border: 1px dashed #eee;
  padding: 10px;
  margin: 10px;
}
</style>
