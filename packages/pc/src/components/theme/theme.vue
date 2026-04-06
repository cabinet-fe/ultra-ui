<template>
  <div :class="cls.b">
    <div :class="cls.e('header')">
      <div :class="cls.e('header-copy')">
        <strong>主题变量配置</strong>
      </div>
      <div :class="cls.e('tags')">
        <span :class="cls.e('tag')">基线 {{ baselineLabel }}</span>
        <span :class="cls.e('tag')">{{ changedFieldKeys.size }} 改动</span>
      </div>
    </div>

    <div :class="cls.e('toolbar')">

      <u-input
        v-model="keyword"
        :class="cls.e('search')"
        placeholder="搜索变量名、中文标签或分组"
      />

      <button
        type="button"
        :class="[cls.e('toggle'), bem.is('active', changedOnly)]"
        @click="changedOnly = !changedOnly"
      >
        {{ changedOnly ? '查看全部' : '仅看改动' }}
      </button>
    </div>

    <div :class="cls.e('body')">
      <div :class="cls.e('nav')">
        <button
          v-for="section in sectionStates"
          :key="section.key"
          type="button"
          :class="[
            cls.e('nav-item'),
            bem.is('active', activeSection === section.key),
            bem.is('disabled', !section.visibleFields.length)
          ]"
          @click="activeSection = section.key"
        >
          <span :class="cls.e('nav-main')">{{ section.title }}</span>
          <span :class="cls.e('nav-meta')">
            {{ section.visibleFields.length }}/{{ section.fields.length }}
            <template v-if="section.changedCount">
              · {{ section.changedCount }} 改动
            </template>
          </span>
        </button>
      </div>

      <div :class="cls.e('panel')">
        <div v-if="activeState" :class="cls.e('panel-head')">
        <div>
          <h4 :class="cls.e('panel-title')">{{ activeState.title }}</h4>
          <p :class="cls.e('panel-desc')">{{ activeState.description }}</p>
        </div>

        <div :class="cls.e('panel-count')">
          {{ activeState.visibleFields.length }} 项
        </div>
      </div>

      <div v-if="activeState?.visibleFields.length" :class="cls.e('list')">
        <div
          v-for="field in activeState.visibleFields"
          :key="field.key"
          :class="[cls.e('item'), bem.is('changed', isFieldChanged(field))]"
        >
          <div :class="cls.e('item-head')">
            <div :class="cls.e('item-copy')">
              <label :class="cls.e('item-label')">{{ field.label }}</label>
              <div :class="cls.e('item-meta')">
                <span :class="cls.e('item-code-label')">Theme</span>
                <code :class="cls.e('item-code')">{{ getThemePath(field.path) }}</code>
              </div>
              <div :class="cls.e('item-meta')">
                <span :class="cls.e('item-code-label')">CSS</span>
                <code :class="cls.e('item-code')">{{ getCssVarName(field.path) }}</code>
              </div>
            </div>

            <span v-if="isFieldChanged(field)" :class="cls.e('item-badge')">
              已修改
            </span>
          </div>

          <div v-if="field.kind === 'palette'" :class="cls.e('palette-field')">
            <template v-if="field.path[0] === 'color'">
              <div :class="cls.e('palette-custom')">
                <u-palette
                  :model-value="String(getFieldValue(field) ?? '')"
                  @update:model-value="value => updateField(field, value)"
                />
                <u-input
                  :model-value="String(getFieldValue(field) ?? '')"
                  placeholder="例如：#1E88E5"
                  @update:model-value="value => updateField(field, value)"
                />
              </div>
            </template>
            <template v-else>
              <div :class="cls.e('palette-custom')">
                <u-palette
                  :model-value="String(getFieldValue(field) ?? '').startsWith('var') ? '' : String(getFieldValue(field) ?? '')"
                  @update:model-value="value => updateField(field, value)"
                />
                <u-input
                  :model-value="String(getFieldValue(field) ?? '')"
                  placeholder="输入颜色或变量"
                  @update:model-value="value => updateField(field, value)"
                />
              </div>
              <div :class="cls.e('palette-var')">
                <span :class="cls.e('palette-var-label')">或选择变量</span>
                <u-select
                  :model-value="String(getFieldValue(field) ?? '').startsWith('var') ? String(getFieldValue(field) ?? '') : ''"
                  :options="colorVarOptions"
                  clearable
                  placeholder="选择预设变量"
                  @update:model-value="value => updateField(field, value ?? '')"
                >
                  <template #default="{ option }">
                    <div style="display: flex; align-items: center; gap: 8px;">
                      <div :style="`width: 14px; height: 14px; border-radius: 4px; background: ${option.value}`" />
                      <span style="font-size: 13px">{{ option.label }}</span>
                    </div>
                  </template>
                </u-select>
              </div>
            </template>
          </div>

          <component
            v-else
            :is="getFieldComponent(field)"
            :model-value="getFieldValue(field)"
            v-bind="getFieldProps(field)"
            @update:model-value="value => updateField(field, value)"
          />

          <p v-if="field.hint || field.placeholder" :class="cls.e('item-hint')">
            {{ field.hint ?? field.placeholder }}
          </p>
        </div>
      </div>

      <div v-else :class="cls.e('empty')">
        <strong>没有匹配项</strong>
        <p>换一个关键字，或关闭“仅看改动”后再继续筛选。</p>
      </div>
      </div>
    </div>

    <div :class="cls.e('actions')">
      <div :class="cls.e('preset-group')">
        <button
          type="button"
          :class="cls.e('preset')"
          @click="applyPreset('light')"
        >
          浅色预设
        </button>
        <button
          type="button"
          :class="cls.e('preset')"
          @click="applyPreset('dark')"
        >
          深色预设
        </button>
      </div>

      <u-button :class="cls.e('action-btn')" @click="handleResetTheme">
        重置
      </u-button>
      <u-button
        :class="cls.e('action-btn')"
        type="primary"
        @click="handleExportTheme"
      >
        导出
      </u-button>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { type Theme, UITheme, currentTheme, darkTheme, lightTheme, loadTheme } from '@ultra-ui/styles/theme'
