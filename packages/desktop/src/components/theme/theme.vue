<template>
  <div :class="cls.b">
    <header :class="cls.e('header')">
      <u-segment v-model="activeScope" size="small" :items="scopeItems" />

      <div :class="cls.e('filters')">
        <u-input
          v-model="keyword"
          size="small"
          clearable
          :class="cls.e('search')"
          placeholder="搜索配置项或组件"
        >
          <template #prefix>
            <u-icon><Search /></u-icon>
          </template>
        </u-input>

        <u-button
          size="small"
          :type="changedOnly ? 'primary' : 'default'"
          :plain="changedOnly"
          @click="changedOnly = !changedOnly"
        >
          仅看改动{{ changedFieldKeys.size ? ` (${changedFieldKeys.size})` : '' }}
        </u-button>
      </div>

      <div :class="cls.e('actions')">
        <u-select
          size="small"
          :class="cls.e('preset-select')"
          :model-value="activePresetValue"
          :options="presetOptions"
          :clearable="false"
          placeholder="切换预设"
          @update:model-value="handlePresetChange"
        />
        <u-button size="small" :disabled="!changedFieldKeys.size" @click="resetAll">
          重置
        </u-button>
        <u-button size="small" type="primary" :icon="Download" @click="exportTheme">
          导出
        </u-button>
      </div>
    </header>

    <div :class="cls.e('body')">
      <aside :class="cls.e('aside')">
        <u-scroll>
          <nav :class="cls.e('nav-list')" aria-label="主题配置分组">
            <button
              v-for="section in currentScopeSections"
              :key="section.key"
              type="button"
              :class="[
                cls.e('nav-item'),
                bem.is('active', activeSection === section.key),
                bem.is('empty', !section.visibleFieldCount)
              ]"
              @click="activeSection = section.key"
            >
              <span :class="cls.e('nav-title')">{{ section.title }}</span>
              <u-tag
                v-if="section.changedCount"
                size="small"
                type="primary"
                round
                :class="cls.e('nav-badge')"
              >
                {{ section.changedCount }}
              </u-tag>
              <span v-else :class="cls.e('nav-count')">{{ section.visibleFieldCount }}</span>
            </button>
          </nav>
        </u-scroll>
      </aside>

      <main :class="cls.e('main')">
        <template v-if="activeState && activeState.visibleGroups.length">
          <div :class="cls.e('main-head')">
            <div :class="cls.e('main-title-wrap')">
              <h3 :class="cls.e('main-title')">{{ activeState.title }}</h3>
              <p :class="cls.e('main-desc')">{{ activeState.description }}</p>
            </div>
            <u-button
              v-if="activeState.changedCount"
              text
              size="small"
              :icon="Rollback"
              @click="resetSection(activeState)"
            >
              重置本组
            </u-button>
          </div>

          <u-scroll :class="cls.e('main-scroll')">
            <div :class="cls.e('groups')">
              <ThemeFieldGroup
                v-for="group in activeState.visibleGroups"
                :key="group.key"
                :group="group"
                :changed-keys="changedFieldKeys"
                :glass-state="glassState"
                :get-value="getFieldValue"
                @update="updateField"
                @reset="resetField"
                @toggle-glass="toggleGlass"
                @update-glass-blur="updateGlassBlur"
                @update-glass-saturate="updateGlassSaturate"
                @reset-glass="resetGlass"
              />
            </div>
          </u-scroll>
        </template>

        <u-empty v-else block :text="changedOnly ? '当前暂无已修改的配置项' : '没有匹配的配置项'" />
      </main>
    </div>
  </div>
</template>

<script lang="ts" setup>
import './style'
import { Download, Rollback, Search } from '@veltra/icons/normal'
import { bem } from '@veltra/utils'
import { computed, shallowRef, watchEffect } from 'vue'

import type { ThemeProps, _ThemeExposed } from '../../types'
import { UButton } from '../button'
import { UEmpty } from '../empty'
import { UIcon } from '../icon'
import { UInput } from '../input'
import { UScroll } from '../scroll'
import { USegment } from '../segment'
import { USelect } from '../select'
import { UTag } from '../tag'
import {
  THEME_PRESETS,
  THEME_SECTIONS,
  getSectionFields,
  type ThemeScope,
  type ThemeSection,
  type ThemeSubGroup
} from './schema'
import ThemeFieldGroup from './theme-field-group.vue'
import { useThemeEditor } from './use-theme-editor'

