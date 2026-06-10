<template>
  <li
    :class="[cls.e('item'), bem.is('disabled', disabled), bem.is('loading', loading)]"
    v-ripple="!disabled && !loading"
    @click="handleClickMenu"
  >
    <div :class="cls.e('item-content')">
      <template v-if="showIconColumn">
        <u-icon v-if="loading" :class="bem.is('loading')">
          <Loading />
        </u-icon>
        <u-icon v-else-if="menu.icon">
          <component :is="menu.icon" />
        </u-icon>
        <i v-else :class="cls.e('icon-place')"></i>
      </template>

      <span :class="cls.e('label')">{{ menu.label }}</span>

      <i v-if="showArrowColumn" :class="cls.e('arrow-place')"></i>
    </div>
  </li>
</template>

<script lang="ts" setup>
import { vRipple } from '@veltra/directives'
import { Loading } from '@veltra/icons/normal'
import { bem } from '@veltra/utils'
import { computed, inject, shallowRef } from 'vue'

import type { ContextmenuItem } from '../../types'
import { UIcon } from '../icon'
import { ContextmenuPanelDIKey, ContextmenuRootDIKey } from './di'
import { getMenuDisabled } from './helper'

defineOptions({ name: 'ContextmenuItem' })

const { menu } = defineProps<{ menu: ContextmenuItem }>()

const { cls, onItemClickStart, onItemClickEnd } = inject(ContextmenuRootDIKey)!
const { showIconColumn, showArrowColumn } = inject(ContextmenuPanelDIKey)!

const loading = shallowRef(false)
const disabled = computed(() => getMenuDisabled(menu))

function handleClickMenu() {
  if (disabled.value || loading.value) return
  onItemClickStart()
  loading.value = true

  const done = () => {
    onItemClickEnd()
    loading.value = false
  }

  const result = menu.callback?.()
  if (result instanceof Promise) {
    result.finally(done)
  } else {
    done()
  }
}
</script>
