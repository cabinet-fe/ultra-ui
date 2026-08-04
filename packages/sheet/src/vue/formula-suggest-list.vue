<template>
  <ul v-if="items.length > 0" :class="cls.e('fx-suggest')" role="listbox" @mousedown.prevent>
    <li
      v-for="(item, index) in items"
      :key="item.name"
      :ref="(el) => setItemRef(index, el)"
      :class="[cls.e('fx-suggest-item'), bem.is('active', index === activeIndex)]"
      role="option"
      :aria-selected="index === activeIndex"
      @mousedown.prevent="emit('select', item)"
      @mouseenter="emit('hover', index)"
    >
      <span :class="cls.e('fx-suggest-sig')">{{ item.signature }}</span>
      <span v-if="item.description" :class="cls.e('fx-suggest-desc')">{{ item.description }}</span>
    </li>
  </ul>
</template>

<script lang="ts" setup>
import { bem } from '@veltra/utils'
import { nextTick, watch } from 'vue'

import type { FormulaSuggestItem } from './use-formula-suggest'

defineOptions({ name: 'UFormulaSuggestList' })

const props = defineProps<{ items: FormulaSuggestItem[]; activeIndex: number }>()

const emit = defineEmits<{ select: [item: FormulaSuggestItem]; hover: [index: number] }>()

const cls = bem('sheet')
// bem.is 挂在工厂函数上，与 cls.e 分开用

const itemEls: (HTMLElement | null)[] = []

function setItemRef(index: number, el: unknown): void {
  itemEls[index] = el instanceof HTMLElement ? el : null
}

watch(
  () => [props.activeIndex, props.items] as const,
  async ([index]) => {
    await nextTick()
    itemEls[index]?.scrollIntoView({ block: 'nearest' })
  }
)
</script>
