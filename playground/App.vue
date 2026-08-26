<template>
  <div class="container1" :data-theme-preset="themePreset">
    <u-dual-nav
      :menus="menus"
      class="aside"
      :current-path="route.path"
      @item-click="handleClick"
    ></u-dual-nav>

    <div class="main">
      <div class="content-backdrop" aria-hidden="true"></div>

      <div class="control-bar">
        <div class="control-bar__start">
          <div class="config-badges">
            <span class="config-badge">{{ themePresetLabel }}</span>
            <span class="config-badge">{{ sizeLabel }}</span>
          </div>
        </div>

        <nav-search class="control-bar__search" :menus="menus" />

        <u-button type="primary" plain class="setting-btn" @click="showDrawer = true">
          <u-icon><Setting /></u-icon>
          设置
        </u-button>
      </div>

      <u-scroll class="content-container">
        <router-view v-slot="{ Component }">
          <transition name="page-fade" mode="out-in">
            <div class="router-content">
              <component :is="Component" />
            </div>
          </transition>
        </router-view>
      </u-scroll>
    </div>

    <!-- <u-watermark text="Ultra UI" append-to-body /> -->

    <u-drawer v-model="showDrawer" title="设置" direction="right" width="400px" :show-close="true">
      <div class="drawer-content">
        <section class="drawer-section">
          <h3 class="drawer-section-title">主题</h3>

          <div v-for="group in themeGroups" :key="group.label" class="theme-group">
            <div class="theme-group-label">{{ group.label }}</div>
            <div class="theme-grid">
              <button
                v-for="item in group.items"
                :key="item.value"
                type="button"
                class="theme-card"
                :class="{ 'is-active': themePreset === item.value }"
                :style="previewVars(item)"
                @click="themePreset = item.value"
              >
                <span class="theme-preview" aria-hidden="true">
                  <span class="theme-preview__side"></span>
                  <span class="theme-preview__body">
                    <span class="theme-preview__line theme-preview__line--title"></span>
                    <span class="theme-preview__pill"></span>
                    <span class="theme-preview__line"></span>
                  </span>
                </span>
                <span class="theme-card__meta">
                  <span class="theme-card__name">{{ item.label }}</span>
                  <u-icon v-if="themePreset === item.value" class="theme-card__check">
                    <Check />
                  </u-icon>
                </span>
              </button>
            </div>
          </div>
        </section>

        <section class="drawer-section">
          <h3 class="drawer-section-title">组件尺寸</h3>
          <u-radio-group v-model="size" :items="sizeOptions" variant="button" block />
        </section>

        <section class="drawer-section">
          <h3 class="drawer-section-title">圆角</h3>
          <u-radio-group v-model="radiusMode" :items="radiusOptions" variant="button" block />
        </section>

        <footer class="drawer-footer">
          <u-button plain size="small" @click="resetSettings">恢复默认</u-button>
        </footer>
      </div>
    </u-drawer>
  </div>
</template>

<script lang="tsx" setup>
import { useConfig } from '@veltra/compositions'
import type { ComponentSize, NavItem } from '@veltra/desktop'
import { Check, Setting } from '@veltra/icons/normal'
import {
  ancientTheme,
  darkTheme,
  glassTheme,
  heroTheme,
  lightTheme,
  loadTheme,
  midnightTheme,
  neonTheme,
  oceanTheme,
  sakuraTheme,
  type UITheme
} from '@veltra/styles/theme'
import { computed, ref, shallowRef, watch, watchEffect } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import { buildPlaygroundMenus, isNavGroupPath } from './nav-config'
import NavSearch from './nav-search.vue'

const router = useRouter()
const route = useRoute()

const menus = buildPlaygroundMenus()

const handleClick = (item: NavItem) => {
  if (isNavGroupPath(item.path)) return
  router.push(item.path)
}
const { setConfig } = useConfig()
const size = shallowRef<ComponentSize>('default')

watchEffect(() => {
  setConfig({ size: size.value })
})

interface ThemeItem {
  label: string
  value: string
  theme: UITheme
}

