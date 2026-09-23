<template>
  <div v-bind="$attrs" :class="[cls.b, bem.is('disabled', disabled)]">
    <KanbanColumn v-for="column of localColumns" :key="column.key" :column="column">
      <template #header="{ column: col, count }">
        <slot name="header" :column="col" :count="count" />
      </template>
      <template #card="{ card, column: col, index }">
        <slot name="card" :card="card" :column="col" :index="index" />
      </template>
      <template #empty="{ column: col }">
        <slot name="empty" :column="col" />
      </template>
    </KanbanColumn>
  </div>
</template>

<script lang="ts" setup>
import { bem } from '@veltra/utils'
import { provide, ref, watch } from 'vue'

import type { KanbanColumnItem, KanbanEmits, KanbanProps, KanbanSlots } from '../../types'
import { KanbanDIKey, type KanbanContext } from './di'
import KanbanColumn from './kanban-column.vue'

defineOptions({ name: 'UKanban', inheritAttrs: false })

const props = withDefaults(defineProps<KanbanProps>(), {
  cardKey: 'id',
  titleKey: 'title',
  disabled: false,
  countable: true,
  placeholder: '暂无内容'
})

const emit = defineEmits<KanbanEmits>()
defineSlots<KanbanSlots>()

const cls = bem('kanban')

// 拖拽写回的本地数据源：props 拷贝一份避免原地改父级数据，
// 拖拽结果经 update:columns 交给父级决定是否受控回写
const localColumns = ref<KanbanColumnItem[]>([])

watch(
  () => props.columns,
  (columns) => {
    localColumns.value = (columns ?? []).map((column) => ({ ...column, items: [...column.items] }))
  },
  { immediate: true }
)

function snapshot(): KanbanColumnItem[] {
  return localColumns.value.map((column) => ({ ...column, items: [...column.items] }))
}

function reorderColumn(columnKey: string, items: Record<string, any>[]) {
  localColumns.value = localColumns.value.map((column) =>
    column.key === columnKey ? { ...column, items } : column
  )
  emit('update:columns', snapshot())
}

// 一次拖拽可能同步触发多个回调（跨列转移在源列与目标列各触发一次 onTransfer），
// microtask 内合并保证一次操作只 emit 一次 change
let changePending = false
function notifyChange() {
  if (changePending) return
  changePending = true
  queueMicrotask(() => {
    changePending = false
    emit('change', snapshot())
  })
}

provide(KanbanDIKey, {
  kanbanProps: props,
  cls,
  reorderColumn,
  notifyChange
} satisfies KanbanContext)
</script>
