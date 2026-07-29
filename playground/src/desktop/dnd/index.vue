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

    <CustomCard title="可见子集排序（filter + 动态容器）">
      <div class="dnd-fields">
        <div v-for="item in visibleFields" :key="item.id" class="dnd-item dnd-item--field">
          <span class="dnd-handle">≡</span>
          {{ item.label }}
        </div>
        <button ref="addBtn" class="dnd-add">+ 添加字段</button>
      </div>
      <p class="dnd-order">完整顺序（含隐藏项）：{{ fullOrder }}</p>
      <p class="dnd-tip">“字段 3”处于隐藏状态不参与拖拽；拖拽可见项，顺序自动合并回完整数组</p>
    </CustomCard>

    <CustomCard title="占位不可见（dragPlaceholderClass）">
      <ul ref="phParent" class="dnd-list">
        <li v-for="item in phValues" :key="item.id" class="dnd-item">
          {{ item.label }}
        </li>
      </ul>
      <p class="dnd-tip">
        拖拽时库会把 dragPlaceholderClass
        加到留在原位的元素上；将其设为透明后原位置直接收拢，不留下残影
      </p>
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

// 可见子集排序：filter 命中的项参与拖拽，排序结果自动合并回完整数组；
// parent 动态取按钮的父元素作为容器，“添加字段”按钮由 draggable 排除
interface FieldItem extends DndItem {
  hidden?: boolean
}

const fields = ref<FieldItem[]>([
  { id: 1, label: '字段 1' },
  { id: 2, label: '字段 2' },
  { id: 3, label: '字段 3', hidden: true },
  { id: 4, label: '字段 4' },
  { id: 5, label: '字段 5' }
])

const addBtn = ref<HTMLElement>()

const visibleFields = computed(() => fields.value.filter((item) => !item.hidden))
const fullOrder = computed(() =>
  fields.value.map((item) => (item.hidden ? `${item.label}(隐)` : item.label)).join(' → ')
)

useDnD<FieldItem>({
  values: fields,
  filter: (item) => !item.hidden,
  parent: () => addBtn.value?.parentElement ?? undefined,
  dragHandle: '.dnd-handle',
  draggable: (el) => el.classList.contains('dnd-item--field'),
  plugins: [animations()]
})

// 占位不可见：库在拖拽时把占位 class 加到留在原位的元素上，
// 将其隐藏后原位置直接收拢（配合 animations 平滑过渡）
const { parentRef: phParent, values: phValues } = useDnD<DndItem>({
  values: createItems('项目', 5),
  plugins: [animations()],
  dragPlaceholderClass: 'dnd-placeholder-hidden',
  synthDragPlaceholderClass: 'dnd-placeholder-hidden'
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

  .dnd-fields {
    display: flex;
    flex-direction: column;
  }

  .dnd-add {
    align-self: flex-start;
    padding: 8px 12px;
    border: 1px dashed var(--u-border-color);
    border-radius: 4px;
    background: none;
    color: var(--u-text-color-secondary);
    cursor: pointer;
  }

  .dnd-tip {
    margin: 4px 0 0;
    font-size: 12px;
    color: var(--u-text-color-secondary);
    opacity: 0.8;
  }

  .dnd-placeholder-hidden {
    opacity: 0;
  }
}
</style>
