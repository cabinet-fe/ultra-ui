<template>
  <header :class="cls.e('stage-head')">
    <div :class="cls.e('stage-title')">
      <span v-if="file" :class="[cls.e('badge'), cls.em('badge', file.kind)]">
        {{ label(file.kind) }}
      </span>
      <span :class="cls.e('stage-copy')">
        <span :class="cls.e('stage-name')" :title="file?.name">
          {{ file?.name ?? '—' }}
        </span>
        <span v-if="file" :class="cls.e('stage-sub')">
          <span>{{ indexLabel }}</span>
          <span v-if="file.size">{{ formatBytes(file.size) }}</span>
        </span>
      </span>
    </div>
    <div :class="cls.e('stage-actions')">
      <span :class="cls.e('action-group')">
        <button
          :class="[cls.e('action'), cls.em('action', 'icon')]"
          :disabled="!hasPrev"
          type="button"
          aria-label="上一个"
          title="上一个"
          @click="emit('prev')"
        >
          <u-icon :size="15">
            <ArrowLeft />
          </u-icon>
        </button>
        <button
          :class="[cls.e('action'), cls.em('action', 'icon')]"
          :disabled="!hasNext"
          type="button"
          aria-label="下一个"
          title="下一个"
          @click="emit('next')"
        >
          <u-icon :size="15">
            <ArrowRight />
          </u-icon>
        </button>
      </span>
      <span v-if="zoomable" :class="cls.e('action-group')">
        <button
          :class="[cls.e('action'), cls.em('action', 'icon')]"
          :disabled="zoomOutDisabled"
          type="button"
          aria-label="缩小"
          title="缩小"
          @click="emit('zoom-out')"
        >
          <u-icon :size="15">
            <ZoomOut />
          </u-icon>
        </button>
        <span :class="cls.e('zoom-value')">{{ zoomPercent }}</span>
        <button
          :class="[cls.e('action'), cls.em('action', 'icon')]"
          :disabled="zoomInDisabled"
          type="button"
          aria-label="放大"
          title="放大"
          @click="emit('zoom-in')"
        >
          <u-icon :size="15">
            <ZoomIn />
          </u-icon>
        </button>
        <button
          :class="[cls.e('action'), cls.em('action', 'icon')]"
          :disabled="transformReset"
          type="button"
          aria-label="重置视图"
          title="重置视图"
          @click="emit('reset')"
        >
          <u-icon :size="15">
            <Refresh />
          </u-icon>
        </button>
      </span>
      <button
        v-if="downloadable && file"
        :class="[cls.e('action'), cls.em('action', 'primary'), cls.em('action', 'icon')]"
        type="button"
        aria-label="下载"
        title="下载"
        @click="emit('download')"
      >
        <u-icon :size="15">
          <Download />
        </u-icon>
      </button>
      <button
        v-if="modal"
        :class="[cls.e('action'), cls.em('action', 'icon')]"
        type="button"
        aria-label="关闭预览"
        title="关闭"
        @click="emit('close')"
      >
        <u-icon :size="16">
          <Close />
        </u-icon>
      </button>
    </div>
  </header>
</template>

<script lang="ts" setup>
import {
  ArrowLeft,
  ArrowRight,
  Close,
  Download,
  Refresh,
  ZoomIn,
  ZoomOut
} from '@veltra/icons/normal'
import { bem } from '@veltra/utils'

import type { FileViewerKind, FileViewerNormalizedItem } from '../../types/file-viewer'
import { UIcon } from '../icon'
import { FILE_VIEWER_KIND_LABEL, formatBytes } from './helper'

defineOptions({ name: 'UFileViewerToolbar' })

defineProps<{
  /** 当前激活文件；无激活文件时标题区显示占位 */
  file?: FileViewerNormalizedItem
  /** 「当前 / 总数」回显文案 */
  indexLabel: string
  hasPrev: boolean
  hasNext: boolean
  /** 当前文件是否支持缩放（决定缩放按钮组显隐） */
  zoomable: boolean
  zoomPercent: string
  zoomInDisabled: boolean
  zoomOutDisabled: boolean
  /** 视图是否处于初始状态（决定重置按钮禁用） */
  transformReset: boolean
  downloadable: boolean
  /** 模态模式（决定关闭按钮显隐） */
  modal: boolean
}>()

const emit = defineEmits<{
  (e: 'prev'): void
  (e: 'next'): void
  (e: 'zoom-in'): void
  (e: 'zoom-out'): void
  (e: 'reset'): void
  (e: 'download'): void
  (e: 'close'): void
}>()

const cls = bem('file-viewer')

function label(kind: FileViewerKind): string {
  return FILE_VIEWER_KIND_LABEL[kind]
}
</script>
