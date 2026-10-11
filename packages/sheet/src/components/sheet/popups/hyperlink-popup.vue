<template>
  <Teleport to="body">
    <div
      :class="cls.e('link-dialog-mask')"
      :style="{ zIndex: maskZIndex }"
      @mousedown.self="handleCancel"
    >
      <div :class="cls.e('link-dialog')" role="dialog" aria-modal="true">
        <div :class="cls.e('link-dialog-title')">{{ title }}</div>
        <div :class="cls.e('link-dialog-body')">
          <div :class="cls.e('popup-row')">
            <label :class="cls.e('popup-label')" :for="urlId">地址</label>
            <u-input
              :id="urlId"
              v-model="url"
              :class="cls.e('link-dialog-input')"
              placeholder="https://example.com"
              size="small"
              @keydown.enter="handleConfirm"
            />
          </div>
          <div v-if="mode === 'cell'" :class="cls.e('popup-row')">
            <label :class="cls.e('popup-label')" :for="textId">显示文本</label>
            <u-input
              :id="textId"
              v-model="text"
              :class="cls.e('link-dialog-input')"
              placeholder="留空沿用单元格内容"
              size="small"
              @keydown.enter="handleConfirm"
            />
          </div>
        </div>
        <div :class="cls.e('link-dialog-footer')">
          <u-button size="small" @click="handleCancel">取消</u-button>
          <u-button size="small" type="primary" @click="handleConfirm">确定</u-button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script lang="ts" setup>
import { UButton, UInput, message } from '@veltra/desktop'
import { bem, zIndex } from '@veltra/utils'
import { computed, onBeforeUnmount, onMounted, ref, useId } from 'vue'

import type { HyperlinkConfirmPayload, HyperlinkPopupMode } from '../popup-helpers'

defineOptions({ name: 'USheetHyperlinkPopup' })

/**
 * 超链接配置弹窗（右键菜单拉起，无工具栏锚点——不走 UDropdown 工具面板链路，
 * 自绘遮罩 + 居中面板，对齐 loading-mask 自绘先例）：
 * - 地址必填：空提交拦截并 message.error，弹窗不关
 * - 显示文本可留空：留空不写入 text（单元格沿用自身内容作为显示）
 * - mode="cell" 两字段；mode="image" 仅地址（图片超链接复用，写入目标由宿主收口）
 * - 确认仅 emit confirm；关闭（取消/Esc/遮罩点击）emit close，均由宿主收口
 */
const props = defineProps<{
  mode: HyperlinkPopupMode
  /** 编辑回填的原链接载荷（插入时缺省） */
  initial?: { url: string; text?: string }
}>()

const emit = defineEmits<{ confirm: [payload: HyperlinkConfirmPayload]; close: [] }>()

const cls = bem('sheet')

/** 字段输入 id（useId：多实例同开不撞固定 id） */
const urlId = useId()
const textId = useId()

const url = ref(props.initial?.url ?? '')
const text = ref(props.initial?.text ?? '')

/** 遮罩层级：挂载时取全局递增 z-index（与 desktop 弹层互不压盖） */
const maskZIndex = zIndex()

const title = computed(() => {
  if (props.mode === 'image') return '设置图片超链接'
  return props.initial ? '编辑超链接' : '插入超链接'
})

function handleConfirm(): void {
  const nextUrl = url.value.trim()
  if (!nextUrl) {
    message.error('请输入链接地址')
    return
  }
  const nextText = text.value.trim()
  // 显示文本留空不写入（不含 text 字段 → 单元格沿用自身内容显示）
  emit('confirm', nextText ? { url: nextUrl, text: nextText } : { url: nextUrl })
}

function handleCancel(): void {
  emit('close')
}

/** Esc 关闭（window 级监听：弹窗内输入框未聚焦时同样生效） */
function onKeydown(event: KeyboardEvent): void {
  if (event.key === 'Escape') handleCancel()
}

onMounted(() => {
  window.addEventListener('keydown', onKeydown)
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKeydown)
})
</script>
