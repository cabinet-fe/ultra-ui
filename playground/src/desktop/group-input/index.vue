<template>
  <div class="group-input-demo">
    <CustomCard width="640px" title="基础用法">
      <u-group-input v-slot="{ item }" v-model="basicItems">
        <u-input v-model="item.name" placeholder="名称" />
        <u-input v-model="item.role" placeholder="角色" />
      </u-group-input>
      <pre class="demo-preview">{{ JSON.stringify(basicItems, null, 2) }}</pre>
    </CustomCard>

    <CustomCard width="640px" title="卡片条目样式（itemStyle）">
      <u-group-input v-slot="{ item }" v-model="cardItems" :item-style="cardItemStyle">
        <u-input v-model="item.key" placeholder="参数名" />
        <u-input v-model="item.value" placeholder="参数值" />
      </u-group-input>
    </CustomCard>

    <CustomCard width="640px" title="响应式条目样式（计算属性）">
      <div class="demo-tip">条目数超过 2 条时自动高亮左侧指示条并收紧间距</div>
      <u-group-input v-slot="{ item }" v-model="responsiveItems" :item-style="responsiveItemStyle">
        <u-input v-model="item.name" placeholder="名称" />
        <u-input v-model="item.age" placeholder="年龄" />
      </u-group-input>
    </CustomCard>

    <CustomCard width="640px" title="只读与禁用">
      <div class="demo-section-label">只读（readonly）</div>
      <u-group-input v-model="readonlyItems" readonly />

      <div class="demo-section-label" style="margin-top: 16px">禁用（disabled）</div>
      <u-group-input v-slot="{ item }" v-model="readonlyItems" disabled>
        <u-input v-model="item.name" placeholder="名称" />
        <u-input v-model="item.role" placeholder="角色" />
      </u-group-input>
    </CustomCard>
  </div>
</template>

<script lang="ts" setup>
import { UGroupInput, UInput } from '@veltra/desktop'
import { computed, shallowRef } from 'vue'

import CustomCard from '../card/custom-card.vue'

const basicItems = shallowRef<{ name: string; role: string }[]>([
  { name: '张三', role: '前端工程师' },
  { name: '李四', role: '设计师' }
])

const cardItems = shallowRef<{ key: string; value: string }[]>([
  { key: 'Content-Type', value: 'application/json' }
])

const cardItemStyle = {
  padding: '10px 12px',
  border: '1px solid var(--u-border-color)',
  borderRadius: 'var(--u-radius-default)',
  backgroundColor: 'var(--u-bg-color-top)'
}

const responsiveItems = shallowRef<{ name: string; age: string }[]>([
  { name: '条目 1', age: '18' },
  { name: '条目 2', age: '24' }
])

const responsiveItemStyle = computed(() => {
  const highlighted = responsiveItems.value.length > 2
  return {
    padding: highlighted ? '8px 12px' : '12px',
    border: '1px solid var(--u-border-color)',
    borderLeft: highlighted
      ? '3px solid var(--u-color-primary)'
      : '3px solid var(--u-border-color)',
    borderRadius: 'var(--u-radius-default)',
    backgroundColor: 'var(--u-bg-color-top)'
  }
})

const readonlyItems = shallowRef<{ name: string; role: string }[]>([
  { name: '王五', role: '架构师' },
  { name: '赵六', role: '产品经理' }
])
</script>

<style lang="scss" scoped>
.group-input-demo {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.demo-tip {
  font-size: 12px;
  color: var(--u-text-color-second);
  margin-bottom: 10px;
}

.demo-section-label {
  font-size: 12px;
  color: var(--u-text-color-second);
  margin-bottom: 6px;
}

.demo-preview {
  margin: 12px 0 0;
  padding: 10px 12px;
  border-radius: var(--u-radius-default);
  background-color: var(--u-bg-color-bottom);
  color: var(--u-text-color-second);
  font-size: 12px;
  line-height: 1.5;
  overflow-x: auto;
}
</style>
