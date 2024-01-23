<template>
  <Teleport to="body">
    <div
      :class="cls.b"
      @mouseenter="handleMouseEnter"
      @mouseleave="handleMouseLeave"
      ref="floatButtonRef"
    >
      <!-- 默认项 -->
      <u-button
        :size="size"
        type="primary"
        circle
        :class="[cls.e('item'), bem.is('default')]"
      >
        <u-icon v-if="icon"> <component :is="icon" /> </u-icon>
      </u-button>

      <!-- 其他更多项 -->
      <u-button
        v-for="(item, index) of items"
        :key="item.key"
        :class="cls.e('item')"
        circle
        :size="size"
        type="primary"
        ref="itemsRef"
        :style="{
          backgroundColor: item.color,
          transitionDelay: index * 0.1 + 's'
        }"
        @transitionend="handleTransitionEnd(index, $event)"
        @click="emit('click', item.key)"
      >
        <u-icon v-if="item.icon"> <component :is="icon" /> </u-icon>
        <span v-else>{{ index + 1 }}</span>
      </u-button>
    </div>
  </Teleport>
</template>

<script lang="ts" setup>
import type {
  FloatButtonProps,
  FloatButtonEmits
} from '@ui/types/components/float-button'
import { bem } from '@ui/utils'
import { UIcon } from '../icon'
import { shallowRef } from 'vue'
import { UButton, type ButtonExposed } from '../button'

defineOptions({
  name: 'FloatButton'
})

defineProps<FloatButtonProps>()

const emit = defineEmits<FloatButtonEmits>()

const cls = bem('float-button')
const hoveredCls = bem.is('hovered')

const floatButtonRef = shallowRef<HTMLElement>()
const itemsRef = shallowRef<ButtonExposed[]>()

const hovered = shallowRef(false)

const handleMouseEnter = () => {
  hovered.value = true

  itemsRef.value?.forEach(item => {
    item.el!.style.display = 'flex'
  })

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      itemsRef.value?.forEach(item => {
        item.el!.classList.add(hoveredCls)
      })
    })
  })
}
const handleMouseLeave = () => {
  hovered.value = false
  itemsRef.value?.forEach(item => {
    item.el!.classList.remove(hoveredCls)
  })
}

/**
 * 动画结束回调
 * @param index 发生的元素索引
 * @param e 事件
 */
const handleTransitionEnd = (index: number, e: TransitionEvent) => {
  if (index !== 0 || hovered.value) return

  itemsRef.value?.forEach(item => {
    item.el!.style.display = ''
  })
}
</script>
