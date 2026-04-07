<template>
  <div class="container">
    <u-menu
      :menus="menus"
      class="aside"
      :current-path="route.path"
      @item-click="handleClick"
    ></u-menu>

    <u-scroll tag="div" class="main">
      <div class="control-bar">
        <div class="control-section">
          <div class="control-group">
            <span class="control-label">组件尺寸</span>
            <div class="radio-group">
              <u-radio value="small" v-model="size">小</u-radio>
              <u-radio value="default" v-model="size">中</u-radio>
              <u-radio value="large" v-model="size">大</u-radio>
            </div>
          </div>

          <div class="control-group">
            <u-switch v-model="isDark" active-text="浅色" inactive-text="深色"></u-switch>
          </div>
        </div>
      </div>

      <div class="content-container">
        <router-view v-slot="{ Component }">
          <transition name="fade" mode="out-in">
            <div class="router-content">
              <component :is="Component" />
            </div>
          </transition>
        </router-view>
      </div>
    </u-scroll>

    <!-- <u-watermark text="Ultra UI" append-to-body /> -->

    <!-- 内置抽屉组件 -->
    <u-drawer
      v-model:visible="showDrawer"
      title="Theme Studio"
      direction="right"
      width="520px"
      :show-close="true"
    >
      <div class="drawer-content">
        <div class="drawer-intro">
          <div>
            <strong>可视化主题配置器</strong>
            <p>在这里直接修改 Theme 变量，变更会即时注入当前页面并支持导出。</p>
          </div>
          <span class="drawer-intro__badge">{{ themeModeLabel }}</span>
        </div>
        <u-theme />
      </div>
    </u-drawer>
  </div>
</template>

<script lang="tsx" setup>
import { useRoute, useRouter } from 'vue-router'
import { routes } from './router'
import { useConfig } from '@ultra-ui/pc'
import {
  currentTheme,
  loadTheme,
  lightTheme,
  darkTheme,
  UITheme
} from '@ultra-ui/styles'
import { computed, ref, shallowRef, watch, watchEffect } from 'vue'
import type { ComponentSize, MenuItem } from '@ultra-ui/pc/types'

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

const localIsDark = localStorage.getItem('isDark')
const isDark = ref(localIsDark ? JSON.parse(localIsDark) : false)

watch(isDark, (d) => {
  localStorage.setItem('isDark', JSON.stringify(d))
  smoothThemeTransition(d ? darkTheme : lightTheme)
})

loadTheme(isDark.value ? darkTheme : lightTheme)

const activeTheme = computed(() => {
  return currentTheme.value?.theme ?? (isDark.value ? darkTheme.theme : lightTheme.theme)
})

const themeModeLabel = computed(() => {
  return isDark.value ? '深色基线' : '浅色基线'
})

const themeSwatches = computed(() => {
  return [
    { label: 'P', value: activeTheme.value.color.primary },
    { label: 'T', value: activeTheme.value.bg.color.top },
    { label: 'M', value: activeTheme.value['text-color'].main }
  ]
})

// 带过渡动画的主题切换
const smoothThemeTransition = (newTheme: UITheme) => {
  // 添加过渡类
  document.documentElement.classList.add('theme-transitioning')

  requestAnimationFrame(() => {
    // 应用新主题
    loadTheme(newTheme)

    // 移除过渡类
    setTimeout(() => {
      document.documentElement.classList.remove('theme-transitioning')
    }, 300)
  })
}

const showDrawer = ref(false)
const handleSetting = () => {
  showDrawer.value = true
}

const handleClose = () => {
  showDrawer.value = false
}
</script>

<style lang="scss">
@function use-var($basename, $nodes...) {
  $suffix: '';

  @each $node in $nodes {
    $suffix: $suffix + '-' + $node;
  }

  @return var(--#{$basename}#{$suffix});
}

.container {
  height: 100vh;
  display: flex;
  background-color: use-var(bg-color, bottom);
  overflow: hidden;
}

$width: 240px;
.aside {
  width: $width;
  border-right: 1px solid use-var(border, color);
  flex-shrink: 0;
  backdrop-filter: var(--bg-filter-blur);
  background-color: use-var(bg-color, top);
}

.main {
  width: calc(100% - $width);
  display: flex;
  flex-direction: column;

  & > .u-scroll__container {
    padding: 0;
    display: flex;
    flex-direction: column;
    height: 100%;
  }
}

.control-bar {
  padding: 16px 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  background: use-var(bg-color, middle);
  backdrop-filter: var(--bg-filter-blur);
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;
  border-top: 1px solid rgba(255, 255, 255, 0.05);
  position: sticky;
  top: 0;
  z-index: 10;
}

.control-section {
  display: flex;
  align-items: center;
  gap: 24px;
}

.control-group {
  display: flex;
  align-items: center;
  gap: 12px;
}

.control-label {
  font-size: 13px;
  color: use-var(text-color, second);
  font-weight: 500;
  white-space: nowrap;
}

.radio-group {
  display: flex;
  gap: 12px;

  .u-radio {
    margin-right: 0;
  }
}

.theme-label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;

  .theme-icon {
    font-size: 16px;
    transition: transform 0.3s ease;

    &:hover {
      transform: scale(1.2);
    }
  }
}

