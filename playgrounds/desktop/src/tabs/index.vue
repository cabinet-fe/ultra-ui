<template>
  <div class="wrap">
    <ul class="cfg">
      <li v-for="item in configList" :key="item.key">
        <u-checkbox v-model="config[item.key]">{{ item.label }}</u-checkbox>
      </li>
      <li>
        <span class="lbl">position</span>
        <u-radio-group
          :items="[
            { label: '上', value: 'top' },
            { label: '下', value: 'bottom' },
            { label: '左', value: 'left' },
            { label: '右', value: 'right' }
          ]"
          v-model="config.position"
        />
      </li>
    </ul>

    <u-tabs
      v-model:items="items"
      v-model="active"
      :position="config.position"
      :editable="config.editable"
      :keep-alive="config.keepAlive"
      :style="{ height: config.fixedHeight ? '300px' : '' }"
      @create="onTabCreate"
    >
      <template #a>
        <p>面板 A</p>
      </template>
      <template #c>
        <p>面板 C</p>
      </template>
    </u-tabs>

    <u-dialog>
      <u-tabs
        v-model:items="items"
        v-model="active"
        :position="config.position"
        :editable="config.editable"
        :keep-alive="config.keepAlive"
        :style="{ height: config.fixedHeight ? '240px' : '' }"
      />
      <template #trigger>
        <u-button>弹层内 Tabs</u-button>
      </template>
    </u-dialog>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, shallowRef } from 'vue'

const items = shallowRef([
  { key: 'a', name: 'Tab A' },
  { key: 'b', name: 'Tab B', disabled: true },
  { key: 'c', name: 'Tab C' }
])

const active = ref<string>('c')

const configList = [
  { label: '可编辑', key: 'editable' },
  { label: '保活', key: 'keepAlive' },
  { label: '固定高度', key: 'fixedHeight' }
] as const

const config = reactive({
  editable: false,
  keepAlive: false,
  position: 'top' as 'top' | 'bottom' | 'left' | 'right',
  fixedHeight: false
})

function onTabCreate() {
  const list = items.value
  items.value = [...list, { name: '新页', key: `new-${list.length}` }]
}
</script>

<style lang="scss" scoped>
.wrap {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.cfg {
  border: 1px dashed var(--u-color-border, #ddd);
  padding: 8px 12px;
  list-style: none;
  margin: 0;
}
.lbl {
  margin-right: 8px;
}
</style>
