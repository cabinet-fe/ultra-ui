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
            <u-switch
              v-model="isDark"
              active-text="浅色"
              inactive-text="深色"
            ></u-switch>
          </div>
        </div>

        <div class="control-actions">
          <u-button
            :icon="Setting"
            @click="handleSetting"
            text
            class="setting-btn"
            >设置</u-button
          >
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
      title="主题设置"
      direction="right"
      width="360px"
      :show-close="true"
    >
      <div class="drawer-content">
        <u-theme />
      </div>
    </u-drawer>
  </div>
</template>

<script lang="tsx" setup>
import { useRoute, useRouter } from 'vue-router'
import { routes } from './router'
import {
  useConfig,
  loadTheme,
  lightTheme,
  darkTheme,
  UITheme,
  type MenuItem
} from 'ultra-ui'
import { ref, shallowRef, watch, watchEffect } from 'vue'
import type { ComponentSize } from 'ultra-ui/types'
import { Setting } from '@ultra/icon'

const router = useRouter()
const route = useRoute()

const handleClick = (item: MenuItem) => {
  router.push(item.path)
}
const { setConfig } = useConfig()
const size = shallowRef<ComponentSize>('default')

const menus = routes.map(item => ({
  title: item.name as string,
  path: item.path
}))

watchEffect(() => {
  setConfig({
    size: size.value
  })
})

const localIsDark = localStorage.getItem('isDark')
const isDark = ref(localIsDark ? JSON.parse(localIsDark) : false)

watch(isDark, d => {
  localStorage.setItem('isDark', JSON.stringify(d))
  smoothThemeTransition(d ? darkTheme : lightTheme)
})

loadTheme(isDark.value ? darkTheme : lightTheme)

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

  & > :deep(.u-scroll__container) {
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

  :deep(.u-radio) {
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
  gap: 8px;
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

.content-container {
  flex: 1;
  padding: 24px;
  overflow-y: auto;
  background: use-var(bg-color, bottom);
}

// 抽屉内容样式
.drawer-content {
  padding: 20px;
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

  .drawer {
    width: 320px;
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
}
</style>

<style lang="scss">
.theme-transitioning {
  * {
    transition:
      background-color 0.3s ease,
      color 0.3s ease,
      border-color 0.3s ease !important;
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
