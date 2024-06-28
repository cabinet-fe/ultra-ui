<template>
  <u-scroll tag="ul" :class="[cls.b, cls.m(size)]">
    <slot v-for="(item, index) of data" v-bind="{ item, index }" />
  </u-scroll>
</template>

<script lang="ts" setup>
import type { ListProps } from '@ui/types/components/list'
import { bem } from '@ui/utils'
import { UScroll } from '../scroll'
import { useFallbackProps } from '@ui/compositions'
import type { ComponentSize } from '@ui/types'

defineOptions({
  name: 'List'
})

const props = withDefaults(defineProps<ListProps>(), {})

const { size } = useFallbackProps([props], {
  size: 'default' as ComponentSize
})

const cls = bem('list')
</script>