defineOptions({ name: 'UTheme' })

const { theme: propTheme } = defineProps<ThemeProps>()

const cls = bem('theme')

const activeScope = shallowRef<ThemeScope>('base')
const activeSection = shallowRef<string>(THEME_SECTIONS[0]!.key)
const keyword = shallowRef('')
const changedOnly = shallowRef(false)

const {
  activePresetValue,
  changedFieldKeys,
  glassState,
  getFieldValue,
  updateField,
  toggleGlass,
  updateGlassBlur,
  updateGlassSaturate,
  resetGlass,
  resetField,
  resetSection,
  resetAll,
  applyPreset,
  applyLightPreset,
  applyDarkPreset,
  exportTheme
} = useThemeEditor(() => propTheme)

const presetOptions = THEME_PRESETS.map((item) => ({ label: item.label, value: item.value }))

function handlePresetChange(value: string | undefined) {
  if (value) applyPreset(value)
}

interface SectionState extends ThemeSection {
  visibleGroups: ThemeSubGroup[]
  visibleFieldCount: number
  changedCount: number
}

const sectionStates = computed<SectionState[]>(() => {
  const kw = keyword.value.trim().toLowerCase()

  return THEME_SECTIONS.map((section) => {
    const sectionHit = `${section.title} ${section.description}`.toLowerCase().includes(kw)

    const visibleGroups: ThemeSubGroup[] = []
    for (const group of section.groups) {
      const groupHit = group.title.toLowerCase().includes(kw)
      const fields = group.fields.filter((field) => {
        const matchesKw =
          !kw ||
          sectionHit ||
          groupHit ||
          `${field.label} ${field.key} ${field.cssVar}`.toLowerCase().includes(kw)
        if (!matchesKw) return false
        if (changedOnly.value && !changedFieldKeys.value.has(field.key)) return false
        return true
      })
      if (fields.length > 0) {
        visibleGroups.push({ ...group, fields })
      }
    }

    const visibleFieldCount = visibleGroups.reduce((sum, g) => sum + g.fields.length, 0)
    const changedCount = getSectionFields(section).filter((f) =>
      changedFieldKeys.value.has(f.key)
    ).length

    return {
      key: section.key,
      scope: section.scope,
      title: section.title,
      description: section.description,
      groups: section.groups,
      visibleGroups,
      visibleFieldCount,
      changedCount
    }
  })
})

function scopeChangedCount(scope: ThemeScope): number {
  return sectionStates.value
    .filter((s) => s.scope === scope)
    .reduce((sum, s) => sum + s.changedCount, 0)
}

const scopeItems = computed(() => {
  const baseChanged = scopeChangedCount('base')
  const compChanged = scopeChangedCount('components')
  return [
    { label: baseChanged ? `基础样式 (${baseChanged})` : '基础样式', value: 'base' },
    { label: compChanged ? `组件样式 (${compChanged})` : '组件样式', value: 'components' }
  ]
})

const currentScopeSections = computed(() => {
  return sectionStates.value.filter((s) => s.scope === activeScope.value)
})

// 跨维度搜索或筛选时自动定位到首个有匹配项的维度与分组
watchEffect(() => {
  const currentList = currentScopeSections.value
  const hasCurrentMatch = currentList.some((s) => s.visibleFieldCount > 0)

  if (!hasCurrentMatch) {
    const otherScope: ThemeScope = activeScope.value === 'base' ? 'components' : 'base'
    const otherHit = sectionStates.value.find(
      (s) => s.scope === otherScope && s.visibleFieldCount > 0
    )
    if (otherHit) {
      activeScope.value = otherScope
      activeSection.value = otherHit.key
      return
    }
  }

  const activeInScope = currentList.find((s) => s.key === activeSection.value)
  if (!activeInScope || activeInScope.visibleFieldCount === 0) {
    const firstHit = currentList.find((s) => s.visibleFieldCount > 0) ?? currentList[0]
    if (firstHit) {
      activeSection.value = firstHit.key
    }
  }
})

const activeState = computed(() => {
  return (
    currentScopeSections.value.find((s) => s.key === activeSection.value) ??
    currentScopeSections.value[0]
  )
})

defineExpose<_ThemeExposed>({ reset: resetAll, exportTheme, applyLightPreset, applyDarkPreset })
</script>
