<template>
  <div :class="[cls.b, cls.m(size)]"><slot /></div>
</template>

<script lang="ts" setup>
import type { MenuEmits, MenuExposed, MenuProps } from '@ui/types/components/menu'
import { bem } from '@ui/utils'
import { provide, inject, ref, shallowRef } from 'vue'
import { MenuDIKey, type MenuContext } from './di'
import { useFallbackProps } from '@ui/compositions'

defineOptions({
  name: 'Menu'
})

const props = defineProps<MenuProps>()

const emit = defineEmits<MenuEmits>()

const cls = bem('menu')

const { size } = useFallbackProps([props], {
  size: 'default'
})

const store = shallowRef<MenuContext>({
  cls,
  menuProps: props,
  menuEmit: emit,
  menuSubs: {}
})

provide(MenuDIKey, store.value )

const open = (index: string) => {
  if (store.value.menuSubs[index]) {
    (store.value.menuSubs[index]!.exposed as any).open()
  }
}

const close = (index: string) => {
  if (store.value.menuSubs[index]) {
    (store.value.menuSubs[index]!.exposed as any).close()
  }
}

defineExpose({ open, close })
</script>
