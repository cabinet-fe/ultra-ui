<template>
  <div :class="cls.b"><slot /></div>
</template>

<script lang="ts" setup>
import type { MenuProps } from '@ui/types/components/menu'
import { bem } from '@ui/utils'
import { useSlots, provide } from 'vue'
import { MenuDIKey } from './di'

defineOptions({
  name: 'Menu'
})

const props = defineProps<MenuProps>()

const cls = bem('menu')

const slots = useSlots()

provide(MenuDIKey, { cls, menuProps: props })
</script>
