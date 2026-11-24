<template>
  <Teleport v-if="appendToBody" to="body">
    <div :class="cls.b" ref="watermark" :style="{ zIndex: zIndex() }"></div>
  </Teleport>

  <div v-else :class="cls.b" ref="watermark" :style="{ zIndex: zIndex() }">
    <slot />
  </div>
</template>

<script lang="ts" setup>
import './style'
import { debounce } from '@cat-kit/core'
import { bem, setStyles, zIndex } from '@veltra/utils'
import { onBeforeUnmount, onMounted, reactive, useTemplateRef } from 'vue'

import type { WatermarkProps, WatermarkEmits } from '../../types'

defineOptions({ name: 'UWatermark' })
const cls = bem('watermark')
const props = withDefaults(defineProps<WatermarkProps>(), { route: -30, fontSize: 60 })
defineEmits<WatermarkEmits>()

const watermarkRef = useTemplateRef('watermark')

const styles = reactive({ fontColor: 'rgba(0,0,0,.1)', fontFamily: 'Arial', image: props.image })

const setWatermark = debounce(async () => {
  const str = props.text
  const container = watermarkRef.value

  if (!container || !str) return

  let canvas: HTMLCanvasElement | null = document.createElement('canvas')

  let ctx = canvas.getContext('2d')!
  ctx.font = `${props.fontSize}px ${styles.fontFamily}`

  const textWidth = ctx.measureText(str).width
  canvas = document.createElement('canvas')
  canvas.width = textWidth
  canvas.height = textWidth
  ctx = canvas.getContext('2d')!
  ctx.font = `${props.fontSize}px ${styles.fontFamily}`
  ctx = canvas.getContext('2d')!
  ctx.fillStyle = styles.fontColor
  ctx.textAlign = 'left'
  ctx.textBaseline = 'top'

  ctx.translate(textWidth / 2, textWidth / 2)
  ctx.rotate((props.route * Math.PI) / 180)
  ctx.translate(-textWidth / 2, -textWidth / 2)
  ctx.fillText(str, 0, (textWidth - props.fontSize) / 2)

  setStyles(container, { background: `url(${canvas.toDataURL('image/png')}) repeat` })

  ctx.clearRect(0, 0, canvas.width, canvas.height)
  canvas = null
}, 150)

window.addEventListener('resize', setWatermark)

onBeforeUnmount(() => {
  window.removeEventListener('resize', setWatermark)
})

onMounted(() => {
  setWatermark()
})
</script>
