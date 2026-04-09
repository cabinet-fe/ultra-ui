<template>
  <u-scroll tag="ul" :class="[cls.b, cls.m(size)]">
    <slot v-for="(item, index) of data" v-bind="{ item, index }" />
  </u-scroll>
</template>

<script lang="ts" setup>
import type { ListProps } from '../../types'
import { bem } from '@ultra-ui/utils'
import { UScroll } from '../scroll'
import { useFallbackProps } from '@ultra-ui/compositions'
import type { ComponentSize } from '../../types'

defineOptions({
  name: 'List'
})

const props = withDefaults(defineProps<ListProps>(), {})

const { size } = useFallbackProps([props], {
  size: 'default' as ComponentSize
})

const cls = bem('list')
</script>
