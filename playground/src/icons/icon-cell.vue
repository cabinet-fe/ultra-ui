<script setup lang="ts">
import { UIcon } from '@veltra/desktop'
import { Copy, Download } from '@veltra/icons/normal'
import { ref } from 'vue'
import type { Component } from 'vue'

export interface IconItem {
  pascal: string
  kebab: string
  component: Component
}

export type IconSetKey = 'normal' | 'colorful'

const props = defineProps<{ item: IconItem; activeSet: IconSetKey }>()

const emit = defineEmits<{ toast: [message: string, detail?: string] }>()

const glyphRef = ref<HTMLElement | null>(null)

function buildIconCode(): string {
  return `import { ${props.item.pascal} } from '@veltra/icons/${props.activeSet}'\n\n<${props.item.pascal} />`
}

function getSvgMarkup(): string | null {
  const svg = glyphRef.value?.querySelector('svg')
  if (!svg) return null

  const clone = svg.cloneNode(true) as SVGSVGElement
  if (!clone.getAttribute('xmlns')) {
    clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg')
  }
  return new XMLSerializer().serializeToString(clone)
}

async function copyIconCode() {
  try {
    const code = buildIconCode()
    await navigator.clipboard.writeText(code)
    emit('toast', '已复制组件代码', code)
  } catch {
    emit('toast', '复制失败，请检查浏览器的剪贴板权限')
  }
}

function downloadSvg() {
  const markup = getSvgMarkup()
  if (!markup) return

  const blob = new Blob([markup], { type: 'image/svg+xml;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${props.item.kebab}.svg`
  link.click()
  URL.revokeObjectURL(url)
  emit('toast', `已下载 ${props.item.kebab}.svg`)
}
</script>

<template>
  <li class="icons-demo__cell">
    <button type="button" class="icons-demo__cell-main" @click="copyIconCode">
      <span ref="glyphRef" class="icons-demo__glyph">
        <component :is="item.component" class="icons-demo__svg" />
      </span>
      <span class="icons-demo__name">{{ item.kebab }}</span>
    </button>

    <div class="icons-demo__actions">
      <button
        type="button"
        class="icons-demo__action"
        title="复制组件代码"
        aria-label="复制组件代码"
        @click.stop="copyIconCode"
      >
        <u-icon :size="14"><Copy /></u-icon>
      </button>
      <button
        type="button"
        class="icons-demo__action"
        title="下载 SVG"
        aria-label="下载 SVG"
        @click.stop="downloadSvg"
      >
        <u-icon :size="14"><Download /></u-icon>
      </button>
    </div>
  </li>
</template>

<style scoped>
.icons-demo__cell {
  position: relative;
  border: 1px solid var(--u-border-color);
  border-radius: var(--u-radius-small);
  transition:
    background-color var(--u-transition-fast) var(--u-transition-ease),
    border-color var(--u-transition-fast) var(--u-transition-ease);
}

.icons-demo__cell:hover,
.icons-demo__cell:focus-within {
  border-color: var(--u-border-muted-color);
  background: var(--u-bg-color-hover);
}

.icons-demo__cell-main {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  width: 100%;
  padding: 12px 8px;
  border: none;
  background: none;
  color: inherit;
  font-family: inherit;
  cursor: pointer;
}

.icons-demo__glyph {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 28px;
  color: var(--u-text-color-title);
}

.icons-demo__svg {
  display: block;
  width: 28px;
  height: 28px;
}

.icons-demo__name {
  max-width: 100%;
  font-size: 12px;
  line-height: 1.3;
  color: var(--u-text-color-second);
  text-align: center;
  /* 优先在连字符处断行，放不下才断词 */
  overflow-wrap: anywhere;
  font-variant-ligatures: none;
}

/* 悬停操作浮在右上角，不占格子高度；隐藏期间不拦截点击 */
.icons-demo__actions {
  position: absolute;
  top: 5px;
  right: 5px;
  display: flex;
  gap: 2px;
  opacity: 0;
  pointer-events: none;
  transition: opacity var(--u-transition-fast) var(--u-transition-ease);
}

.icons-demo__cell:hover .icons-demo__actions,
.icons-demo__cell:focus-within .icons-demo__actions {
  opacity: 1;
  pointer-events: auto;
}

/* 触屏没有悬停，操作常显 */
@media (hover: none) {
  .icons-demo__actions {
    opacity: 1;
    pointer-events: auto;
  }
}

.icons-demo__action {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  padding: 0;
  border: 1px solid var(--u-border-color);
  border-radius: var(--u-radius-small);
  background: var(--u-bg-color-top);
  color: var(--u-text-color-second);
  cursor: pointer;
  transition:
    border-color var(--u-transition-fast) var(--u-transition-ease),
    color var(--u-transition-fast) var(--u-transition-ease);
}

.icons-demo__action:hover {
  border-color: var(--u-color-primary);
  color: var(--u-color-primary);
}
</style>
