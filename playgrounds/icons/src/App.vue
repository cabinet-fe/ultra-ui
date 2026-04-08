<script setup lang="ts">
import { computed, ref, shallowRef, watch } from 'vue'
import type { Component } from 'vue'

import * as ColorfulIcons from '@ultra-ui/icons/colorful'
import * as NormalIcons from '@ultra-ui/icons/normal'

type SetKey = 'normal' | 'colorful'

interface IconItem {
  pascal: string
  kebab: string
  component: Component
}

function pascalToKebab(name: string): string {
  return name
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/([A-Z])([A-Z][a-z])/g, '$1-$2')
    .toLowerCase()
}

function collectIcons(ns: Record<string, unknown>): IconItem[] {
  const out: IconItem[] = []
  for (const [key, value] of Object.entries(ns)) {
    if (key === 'default' || key.startsWith('_')) continue
    if (typeof value !== 'object' || value === null) continue
    out.push({ pascal: key, kebab: pascalToKebab(key), component: value as Component })
  }
  out.sort((a, b) => a.kebab.localeCompare(b.kebab))
  return out
}

const sets: Record<SetKey, IconItem[]> = {
  normal: collectIcons(NormalIcons as Record<string, unknown>),
  colorful: collectIcons(ColorfulIcons as Record<string, unknown>)
}

const activeSet = ref<SetKey>('normal')
const query = ref('')
const copiedLine = shallowRef('')

let copyTimer: ReturnType<typeof setTimeout> | undefined

const filtered = computed(() => {
  const q = query.value.trim().toLowerCase()
  const list = sets[activeSet.value]
  if (!q) return list
  return list.filter(
    i => i.kebab.includes(q) || i.pascal.toLowerCase().includes(q)
  )
})

watch(activeSet, () => {
  query.value = ''
})

async function copyImport(item: IconItem) {
  const line = `import { ${item.pascal} } from '@ultra-ui/icons/${activeSet.value}'`
  try {
    await navigator.clipboard.writeText(line)
    copiedLine.value = line
    if (copyTimer) clearTimeout(copyTimer)
    copyTimer = setTimeout(() => {
      copiedLine.value = ''
    }, 2200)
  } catch {
    copiedLine.value = ''
  }
}
</script>

<template>
  <div class="icons-app">
    <header class="icons-app__header">
      <div class="icons-app__header-inner">
        <div class="icons-app__brand">
          <h1 class="icons-app__title">Ultra Icons</h1>
          <p class="icons-app__subtitle">
            来自 <code>@ultra-ui/icons</code> 的 Vue 图标组件，点击卡片复制 import 语句。
          </p>
        </div>
        <div class="icons-app__tabs" role="tablist">
          <button
            type="button"
            role="tab"
            :aria-selected="activeSet === 'normal'"
            class="icons-app__tab"
            :class="{ 'icons-app__tab--active': activeSet === 'normal' }"
            @click="activeSet = 'normal'"
          >
            Normal
          </button>
          <button
            type="button"
            role="tab"
            :aria-selected="activeSet === 'colorful'"
            class="icons-app__tab"
            :class="{ 'icons-app__tab--active': activeSet === 'colorful' }"
            @click="activeSet = 'colorful'"
          >
            Colorful
          </button>
        </div>
      </div>
    </header>

    <div class="icons-app__toolbar">
      <div class="icons-app__search-wrap">
        <span class="icons-app__search-icon" aria-hidden="true">
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
          </svg>
        </span>
        <input
          v-model="query"
          class="icons-app__search"
          type="search"
          placeholder="Search icons..."
          autocomplete="off"
          spellcheck="false"
          aria-label="搜索图标"
        />
      </div>
      <p class="icons-app__count">{{ filtered.length }} icons</p>
    </div>

    <main class="icons-app__main">
      <div v-if="filtered.length === 0" class="icons-app__empty">没有匹配的图标</div>
      <ul v-else class="icons-app__grid">
        <li v-for="item in filtered" :key="item.kebab" class="icons-app__cell-wrap">
          <button
            type="button"
            class="icons-app__cell"
            :title="`复制 ${item.pascal}`"
            @click="copyImport(item)"
          >
            <span class="icons-app__glyph">
              <component :is="item.component" class="icons-app__svg" />
            </span>
            <span class="icons-app__name">{{ item.kebab }}</span>
          </button>
        </li>
      </ul>
    </main>

    <Transition name="icons-app-toast">
      <div v-if="copiedLine" class="icons-app__toast" role="status">
        已复制
        <code class="icons-app__toast-code">{{ copiedLine }}</code>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.icons-app {
  min-height: 100vh;
  background: #fafafa;
  color: #171717;
  font-family:
    'Inter',
    ui-sans-serif,
    system-ui,
    -apple-system,
    'Segoe UI',
    Roboto,
    sans-serif;
  font-size: 15px;
  line-height: 1.5;
}

