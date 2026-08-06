<template>
  <div v-if="items.length > 0" :class="cls.e('fx-suggest')" role="listbox" @mousedown.prevent>
    <!-- 滚动用 desktop UScroll（自定义滚动条；原生 overflow 滚动条在浮层里常看不见） -->
    <u-scroll :height="scrollHeight" :class="cls.e('fx-suggest-scroll')">
      <ul :class="cls.e('fx-suggest-list')">
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
          <span v-if="item.description" :class="cls.e('fx-suggest-desc')">{{
            item.description
          }}</span>
        </li>
      </ul>
    </u-scroll>
  </div>
</template>

<script lang="ts" setup>
import { UScroll } from '@veltra/desktop'
import { bem } from '@veltra/utils'
import { computed, nextTick, watch } from 'vue'

import type { FormulaSuggestItem } from './use-formula-suggest'

defineOptions({ name: 'UFormulaSuggestList' })

const props = defineProps<{ items: FormulaSuggestItem[]; activeIndex: number }>()

const emit = defineEmits<{ select: [item: FormulaSuggestItem]; hover: [index: number] }>()

const cls = bem('sheet')
// bem.is 挂在工厂函数上，与 cls.e 分开用

/** 候选列表最大可视高度；内容更短时收缩，避免空前缀少量项时大片留白 */
const SUGGEST_MAX_HEIGHT = 240
/** 单项约高（含 padding + 签名/描述两行）；用于估算 UScroll height */
const SUGGEST_ITEM_HEIGHT = 48

const scrollHeight = computed(() =>
  Math.min(Math.max(props.items.length, 1) * SUGGEST_ITEM_HEIGHT, SUGGEST_MAX_HEIGHT)
)

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
