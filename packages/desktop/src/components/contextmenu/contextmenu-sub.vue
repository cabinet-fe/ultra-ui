<template>
  <li
    :class="[
      cls.e('item'),
      bem.is('disabled', disabled),
      bem.is('open', subVisible),
      bem.is('flip-x', flipX)
    ]"
    @mouseenter="handleMouseEnter"
    @mouseleave="scheduleClose"
  >
    <div :class="cls.e('item-content')">
      <template v-if="showIconColumn">
        <u-icon v-if="menu.icon">
          <component :is="menu.icon" />
        </u-icon>
        <i v-else :class="cls.e('icon-place')"></i>
      </template>

      <span :class="cls.e('label')">{{ menu.label }}</span>

      <u-icon v-if="showArrowColumn" :class="cls.e('arrow')">
        <ArrowRight />
      </u-icon>
      <i v-else :class="cls.e('arrow-place')"></i>
    </div>

    <UContextmenuPanel
      v-show="subVisible"
      :menus="menu.children!"
      :class="[cls.e('sub'), bem.is('flip-x', flipX)]"
      @mouseenter="cancelClose"
      @mouseleave="scheduleClose"
    />
  </li>
</template>

<script lang="ts" setup>
import { ArrowRight } from '@veltra/icons/normal'
import { bem } from '@veltra/utils'
import { computed, inject, nextTick, onBeforeUnmount, shallowRef } from 'vue'

import type { ContextmenuItem } from '../../types'
import { UIcon } from '../icon'
import UContextmenuPanel from './contextmenu-panel.vue'
import { ContextmenuPanelDIKey, ContextmenuRootDIKey } from './di'
import { getMenuDisabled } from './helper'

defineOptions({ name: 'UContextmenuSub' })

const { menu } = defineProps<{ menu: ContextmenuItem }>()

const { cls } = inject(ContextmenuRootDIKey)!
const { showIconColumn, showArrowColumn } = inject(ContextmenuPanelDIKey)!

const subVisible = shallowRef(false)
const flipX = shallowRef(false)

let closeTimer: ReturnType<typeof setTimeout> | undefined

const disabled = computed(() => getMenuDisabled(menu))

function cancelClose() {
  if (closeTimer !== undefined) {
    clearTimeout(closeTimer)
    closeTimer = undefined
  }
}

function scheduleClose() {
  cancelClose()
  closeTimer = setTimeout(() => {
    subVisible.value = false
  }, 250)
}

function handleMouseEnter(e: MouseEvent) {
  if (disabled.value) return
  cancelClose()
  subVisible.value = true
  nextTick(() => {
    const panel = (e.currentTarget as HTMLElement).querySelector<HTMLElement>(`.${cls.e('sub')}`)
    if (panel) flipX.value = panel.getBoundingClientRect().right > window.innerWidth
  })
}

onBeforeUnmount(cancelClose)
</script>