.control-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.theme-brief {
  display: grid;
  gap: 4px;
  padding: 8px 12px;
  border-radius: 14px;
  border: 1px solid rgba(148, 163, 184, 0.18);
  background:
    linear-gradient(135deg, rgba(30, 136, 229, 0.08), rgba(15, 23, 42, 0.02)),
    use-var(bg-color, top);
}

.theme-brief__label {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: use-var(color, primary);
}

.theme-brief__meta {
  display: flex;
  align-items: center;
  gap: 8px;
}

.theme-brief__mode {
  font-size: 12px;
  color: use-var(text-color, second);
}

.theme-brief__swatch {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  border-radius: 999px;
  box-shadow:
    inset 0 0 0 1px rgba(255, 255, 255, 0.72),
    0 6px 14px rgba(15, 23, 42, 0.12);
  font-size: 10px;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.92);
}

.theme-trigger {
  height: 38px;
  padding: 0 16px;
  border-radius: 12px;
  border: 1px solid rgba(30, 136, 229, 0.16);
  background: linear-gradient(135deg, var(--color-primary), var(--color-primary-light-3));
  box-shadow: 0 12px 24px rgba(30, 136, 229, 0.22);

  &:hover {
    transform: translateY(-1px);
  }
}

.setting-btn {
  border-radius: 8px;
  padding: 6px 12px;
  transition: all 0.3s ease;

  &:hover {
    background-color: use-var(bg-color, hover);
    transform: translateY(-1px);
  }
}

.theme-dock {
  position: fixed;
  right: 24px;
  bottom: 24px;
  z-index: 30;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  border-radius: 16px;
  border: 1px solid rgba(148, 163, 184, 0.18);
  background:
    linear-gradient(135deg, rgba(30, 136, 229, 0.14), rgba(15, 23, 42, 0.04)),
    use-var(bg-color, top);
  box-shadow: 0 20px 40px rgba(15, 23, 42, 0.18);
  backdrop-filter: blur(18px);
  cursor: pointer;
  transition:
    transform 0.22s ease,
    box-shadow 0.22s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 26px 48px rgba(15, 23, 42, 0.22);
  }
}

.theme-dock__copy {
  display: grid;
  gap: 2px;

  strong {
    font-size: 13px;
    color: use-var(text-color, title);
  }

  p {
    margin: 0;
    font-size: 12px;
    color: use-var(text-color, second);
  }
}

.theme-dock__swatches {
  display: flex;
  gap: 6px;
}

.theme-dock__swatch {
  width: 16px;
  height: 16px;
  border-radius: 999px;
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.8);
}

.theme-dock__mode {
  padding: 4px 8px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.72);
  font-size: 11px;
  font-weight: 700;
  color: use-var(text-color, title);
}

.content-container {
  flex: 1;
  padding: 24px;
  overflow-y: auto;
  background: use-var(bg-color, bottom);
}

// 抽屉内容样式
.drawer-content {
  display: grid;
  gap: 12px;
  padding: 20px;
}

.drawer-intro {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  padding: 14px 16px;
  border-radius: 16px;
  border: 1px solid rgba(148, 163, 184, 0.16);
  background:
    linear-gradient(135deg, rgba(30, 136, 229, 0.08), transparent 56%), use-var(bg-color, top);

  strong {
    display: block;
    margin-bottom: 4px;
    color: use-var(text-color, title);
  }

  p {
    margin: 0;
    color: use-var(text-color, second);
    line-height: 1.5;
  }
}

.drawer-intro__badge {
  flex-shrink: 0;
  padding: 5px 10px;
  border-radius: 999px;
  background: rgba(30, 136, 229, 0.1);
  color: use-var(color, primary);
  font-size: 12px;
  font-weight: 700;
}

// 响应式设计
@media (max-width: 768px) {
  .control-bar {
    flex-direction: column;
    gap: 16px;
    padding: 12px 16px;
  }

  .control-section {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
    width: 100%;
  }

  .control-group {
    width: 100%;
    justify-content: space-between;
  }

  .content-container {
    padding: 16px;
  }

  .control-actions {
    width: 100%;
    justify-content: space-between;
  }

  .theme-brief {
    flex: 1;
    min-width: 0;
  }

  .theme-dock {
    right: 16px;
    left: 16px;
    bottom: 16px;
  }

  .drawer-intro {
    flex-direction: column;
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

  .drawer {
    width: 100%;
  }

  .content-container {
    padding: 12px;
  }

  .theme-brief__meta {
    flex-wrap: wrap;
  }

  .theme-trigger,
  .setting-btn {
    flex: 1;
  }

  .theme-dock {
    align-items: flex-start;
    flex-direction: column;
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
.fade-enter-active {
  transition: all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}

.fade-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.fade-enter-from {
  opacity: 0;
  transform: translateY(20px) scale(0.98);
  filter: blur(2px);
}

.fade-leave-to {
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

.fade-enter-active .router-content::before,
.fade-leave-active .router-content::before {
  opacity: 1;
}

// 优化选择状态
::selection {
  background-color: var(--color-primary);
  color: use-var(text-color, white);
}
</style>
