<template>
  <li
    :class="[
      cls.e('item'),
      bem.is('disabled', disabled),
      bem.is('loading', loading),
      cls.em('item', 'menu')
    ]"
    v-ripple="!disabled && !loading"
    @click="handleClickMenu"
  >
    <u-icon v-if="loading" :class="bem.is('loading')">
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
import { bem } from '@ui/utils'

defineOptions({
  name: 'ContextMenuItem'
})

const { menu } = defineProps<{
  menu: ContextMenuItem
}>()

const emit = defineEmits<{
  (e: 'click-start'): void
  (e: 'click-end'): void
}>()

const { cls } = inject(ContextMenuDIKey)!

const loading = shallowRef(false)

const disabled = computed(() => {
  return (
    (typeof menu.disabled === 'function' ? menu.disabled() : menu.disabled) ??
    false
  )
})

function handleClickMenu() {
  if (disabled.value || loading.value) return
  emit('click-start')
  loading.value = true
  const result = menu.callback?.()

  if (result instanceof Promise) {
    return result
      .then(() => {})
      .finally(() => {
        emit('click-end')
        loading.value = false
      })
  }
  loading.value = false
  emit('click-end')
}
</script>
