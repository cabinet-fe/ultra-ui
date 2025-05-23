<template>
  <div class="container">
    <u-menu
      :menus="menus"
      class="aside"
      :current-path="route.path"
      @item-click="handleClick"
    ></u-menu>

    <u-scroll tag="div" class="main">
      <div style="border-bottom: 1px solid #eee; margin-bottom: 10px">
        组件尺寸
        <span>
          <u-radio value="small" v-model="size">小</u-radio>
          <u-radio value="default" v-model="size">中</u-radio>
          <u-radio value="large" v-model="size">大</u-radio>
        </span>

        <span>
          <u-checkbox v-model="isDark" />
        </span>
      </div>

      <router-view v-slot="{ Component }">
        <transition name="fade" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </u-scroll>

    <!-- <u-watermark text="Ultra UI" append-to-body /> -->
  </div>
</template>

<script lang="tsx" setup>
import { useRoute, useRouter } from 'vue-router'
import { routes } from './router'
import {
  useConfig,
  vRipple,
  contextmenu,
  message,
  loadTheme,
  lightTheme,
  darkTheme,
  UITheme,
  type MenuItem
} from 'ultra-ui'
import { ref, shallowRef, watch, watchEffect } from 'vue'
import type { ComponentSize } from 'ultra-ui/types/component-common.js'

const router = useRouter()
const route = useRoute()

const handleClick = (item: MenuItem) => {
  router.push(item.path)
}
const { setConfig } = useConfig()
const size = shallowRef<ComponentSize>('default')

const menus = routes.map(item => ({
  title: item.name,
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
</script>

<style lang="scss" scoped>
@use '@ui/styles/functions' as fn;

.container {
  height: 100vh;
  display: flex;
  background-color: fn.use-var(bg-color, bottom);
}

$width: 240px;
.aside {
  width: $width;
  border-right: fn.use-var(border);

  flex-shrink: 0;
}

.main {
  width: calc(100% - $width);

  & > :deep(.u-scroll__container) {
    padding: 10px;
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
</style>
