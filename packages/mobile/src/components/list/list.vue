<template>
  <ul :class="[cls.b, cls.m(size)]">
    <slot v-for="(item, index) of data" v-bind="{ item, index }" />
  </ul>
</template>

<script lang="ts" setup>
import { computed } from 'vue'

import { bem } from '../../shared/bem'
import type { ListProps } from '../../types/list'

defineOptions({ name: 'UList' })

const props = withDefaults(defineProps<ListProps>(), {})

const cls = bem('list')

const size = computed(() => props.size ?? 'default')
</script>
