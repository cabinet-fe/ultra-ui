<template>
  <u-tip direction="right" v-if="injected?.simple.value && isBase">
    <template #content><slot /></template>
    <div
      :class="[
        cls?.e('item'),
        bem.is('active', activation),
        bem.is('disabled', disabled),
        bem.is('simple', true)
      ]"
      @click="handleClick"
      :style="{
        width: 'auto',
        color: customColor
      }"
      v-ripple="!disabled"
    >
      <UIcon
        :class="cls?.em('item', 'icon')"
        style="margin-right: 0"
        v-if="icon"
      >
        <component :is="icon" />
      </UIcon>
    </div>
  </u-tip>

  <div
    v-else
    :class="[
      cls?.e('item'),
      bem.is('active', activation),
      bem.is('disabled', disabled),
      cls?.em('item', size)
    ]"
    @click="handleClick"
    :style="{
      textIndent: injected!.simple.value ? '0px' : textIndent,
      width: 'auto',
      color: customColor
    }"
    v-ripple="!disabled"
  >
    <UIcon :class="cls?.em('item', 'icon')" v-if="icon">
      <component :is="icon" />
    </UIcon>
    <slot />
  </div>
</template>

<script setup lang="ts">
import {
  inject,
  ref,
  watch,
  getCurrentInstance,
  computed,
  type ComponentInternalInstance
} from 'vue'
import { MenuDIKey, calcIndent, getParentIndex } from './di'
import type { MenuItemProps } from '@ui/types/components/menu'
import { bem } from '@ui/utils'
import { UIcon } from '../icon'
import { UTip } from '../tip'
import { useFallbackProps } from '@ui/compositions'
import { vRipple } from '@ui/directives'

defineOptions({
  name: 'MenuItem'
})

const injected = inject(MenuDIKey)
const { cls } = injected || {}

const props = defineProps<MenuItemProps>()

const { size } = useFallbackProps([props], {
  size: 'default'
})

const handleClick = () => {
  if (!props.disabled) {
    injected!.activeIndex.value = props.index
    injected?.menuEmit('select', props.index || '')
  }
}

const instance = getCurrentInstance()

const textIndent = ref<string>('0px')

const parents = ref<string[]>([])

const isBase = computed(() => {
  if (parents.value.length) {
    return Boolean(parents.value[0] === 'menu-root')
  } else {
    return false
  }
})

const getParent = (instance: ComponentInternalInstance) => {
  parents.value = getParentIndex(instance)
  parents.value.forEach((parent: string) => {
    if (injected?.structure.value[parent]) {
      injected!.structure.value[parent]?.add(props.index)
    } else {
      injected!.structure.value[parent] = new Set([props.index])
    }
  })
}
// 根据嵌套层级计算缩进
watch(
  () => instance,
  () => {
    if (instance) {
      textIndent.value = calcIndent(instance)
      getParent(instance)
    }
  },
  { immediate: true }
)
// 是否为激活状态
const activation = computed(() => injected?.activeIndex.value === props.index)
// 用户自定义颜色
const customColor = computed(() => {
  if (!props.disabled) {
    return activation.value ? injected?.activeTextColor : injected?.textColor
  } else {
    return 'var(--text-color-disabled)'
  }
})
</script>
