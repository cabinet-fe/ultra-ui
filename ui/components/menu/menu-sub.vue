<template>
  <div :class="[cls?.e('sub'), bem.is('disabled', disabled)]">
    <div
      :class="[cls?.em('sub', 'title'), bem.is('active', injected?.activeIndex.value === index)]"
      @click.stop="handleClick"
    >
      <slot name="title" />
      <UIcon
        :class="cls?.em('sub', 'arrow')"
        :style="{ transform: `rotate(${Number(expand) * 90}deg)` }"
        ><ArrowRight
      /></UIcon>
    </div>
    <Transition name="menu-expand">
      <div
        :class="cls?.em('sub', 'item')"
        v-show="expand"
        :style="{
          maxHeight: `${Number(expand) * 1000}px`,
          textIndent: `${Number(hasIcon) * 18}px`
        }"
      >
        <slot />
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { inject, ref, watch, onMounted, useSlots, computed } from 'vue'
import { MenuDIKey } from './di'
import { ArrowRight } from 'icon-ultra'
import { UIcon } from '../icon'
import type { MenuSubProps } from '@ui/types/components/menu'
import { bem } from '@ui/utils'

const injected = inject(MenuDIKey)
const { cls } = injected || {}

const expand = ref<boolean>(false)

watch(
  () => expand.value,
  (val) => {
    if (val) {
      injected?.menuEmit('open', props.index || '')
    } else {
      injected?.menuEmit('close', props.index || '')
    }
  }
)

const props = defineProps<MenuSubProps>()

const open = () => (expand.value = true)

const close = () => (expand.value = false)

watch(
  () => injected?.openIndex.value,
  (index) => {
    if (index === props.index) open()
  }
)

watch(
  () => injected?.closeIndex.value,
  (index) => {
    if (index === props.index) close()
  }
)

const handleClick = () => {
  if (props.disabled) return
  injected!.activeIndex.value = props.index
  expand.value = !expand.value
}

watch(
  () => injected?.activeIndex.value,
  (index) => {
    if (index === props.index) open()
  },
  { once: true }
)

onMounted(() => {
  if (injected?.expand) open()
})

const slots = useSlots()

const hasIcon = computed(() => {
  const type: any = slots.title!()[0]?.type
  if (typeof type === 'object') {
    return type.name === 'Icon'
  } else {
    return false
  }
})

defineExpose({ open, close })
</script>
