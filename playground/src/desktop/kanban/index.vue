<template>
  <div class="box">
    <CustomCard title="基础看板（列内排序 + 跨列拖拽）">
      <div class="demo-section">
        <div class="demo-desc">
          按住卡片左侧 ≡ 手柄拖拽，可列内排序或跨列转移；空列也可拖入。列超出容器宽度时看板横向滚动
        </div>
        <u-kanban v-model:columns="columns" style="height: 420px" @change="lastChange = $event" />
      </div>
    </CustomCard>

    <CustomCard title="自定义插槽（#header / #card / #empty）">
      <u-kanban v-model:columns="columns" style="height: 420px">
        <template #header="{ column, count }">
          <span class="custom-header">{{ column.title }}</span>
          <u-tag size="small" type="primary">{{ count }}</u-tag>
        </template>
        <template #card="{ card }">
          <div class="custom-card">
            <div class="custom-card-title">{{ card.title }}</div>
            <div class="custom-card-desc">{{ card.desc }}</div>
          </div>
        </template>
        <template #empty="{ column }">
          <span>{{ column.title }}列暂无卡片</span>
        </template>
      </u-kanban>
    </CustomCard>

    <CustomCard title="字段名定制（cardKey / titleKey / placeholder）">
      <u-kanban
        v-model:columns="customColumns"
        card-key="no"
        title-key="name"
        placeholder="拖卡片到这里"
        style="height: 360px"
      />
    </CustomCard>

    <CustomCard title="禁用拖拽（disabled）">
      <u-kanban v-model:columns="disabledColumns" disabled style="height: 360px" />
    </CustomCard>

    <CustomCard title="最近一次拖拽结果（change 事件）">
      <pre class="demo-desc">{{ lastChangeText }}</pre>
    </CustomCard>
  </div>
</template>

<script setup lang="ts">
import type { KanbanColumnItem } from '@veltra/desktop'
import { computed, ref } from 'vue'

import CustomCard from '../card/custom-card.vue'

const columns = ref<KanbanColumnItem[]>([
  {
    key: 'todo',
    title: '待办',
    items: [
      { id: 1, title: '梳理需求', desc: '输出技术方案与排期' },
      { id: 2, title: '开发看板组件', desc: '基于 useDnD 实现拖拽' },
      { id: 3, title: '补充单元测试', desc: '渲染 / 插槽 / 禁用态' }
    ]
  },
  { key: 'doing', title: '进行中', items: [{ id: 4, title: '联调接口', desc: '与后端核对字段' }] },
  {
    key: 'done',
    title: '已完成',
    items: [
      { id: 5, title: '技术调研', desc: '确认拖拽方案' },
      { id: 6, title: '组件设计', desc: 'API 与数据流' }
    ]
  },
  { key: 'archive', title: '归档', items: [] }
])

const customColumns = ref<KanbanColumnItem[]>([
  {
    key: 'bugs',
    name: '缺陷',
    items: [
      { no: 'b-1', name: '样式错位' },
      { no: 'b-2', name: '滚动卡顿' }
    ]
  },
  { key: 'ideas', name: '想法', items: [{ no: 'i-1', name: '支持多选拖拽' }] }
])

// 禁用态演示用独立数据，避免与基础看板共用数据时内容被其它看板的拖拽改动
const disabledColumns = ref<KanbanColumnItem[]>(
  ['todo', 'doing', 'done', 'archive'].map((key) => ({
    key,
    title: { todo: '待办', doing: '进行中', done: '已完成', archive: '归档' }[key]!,
    items:
      key === 'todo'
        ? [{ id: 1, title: '梳理需求' }]
        : key === 'done'
          ? [{ id: 2, title: '技术调研' }]
          : []
  }))
)

const lastChange = ref<KanbanColumnItem[]>()

const lastChangeText = computed(() =>
  lastChange.value
    ? lastChange.value
        .map(
          (column) => `${column.title}: ${column.items.map((c) => c.title).join('、') || '(空)'}`
        )
        .join('\n')
    : '尚未拖拽'
)
</script>

<style scoped>
.custom-header {
  font-weight: 600;
}

.custom-card {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.custom-card-title {
  font-weight: 500;
}

.custom-card-desc {
  font-size: 12px;
  opacity: 0.7;
}
</style>
