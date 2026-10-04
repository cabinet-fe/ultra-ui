<template>
  <nav :class="cls.b">
    <slot></slot>
  </nav>
</template>

<script lang="ts" setup>
import { bem } from '@veltra/utils'
import { computed, provide, shallowRef } from 'vue'

import type { AnchorEmits, AnchorProps } from '../../types'
import { AnchorDIKey } from './di'
import { useAnchor } from './use-anchor'

defineOptions({ name: 'UAnchor' })

const { container, offset = 0 } = defineProps<AnchorProps>()

const emit = defineEmits<AnchorEmits>()

/** 受控高亮锚点 */
const current = defineModel<string>('current')

const cls = bem('anchor')

/** 已注册锚点（保持锚点项出现顺序） */
const hrefs = shallowRef<string[]>([])

function register(href: string) {
  hrefs.value = [...hrefs.value, href]
}

function unregister(href: string) {
  hrefs.value = hrefs.value.filter((item) => item !== href)
}

function handleChange(href: string) {
  if (current.value === href) return
  current.value = href
  emit('change', href)
}

const { scrollTo } = useAnchor({
  items: hrefs,
  container: () => container,
  offset: () => offset,
  onChange: handleChange
})

function handleClick(href: string, event: MouseEvent) {
  event.preventDefault()
  scrollTo(href)
  handleChange(href)
  emit('click-item', href, event)
}

provide(AnchorDIKey, {
  current: computed(() => current.value),
  click: handleClick,
  register,
  unregister
})
</script>
