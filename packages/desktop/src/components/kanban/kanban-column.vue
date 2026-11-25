<template>
  <div :class="cls.e('column')">
    <div :class="cls.e('column-header')">
      <slot name="header" :column="column" :count="column.items.length">
        <span :class="cls.e('column-title')">{{ title }}</span>
        <span v-if="countable" :class="cls.e('column-count')">{{ column.items.length }}</span>
      </slot>
    </div>

    <u-scroll
      ref="cardsScroll"
      :class="cls.e('cards')"
      :content-class="[cls.e('track'), bem.is('virtual', virtual)]"
    >
      <div
        v-for="row of rows"
        :key="row.card[cardKey] ?? row.index"
        :class="cls.e('card')"
        :style="row.start === null ? undefined : { top: `${row.start}px` }"
        :ref="(el) => measure(row.index, el as Element | null)"
      >
        <u-icon :class="cls.e('card-handle')" :size="14">
          <Move />
        </u-icon>
        <div :class="cls.e('card-body')">
          <slot name="card" :card="row.card" :column="column" :index="row.index">
            {{ row.card[titleKey] ?? row.card[cardKey] }}
          </slot>
        </div>
      </div>

      <div v-if="!column.items.length" :class="cls.e('empty')">
        <slot name="empty" :column="column">{{ placeholder }}</slot>
      </div>
    </u-scroll>
  </div>
</template>

<script lang="ts" setup>
import './style'
import { animations, useDnD, useVirtualizer, type VueParentConfig } from '@veltra/compositions'
import { Move } from '@veltra/icons/normal'
import { bem } from '@veltra/utils'
import { computed, inject, shallowRef, useTemplateRef, watch } from 'vue'

import type { KanbanColumnItem, KanbanSlots, ScrollExposed } from '../../types'
import { UIcon } from '../icon'
import { UScroll } from '../scroll'
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

const cardsScroll = useTemplateRef<ScrollExposed>('cardsScroll')
// 视口尚未量到（测试环境或首帧）时不锁高度，卡片按文档流全部渲染
const pinTrack = shallowRef(false)
// 拖拽期间冻住窗口里的卡片：formkit 要求可拖节点数与 values 一致
const dragFreeze = shallowRef<Record<string, any>[] | null>(null)

function readCardGap(): number {
  if (typeof document === 'undefined') return 8
  const raw = getComputedStyle(document.documentElement).getPropertyValue('--u-gap-small')
  const value = Number.parseFloat(raw)
  return Number.isFinite(value) ? value : 8
}

const {
  virtualizer,
  items: virtualItems,
  snapshot
} = useVirtualizer({
  count: computed(() => props.column.items.length),
  scrollEl: () => cardsScroll.value?.containerRef ?? null,
  contentEl: () => (pinTrack.value ? (cardsScroll.value?.contentRef ?? null) : null),
  gap: readCardGap(),
  estimateSize: () => 48,
  initialViewport: 640,
  getItemKey: (index) => props.column.items[index]?.[cardKey.value] ?? index
})

// count 不变时 Virtualizer 不重读 key，start 仍按旧下标的高度累加。
// 换一个函数身份才会按每张卡片已测高度重排，否则不等高卡片排序后叠在一起。
function relayout() {
  virtualizer.setOptions({
    getItemKey: (index) => props.column.items[index]?.[cardKey.value] ?? index
  })
}

watch(() => props.column.items, relayout)

const virtual = computed(() => snapshot.value.viewportSize > 0)

watch(
  virtual,
  (active) => {
    pinTrack.value = active
  },
  { immediate: true }
)

function inWindow(card: Record<string, any>): boolean {
  if (!virtual.value) return true
  const frozen = dragFreeze.value
  if (frozen) return frozen.includes(card)
  const list = props.column.items
  for (const item of virtualItems.value) {
    if (list[item.index] === card) return true
  }
  return false
}

function measure(index: number, el: Element | null) {
  if (!virtual.value || index < 0) return
  virtualizer.measureElement(index, el)
}

function makeConfig(): VueParentConfig<Record<string, any>> {
  return {
    group: 'u-kanban',
    dragHandle: `.${cls.e('card-handle')}`,
    draggable: (el) => el.classList.contains(cls.e('card')),
    draggingClass: 'is-dragging',
    // formkit 拖起后下一帧把原位元素换成 placeholder 类；跟随鼠标的是原生拖拽快照
    dragPlaceholderClass: 'is-drag-placeholder',
    dropZoneClass: 'is-dropzone',
    disabled: ctx.kanbanProps.disabled,
    onDragstart: () => {
      if (!virtual.value) return
      const list = props.column.items
      dragFreeze.value = virtualItems.value.flatMap((item) => {
        const card = list[item.index]
        return card ? [card] : []
      })
    },
    onDragend: () => {
      dragFreeze.value = null
    },
    // 排序/转移数据已由 onReorder 写回，这里只负责对外发 change 通知
    onSort: () => ctx.notifyChange(),
    onTransfer: () => ctx.notifyChange(),
    plugins: [animations()]
  }
}

const { values: view, updateConfig } = useDnD<Record<string, any>>({
  parent: () => cardsScroll.value?.contentRef ?? undefined,
  values: () => props.column.items,
  onReorder: (items) => ctx.reorderColumn(props.column.key, items),
  filter: inWindow,
  ...makeConfig()
})

const rows = computed(() => {
  const list = props.column.items
  if (!virtual.value) {
    return list.map((card, index) => ({ card, index, start: null as number | null }))
  }
  const frozen = dragFreeze.value
  if (!frozen) {
    return virtualItems.value.flatMap((item) => {
      const card = list[item.index]
      return card ? [{ card, index: item.index, start: item.start }] : []
    })
  }
  return view.value.flatMap((card) => {
    const index = list.indexOf(card)
    if (index < 0) return []
    return [{ card, index, start: virtualizer.getItem(index).start }]
  })
})

// updateConfig 是整体替换配置，须传完整配置而非仅 disabled
watch(
  () => ctx.kanbanProps.disabled,
  () => updateConfig(makeConfig())
)
</script>
