<template>
  <div class="demo">
    <section>
      <h3>基础标签页</h3>
      <UTabs v-model="active" :items="items">
        <template #a>
          <p class="panel">面板 A：横向滑动标签栏可滚动</p>
        </template>
        <template #b>
          <p class="panel">面板 B</p>
        </template>
        <template #c>
          <p class="panel">面板 C</p>
        </template>
      </UTabs>
      <p class="note">
        当前激活：{{ active }}。默认下划线风格：激活项主题色 + 底部下划线，按压非激活项有反馈；标签
        B 为禁用项（压暗、不可点）。
      </p>
    </section>

    <section>
      <h3>胶囊风格 + 填充宽度</h3>
      <UTabs v-model="roundedActive" :items="items" rounded block>
        <template #a>
          <p class="panel">面板 A</p>
        </template>
        <template #b>
          <p class="panel">面板 B</p>
        </template>
        <template #c>
          <p class="panel">面板 C</p>
        </template>
      </UTabs>
    </section>

    <section>
      <h3>底部位置</h3>
      <UTabs v-model="bottomActive" :items="items" position="bottom">
        <template #a>
          <p class="panel">面板 A（标签栏在底部）</p>
        </template>
        <template #b>
          <p class="panel">面板 B</p>
        </template>
        <template #c>
          <p class="panel">面板 C</p>
        </template>
      </UTabs>
    </section>

    <section>
      <h3>竖向标签</h3>
      <div class="side">
        <UTabs v-model="sideActive" :items="items" position="left" class="side-tabs" />
        <p class="panel side-panel">当前激活：{{ sideActive }}</p>
      </div>
    </section>

    <section>
      <h3>可关闭 + 溢出滚动</h3>
      <UTabs v-model="closeActive" :items="closableItems" closable @close="onClose" />
      <p class="note">剩余 {{ closableItems.length }} 个标签，横向滑动标签栏查看更多</p>
    </section>
  </div>
</template>

<script lang="ts" setup>
import type { TabItem } from '@veltra/mobile'
import { UTabs } from '@veltra/mobile'
import { shallowRef } from 'vue'
import '@veltra/mobile/components/tabs/style'

const items: TabItem[] = [
  { key: 'a', name: '标签 A' },
  { key: 'b', name: '标签 B', disabled: true },
  { key: 'c', name: '标签 C' }
]

const active = shallowRef('a')
const roundedActive = shallowRef('a')
const bottomActive = shallowRef('a')
const sideActive = shallowRef('a')

const closableItems = shallowRef<TabItem[]>(
  Array.from({ length: 10 }, (_, i) => ({ key: `t${i + 1}`, name: `标签 ${i + 1}` }))
)

const closeActive = shallowRef('t1')

const onClose = (item: TabItem) => {
  const list = closableItems.value.slice()
  const idx = list.findIndex((i) => i.key === item.key)
  if (idx < 0) return
  list.splice(idx, 1)
  closableItems.value = list
  if (closeActive.value === item.key) closeActive.value = list[0]?.key ?? ''
}
</script>

<style lang="scss" scoped>
// 手机设备外壳视口内呈现，验证触控热区与横向滚动
.demo {
  display: flex;
  flex-direction: column;
  gap: 20px;

  h3 {
    margin: 0 0 8px;
    font-size: 13px;
    font-weight: 600;
    color: var(--u-text-color-title);
  }
}

.panel {
  margin: 0;
  padding: 12px;
  font-size: 13px;
  color: var(--u-text-color-main);
  background-color: var(--u-bg-color-middle);
  border-radius: 6px;
}

.note {
  margin: 8px 0 0;
  font-size: 12px;
  color: var(--u-text-color-secondary);
}

.side {
  display: flex;
  gap: 12px;
  align-items: stretch;
}

.side-tabs {
  min-width: 0;
}

.side-panel {
  flex: 1;
}
</style>
