<template>
  <span :class="[cls.b, bem.is('block', block)]">
    <u-icon :size="size"> <Empty /> </u-icon>
    <div>{{ text }}</div>
  </span>
</template>

<script lang="ts" setup>
import { Empty } from '@veltra/icons/normal'
import { bem } from '@veltra/utils'

import type { EmptyProps } from '../../types'
import { UIcon } from '../icon'

defineOptions({ name: 'UEmpty' })

withDefaults(defineProps<EmptyProps>(), { size: 48, text: '暂无数据', block: false })

const cls = bem('empty')
</script>
