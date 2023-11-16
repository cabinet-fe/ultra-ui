<template>
  <div
    :class="cls.b"
    @mouseover.stop="handleMouseOver"
    @mouseleave.stop="handleMouseOut"
    @click="handleClick"

  >
    <slot />

    <div :class="cls.e('content')"  v-if="visible" :style="dynamicStyle">
      <slot name="content">
        {{ modelValue }}
      </slot>
    </div>
  </div>
</template>

<script lang="ts" setup>
import type { TipProps } from '@ui/types/components/tip'
import type { Undef } from '@ui/utils'
import type { Null } from '@ui/utils'
import { bem, zIndex } from '@ui/utils'
import { shallowReactive, watch, ref } from 'vue'



defineOptions({
  name: 'Tip'
})

const props = withDefaults(defineProps<TipProps>(), {
  modelValue: '提示内容',
  triggerPopUpMode: 'hover'
})

const cls = bem('tip')

let visible = ref(false)

let timeClick: Undef<number> = undefined

let timeMouseOut = null as any

let timeMouseOver = null as any

const handleMouseOver = () => {
  if (props.triggerPopUpMode !== 'hover') return
  clearTimeout(timeMouseOver)
  timeMouseOver = setTimeout(() => {
    visible.value = true
    clearTimeout(timeMouseOver)
  }, 300)
}

const handleMouseOut = () => {
  if (props.triggerPopUpMode !== 'hover') return
  clearTimeout(timeMouseOut)
  timeMouseOut = setTimeout(() => {
    visible.value = false
    clearTimeout(timeMouseOut)
  }, 300)
}

const handleClick = () => {
  if (props.triggerPopUpMode !== 'click') return

  clearTimeout(timeClick)
  timeClick = setTimeout(() => {
    visible.value = !visible.value
  }, 300)
}

/**弹出样式 */
const dynamicStyle = shallowReactive({
  // display: 'none',
  zIndex: zIndex(),
  left: undefined as string | undefined,
  top: undefined as string | undefined,
  right: undefined as string | undefined,
  bottom: undefined as string | undefined,
  transform: undefined as string | undefined,
  background: '#ddd',
  ...(props.customStyle || {})
})

/**监听提示框显示/隐藏 */

watch(visible, value => {
  if (value) {
    dynamicStyle.display = 'block'
  } else {
    dynamicStyle.display = 'none'
  }
})
</script>
