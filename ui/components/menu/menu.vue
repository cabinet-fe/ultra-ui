<template>
  <div :class="[cls.b, cls.m(size)]" :style="{ maxWidth: simple ? '68px' : '1980px' }">
    <slot />
  </div>
</template>

<script lang="ts" setup>
import type { MenuEmits, MenuProps } from '@ui/types/components/menu'
import { bem } from '@ui/utils'
import { provide, shallowRef, ref, watch } from 'vue'
import { MenuDIKey, type MenuContext } from './di'
import { useFallbackProps } from '@ui/compositions'

defineOptions({
  name: 'Menu'
})

const props = defineProps<MenuProps>()

const emit = defineEmits<MenuEmits>()

const cls = bem('menu')

const { size, expand, activeIndex, simple } = useFallbackProps([props], {
  size: 'default',
  expand: false,
  activeIndex: '',
  simple: false
})

const store = shallowRef<MenuContext>({
  cls,
  menuProps: props,
  menuEmit: emit,
  openIndex: ref(''),
  closeIndex: ref(''),
  expand: expand.value,
  activeIndex: ref(activeIndex.value),
  simple: ref(simple.value)
})

watch(
  () => simple.value,
  (val) => {
    if (val) {
      setTimeout(() => (store.value.simple.value = true), 450)
    } else {
      setTimeout(() => (store.value.simple.value = false), 150)
    }
  }
)

provide(MenuDIKey, store.value)

const open = (index: string) => {
  store.value.openIndex.value = index
  if (store.value.closeIndex.value === index) store.value.closeIndex.value = ''
}

const close = (index: string) => {
  store.value.closeIndex.value = index
  if (store.value.openIndex.value === index) store.value.openIndex.value = ''
}

defineExpose({ open, close })
</script>
