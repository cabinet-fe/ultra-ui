<template>
  <div :class="cls.e('popup-row')">
    <span :class="cls.e('popup-label')">线型</span>
    <button
      v-for="line in BORDER_LINE_STYLES"
      :key="line"
      type="button"
      :class="[cls.e('popup-line'), bem.is('active', borderLineStyle === line)]"
      :title="BORDER_LINE_TITLES[line]"
      @click="borderLineStyle = line"
    >
      <span :class="cls.e('popup-line-swatch')" :style="lineSwatchStyle(line)" />
    </button>
  </div>
  <div :class="cls.e('popup-row')">
    <span :class="cls.e('popup-label')">颜色</span>
    <u-palette
      :model-value="borderColor"
      @update:model-value="(value) => (borderColor = value || borderColor)"
    />
  </div>
  <div :class="cls.e('popup-row')">
    <button
      v-for="preset in BORDER_PRESETS"
      :key="preset.id"
      type="button"
      :class="cls.e('popup-preset')"
      @click="applyBorderPreset(preset.id)"
    >
      {{ preset.title }}
    </button>
  </div>
</template>

<script lang="ts" setup>
import { UPalette } from '@veltra/desktop'
import { bem } from '@veltra/utils'
import { ref } from 'vue'

import type { BorderLineStyle } from '../../core/style/types'
import type { SheetContext } from '../../tools/context'
import {
  BORDER_LINE_STYLES,
  BORDER_LINE_TITLES,
  BORDER_PRESETS,
  buildBorderPresetItems,
  currentRange,
  lineSwatchStyle,
  type BorderPresetId
} from '../popup-helpers'

defineOptions({ name: 'USheetBorderPopup' })

/**
 * 边框面板（全边框 / 外边框 / 下边框 / 无边框预设 + 线型 / 颜色子选项）。
 * 预设按包围盒边缘逐格表达（与 Excel 视觉一致）；面板打开期间的写入由
 * use-tool-popup 事务包裹为一个 undo 单元。
 */
const props = defineProps<{
  /** 工具上下文（写入走命令系统，天然可撤销） */
  context: SheetContext
}>()

const cls = bem('sheet')

/** 当前线型 / 颜色 */
const borderLineStyle = ref<BorderLineStyle>('thin')
const borderColor = ref('#000000')

/** 应用边框预设：一次 executeCommand（items 批量）= 一个 undo 单元 */
function applyBorderPreset(preset: BorderPresetId): void {
  const range = currentRange(props.context)
  if (!range) return
  const items = buildBorderPresetItems(range, preset, borderLineStyle.value, borderColor.value)
  if (items.length === 0) return
  props.context.executeCommand('sheet.command.set-cell-style', { items })
}
</script>
