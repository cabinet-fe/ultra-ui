<template>
  <div>
    <div class="config">
      <u-radio-group
        radioType="btn"
        :data="
          items.map(item => {
            return { label: item.label, value: item.key }
          })
        "
        v-model="config.active"
      />
      <br />
      <u-checkbox v-model="config.readonly">readonly</u-checkbox>
      <br />
      <u-radio-group
        radioType="btn"
        :data="[
          { label: '水平', value: 'horizontal' },
          { label: '垂直', value: 'vertical' }
        ]"
        v-model="config.mode"
      />
    </div>
    <div class="wrap">
      <u-steps
        v-model:active="config.active"
        :items="items"
        :readonly="config.readonly"
        :mode="config.mode"
      >
        <template #1-icon="{ data }">
          <u-button :type="config.active === data.key ? 'primary' : 'info'">{{
            data.key
          }}</u-button>
        </template>
        <template #3-desc="{ data }"> {{ data.label }}{{ data.label }} </template>
      </u-steps>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { CirclePlus, TopRight } from 'icon-ultra'

const config = reactive({
  active: '1',
  readonly: false,
  mode: 'horizontal' as 'horizontal' | 'vertical'
})

const icons = {
  1: CirclePlus,
  2: TopRight
}

let items = ref([
  { label: '开始', key: '1' },
  { label: '过程x', key: '2' },
  { label: '过程y', key: '3' },
  { label: '结束', key: '4' }
])
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
