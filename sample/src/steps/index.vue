<template>
  <div>
    <div class="config">
      <u-radio-group
        radioType="btn"
        :items="
          items.map((item) => {
            return { label: item.label, value: item.key }
          })
        "
        v-model="config.active"
      />
      <br />
      <u-checkbox v-model="config.finished">finished</u-checkbox>
      <br />
      <u-checkbox v-model="config.readonly">readonly</u-checkbox>
      <br />
      <u-radio-group
        radioType="btn"
        :items="[
          { label: '水平', value: 'horizontal' },
          { label: '垂直', value: 'vertical' }
        ]"
        v-model="config.direction"
      />
      <br />
      <u-checkbox v-model="config.customIcon">customIcon</u-checkbox>
      <u-checkbox v-model="config.customDesc">customDesc</u-checkbox>
    </div>
    <div class="wrap">
      <u-steps
        v-model:active="config.active"
        :items="items"
        :readonly="config.readonly"
        :direction="config.direction"
      >
        <template #icon v-if="config.customIcon">
          <span v-for="item in items">
            <UIcon :size="16" v-if="config.active === item.key"><Edit /></UIcon>
            <UIcon :size="16" v-else><Setting /></UIcon>
          </span>
        </template>
        <template #desc v-if="config.customDesc">
          <span v-for="item in items">
            {{ item }}
          </span>
        </template>
      </u-steps>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, watch } from 'vue'
import { defineSteps, UIcon } from 'ultra-ui'
import { Edit, Setting } from 'icon-ultra'

const config = reactive({
  active: '1' as any,
  readonly: true,
  direction: 'horizontal' as 'horizontal' | 'vertical',
  finished: false,
  customIcon: false,
  customDesc: false
})

watch(
  () => config.finished,
  (val) => {
    val ? (config.active = null) : (config.active = '1')
  }
)

let items = defineSteps(
  Array.from({ length: 8 }, (v, i) => {
    return { label: `step-${i}`, key: `${i}` }
  })
)
</script>

<style lang="scss" scoped>
.config {
  border: 1px dashed #eee;
  padding: 10px;
  margin: 10px;
}
.wrap {
  width: 600px;
  height: 600px;
  border: 1px solid gold;
}
</style>