import type { ThemeProps, _ThemeExposed } from '@ultra-ui/pc/types'
import { bem } from '@ultra-ui/core'
import { computed, shallowRef, watch, watchEffect } from 'vue'
import { UNumberInput } from '../number-input'
import { UPalette } from '../palette'
import { UInput } from '../input'
import { UButton } from '../button'
import { USelect } from '../select'
import { THEME_SECTIONS } from './schema'
import type { ThemeField } from './schema'

defineOptions({
  name: 'UTheme'
})

const props = defineProps<ThemeProps>()

const cls = bem('theme')

const keyword = shallowRef('')
const changedOnly = shallowRef(false)
const activeSection = shallowRef(THEME_SECTIONS[0]!.key)

const colorVarOptions = computed(() => {
  const options: { label: string; value: string }[] = []
  THEME_SECTIONS.forEach(section => {
    section.fields.forEach(field => {
      if (field.kind === 'palette') {
        const varName = `var(${getCssVarName(field.path)})`
        options.push({
          label: `${field.label}`,
          value: varName
        })
      }
    })
  })
  return options
})


const editorTheme = shallowRef<UITheme>()
const baselineTheme = shallowRef<Theme>(createThemeSnapshot(lightTheme.theme))
const baselineLabel = shallowRef('浅色预设')

const lightPreset = createThemeSnapshot(lightTheme.theme)
const darkPreset = createThemeSnapshot(darkTheme.theme)

const sourceTheme = computed(() => {
  return props.theme ?? currentTheme.value ?? lightTheme
})

watch(
  sourceTheme,
  theme => {
    if (!props.theme && theme === editorTheme.value) return

    const nextTheme = props.theme
      ? theme
      : new UITheme(createThemeSnapshot(theme.theme))

    editorTheme.value = nextTheme
    baselineTheme.value = createThemeSnapshot(nextTheme.theme)
    baselineLabel.value =
      theme === darkTheme
        ? '深色预设'
        : theme === lightTheme
          ? '浅色预设'
          : props.theme
            ? '外部主题'
            : '当前主题'

    if (!props.theme && currentTheme.value !== nextTheme) {
      loadTheme(nextTheme)
    }
  },
  { immediate: true }
)

const changedFieldKeys = computed(() => {
  const keys = new Set<string>()

  THEME_SECTIONS.forEach(section => {
    section.fields.forEach(field => {
      if (
        getByPath(editorTheme.value?.theme ?? lightTheme.theme, field.path) !==
        getByPath(baselineTheme.value, field.path)
      ) {
        keys.add(field.key)
      }
    })
  })

  return keys
})