const themeGroups: { label: string; items: ThemeItem[] }[] = [
  {
    label: '浅色系',
    items: [
      { label: '默认', value: 'light', theme: lightTheme },
      { label: 'Hero', value: 'hero', theme: heroTheme },
      { label: '古风', value: 'ancient', theme: ancientTheme },
      { label: '樱花', value: 'sakura', theme: sakuraTheme },
      { label: '海盐', value: 'ocean', theme: oceanTheme }
    ]
  },
  {
    label: '深色系',
    items: [
      { label: '默认深色', value: 'dark', theme: darkTheme },
      { label: '玻璃', value: 'glass', theme: glassTheme },
      { label: '午夜', value: 'midnight', theme: midnightTheme },
      { label: '霓虹', value: 'neon', theme: neonTheme }
    ]
  }
]

const allThemes = themeGroups.flatMap((g) => g.items)

function readInitialPreset(): string {
  const stored = localStorage.getItem('themePreset')
  // 旧版主题包 id（default / shadcn 等）已不存在，回退浅色默认
  if (stored === 'default') return 'light'
  return allThemes.some((t) => t.value === stored) ? stored! : 'light'
}

// 明暗模式开关已移除（选主题即定明暗），清理遗留 key
localStorage.removeItem('themeMode')

const themePreset = ref(readInitialPreset())

const themeItem = computed(() => {
  return allThemes.find((t) => t.value === themePreset.value) ?? allThemes[0]!
})

const RADIUS_MODES = [
  { label: '直角', value: 'sharp' },
  { label: '默认', value: 'default' },
  { label: '圆润', value: 'soft' }
] as const

type RadiusMode = (typeof RADIUS_MODES)[number]['value']

// items 需要可变数组，as const 元组展开一层
const radiusOptions = [...RADIUS_MODES]

function readInitialRadius(): RadiusMode {
  const stored = localStorage.getItem('themeRadius')
  return RADIUS_MODES.some((m) => m.value === stored) ? (stored as RadiusMode) : 'default'
}

const radiusMode = ref<RadiusMode>(readInitialRadius())

const effectiveTheme = computed(() => {
  const base = themeItem.value.theme
  if (radiusMode.value === 'sharp') {
    return base.new({ radius: { small: 0, default: 0, large: 0 } })
  }
  if (radiusMode.value === 'soft') {
    const r = base.theme.radius
    return base.new({ radius: { small: r.small + 2, default: r.default + 6, large: r.large + 8 } })
  }
  return base
})

watch([themePreset, radiusMode], () => {
  localStorage.setItem('themePreset', themePreset.value)
  localStorage.setItem('themeRadius', radiusMode.value)
  applyThemeWithTransition()
})

applyThemeWithTransition()

function applyThemeWithTransition() {
  document.documentElement.classList.add('theme-transitioning')

  requestAnimationFrame(() => {
    loadTheme(effectiveTheme.value)

    setTimeout(() => {
      document.documentElement.classList.remove('theme-transitioning')
    }, 300)
  })
}

const showDrawer = ref(false)

const sizeOptions = [
  { label: '小', value: 'small' },
  { label: '中', value: 'default' },
  { label: '大', value: 'large' }
]

const themePresetLabel = computed(() => themeItem.value.label)

const sizeLabel = computed(() => {
  return sizeOptions.find((o) => o.value === size.value)?.label ?? '中'
})

function previewVars(item: ThemeItem) {
  const t = item.theme.theme
  return {
    '--tp-bg': t.bg.color.bottom,
    '--tp-surface': t.bg.color.top,
    '--tp-primary': t.color.primary,
    '--tp-border': t.border.mutedColor,
    '--tp-text': t['text-color'].second,
    '--tp-title': t['text-color'].title,
    '--tp-radius': `${Math.min(t.radius.large, 12)}px`
  }
}

function resetSettings() {
  themePreset.value = 'light'
  size.value = 'default'
  radiusMode.value = 'default'
}
</script>

