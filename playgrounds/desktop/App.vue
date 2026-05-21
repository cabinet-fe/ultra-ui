<template>
  <div class="container" :data-theme-preset="themePreset">
    <u-menu
      :menus="menus"
      class="aside"
      :current-path="route.path"
      @item-click="handleClick"
    ></u-menu>

    <u-scroll tag="div" class="main">
      <div class="content-backdrop" aria-hidden="true"></div>

      <div class="control-bar">
        <div class="config-badges">
          <span class="config-badge">{{ themePresetLabel }}</span>
          <span class="config-badge">{{ sizeLabel }}</span>
          <span class="config-badge">{{ themeModeLabel }}</span>
        </div>

        <u-button type="primary" plain class="setting-btn" @click="showDrawer = true">
          <u-icon><Setting /></u-icon>
          设置
        </u-button>
      </div>

      <div class="content-container">
        <router-view v-slot="{ Component }">
          <transition name="page-fade" mode="out-in">
            <div class="router-content">
              <component :is="Component" />
            </div>
          </transition>
        </router-view>
      </div>
    </u-scroll>

    <!-- <u-watermark text="Ultra UI" append-to-body /> -->

    <u-drawer v-model="showDrawer" title="设置" direction="right" width="400px" :show-close="true">
      <div class="drawer-content">
        <div class="drawer-section">
          <div class="drawer-section-title">外观</div>
          <u-radio-group v-model="themeMode" :items="themeModeOptions" block />
        </div>

        <div class="drawer-section">
          <div class="drawer-section-title">主题包</div>
          <u-radio-group v-model="themePreset" :items="themePresetOptions" block />
        </div>

        <div class="drawer-section">
          <div class="drawer-section-title">组件尺寸</div>
          <u-radio-group v-model="size" :items="sizeOptions" block />
        </div>

        <!-- <div class="drawer-divider"></div>

        <div class="drawer-section">
          <div class="drawer-section-title">主题变量</div>
          <u-theme />
        </div> -->
      </div>
    </u-drawer>
  </div>
</template>

<script lang="tsx" setup>
import { useConfig } from '@veltra/compositions'
import type { ComponentSize, MenuItem } from '@veltra/desktop'
import { Setting } from '@veltra/icons/normal'
import {
  lightTheme,
  darkTheme,
  shadcnLightTheme,
  shadcnDarkTheme,
  heroLightTheme,
  heroDarkTheme,
  UITheme,
  currentTheme,
  glassDarkTheme,
  glassLightTheme
} from '@veltra/styles/theme'
import { computed, onMounted, onUnmounted, ref, shallowRef, watch, watchEffect } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import { routes } from './router'

const router = useRouter()
const route = useRoute()

const handleClick = (item: MenuItem) => {
  router.push(item.path)
}
const { setConfig } = useConfig()
const size = shallowRef<ComponentSize>('default')

const menus = routes.map((item) => ({ title: item.name as string, path: item.path }))

watchEffect(() => {
  setConfig({ size: size.value })
})

type SampleThemeMode = 'light' | 'dark' | 'auto'

function readInitialThemeMode(): SampleThemeMode {
  const stored = localStorage.getItem('themeMode')
  if (stored === 'light' || stored === 'dark' || stored === 'auto') {
    return stored
  }
  const legacy = localStorage.getItem('isDark')
  if (legacy !== null) {
    try {
      return JSON.parse(legacy) ? 'dark' : 'light'
    } catch {
      /* ignore */
    }
  }
  return 'light'
}

const themeMode = ref<SampleThemeMode>(readInitialThemeMode())

const prefersDark = ref(
  typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches
)
let removePrefListener: (() => void) | undefined

onMounted(() => {
  const mq = window.matchMedia('(prefers-color-scheme: dark)')
  prefersDark.value = mq.matches
  const onChange = (e: MediaQueryListEvent) => {
    prefersDark.value = e.matches
  }
  mq.addEventListener('change', onChange)
  removePrefListener = () => mq.removeEventListener('change', onChange)
})

onUnmounted(() => removePrefListener?.())

const themePreset = ref(localStorage.getItem('themePreset') || 'default')
watch(themePreset, (v) => localStorage.setItem('themePreset', v))

const getThemesByPreset = (preset: string) => {
  if (preset === 'shadcn') return { light: shadcnLightTheme, dark: shadcnDarkTheme }
  if (preset === 'hero') return { light: heroLightTheme, dark: heroDarkTheme }
  if (preset === 'glass') return { light: glassLightTheme, dark: glassDarkTheme }

  return { light: lightTheme, dark: darkTheme }
}

const effectiveDark = computed(() => {
  if (themeMode.value === 'dark') return true
  if (themeMode.value === 'light') return false
  return prefersDark.value
})

watch([themeMode, themePreset], ([m, p]) => {
  localStorage.setItem('themeMode', m)
  applyThemeWithTransition(m, p)
})

const initial = getThemesByPreset(themePreset.value)
UITheme.injectBuiltInThemes(initial.light, initial.dark)
UITheme.setTheme(themeMode.value)

