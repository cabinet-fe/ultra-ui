<template>
  <div :class="cls.e('column')">
    <div :class="cls.e('column-header')">
      <slot name="header" :column="column" :count="values.length">
        <span :class="cls.e('column-title')">{{ title }}</span>
        <span v-if="countable" :class="cls.e('column-count')">{{ values.length }}</span>
      </slot>
    </div>

    <div ref="parentRef" :class="cls.e('cards')">
      <div v-for="(card, index) of values" :key="card[cardKey]" :class="cls.e('card')">
        <span :class="cls.e('card-handle')">≡</span>
        <div :class="cls.e('card-body')">
          <slot name="card" :card="card" :column="column" :index="index">
            {{ card[titleKey] ?? card[cardKey] }}
          </slot>
        </div>
      </div>

      <div v-if="!values.length" :class="cls.e('empty')">
        <slot name="empty" :column="column">{{ placeholder }}</slot>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { animations, useDnD, type VueParentConfig } from '@veltra/compositions'
import { computed, inject, watch } from 'vue'

import type { KanbanColumnItem, KanbanSlots } from '../../types'
import { KanbanDIKey } from './di'

defineOptions({ name: 'UKanbanColumn' })

defineSlots<KanbanSlots>()

const props = defineProps<{ column: KanbanColumnItem }>()

const ctx = inject(KanbanDIKey)!

const cls = ctx.cls

const titleKey = computed(() => ctx.kanbanProps.titleKey ?? 'title')
const cardKey = computed(() => ctx.kanbanProps.cardKey ?? 'id')
const countable = computed(() => ctx.kanbanProps.countable !== false)
const placeholder = computed(() => ctx.kanbanProps.placeholder ?? '暂无内容')

const title = computed(() => props.column[titleKey.value])

function makeConfig(): VueParentConfig<Record<string, any>> {
  return {
    group: 'u-kanban',
    dragHandle: `.${cls.e('card-handle')}`,
    draggable: (el) => el.classList.contains(cls.e('card')),
    draggingClass: 'is-dragging',
    dropZoneClass: 'is-dropzone',
    disabled: ctx.kanbanProps.disabled,
    // 排序/转移数据已由 onReorder 写回，这里只负责对外发 change 通知
    onSort: () => ctx.notifyChange(),
    onTransfer: () => ctx.notifyChange(),
    plugins: [animations()]
  }
}

const { parentRef, values, updateConfig } = useDnD<Record<string, any>>({
  values: () => props.column.items,
  onReorder: (items) => ctx.reorderColumn(props.column.key, items),
  ...makeConfig()
})

// updateConfig 是整体替换配置，须传完整配置而非仅 disabled
watch(
  () => ctx.kanbanProps.disabled,
  () => updateConfig(makeConfig())
)
</script>
