<template>
  <svg
    :class="cls.e('popup-preset-glyph')"
    viewBox="0 0 16 16"
    width="16"
    height="16"
    aria-hidden="true"
  >
    <!-- 田字格：外框 + 十字；高亮边用 currentColor，其余用 muted -->
    <line
      x1="2"
      y1="2"
      x2="14"
      y2="2"
      :stroke="stroke(edges.top)"
      stroke-width="1.5"
      stroke-linecap="square"
    />
    <line
      x1="2"
      y1="14"
      x2="14"
      y2="14"
      :stroke="stroke(edges.bottom)"
      stroke-width="1.5"
      stroke-linecap="square"
    />
    <line
      x1="2"
      y1="2"
      x2="2"
      y2="14"
      :stroke="stroke(edges.left)"
      stroke-width="1.5"
      stroke-linecap="square"
    />
    <line
      x1="14"
      y1="2"
      x2="14"
      y2="14"
      :stroke="stroke(edges.right)"
      stroke-width="1.5"
      stroke-linecap="square"
    />
    <line
      x1="2"
      y1="8"
      x2="14"
      y2="8"
      :stroke="stroke(edges.innerH)"
      stroke-width="1.5"
      stroke-linecap="square"
    />
    <line
      x1="8"
      y1="2"
      x2="8"
      y2="14"
      :stroke="stroke(edges.innerV)"
      stroke-width="1.5"
      stroke-linecap="square"
    />
  </svg>
</template>

<script lang="ts" setup>
import { bem } from '@veltra/utils'
import { computed } from 'vue'

import type { BorderPresetGlyph } from '../popup-helpers'

defineOptions({ name: 'USheetBorderPresetGlyph' })

/**
 * 边框预设田字格 glyph（包内联 SVG，不进 @veltra/icons）。
 * 3×3 网格（外框 + 十字），按 glyph 高亮对应边。
 */
const props = defineProps<{ glyph: BorderPresetGlyph }>()

const cls = bem('sheet')

/** 田字格各线段是否高亮 */
interface GlyphEdges {
  top: boolean
  bottom: boolean
  left: boolean
  right: boolean
  innerH: boolean
  innerV: boolean
}

const MUTED = 'var(--u-border-muted-color, #c0c4cc)'
const ACTIVE = 'currentColor'

function stroke(active: boolean): string {
  return active ? ACTIVE : MUTED
}

const edges = computed<GlyphEdges>(() => {
  const g = props.glyph
  return {
    top: g === 'outer' || g === 'all' || g === 'top',
    bottom: g === 'outer' || g === 'all' || g === 'bottom',
    left: g === 'outer' || g === 'all' || g === 'left',
    right: g === 'outer' || g === 'all' || g === 'right',
    innerH: g === 'inner' || g === 'all',
    innerV: g === 'inner' || g === 'all'
  }
})
</script>