watchEffect(() => {
  const { light, dark } = getThemesByPreset(themePreset.value)
  currentTheme.value = effectiveDark.value ? dark : light
})

const themeModeLabel = computed(() => {
  if (themeMode.value === 'auto') return '跟随系统'
  return themeMode.value === 'dark' ? '深色基线' : '浅色基线'
})

function applyThemeWithTransition(mode: SampleThemeMode, preset: string = themePreset.value) {
  document.documentElement.classList.add('theme-transitioning')

  requestAnimationFrame(() => {
    const { light, dark } = getThemesByPreset(preset)
    UITheme.injectBuiltInThemes(light, dark)
    UITheme.setTheme(mode)

    setTimeout(() => {
      document.documentElement.classList.remove('theme-transitioning')
    }, 300)
  })
}

const showDrawer = ref(false)

const themePresetOptions = [
  { label: '默认', value: 'default' },
  { label: 'Shadcn', value: 'shadcn' },
  { label: 'Hero', value: 'hero' },
  { label: '玻璃', value: 'glass' }
]

const sizeOptions = [
  { label: '小', value: 'small' },
  { label: '中', value: 'default' },
  { label: '大', value: 'large' }
]

const themeModeOptions = [
  { label: '浅色', value: 'light' },
  { label: '深色', value: 'dark' },
  { label: '跟随系统', value: 'auto' }
]

const themePresetLabel = computed(() => {
  return themePresetOptions.find((o) => o.value === themePreset.value)?.label ?? '默认'
})

const sizeLabel = computed(() => {
  return sizeOptions.find((o) => o.value === size.value)?.label ?? '中'
})
</script>

<style lang="scss">
@function use-var($basename, $nodes...) {
  $suffix: '';

  @each $node in $nodes {
    $suffix: $suffix + '-' + $node;
  }

  @return var(--u-#{$basename}#{$suffix});
}

.container {
  height: 100vh;
  display: flex;
  background-color: use-var(bg-color, bottom);
  overflow: hidden;
  --playground-grid-color: rgba(15, 23, 42, 0.08);
}

$width: 240px;
.aside {
  width: $width;
  border-right: 1px solid use-var(border, color);
  flex-shrink: 0;
  backdrop-filter: var(--u-bg-filter);
  background-color: use-var(bg-color, top);
}

.main {
  width: calc(100% - $width);
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

.container[data-theme-preset='glass'] {
  --playground-grid-color: rgba(15, 23, 42, 0.1);
}

.container[data-theme-preset='glass'] .content-backdrop::before {
  background:
    radial-gradient(ellipse 74% 60% at 14% 24%, rgba(59, 130, 246, 0.42), transparent 58%),
    radial-gradient(ellipse 66% 56% at 86% 16%, rgba(236, 72, 153, 0.3), transparent 56%),
    radial-gradient(ellipse 64% 64% at 54% 88%, rgba(6, 182, 212, 0.34), transparent 60%),
    linear-gradient(135deg, rgba(248, 250, 252, 0.92), rgba(226, 232, 240, 0.7));
}

html[data-theme='dark'] .container {
  --playground-grid-color: rgba(255, 255, 255, 0.08);
}

html[data-theme='dark'] .content-backdrop::before {
  background:
    radial-gradient(ellipse 74% 58% at 14% 24%, rgba(99, 102, 241, 0.42), transparent 58%),
    radial-gradient(ellipse 64% 56% at 86% 18%, rgba(236, 72, 153, 0.3), transparent 56%),
    radial-gradient(ellipse 62% 62% at 52% 88%, rgba(14, 165, 233, 0.34), transparent 60%),
    linear-gradient(135deg, rgba(2, 6, 23, 0.98), rgba(15, 23, 42, 0.86));
}

html[data-theme='dark'] .container[data-theme-preset='glass'] {
  --playground-grid-color: rgba(255, 255, 255, 0.1);
}

html[data-theme='dark'] .container[data-theme-preset='glass'] .content-backdrop::before {
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
  justify-content: space-between;
  flex-shrink: 0;
  position: sticky;
  top: 0;
  z-index: 10;
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
}

.content-container {
  flex: 1;
  padding: 24px;
  overflow-y: auto;
  background: transparent;
  position: relative;
  z-index: 1;
}

.drawer-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 20px;
}

.drawer-section {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.drawer-section-title {
  font-size: 13px;
  font-weight: 600;
  color: use-var(text-color, title);
  margin: 0;
}

.drawer-divider {
  height: 1px;
  background: use-var(border, color);
}

// 响应式设计
@media (max-width: 768px) {
  .control-bar {
    padding: 12px 16px;
  }

  .content-container {
    padding: 16px;
  }
}

@media (max-width: 480px) {
  $width: 200px;
  .aside {
    width: $width;
  }

  .main {
    width: calc(100% - $width);
  }

  .control-bar {
    padding: 8px 12px;
  }

  .content-container {
    padding: 12px;
  }
}
</style>

<style lang="scss">
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
