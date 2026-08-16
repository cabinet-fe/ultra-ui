<template>
  <canvas
    ref="canvasRef"
    :class="cls.b"
    :style="{ width: `${size}px`, height: `${size}px` }"
    aria-hidden="true"
  />
</template>

<script lang="ts" setup>
import { bem } from '@veltra/utils'
import { onBeforeUnmount, onMounted, useTemplateRef, watch } from 'vue'

import type { AiOrbProps } from '../../types/ai-orb'
import { createOrbRenderer, type AiOrbRenderer } from './orb-renderer'

defineOptions({ name: 'UAiOrb' })

const props = withDefaults(defineProps<AiOrbProps>(), { size: 48, status: 'idle' })

const cls = bem('ai-orb')

const canvasRef = useTemplateRef<HTMLCanvasElement>('canvasRef')

let renderer: AiOrbRenderer | null = null
let observer: IntersectionObserver | null = null
let motionQuery: MediaQueryList | null = null

/** 取主题主色作为球体基色（挂载时解析一次，失败时渲染器回退默认蓝） */
const resolveThemeColor = () => {
  const el = canvasRef.value
  if (!el) return undefined
  return getComputedStyle(el).getPropertyValue('--u-color-primary').trim() || undefined
}

const applyVisibility = (visible: boolean) => {
  if (!renderer) return
  if (motionQuery?.matches) {
    // 减少动态偏好：只画一帧静态画面，不启动画循环
    renderer.stop()
    renderer.renderOnce()
    return
  }
  if (visible) renderer.start()
  else renderer.stop()
}

const handleMotionChange = () => {
  // 偏好像素级开关变化时重评估（不可见时 start 也会被 IntersectionObserver 纠正）
  applyVisibility(true)
}

onMounted(() => {
  const canvas = canvasRef.value
  if (!canvas) return

  renderer = createOrbRenderer(canvas, {
    size: props.size,
    status: props.status,
    color: resolveThemeColor()
  })

  motionQuery = window.matchMedia?.('(prefers-reduced-motion: reduce)') ?? null
  motionQuery?.addEventListener?.('change', handleMotionChange)

  if (typeof IntersectionObserver !== 'undefined') {
    // 滚出视口的球暂停动画循环，长会话下同屏多个球也不累积开销
    observer = new IntersectionObserver((entries) => {
      applyVisibility(entries[0]?.isIntersecting ?? true)
    })
    observer.observe(canvas)
  } else {
    applyVisibility(true)
  }
})

watch(
  () => props.status,
  (status) => renderer?.setStatus(status)
)

watch(
  () => props.size,
  (size) => renderer?.resize(size)
)

onBeforeUnmount(() => {
  observer?.disconnect()
  motionQuery?.removeEventListener?.('change', handleMotionChange)
  renderer?.stop()
  renderer = null
})
</script>
