<template>
  <nav :class="[cls.b, cls.m(size)]" aria-label="Breadcrumb">
    <ol :class="cls.e('list')">
      <template v-for="(item, index) in props.items" :key="index">
        <li :class="cls.e('item')">
          <slot name="item" v-bind="{ item, index, isLast: index === props.items.length - 1 }">
            <a
              v-if="isAnchor(item, index)"
              :class="linkClass(item, index)"
              :href="item.href"
              :aria-disabled="item.disabled ? 'true' : undefined"
              :tabindex="item.disabled ? -1 : undefined"
              @click="handleAnchorClick($event, item, index)"
            >
              {{ item.title }}
            </a>
            <span
              v-else-if="isActionSpan(item, index)"
              :class="linkClass(item, index)"
              role="link"
              :tabindex="item.disabled ? -1 : 0"
              @click="handleSpanClick($event, item, index)"
              @keydown="handleSpanKeydown($event, item, index)"
            >
              {{ item.title }}
            </span>
            <span v-else :class="innerClass(true)" aria-current="page">{{ item.title }}</span>
          </slot>
        </li>
        <li v-if="index < props.items.length - 1" :class="cls.e('separator')" aria-hidden="true">
          <slot name="separator">/</slot>
        </li>
      </template>
    </ol>
  </nav>
</template>

<script lang="ts" setup>
import { useFallbackProps } from '@veltra/compositions'
import { bem } from '@veltra/utils'

import type {
  BreadcrumbEmits,
  BreadcrumbItem,
  BreadcrumbProps,
  BreadcrumbSlotScope,
  ComponentSize
} from '../../types'

defineOptions({ name: 'Breadcrumb' })

const props = withDefaults(defineProps<BreadcrumbProps>(), { lastLinked: false })

const emit = defineEmits<BreadcrumbEmits>()

defineSlots<{ item?: (scope: BreadcrumbSlotScope) => unknown; separator?: () => unknown }>()

const cls = bem('breadcrumb')

const { size } = useFallbackProps([props], { size: 'default' as ComponentSize })

const isLast = (index: number) => index === props.items.length - 1

const isLinked = (item: BreadcrumbItem, index: number) => {
  if (item.disabled) return false
  if (isLast(index)) return props.lastLinked
  return true
}

const isAnchor = (item: BreadcrumbItem, index: number) => isLinked(item, index) && !!item.href

const isActionSpan = (item: BreadcrumbItem, index: number) => isLinked(item, index) && !item.href

const innerClass = (current: boolean) => [cls.e('inner'), current && bem.is('current', current)]

const linkClass = (item: BreadcrumbItem, index: number) => [
  cls.e('inner'),
  cls.e('link'),
  bem.is('disabled', !!item.disabled),
  bem.is('current', isLast(index) && !props.lastLinked)
]

const handleAnchorClick = (ev: MouseEvent, item: BreadcrumbItem, index: number) => {
  if (item.disabled) {
    ev.preventDefault()
    ev.stopPropagation()
  }
}

const handleSpanClick = (ev: MouseEvent, item: BreadcrumbItem, index: number) => {
  if (item.disabled) {
    ev.preventDefault()
    return
  }
  emit('click', item, index, ev)
}

const handleSpanKeydown = (ev: KeyboardEvent, item: BreadcrumbItem, index: number) => {
  if (item.disabled) return
  if (ev.key !== 'Enter' && ev.key !== ' ') return
  ev.preventDefault()
  emit('click', item, index, ev)
}
</script>
