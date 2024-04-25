<template>
  <Teleport to="body">
    <div
      :class="cls.b"
      @mouseenter="handleMouseEnter"
      @mouseleave="handleMouseLeave"
      ref="floatButtonRef"
    >
      <u-button
        v-for="(item, index) of items"
        :key="item.key"
        :class="[cls.e('item'), bem.is('first', index === 0)]"
        circle
        :size="size"
        :type="item.type ?? 'primary'"
        ref="itemsRef"
        :style="{
          transitionDelay: index * 0.1 + 's'
        }"
        @transitionend="handleTransitionEnd(index, $event)"
        @click="emit('click', item.key)"
        :title="item.name ?? item.key"
      >
        <u-icon v-if="item.icon"> <component :is="item.icon" /> </u-icon>
        <span v-else>{{ item.name?.[0] ?? item.key[0] }}</span>
      </u-button>
    </div>
  </Teleport>
</template>

<script lang="ts" setup>
import type {
  FloatButtonProps,
  FloatButtonEmits
} from '@ui/types/components/float-button'
import { bem, removeStyles, setStyles } from '@ui/utils'
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
    setStyles(item.el!, { display: 'flex' })
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
  if (index !== 1 || hovered.value) return

  itemsRef.value?.forEach(item => {
    removeStyles(item.el!, ['display'])
  })
}
</script>
