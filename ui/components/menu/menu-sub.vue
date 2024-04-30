<template>
  <u-tip v-if="injected?.simple.value && textIndent === '0px'" position="right-start">
    <div :class="[cls?.e('sub'), bem.is('disabled', disabled)]">
      <div
        :class="[cls?.em('sub', 'title'), bem.is('active', injected?.activeIndex.value === index)]"
        @click.stop="handleClick"
        :style="{ textIndent }"
      >
        <UIcon :class="cls?.em('sub', 'icon')" style="margin-right: 0" v-if="icon">
          <component :is="icon" />
        </UIcon>
      </div>
    </div>
    <template #content>
      <slot />
    </template>
  </u-tip>

  <div v-else :class="[cls?.e('sub'), bem.is('disabled', disabled), cls?.m(size)]">
    <div
      :class="[cls?.em('sub', 'title'), bem.is('active', injected?.activeIndex.value === index)]"
      @click.stop="handleClick"
      :style="{
        textIndent: injected?.simple.value ? `${parseInt(textIndent) - 40}px` : textIndent,
        paddingRight: '30px'
      }"
    >
      <UIcon :class="cls?.em('sub', 'icon')" v-if="icon">
        <component :is="icon" />
      </UIcon>

      <slot name="title" />
      <UIcon
        :class="cls?.em('sub', 'arrow')"
        :style="{ transform: `rotate(${Number(expand) * 90}deg)` }"
        ><ArrowRight
      /></UIcon>
    </div>
    <Transition name="menu-sub-expand">
      <div
        :class="cls?.em('sub', 'item')"
        v-show="expand"
        :style="{
          maxHeight: `${Number(expand) * 1080}px`
        }"
      >
        <slot />
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { inject, ref, watch, onMounted, getCurrentInstance } from 'vue'
import { MenuDIKey, calcIndent } from './di'
import { ArrowRight } from 'icon-ultra'
import { UIcon } from '../icon'
import type { MenuSubProps } from '@ui/types/components/menu'
import { bem } from '@ui/utils'
import { UTip } from '../tip'
import { useFallbackProps } from '@ui/compositions'

defineOptions({
  name: 'MenuSub'
})

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

const { size } = useFallbackProps([props], {
  size: 'default'
})

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

watch(
  () => injected?.simple.value,
  (val) => {
    if (val) {
      close()
    }
  }
)

const handleClick = () => {
  if (props.disabled) return
  if (injected?.simple.value && textIndent.value === '0px') return
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

const instance = getCurrentInstance()

const textIndent = ref<string>('0px')

watch(
  () => instance,
  () => {
    if (instance) textIndent.value = calcIndent(instance)
  },
  { immediate: true }
)

defineExpose({ open, close })
</script>
