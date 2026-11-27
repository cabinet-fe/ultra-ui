<template>
  <div class="scene-devtools">
    <!-- 特性走马灯 -->
    <u-card>
      <u-card-content>
        <u-carousel arrows dots autoplay :interval="4500" class="feature-carousel">
          <u-carousel-item v-for="slide in slides" :key="slide.title">
            <div class="carousel-slide">
              <u-tag :type="slide.tagType" size="small">{{ slide.badge }}</u-tag>
              <h3>{{ slide.title }}</h3>
              <p>{{ slide.desc }}</p>
            </div>
          </u-carousel-item>
        </u-carousel>
      </u-card-content>
    </u-card>

    <!-- 代码编辑器 + 日历 -->
    <div class="devtools-grid">
      <u-card>
        <u-card-header>
          <div class="row-between w-full">
            <span class="section-title">在线代码编辑器</span>
            <u-tag type="info" size="small">CodeMirror 6</u-tag>
          </div>
        </u-card-header>
        <u-card-content>
          <u-code-editor
            v-model="code"
            v-model:lang="codeLang"
            :langs="['js', 'json', 'sql']"
            :default-lines="11"
          />
        </u-card-content>
      </u-card>

      <u-card>
        <u-card-header>
          <span class="section-title">版本发布日历</span>
        </u-card-header>
        <u-card-content>
          <u-calendar v-model="calendarDate" />
        </u-card-content>
      </u-card>
    </div>

    <!-- 交互反馈、骨架屏与快捷键 -->
    <div class="devtools-grid">
      <u-card>
        <u-card-header>
          <div class="row-between w-full">
            <span class="section-title">骨架屏加载切换</span>
            <u-switch v-model="skeletonLoading" active-text="加载中" inactive-text="已就绪" />
          </div>
        </u-card-header>
        <u-card-content>
          <u-skeleton :loading="skeletonLoading" avatar :rows="3" animated>
            <div class="row gap-md">
              <u-avatar>V</u-avatar>
              <div class="column gap-xs">
                <span class="font-medium">Veltra Design System</span>
                <span class="text-xs text-second">
                  全量 TypeScript 类型推导，开箱即用的亮暗双色主题与 CSS Token 体系。
                </span>
              </div>
            </div>
          </u-skeleton>
        </u-card-content>
      </u-card>

      <u-card>
        <u-card-header>
          <span class="section-title">快捷键与即时反馈</span>
        </u-card-header>
        <u-card-content class="column gap-md">
          <div class="kbd-list">
            <div class="kbd-row">
              <span class="text-sm">快速检索组件</span>
              <span class="row gap-xs"><u-kbd>⌘</u-kbd><u-kbd>K</u-kbd></span>
            </div>
            <div class="kbd-row">
              <span class="text-sm">保存当前配置</span>
              <span class="row gap-xs"><u-kbd>⌘</u-kbd><u-kbd>S</u-kbd></span>
            </div>
          </div>

          <u-divider />

          <div class="row gap-xs flex-wrap">
            <u-button type="primary" size="small" @click="triggerMessage">Message 提示</u-button>
            <u-button type="success" size="small" @click="triggerNotification">
              Notification 通知
            </u-button>
            <u-button plain size="small" @click="dialogVisible = true">打开 Dialog</u-button>
          </div>
        </u-card-content>
      </u-card>
    </div>

    <u-dialog v-model="dialogVisible" title="开发者调试面板" size="small">
      <p class="text-sm text-second m-0">
        所有浮层组件（Dialog、Drawer、Dropdown、Tip）均内置无障碍焦点管理与平滑过渡动画。
      </p>
      <template #footer>
        <u-button type="primary" @click="dialogVisible = false">知道了</u-button>
      </template>
    </u-dialog>
  </div>
</template>

<script setup lang="ts">
import type { CodeEditorLang } from '@veltra/desktop'
import {
  UAvatar,
  UButton,
  UCalendar,
  UCard,
  UCardContent,
  UCardHeader,
  UCarousel,
  UCarouselItem,
  UCodeEditor,
  UDialog,
  UDivider,
  UKbd,
  USkeleton,
  USwitch,
  UTag,
  message,
  notification
} from '@veltra/desktop'
import { ref, shallowRef } from 'vue'

const slides = [
  {
    badge: 'Design Token',
    tagType: 'primary' as const,
    title: '统一的设计变量与亮暗主题无缝切换',
    desc: '基于 CSS Custom Properties 构建，所有组件自动响应主题色与深浅模式变化。'
  },
  {
    badge: 'TypeScript',
    tagType: 'success' as const,
    title: '全量严格类型定义与 IDE 智能补全',
    desc: '从 Props、Emits 到表格列渲染作用域插槽，提供完整类型约束与开发体验。'
  },
  {
    badge: 'Enterprise',
    tagType: 'warning' as const,
    title: '覆盖 60+ 桌面端高频与复杂业务组件',
    desc: '涵盖表单、树形选择、看板、代码编辑器、甘特图与电子表格等专业场景。'
  }
]

const codeLang = ref<CodeEditorLang>('js')
const code = ref(`import { UButton, USegment, message } from '@veltra/desktop'

export function notifyReady() {
  message.success('Veltra UI 组件库已就绪')
}`)

const calendarDate = shallowRef<string>('2026-11-27')
const skeletonLoading = ref(false)
const dialogVisible = ref(false)

const triggerMessage = () => {
  message.success('操作执行成功')
}

const triggerNotification = () => {
  notification.info({ title: '构建完成', content: '所有 @veltra/* 包已完成类型检查与产物构建。' })
}
</script>

<style scoped>
.scene-devtools {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.feature-carousel {
  height: 150px;
}

.carousel-slide {
  height: 150px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 16px 32px;
  background: var(--u-bg-color-hover);
  border-radius: var(--u-radius-default);
}

.carousel-slide h3 {
  margin: 10px 0 6px;
  font-size: 18px;
  font-weight: 700;
  color: var(--u-text-color-title);
}

.carousel-slide p {
  margin: 0;
  font-size: 13px;
  color: var(--u-text-color-second);
  max-width: 560px;
}

.devtools-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 20px;
}

.section-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--u-text-color-title);
}

.kbd-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.kbd-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
</style>
