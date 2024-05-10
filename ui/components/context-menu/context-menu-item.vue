<template>
  <li :class="cls.e('item')" v-ripple="!disabled" @click="emit('click', menu)">
    <u-icon v-if="loading">
      <Loading />
    </u-icon>
    <template v-else>
      <u-icon v-if="menu.icon">
        <component :is="menu.icon" />
      </u-icon>
      <i v-else :class="cls.e('icon-place')"></i>
    </template>

    <span :class="cls.e('label')">{{ menu.label }}</span>
  </li>
</template>

<script lang="ts" setup>
import { computed, inject, shallowRef } from 'vue'
import { ContextMenuDIKey } from './di'
import type { ContextMenuItem } from '@ui/types/components/context-menu'
import { vRipple } from '@ui/directives'
import { UIcon } from '../icon'
import { Loading } from 'icon-ultra'

defineOptions({
  name: 'ContextMenuItem'
})

const { menu } = defineProps<{
  menu: ContextMenuItem
}>()

const emit = defineEmits<{
  (e: 'click', menu: ContextMenuItem): void
}>()

const { cls } = inject(ContextMenuDIKey)!

const loading = shallowRef(false)


const disabled = computed(() => {
  return typeof menu.disabled === 'function' ? menu.disabled() : menu.disabled
})
async function handleClickMenu   (menu: ContextMenuItem)  {
  if (disabled.value) return
  loading.value = true
  await menu.callback?.()
  loading.value = false
  close()
}
</script>
