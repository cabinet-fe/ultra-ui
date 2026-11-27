<template>
  <div class="showcase">
    <header class="hero">
      <div class="hero-top">
        <u-tag type="primary" size="small">Veltra Desktop · Vue 3.5</u-tag>
        <span class="hero-kicker">60+ 桌面端组件 · 全量 TypeScript · 亮暗双色主题</span>
      </div>

      <h1 class="title">构建优雅、高效的桌面端界面</h1>
      <p class="subtitle">通过下方场景切换器，浏览不同真实业务场景下的组件组合与交互体验。</p>

      <div class="scene-switcher">
        <u-segment v-model="activeScene" :items="sceneItems" size="large">
          <template #item="{ item }">
            <span class="segment-tab">
              <u-icon><component :is="item.icon" /></u-icon>
              <span>{{ item.label }}</span>
            </span>
          </template>
        </u-segment>
      </div>
    </header>

    <main class="scene-stage">
      <keep-alive>
        <component :is="currentComponent" />
      </keep-alive>
    </main>
  </div>
</template>

<script setup lang="ts">
import { UIcon, USegment, UTag } from '@veltra/desktop'
import { Code, Database, House, Layers, Setting } from '@veltra/icons/normal'
import { computed, markRaw, shallowRef } from 'vue'
import type { Component } from 'vue'

import './shared.css'
import SceneData from './scenes/scene-data.vue'
import SceneDevtools from './scenes/scene-devtools.vue'
import SceneOverview from './scenes/scene-overview.vue'
import SceneSettings from './scenes/scene-settings.vue'
import SceneWorkspace from './scenes/scene-workspace.vue'

type SceneKey = 'overview' | 'workspace' | 'data' | 'settings' | 'devtools'

interface SceneOption {
  value: SceneKey
  label: string
  icon: Component
  component: Component
}

const sceneItems: SceneOption[] = [
  {
    value: 'overview',
    label: '工作台概览',
    icon: markRaw(House),
    component: markRaw(SceneOverview)
  },
  {
    value: 'workspace',
    label: '项目与看板',
    icon: markRaw(Layers),
    component: markRaw(SceneWorkspace)
  },
  { value: 'data', label: '数据资产中心', icon: markRaw(Database), component: markRaw(SceneData) },
  {
    value: 'settings',
    label: '表单与配置',
    icon: markRaw(Setting),
    component: markRaw(SceneSettings)
  },
  { value: 'devtools', label: '开发者工具', icon: markRaw(Code), component: markRaw(SceneDevtools) }
]

const activeScene = shallowRef<SceneKey>('overview')

const currentComponent = computed(
  () => sceneItems.find((item) => item.value === activeScene.value)?.component ?? SceneOverview
)
</script>

<style scoped>
.showcase {
  max-width: 1320px;
  margin: 0 auto;
  padding: 28px 24px 64px;
}

.hero {
  text-align: center;
  margin-bottom: 32px;
}

.hero-top {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 16px;
  padding: 4px 12px 4px 6px;
  border-radius: 999px;
  background: var(--u-bg-color-top);
  border: 1px solid var(--u-border-color);
}

.hero-kicker {
  font-size: 12px;
  color: var(--u-text-color-second);
}

.title {
  margin: 0 0 12px;
  font-size: clamp(1.9rem, 4vw, 2.75rem);
  font-weight: 800;
  line-height: 1.15;
  letter-spacing: -0.03em;
  color: var(--u-text-color-title);
}

.subtitle {
  margin: 0 auto 24px;
  max-width: 620px;
  font-size: 15px;
  line-height: 1.6;
  color: var(--u-text-color-second);
}

.scene-switcher {
  display: flex;
  justify-content: center;
  overflow-x: auto;
  padding: 4px 0;
}

.segment-tab {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 0 4px;
}

.scene-stage {
  min-height: 520px;
}
</style>
