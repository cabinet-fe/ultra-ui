<script setup lang="ts">
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

const rootRef = ref<HTMLElement | null>(null)

function buildIconCode(): string {
  return `import { ${props.item.pascal} } from '@veltra/icons/${props.activeSet}'\n\n<${props.item.pascal} />`
}

function getSvgMarkup(): string | null {
  const svg = rootRef.value?.querySelector('svg')
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
    /* clipboard unavailable */
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
  <li class="icons-demo__cell-wrap">
    <div ref="rootRef" class="icons-demo__cell">
      <button type="button" class="icons-demo__cell-main" @click="copyIconCode">
        <span class="icons-demo__glyph">
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
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
            <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
          </svg>
        </button>
        <button
          type="button"
          class="icons-demo__action"
          title="下载 SVG"
          aria-label="下载 SVG"
          @click.stop="downloadSvg"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" x2="12" y1="15" y2="3" />
          </svg>
        </button>
      </div>
    </div>
  </li>
</template>

<style scoped>
.icons-demo__cell-wrap {
  margin: 0;
}

.icons-demo__cell {
  position: relative;
  width: 100%;
  border: 1px solid #e5e5e5;
  border-radius: 12px;
  background: #fff;
  transition:
    border-color 0.15s ease,
    box-shadow 0.15s ease,
    transform 0.12s ease;
}

.icons-demo__cell:hover,
.icons-demo__cell:focus-within {
  border-color: #d4d4d4;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.06);
  transform: translateY(-1px);
}

.icons-demo__cell-main {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.45rem;
  padding: 0.6rem 0.4rem 0.45rem;
  border: none;
  background: transparent;
  cursor: pointer;
  font-family: inherit;
  color: inherit;
}

.icons-demo__cell-main:active {
  transform: translateY(0);
}

.icons-demo__actions {
  display: flex;
  justify-content: center;
  gap: 0.25rem;
  padding: 0 0.35rem 0.4rem;
  opacity: 0;
  transform: translateY(2px);
  transition:
    opacity 0.15s ease,
    transform 0.15s ease;
}

.icons-demo__cell:hover .icons-demo__actions,
.icons-demo__cell:focus-within .icons-demo__actions {
  opacity: 1;
  transform: translateY(0);
}

.icons-demo__action {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.625rem;
  height: 1.625rem;
  padding: 0;
  border: 1px solid #e5e5e5;
  border-radius: 6px;
  background: #fafafa;
  color: #525252;
  cursor: pointer;
  transition:
    background 0.12s ease,
    color 0.12s ease,
    border-color 0.12s ease;
}

.icons-demo__action:hover {
  background: #171717;
  border-color: #171717;
  color: #fafafa;
}

.icons-demo__glyph {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.125rem;
  height: 2.125rem;
  color: #171717;
}

.icons-demo__svg {
  display: block;
  font-size: 30px;
}

.icons-demo__name {
  font-size: 0.6875rem;
  line-height: 1.3;
  color: #737373;
  text-align: center;
  word-break: break-all;
  max-width: 100%;
  font-variant-ligatures: none;
}
</style>
