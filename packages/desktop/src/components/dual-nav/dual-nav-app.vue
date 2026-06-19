<template>
  <u-tip direction="right" hide-arrow>
    <button
      type="button"
      :class="[cls.e('app'), bem.is('active', active), bem.is('disabled', app.disabled ?? false)]"
      :disabled="app.disabled"
      @click="emit('click')"
    >
      <UNavIcon v-if="app.icon" :icon="app.icon" :class="cls.e('app-icon')" />
      <span v-else :class="cls.e('app-fallback')">{{ app.title[0] }}</span>
    </button>

    <template #content>
      {{ app.title }}
    </template>
  </u-tip>
</template>

<script setup lang="ts">
import { bem } from '@veltra/utils'

import type { NavItem } from '../../types'
import UNavIcon from '../nav/nav-icon.vue'
import { UTip } from '../tip'

defineOptions({ name: 'DualNavApp' })

const cls = bem('dual-nav')

defineProps<{ app: NavItem; active: boolean }>()

const emit = defineEmits<{ click: [] }>()
</script>
