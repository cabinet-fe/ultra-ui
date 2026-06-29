<template>
  <u-scroll tag="ul" :class="[cls.b, cls.m(size)]">
    <slot v-for="(item, index) of data" v-bind="{ item, index }" />
  </u-scroll>
</template>

<script lang="ts" setup>
import { useFallbackProps } from '@veltra/compositions'
import { bem } from '@veltra/utils'

import type { ListProps } from '../../types'
import type { ComponentSize } from '../../types'
import { UScroll } from '../scroll'

defineOptions({ name: 'UList' })

const props = withDefaults(defineProps<ListProps>(), {})

const { size } = useFallbackProps([props], { size: 'default' as ComponentSize })

const cls = bem('list')
</script>
