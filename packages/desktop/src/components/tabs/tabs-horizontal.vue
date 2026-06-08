<template>
  <div
    :class="[
      cls.b,
      cls.m('horizontal'),
      cls.m(position),
      cls.m(size),
      bem.is('block', block),
      bem.is('rounded', rounded)
    ]"
  >
    <button
      v-show="showNav"
      type="button"
      :class="[cls.e('nav'), cls.em('nav', 'prev')]"
      :disabled="!canPrev"
      @click="scrollByStep(-1)"
    >
      <u-icon> <ArrowLeft /> </u-icon>
    </button>

    <div ref="viewportRef" :class="cls.e('viewport')">
      <div ref="listRef" :class="cls.e('list')">
        <button
          type="button"
          role="tab"
          v-for="(item, index) in items"
          :key="item.key"
          :class="[
            cls.e('item'),
            bem.is('active', model === item.key),
            bem.is('disabled', item.disabled === true)
          ]"
          @click.stop="handleClick(item, index)"
        >
          <slot v-bind="{ item, index }">
            <span :class="cls.e('item-label')">{{ item.name ?? item.key }}</span>
          </slot>

          <span
            v-if="isItemClosable(item)"
            role="button"
            tabindex="0"
            :class="cls.e('close')"
            :aria-label="`close ${item.name ?? item.key}`"
            @click.stop="handleClose(item, index)"
          >
            <u-icon>
              <Close />
            </u-icon>
          </span>
        </button>
      </div>
    </div>

    <button
      v-show="showNav"
      type="button"
      :class="[cls.e('nav'), cls.em('nav', 'next')]"
      :disabled="!canNext"
      @click="scrollByStep(1)"
    >
      <u-icon> <ArrowRight /> </u-icon>
    </button>
  </div>
</template>

<script lang="ts" setup>
import { useFallbackProps } from '@veltra/compositions'
import { ArrowLeft, ArrowRight, Close } from '@veltra/icons/normal'
import { bem } from '@veltra/utils'
import { computed, shallowRef } from 'vue'

import type { ComponentSize, TabItem, TabsHorizontalEmits, TabsHorizontalProps } from '../../types'
import { UIcon } from '../icon'
import { useTabsBar } from './use-tabs-bar'

defineOptions({ name: 'TabsHorizontal' })

const props = withDefaults(defineProps<TabsHorizontalProps>(), {
  position: 'top',
  closable: false,
  block: false,
  rounded: false
})

const emit = defineEmits<TabsHorizontalEmits>()

defineSlots<{ default: (props: { item: TabItem }) => any }>()

const { size } = useFallbackProps([props], { size: 'default' as ComponentSize })

const cls = bem('tabs-bar')

const model = defineModel<string>()

const viewportRef = shallowRef<HTMLElement>()
const listRef = shallowRef<HTMLElement>()

const itemsRef = computed(() => props.items)

const { showNav, canPrev, canNext, scrollByStep } = useTabsBar({
  viewportRef,
  listRef,
  items: itemsRef,
  model
})

const isItemClosable = (item: TabItem) => {
  if (item.disabled) return false
  return item.closable ?? props.closable
}

const handleClick = (item: TabItem, index: number) => {
  if (item.disabled) return
  model.value = item.key
  emit('click', item, index)
}

const handleClose = (item: TabItem, index: number) => {
  if (item.disabled) return
  emit('close', item, index)
}
</script>