<style lang="scss">
@function use-var($basename, $nodes...) {
  $suffix: '';

  @each $node in $nodes {
    $suffix: $suffix + '-' + $node;
  }

  @return var(--u-#{$basename}#{$suffix});
}

.container1 {
  width: 100%;
  height: 100vh;
  display: flex;
  background-color: use-var(bg-color, bottom);
  overflow: hidden;
  --playground-grid-color: rgba(15, 23, 42, 0.08);
}

$width: 320px;
.aside {
  width: $width;
  height: 100%;
  border-right: 1px solid use-var(border, color);
  flex-shrink: 0;
  backdrop-filter: var(--u-bg-filter);
  background-color: use-var(bg-color, top);
}

.main {
  flex: 1;
  min-width: 0;
  width: 100%;
  display: flex;
  flex-direction: column;
  background-color: use-var(bg-color, bottom);
  position: relative;
  overflow: hidden;

  & > :deep(.u-scroll__container) {
    padding: 0;
    display: flex;
    flex-direction: column;
    height: 100%;
    position: relative;
  }
}

.content-backdrop {
  position: absolute;
  inset: 0;
  z-index: 0;
  overflow: hidden;
  pointer-events: none;
  background: use-var(bg-color, bottom);

  &::before,
  &::after {
    content: '';
    position: absolute;
    inset: 0;
    pointer-events: none;
  }

  &::before {
    // background:
    //   radial-gradient(ellipse 72% 58% at 15% 22%, rgba(59, 130, 246, 0.34), transparent 58%),
    //   radial-gradient(ellipse 64% 54% at 86% 14%, rgba(236, 72, 153, 0.24), transparent 56%),
    //   radial-gradient(ellipse 62% 62% at 56% 88%, rgba(6, 182, 212, 0.26), transparent 60%),
    //   linear-gradient(135deg, rgba(248, 250, 252, 0.92), rgba(226, 232, 240, 0.74));
  }

  &::after {
    // background-image:
    //   linear-gradient(to right, var(--playground-grid-color) 1px, transparent 1px),
    //   linear-gradient(to bottom, var(--playground-grid-color) 1px, transparent 1px);
    background-size: 52px 52px;
    mask-image: linear-gradient(to bottom, rgba(0, 0, 0, 0.8), rgba(0, 0, 0, 0.38));
  }
}

.container1[data-theme-preset='glass'] {
  --playground-grid-color: rgba(15, 23, 42, 0.1);
}

.container1[data-theme-preset='glass'] .content-backdrop::before {
  background:
    radial-gradient(ellipse 74% 60% at 14% 24%, rgba(59, 130, 246, 0.42), transparent 58%),
    radial-gradient(ellipse 66% 56% at 86% 16%, rgba(236, 72, 153, 0.3), transparent 56%),
    radial-gradient(ellipse 64% 64% at 54% 88%, rgba(6, 182, 212, 0.34), transparent 60%),
    linear-gradient(135deg, rgba(248, 250, 252, 0.92), rgba(226, 232, 240, 0.7));
}

html[data-theme='dark'] .container1 {
  --playground-grid-color: rgba(255, 255, 255, 0.08);
}

html[data-theme='dark'] .content-backdrop::before {
  background:
    radial-gradient(ellipse 74% 58% at 14% 24%, rgba(99, 102, 241, 0.42), transparent 58%),
    radial-gradient(ellipse 64% 56% at 86% 18%, rgba(236, 72, 153, 0.3), transparent 56%),
    radial-gradient(ellipse 62% 62% at 52% 88%, rgba(14, 165, 233, 0.34), transparent 60%),
    linear-gradient(135deg, rgba(2, 6, 23, 0.98), rgba(15, 23, 42, 0.86));
}

html[data-theme='dark'] .container1[data-theme-preset='glass'] {
  --playground-grid-color: rgba(255, 255, 255, 0.1);
}

html[data-theme='dark'] .container1[data-theme-preset='glass'] .content-backdrop::before {
  background:
    radial-gradient(ellipse 76% 60% at 14% 24%, rgba(99, 102, 241, 0.5), transparent 58%),
    radial-gradient(ellipse 66% 58% at 86% 18%, rgba(236, 72, 153, 0.36), transparent 56%),
    radial-gradient(ellipse 64% 64% at 52% 88%, rgba(14, 165, 233, 0.42), transparent 60%),
    linear-gradient(135deg, rgba(2, 6, 23, 0.98), rgba(15, 23, 42, 0.82));
}

.control-bar {
  padding: 16px 20px;
  border-bottom: 1px solid use-var(border, color);
  background: use-var(bg-color, middle);
  backdrop-filter: var(--u-bg-filter);
  display: flex;
  align-items: center;
  gap: 16px;
  flex-shrink: 0;
  position: sticky;
  top: 0;
  z-index: 10;
}

.control-bar__start {
  display: flex;
  align-items: center;
  min-width: 0;
  flex-shrink: 0;
}

.control-bar__search {
  margin-inline: auto;
}

.config-badges {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.config-badge {
  font-size: 12px;
  padding: 4px 10px;
  border-radius: 999px;
  background: use-var(bg-color, top);
  color: use-var(text-color, second);
  border: 1px solid use-var(border, color);
  font-weight: 500;
}

.setting-btn {
  border-radius: 8px;
  flex-shrink: 0;
}

.content-container {
  flex: 1;
  width: 100%;
  padding: 12px;
  overflow-y: auto;
  background: transparent;
  position: relative;
  z-index: 1;
}

.drawer-content {
  display: flex;
  flex-direction: column;
  gap: 24px;
  padding: 20px;
}

.drawer-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.drawer-section-title {
  font-size: 13px;
  font-weight: 600;
  color: use-var(text-color, title);
  margin: 0;
}

.theme-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.theme-group-label {
  font-size: 11px;
  color: use-var(text-color, second);
  letter-spacing: 0.05em;
}

.theme-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.theme-card {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 7px;
  background: use-var(bg-color, middle);
  border: 1px solid use-var(border, color);
  border-radius: 10px;
  cursor: pointer;
  text-align: left;
  transition:
    border-color var(--u-transition-fast) ease,
    box-shadow var(--u-transition-fast) ease,
    transform var(--u-transition-fast) ease;

  &:hover {
    transform: translateY(-1px);
    box-shadow: var(--u-shadow-sm);
    border-color: use-var(border, mutedColor);
  }

  &.is-active {
    border-color: use-var(color, primary);
    box-shadow: 0 0 0 1px use-var(color, primary);

    .theme-card__name {
      color: use-var(color, primary);
      font-weight: 600;
    }
  }
}

.theme-preview {
  display: flex;
  gap: 6px;
  height: 64px;
  padding: 7px;
  background: var(--tp-bg);
  border: 1px solid var(--tp-border);
  border-radius: var(--tp-radius);
  overflow: hidden;
}

.theme-preview__side {
  width: 26%;
  background: var(--tp-surface);
  border-right: 1px solid var(--tp-border);
}

.theme-preview__body {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 6px;
}

.theme-preview__line {
  height: 5px;
  width: 86%;
  border-radius: 3px;
  background: var(--tp-text);
  opacity: 0.35;

  &--title {
    width: 58%;
    background: var(--tp-title);
    opacity: 0.8;
  }
}

.theme-preview__pill {
  width: 52%;
  height: 13px;
  border-radius: 999px;
  background: var(--tp-primary);
}

.theme-card__meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 2px 2px;
}

.theme-card__name {
  font-size: 12px;
  font-weight: 500;
  color: use-var(text-color, main);
}

.theme-card__check {
  font-size: 14px;
  color: use-var(color, primary);
}

.drawer-footer {
  padding-top: 16px;
  border-top: 1px solid use-var(border, color);
  display: flex;
  justify-content: flex-end;
}

.theme-transitioning {
  * {
    // 只覆盖过渡时长与曲线，避免把组件自身的 transition-property
    //（例如 switch thumb 的 transform）在主题切换时整体抹掉。
    transition-duration: 0.3s !important;
    transition-timing-function: ease !important;
  }
}

// 优化页面过渡动画
.page-fade-enter-active {
  transition: all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}

.page-fade-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.page-fade-enter-from {
  opacity: 0;
  transform: translateY(20px) scale(0.98);
  filter: blur(2px);
}

.page-fade-leave-to {
  opacity: 0;
  transform: translateY(-20px) scale(0.98);
  filter: blur(1px);
}

// 路由切换时的容器动画
.router-content {
  position: relative;
  min-height: 400px;
  width: 100%;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(
      45deg,
      transparent 30%,
      rgba(255, 255, 255, 0.03) 50%,
      transparent 70%
    );
    opacity: 0;
    transition: opacity 0.3s ease;
    pointer-events: none;
  }
}

.page-fade-enter-active .router-content::before,
.page-fade-leave-active .router-content::before {
  opacity: 1;
}
</style>
