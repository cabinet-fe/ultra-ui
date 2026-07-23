<template>
  <div class="dnd-demo">
    <CustomCard title="基础排序">
      <ul ref="basicParent" class="dnd-list">
        <li v-for="item in basicValues" :key="item.id" class="dnd-item">
          {{ item.label }}
        </li>
      </ul>
      <p class="dnd-order">当前顺序：{{ basicOrder }}</p>
    </CustomCard>

    <CustomCard title="拖拽手柄">
      <ul ref="handleParent" class="dnd-list">
        <li v-for="item in handleValues" :key="item.id" class="dnd-item">
          <span class="dnd-handle">≡</span>
          {{ item.label }}
        </li>
      </ul>
    </CustomCard>

    <CustomCard title="多容器互拖（相同 group）">
      <div class="dnd-groups">
        <div class="dnd-group">
          <p class="dnd-group__title">待处理</p>
          <ul ref="todoParent" class="dnd-list dnd-list--group">
            <li v-for="item in todoValues" :key="item.id" class="dnd-item">
              {{ item.label }}
            </li>
          </ul>
        </div>
        <div class="dnd-group">
          <p class="dnd-group__title">已处理</p>
          <ul ref="doneParent" class="dnd-list dnd-list--group">
            <li v-for="item in doneValues" :key="item.id" class="dnd-item">
              {{ item.label }}
            </li>
          </ul>
        </div>
      </div>
    </CustomCard>
  </div>
</template>

<script lang="ts" setup>
import { animations, useDnD } from '@veltra/compositions'
import { computed, ref } from 'vue'

import CustomCard from '../card/custom-card.vue'

interface DndItem {
  id: number
  label: string
}

function createItems(prefix: string, count: number, startId = 1): DndItem[] {
  return Array.from({ length: count }, (_, i) => ({
    id: startId + i,
    label: `${prefix} ${startId + i}`
  }))
}

// 基础排序
const { parentRef: basicParent, values: basicValues } = useDnD<DndItem>({
  values: createItems('事项', 5),
  plugins: [animations()]
})

const basicOrder = computed(() => basicValues.value.map((item) => item.label).join(' → '))

// 拖拽手柄：只有按住手柄才能拖动
const { parentRef: handleParent, values: handleValues } = useDnD<DndItem>({
  values: createItems('条目', 4),
  dragHandle: '.dnd-handle',
  plugins: [animations()]
})

// 多容器互拖：相同 group 的容器之间可以转移
const { parentRef: todoParent, values: todoValues } = useDnD<DndItem>({
  values: createItems('任务', 3),
  group: 'demo',
  plugins: [animations()]
})

const { parentRef: doneParent, values: doneValues } = useDnD<DndItem>({
  values: ref(createItems('任务', 2, 4)),
  group: 'demo',
  plugins: [animations()]
})
</script>

<style lang="scss" scoped>
.dnd-demo {
  .dnd-list {
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .dnd-item {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 12px;
    margin-bottom: 6px;
    border: 1px solid var(--u-border-color);
    border-radius: 4px;
    background-color: var(--u-bg-color);
    cursor: grab;
    user-select: none;
  }

  .dnd-handle {
    color: var(--u-text-color-secondary);
    cursor: grab;
  }

  .dnd-order {
    margin: 8px 0 0;
    font-size: 12px;
    color: var(--u-text-color-secondary);
  }

  .dnd-groups {
    display: flex;
    gap: 16px;
  }

  .dnd-group {
    flex: 1;

    &__title {
      margin: 0 0 8px;
      font-size: 13px;
      color: var(--u-text-color-secondary);
    }
  }

  .dnd-list--group {
    min-height: 120px;
    padding: 8px;
    border: 1px dashed var(--u-border-color);
    border-radius: 4px;
  }
}
</style>