.icons-app__header {
  position: sticky;
  top: 0;
  z-index: 10;
  border-bottom: 1px solid #e5e5e5;
  background: rgba(250, 250, 250, 0.85);
  backdrop-filter: blur(10px);
}

.icons-app__header-inner {
  max-width: 72rem;
  margin: 0 auto;
  padding: 1.25rem 1.5rem 1rem;
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  justify-content: space-between;
  gap: 1rem;
}

.icons-app__title {
  margin: 0;
  font-size: 1.375rem;
  font-weight: 600;
  letter-spacing: -0.02em;
}

.icons-app__subtitle {
  margin: 0.35rem 0 0;
  font-size: 0.875rem;
  color: #737373;
  max-width: 36rem;
}

.icons-app__subtitle code {
  font-size: 0.8125rem;
  padding: 0.1em 0.35em;
  border-radius: 4px;
  background: #f0f0f0;
  color: #404040;
}

.icons-app__tabs {
  display: inline-flex;
  padding: 3px;
  border-radius: 10px;
  background: #ececec;
  gap: 2px;
}

.icons-app__tab {
  border: none;
  margin: 0;
  padding: 0.45rem 1rem;
  font-size: 0.8125rem;
  font-weight: 500;
  font-family: inherit;
  border-radius: 8px;
  background: transparent;
  color: #525252;
  cursor: pointer;
  transition:
    background 0.15s ease,
    color 0.15s ease;
}

.icons-app__tab:hover {
  color: #171717;
}

.icons-app__tab--active {
  background: #fff;
  color: #171717;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.06);
}

.icons-app__toolbar {
  max-width: 72rem;
  margin: 0 auto;
  padding: 1rem 1.5rem 0.75rem;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 1rem;
}

.icons-app__search-wrap {
  position: relative;
  flex: 1;
  min-width: min(100%, 280px);
  max-width: 420px;
}

.icons-app__search-icon {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: #a3a3a3;
  display: flex;
  pointer-events: none;
}

.icons-app__search {
  width: 100%;
  box-sizing: border-box;
  padding: 0.55rem 0.85rem 0.55rem 2.5rem;
  font-size: 0.875rem;
  font-family: inherit;
  border: 1px solid #e5e5e5;
  border-radius: 10px;
  background: #fff;
  color: #171717;
  outline: none;
  transition:
    border-color 0.15s ease,
    box-shadow 0.15s ease;
}

.icons-app__search::placeholder {
  color: #a3a3a3;
}

.icons-app__search:hover {
  border-color: #d4d4d4;
}

.icons-app__search:focus {
  border-color: #171717;
  box-shadow: 0 0 0 3px rgba(23, 23, 23, 0.08);
}

.icons-app__count {
  margin: 0;
  font-size: 0.8125rem;
  color: #737373;
}

.icons-app__main {
  max-width: 72rem;
  margin: 0 auto;
  padding: 0.5rem 1.5rem 3rem;
}

.icons-app__empty {
  text-align: center;
  padding: 3rem 1rem;
  color: #737373;
  font-size: 0.9375rem;
}

.icons-app__grid {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(6.75rem, 1fr));
  gap: 0.5rem;
}

.icons-app__cell-wrap {
  margin: 0;
}

.icons-app__cell {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.45rem;
  padding: 0.6rem 0.4rem;
  border: 1px solid #e5e5e5;
  border-radius: 12px;
  background: #fff;
  cursor: pointer;
  font-family: inherit;
  color: inherit;
  transition:
    border-color 0.15s ease,
    box-shadow 0.15s ease,
    transform 0.12s ease;
}

.icons-app__cell:hover {
  border-color: #d4d4d4;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.06);
  transform: translateY(-1px);
}

.icons-app__cell:active {
  transform: translateY(0);
}

.icons-app__glyph {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.125rem;
  height: 2.125rem;
  color: #171717;
}

.icons-app__svg {
  display: block;
  font-size: 30px;
}

.icons-app__name {
  font-size: 0.6875rem;
  line-height: 1.3;
  color: #737373;
  text-align: center;
  word-break: break-all;
  max-width: 100%;
  font-variant-ligatures: none;
}

.icons-app__toast {
  position: fixed;
  bottom: 1.5rem;
  left: 50%;
  transform: translateX(-50%);
  z-index: 50;
  max-width: min(calc(100vw - 2rem), 32rem);
  padding: 0.75rem 1rem;
  border-radius: 10px;
  background: #171717;
  color: #fafafa;
  font-size: 0.8125rem;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.18);
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.icons-app__toast-code {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, monospace;
  font-size: 0.7rem;
  opacity: 0.92;
  word-break: break-all;
}

.icons-app-toast-enter-active,
.icons-app-toast-leave-active {
  transition:
    opacity 0.2s ease,
    transform 0.2s ease;
}

.icons-app-toast-enter-from,
.icons-app-toast-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(8px);
}
</style>

<style>
html,
body {
  margin: 0;
}

#app {
  min-height: 100vh;
}

*,
*::before,
*::after {
  box-sizing: border-box;
}
</style>
