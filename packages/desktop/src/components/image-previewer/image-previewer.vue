<template>
  <Teleport to="body" :disabled="!modal">
    <transition :name="modal ? 'u-image-previewer-fade' : ''">
      <div v-if="!modal || open" :class="[cls.b, bem.is('modal', modal)]">
        <div
          ref="stage"
          :class="[cls.e('stage'), bem.is('pannable', scale > 1), bem.is('dragging', isDragging)]"
          v-bind="attrs"
          @mousedown.self="onBackdropMousedown"
          @pointerdown="onPointerDown"
          @pointermove="onPointerMove"
          @pointerup="onPointerEnd"
          @pointercancel="onPointerEnd"
          @wheel="onWheel"
          @dblclick="onDblclick"
        >
          <img
            v-if="url"
            :src="url"
            :alt="alt ?? '图片预览'"
            draggable="false"
            @dragstart.prevent
            @load="loading = false"
            @error="onImgError"
          />
          <div v-if="loading" :class="cls.e('loading')">加载中…</div>
          <div v-else-if="failed" :class="cls.e('loading')">图片加载失败</div>
        </div>

        <template v-if="modal">
          <button
            :class="cls.e('close')"
            type="button"
            aria-label="关闭"
            title="关闭"
            @click="close"
          >
            <u-icon :size="18">
              <Close />
            </u-icon>
          </button>
          <div :class="cls.e('toolbar')">
            <button
              :class="cls.e('tool')"
              type="button"
              :disabled="scale <= ZOOM_MIN"
              aria-label="缩小"
              title="缩小"
              @click="zoomOut"
            >
              <u-icon :size="16">
                <ZoomOut />
              </u-icon>
            </button>
            <span :class="cls.e('zoom-value')">{{ zoomPercent }}</span>
            <button
              :class="cls.e('tool')"
              type="button"
              :disabled="scale >= ZOOM_MAX"
              aria-label="放大"
              title="放大"
              @click="zoomIn"
            >
              <u-icon :size="16">
                <ZoomIn />
              </u-icon>
            </button>
            <button
              :class="cls.e('tool')"
              type="button"
              :disabled="scale === 1"
              aria-label="重置视图"
              title="重置视图"
              @click="resetZoom"
            >
              <u-icon :size="16">
                <Refresh />
              </u-icon>
            </button>
          </div>
        </template>
      </div>
    </transition>
  </Teleport>
</template>

<script lang="ts" setup>
import { Close, Refresh, ZoomIn, ZoomOut } from '@veltra/icons/normal'
import { bem } from '@veltra/utils'
import { computed, onBeforeUnmount, ref, shallowRef, useAttrs, useTemplateRef, watch } from 'vue'

import type {
  ImagePreviewerEmits,
  ImagePreviewerExposed,
  ImagePreviewerProps
} from '../../types/image-previewer'
import { ZOOM_MAX, ZOOM_MIN, ZOOM_STEP, clampZoom, toBlobUrl } from '../file-viewer/helper'
import { UIcon } from '../icon'

// 根为 Teleport，无 fallthrough 落点：attrs（含宿主 class）由内层预览面承接
defineOptions({ name: 'UImagePreviewer', inheritAttrs: false })

const {
  src,
  alt,
  mime,
  modal = true,
  closeOnClickBackdrop = true,
  closeOnEsc = true
} = defineProps<ImagePreviewerProps>()

const emit = defineEmits<ImagePreviewerEmits>()

const cls = bem('image-previewer')
const attrs = useAttrs()

const stage = useTemplateRef<HTMLDivElement>('stage')

const open = defineModel<boolean>('open', { default: true })

const url = shallowRef<string>('')
const loading = ref(false)
const failed = ref(false)

/** 缩放级别；缩放入口统一经 setScale 收敛到 [ZOOM_MIN, ZOOM_MAX] */
const scale = ref(1)
/** 拖拽起止各写一次，仅驱动 grabbing 光标 */
const isDragging = ref(false)

const zoomPercent = computed(() => `${Math.round(scale.value * 100)}%`)

// ---- pan 热状态：全部走普通变量，pointermove 不触发重渲染 ----
let panState:
  | { pointerId: number; startX: number; startY: number; originX: number; originY: number }
  | undefined
let offsetX = 0
let offsetY = 0

