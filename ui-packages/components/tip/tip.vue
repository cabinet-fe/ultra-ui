<template>
  <div
    :class="cls.b"
    @mouseover.stop="handleMouseOver"
    @mouseleave.stop="handleMouseOut"
    @click="handleClick"
  >
    <slot />
  </div>
  <div class="u-tip-content" :style="dynamicStyle">
    {{ modelValue }}
  </div>
</template>

<script lang="ts" setup>
import type {TipProps} from "@ui/types/components/tip"
import {bem} from "@ui/utils"
import {shallowReactive, watch, ref} from "vue"

defineOptions({
  name: "Tip",
})

const props = withDefaults(defineProps<TipProps>(), {
  modelValue: "提示内容",
  customStyle: undefined,
  triggerPopUpMode: "hover",
})

let visible = ref(false)

let timeClick = null as any

let timeMouseOut = null as any

let timeMouseOver = null as any

const handleMouseOver = () => {
  if (props.triggerPopUpMode !== "hover") return
  clearTimeout(timeMouseOver)
  timeMouseOver = setTimeout(() => {
    visible.value = true
    clearTimeout(timeMouseOver)
  }, 300)
}

const handleMouseOut = () => {
  if (props.triggerPopUpMode !== "hover") return
  clearTimeout(timeMouseOut)
  timeMouseOut = setTimeout(() => {
    visible.value = false
    clearTimeout(timeMouseOut)
  }, 300)
}

const handleClick = () => {
  if (props.triggerPopUpMode !== "click") return

  timeClick = setTimeout(() => {
    visible.value = !visible.value
    clearTimeout(timeClick)
  }, 300)
}

/**弹出样式 */
const dynamicStyle = shallowReactive({
  display: "none",
  left: undefined as string | undefined,
  top: undefined as string | undefined,
  right: undefined as string | undefined,
  bottom: undefined as string | undefined,
  transform: undefined as string | undefined,
  background: "#ddd",
  ...(props.customStyle || {}),
})

const cls = bem("tip")

/**监听提示框显示/隐藏 */

watch(visible, (value) => {
  if (value) {
    dynamicStyle.display = "block"
  } else {
    dynamicStyle.display = "none"
  }
})
</script>
