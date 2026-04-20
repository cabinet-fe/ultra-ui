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

    <section class="demo">
      <h3>UTabs（组合版：tab 栏 + 内容面板）</h3>
      <u-tabs
        :items="displayItems"
        v-model="active"
        :position="config.position"
        :keep-alive="config.keepAlive"
        :rounded="config.rounded"
        :closable="config.closable"
        :block="config.block"
        :style="{ height: config.fixedHeight ? '300px' : '' }"
        @close="onClose"
      >
        <template #a>
          <p>面板 A</p>
        </template>
        <template #c>
          <p>面板 C</p>
        </template>
      </u-tabs>
    </section>

    <section class="demo">
      <h3>UTabsHorizontal（独立使用，后台系统标签栏场景）</h3>
      <u-tabs-horizontal
        :items="barItems"
        v-model="barActive"
        :position="config.position === 'bottom' ? 'bottom' : 'top'"
        :rounded="config.rounded"
        :closable="true"
        :block="config.block"
        @close="onBarClose"
      />
      <p class="note">当前激活：{{ barActive }}</p>
    </section>

    <section class="demo">
      <h3>UTabsVertical（独立使用）</h3>
      <div class="side">
        <u-tabs-vertical
          :items="barItems"
          v-model="barActive"
          :position="config.position === 'right' ? 'right' : 'left'"
          :rounded="config.rounded"
          :closable="true"
          @close="onBarClose"
        />
        <div class="side-content">当前激活：{{ barActive }}</div>
      </div>
    </section>

    <u-dialog>
      <u-tabs
        :items="displayItems"
        v-model="active"
        :position="config.position"
        :keep-alive="config.keepAlive"
        :rounded="config.rounded"
        :closable="config.closable"
        :block="config.block"
        :style="{ height: config.fixedHeight ? '240px' : '' }"
      />
      <template #trigger>
        <u-button>弹层内 Tabs</u-button>
      </template>
    </u-dialog>
  </div>
</template>

<script setup lang="ts">
import type { TabItem } from '@veltra/desktop'
import { computed, reactive, ref, shallowRef } from 'vue'

const items = shallowRef<TabItem[]>([
  { key: 'a', name: 'Tab A' },
  { key: 'b', name: 'Tab B', disabled: true },
  { key: 'c', name: 'Tab C', closable: true }
])

const overflowItems: TabItem[] = Array.from({ length: 15 }, (_, i) => ({
  key: `t${i + 1}`,
  name: `标签页 ${String(i + 1).padStart(2, '0')} - 示例`
}))

const active = ref<string>('c')

const configList = [
  { label: '保活', key: 'keepAlive' },
  { label: '固定高度', key: 'fixedHeight' },
  { label: '溢出演示', key: 'overflowDemo' },
  { label: '圆角', key: 'rounded' },
  { label: '可关闭', key: 'closable' },
  { label: '填充宽度', key: 'block' }
] as const

const config = reactive({
  keepAlive: false,
  position: 'top' as 'top' | 'bottom' | 'left' | 'right',
  fixedHeight: false,
  overflowDemo: false,
  rounded: true,
  closable: false,
  block: false
})

const displayItems = computed(() => (config.overflowDemo ? overflowItems : items.value))

const onClose = (item: TabItem) => {
  const list = config.overflowDemo ? overflowItems : items.value
  const idx = list.findIndex((i) => i.key === item.key)
  if (idx < 0) return
  list.splice(idx, 1)
  if (active.value === item.key) active.value = list[0]?.key ?? ''
  if (!config.overflowDemo) items.value = [...list]
}

// 独立标签栏演示（模拟后台系统路由标签栏）
const barItems = shallowRef<TabItem[]>([
  { key: 'home', name: '首页' },
  { key: 'user', name: '用户管理' },
  { key: 'order', name: '订单中心' },
  { key: 'stat', name: '数据统计' },
  { key: 'setting', name: '系统设置' }
])
const barActive = ref('home')

const onBarClose = (item: TabItem) => {
  const list = [...barItems.value]
  const idx = list.findIndex((i) => i.key === item.key)
  if (idx < 0) return
  list.splice(idx, 1)
  barItems.value = list
  if (barActive.value === item.key) barActive.value = list[0]?.key ?? ''
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
.demo {
  border: 1px dashed var(--u-color-border, #ddd);
  padding: 12px;
  border-radius: 8px;

  h3 {
    margin: 0 0 12px;
    font-size: 14px;
    color: var(--u-text-color-secondary, #666);
  }
}
.note {
  margin: 8px 0 0;
  font-size: 12px;
  color: var(--u-text-color-secondary, #999);
}
.side {
  display: flex;
  gap: 16px;
  align-items: flex-start;
}
.side-content {
  flex: 1;
  padding: 12px;
  color: var(--u-text-color-secondary, #999);
  font-size: 13px;
}
</style>