/** transform 唯一写入口：直接写预览面 style，绕开响应式 */
function applyTransform() {
  const el = stage.value
  if (!el) return
  el.style.transform = `translate3d(${offsetX}px, ${offsetY}px, 0) scale(${scale.value})`
}

function setScale(value: number) {
  scale.value = clampZoom(value)
  if (scale.value <= 1) {
    // 未放大时不允许平移，offset 归零
    offsetX = 0
    offsetY = 0
  }
  applyTransform()
  emit('zoom-change', scale.value)
}

function zoomIn() {
  setScale(scale.value + ZOOM_STEP)
}

function zoomOut() {
  setScale(scale.value - ZOOM_STEP)
}

function resetZoom() {
  setScale(1)
}

defineExpose<ImagePreviewerExposed>({ zoomIn, zoomOut, resetZoom })

function onPointerDown(e: PointerEvent) {
  if (scale.value <= 1 || e.button !== 0) return
  panState = {
    pointerId: e.pointerId,
    startX: e.clientX,
    startY: e.clientY,
    originX: offsetX,
    originY: offsetY
  }
  isDragging.value = true
  stage.value?.setPointerCapture(e.pointerId)
  e.preventDefault()
}

function onPointerMove(e: PointerEvent) {
  if (!panState || panState.pointerId !== e.pointerId) return
  offsetX = panState.originX + e.clientX - panState.startX
  offsetY = panState.originY + e.clientY - panState.startY
  applyTransform()
}

function onPointerEnd(e: PointerEvent) {
  if (!panState || panState.pointerId !== e.pointerId) return
  const el = stage.value
  if (el?.hasPointerCapture(e.pointerId)) {
    el.releasePointerCapture(e.pointerId)
  }
  panState = undefined
  isDragging.value = false
}

function onWheel(e: WheelEvent) {
  if (!(e.ctrlKey || e.metaKey)) return
  e.preventDefault()
  setScale(scale.value + (e.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP))
}

function onDblclick() {
  if (scale.value === 1) {
    setScale(2)
  } else {
    resetZoom()
  }
}

function onBackdropMousedown() {
  if (!modal) return
  if (closeOnClickBackdrop === false) return
  // 放大后空白区域是平移热区，不作为关闭入口
  if (scale.value > 1) return
  close()
}

function close() {
  if (!modal) return
  open.value = false
  emit('close')
}

function handleWindowKeydown(e: KeyboardEvent) {
  if (e.key !== 'Escape') return
  if (!modal || !open.value) return
  if (closeOnEsc === false) return
  e.stopPropagation()
  close()
}

let revoke: (() => void) | undefined

function load() {
  if (src === undefined || src === null) {
    revoke?.()
    revoke = undefined
    url.value = ''
    loading.value = false
    failed.value = false
    return
  }
  loading.value = true
  failed.value = false
  revoke?.()
  const r = toBlobUrl(src, mime)
  url.value = r.url
  revoke = r.revoke
  // 新图回到初始视图，并同步工具栏回显
  setScale(1)
}

function onImgError(e: Event) {
  loading.value = false
  failed.value = true
  emit('error', e)
}

watch(
  () => src,
  () => load(),
  { immediate: true }
)

// lightbox 打开时：锁定 body 滚动 + 挂 Esc 监听
let previousBodyOverflow = ''
let isBodyLocked = false

function lockBody() {
  if (isBodyLocked || typeof document === 'undefined') return
  previousBodyOverflow = document.body.style.overflow
  document.body.style.overflow = 'hidden'
  isBodyLocked = true
}

function unlockBody() {
  if (!isBodyLocked || typeof document === 'undefined') return
  document.body.style.overflow = previousBodyOverflow
  isBodyLocked = false
}

watch(
  [() => modal, open],
  ([modalOpen, openNow], _, onCleanup) => {
    // 依赖重跑前与作用域销毁时统一解锁 + 摘除 keydown 监听
    onCleanup(() => {
      unlockBody()
      if (typeof window !== 'undefined') {
        window.removeEventListener('keydown', handleWindowKeydown, true)
      }
    })
    if (modalOpen && openNow) {
      lockBody()
      if (typeof window !== 'undefined') {
        window.addEventListener('keydown', handleWindowKeydown, true)
      }
    } else {
      unlockBody()
    }
  },
  { immediate: true }
)

onBeforeUnmount(() => {
  revoke?.()
  url.value = ''
})
</script>
