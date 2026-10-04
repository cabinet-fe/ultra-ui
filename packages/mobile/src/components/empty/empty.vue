<template>
  <span :class="cls.b">
    <span :class="cls.e('icon')" :style="{ fontSize: withUnit(size, 'px') }">
      <Empty />
    </span>
    <div :class="cls.e('text')">{{ text }}</div>
  </span>
</template>

<script lang="ts" setup>
import { Empty } from '@veltra/icons/normal'
import { withUnit } from '@veltra/utils'

import { bem } from '../../shared/bem'
import type { EmptyProps } from '../../types/empty'

defineOptions({ name: 'UEmpty' })

const { size = 48, text = '暂无数据' } = defineProps<EmptyProps>()

const cls = bem('empty')
</script>
