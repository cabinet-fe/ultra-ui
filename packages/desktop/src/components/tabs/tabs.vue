<template>
  <u-tabs-horizontal
    v-if="isHorizontal"
    v-model="model"
    :items="items"
    :position="position as 'top' | 'bottom'"
    :size="size"
    :rounded="rounded"
    :closable="closable"
    :block="block"
    @click="onClick"
    @close="onClose"
  >
    <template v-for="(_, name) in nameSlots" :key="name" #[name]>
      <slot :name="name" />
    </template>
    <transition name="fade" mode="out-in">
      <keep-alive v-if="keepAlive">
        <component :key="model" :is="renderContent()" />
      </keep-alive>
      <component v-else :key="model" :is="renderContent()" />
    </transition>
  </u-tabs-horizontal>

  <u-tabs-vertical
    v-else
    v-model="model"
    :items="items"
    :position="position as 'left' | 'right'"
    :size="size"
    :rounded="rounded"
    :closable="closable"
    @click="onClick"
    @close="onClose"
  >
    <template v-for="(_, name) in nameSlots" :key="name" #[name]>
      <slot :name="name" />
    </template>
    <transition name="fade" mode="out-in">
      <keep-alive v-if="keepAlive">
        <component :key="model" :is="renderContent()" />
      </keep-alive>
      <component v-else :key="model" :is="renderContent()" />
    </transition>
  </u-tabs-vertical>
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
  rounded: true,
  closable: false,
  block: false,
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

/** 仅转发 `name:${key}` 命名槽，default 槽由本组件自己提供内容区 */
const nameSlots = computed(() => {
  const result: Record<string, true> = {}
  for (const key of Object.keys(slots)) {
    if (key.startsWith('name:')) result[key] = true
  }
  return result
})

const onClick = (item: TabItem, index: number) => emit('click', item, index)
const onClose = (item: TabItem, index: number) => emit('close', item, index)

const renderContent = () => {
  const key = model.value
  if (!key) return null
  const nodes = slots[key]?.({ key })
  if (Array.isArray(nodes)) {
    return createVNode(UScroll, { class: cls.e('content') }, { default: () => nodes })
  }
  return nodes
}
</script>
