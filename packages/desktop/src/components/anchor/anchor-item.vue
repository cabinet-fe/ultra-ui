<template>
  <a
    :class="[cls.e('item'), bem.is('active', active)]"
    :href="href"
    :title="title"
    @click="handleClick"
  >
    <slot>{{ title }}</slot>
  </a>
</template>

<script lang="ts" setup>
import { bem } from '@veltra/utils'
import { computed, inject, onBeforeUnmount, onMounted } from 'vue'

import type { AnchorItemProps } from '../../types'
import { AnchorDIKey } from './di'

defineOptions({ name: 'UAnchorItem' })

const { href, title } = defineProps<AnchorItemProps>()

const cls = bem('anchor')

const context = inject(AnchorDIKey)

const active = computed(() => context?.current.value === href)

function handleClick(event: MouseEvent) {
  context?.click(href, event)
}

onMounted(() => context?.register(href))
onBeforeUnmount(() => context?.unregister(href))
</script>
