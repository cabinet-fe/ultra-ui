<template>
  <div>
    <div class="config">
      <u-radio-group
        radioType="btn"
        :data="
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
        :data="[
          { label: '水平', value: 'horizontal' },
          { label: '垂直', value: 'vertical' }
        ]"
        v-model="config.direction"
      />
    </div>
    <div class="wrap">
      <u-steps
        v-model:active="config.active"
        :items="items"
        :readonly="config.readonly"
        :direction="config.direction"
        finish-status="danger"
        process-status="success"
      >
        <template #desc>
          <div v-for="item in items">
            {{item.key}} {{ item.label }}
          </div>
        </template>
      </u-steps>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, watch } from 'vue'

const config = reactive({
  active: '1' as any,
  readonly: true,
  direction: 'horizontal' as 'horizontal' | 'vertical',
  finished: false
})

watch(() => config.finished, (val) => {
  val ? config.active = null : config.active = '1'
})

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