const sectionStates = computed(() => {
  const normalizedKeyword = keyword.value.trim().toLowerCase()

  return THEME_SECTIONS.map(section => {
    const sectionMatched = `${section.title} ${section.description}`
      .toLowerCase()
      .includes(normalizedKeyword)

    const visibleFields = section.fields.filter(field => {
      const matchesKeyword =
        !normalizedKeyword ||
        sectionMatched ||
        `${field.label} ${field.key} ${getThemePath(field.path)} ${getCssVarName(field.path)}`
          .toLowerCase()
          .includes(normalizedKeyword)

      if (!matchesKeyword) return false

      if (changedOnly.value && !changedFieldKeys.value.has(field.key)) {
        return false
      }

      return true
    })

    const changedCount = section.fields.filter(field => {
      return changedFieldKeys.value.has(field.key)
    }).length

    return {
      ...section,
      visibleFields,
      changedCount
    }
  })
})

watchEffect(() => {
  const current = sectionStates.value.find(section => {
    return section.key === activeSection.value && section.visibleFields.length
  })

  if (current) return

  activeSection.value =
    sectionStates.value.find(section => section.visibleFields.length)?.key ??
    THEME_SECTIONS[0]!.key
})

const activeState = computed(() => {
  return (
    sectionStates.value.find(section => section.key === activeSection.value) ??
    sectionStates.value[0]
  )
})



function createThemeSnapshot(theme: Theme): Theme {
  return JSON.parse(JSON.stringify(theme)) as Theme
}

function getByPath(source: Record<string, any>, path: string[]) {
  return path.reduce((current, key) => current?.[key], source)
}

function setByPath(source: Record<string, any>, path: string[], value: any) {
  let current = source

  path.slice(0, -1).forEach(key => {
    current = current[key]
  })

  current[path[path.length - 1]!] = value
}

function getCssVarName(path: string[]) {
  return `--${path.join('-')}`
}

function getThemePath(path: string[]) {
  return path.reduce((expression, key) => {
    if (/^[A-Za-z_$][\w$]*$/.test(key)) {
      return `${expression}.${key}`
    }

    return `${expression}['${key}']`
  }, 'theme')
}

function getFieldComponent(field: ThemeField) {
  switch (field.kind) {
    case 'number':
      return UNumberInput
    case 'select':
      return USelect
    default:
      return UInput
  }
}

function getFieldValue(field: ThemeField) {
  return getByPath(editorTheme.value?.theme ?? lightTheme.theme, field.path)
}

function getFieldProps(field: ThemeField) {
  switch (field.kind) {
    case 'number':
      return {
        min: field.min,
        max: field.max,
        step: field.step,
        suffix: field.suffix
      }
    case 'select':
      return {
        options: field.options,
        clearable: false,
        placeholder: '请选择'
      }
    case 'input':
      return {
        placeholder: field.placeholder
      }
    default:
      return {}
  }
}

function updateField(field: ThemeField, value: string | number | undefined) {
  if (!editorTheme.value) return

  const normalizedValue =
    field.kind === 'number'
      ? typeof value === 'number'
        ? value
        : Number(value || 0)
      : String(value ?? '')

  setByPath(editorTheme.value.theme, field.path, normalizedValue)
  editorTheme.value.render()
}

function isFieldChanged(field: ThemeField) {
  return changedFieldKeys.value.has(field.key)
}

function applySnapshot(snapshot: Theme, label?: string) {
  if (!editorTheme.value) return

  Object.assign(editorTheme.value.theme, createThemeSnapshot(snapshot))
  baselineTheme.value = createThemeSnapshot(editorTheme.value.theme)

  if (label) {
    baselineLabel.value = label
  }

  editorTheme.value.render()
}

function applyPreset(type: 'light' | 'dark') {
  applySnapshot(type === 'dark' ? darkPreset : lightPreset, type === 'dark' ? '深色预设' : '浅色预设')
}

function handleResetTheme() {
  if (!editorTheme.value) return

  Object.assign(editorTheme.value.theme, createThemeSnapshot(baselineTheme.value))
  editorTheme.value.render()
}

function handleExportTheme() {
  if (!editorTheme.value) return

  const themeConfig = JSON.stringify(createThemeSnapshot(editorTheme.value.theme), null, 2)
  const blob = new Blob([themeConfig], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'theme-config.json'
  a.click()
  URL.revokeObjectURL(url)
}

defineExpose<_ThemeExposed>({
  reset: handleResetTheme,
  exportTheme: handleExportTheme,
  applyLightPreset: () => applyPreset('light'),
  applyDarkPreset: () => applyPreset('dark')
})
</script>
