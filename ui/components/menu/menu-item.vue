<template>
  <u-tip position="right" v-if="injected?.simple.value && textIndent === '0px'">
    <template #content><slot /></template>
    <div
      :class="[
        cls?.e('item'),
        bem.is('active', injected?.activeIndex.value === index),
        bem.is('disabled', disabled)
      ]"
      @click="handleClick"
      :style="{ textIndent, width: 'auto' }"
      v-ripple="!disabled"
    >
      <UIcon :class="cls?.em('item', 'icon')" style="margin-right: 0" v-if="icon">
        <component :is="icon" />
      </UIcon>
    </div>
  </u-tip>

  <div
    v-else
    :class="[
      cls?.e('item'),
      bem.is('active', injected?.activeIndex.value === index),
      bem.is('disabled', disabled),
      cls?.em('item', size)
    ]"
    @click="handleClick"
    :style="{
      textIndent: injected?.simple.value ? `${parseInt(textIndent) - 40}px` : textIndent,
      width: 'auto'
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
import { inject, ref, watch, getCurrentInstance } from 'vue'
import { MenuDIKey, calcIndent } from './di'
import type { MenuItemProps } from '@ui/types/components/menu'
import { bem } from '@ui/utils'
import { UIcon } from '../icon'
import { UTip } from '../tip'
import { useFallbackProps } from '@ui/compositions'
import { vRipple } from '@ui/directives'
import { useRouter } from 'vue-router'

defineOptions({
  name: 'MenuItem'
})

const injected = inject(MenuDIKey)
const { cls } = injected || {}

const props = defineProps<MenuItemProps>()

const { size } = useFallbackProps([props], {
  size: 'default'
})

const router = useRouter()

const handleClick = () => {
  if (!props.disabled) {
    injected!.activeIndex.value = props.index
    if (injected!.router) {
      router.push({ path: props.index })
    } else {
      if (props.route) router.push({ path: props.route })
    }
  }
}

const instance = getCurrentInstance()

const textIndent = ref<string>('0px')

watch(
  () => instance,
  () => {
    if (instance) textIndent.value = calcIndent(instance)
  },
  { immediate: true }
)
</script>
