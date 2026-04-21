<template>
  <div :class="[cls.b, cls.m(position!)]">
    <u-tabs-horizontal
      v-if="isHorizontal"
      v-model="model"
      :items="items"
      :position="horizontalPosition"
      :size="size"
      :closable="closable"
      :block="block"
      :rounded="rounded"
      @click="onClick"
      @close="onClose"
    />
    <u-tabs-vertical
      v-else
      v-model="model"
      :items="items"
      :position="verticalPosition"
      :size="size"
      :closable="closable"
      :rounded="rounded"
      @click="onClick"
      @close="onClose"
    />

    <div v-if="hasContentSlots" :class="cls.e('content')">
      <transition name="fade" mode="out-in">
        <keep-alive v-if="keepAlive">
          <component :key="model" :is="renderContent()" />
        </keep-alive>
        <component v-else :key="model" :is="renderContent()" />
      </transition>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { useFallbackProps } from '@veltra/compositions'
import { bem } from '@veltra/utils'
import { computed, createVNode, useSlots } from 'vue'

import type { ComponentSize, TabItem, TabsEmits, TabsProps } from '../../types'
import { UScroll } from '../scroll'
import UTabsHorizontal from './tabs-horizontal.vue'
import UTabsVertical from './tabs-vertical.vue'

defineOptions({ name: 'Tabs' })

const props = withDefaults(defineProps<TabsProps>(), {
  position: 'top',
  closable: false,
  block: false,
  rounded: false,
  keepAlive: false
})

const emit = defineEmits<TabsEmits>()

const slots = useSlots() as Record<string, ((props?: any) => any) | undefined>

const { size } = useFallbackProps([props], {
  size: 'default' as ComponentSize
})

const cls = bem('tabs')

const model = defineModel<string>()

const isHorizontal = computed(() => props.position === 'top' || props.position === 'bottom')

/** 避免模板中使用类型断言：收敛 position 到水平 / 垂直子组件所需的子集。 */
const horizontalPosition = computed<'top' | 'bottom'>(() =>
  props.position === 'bottom' ? 'bottom' : 'top'
)

const verticalPosition = computed<'left' | 'right'>(() =>
  props.position === 'right' ? 'right' : 'left'
)

/** 是否存在任一内容面板插槽；没有则不渲染内容区域。 */
const hasContentSlots = computed(() => Object.keys(slots).length > 0)

const onClick = (item: TabItem, index: number) => emit('click', item, index)
const onClose = (item: TabItem, index: number) => emit('close', item, index)

const renderContent = () => {
  const key = model.value
  if (!key) return null
  const nodes = slots[key]?.({ key })
  if (Array.isArray(nodes)) {
    return createVNode(UScroll, null, { default: () => nodes })
  }
  return nodes
}
</script>
