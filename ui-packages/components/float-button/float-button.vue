<template>
  <Teleport to="body">
    <div :class="cls.b" >
      <!-- 默认项 -->
      <div :class="[cls.e('item'),cls.e('default')]">
        <u-icon v-if="icon"> <component :is="icon" /> </u-icon>
      </div>

      <!-- 其他更多项 -->

      <div
        v-for="(item, index) of items"
        :class="cls.e('item')"
        :style="{
          backgroundColor: item.color,
          transform: `translate(0, -${index * 48 + 48}px)`,
          transitionDelay: index * 0.25 + 's'
        }"
      >
        <u-icon v-if="item.icon"> <component :is="icon" /> </u-icon>
        <span v-else>{{ index + 1 }}</span>
      </div>
    </div>
  </Teleport>
</template>

<script lang="ts" setup>
import type { FloatButtonProps } from '@ui/types/components/float-button'
import { bem } from '@ui/utils'
import { UIcon } from '../icon'

defineOptions({
  name: 'FloatButton'
})

defineProps<FloatButtonProps>()

const cls = bem('float-button')
</script>
