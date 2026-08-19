<template>
  <div class="theme-editor">
    <header class="theme-editor__toolbar">
      <u-input
        v-model="keyword"
        class="theme-editor__search"
        size="small"
        clearable
        placeholder="搜索中文标签 / 字段路径 / CSS 变量名"
      />

      <u-radio-group v-model="mode" :items="modeItems" size="small" />

      <span class="theme-editor__stat" :class="{ 'is-active': changedKeys.size > 0 }">
        {{ changedKeys.size }} 处改动
      </span>

      <div class="theme-editor__actions">
        <u-button size="small" @click="handleReloadPreset">重载预设</u-button>
        <u-button size="small" @click="handleReset">重置</u-button>
        <u-button size="small" type="primary" @click="handleExport">导出 JSON</u-button>
      </div>
    </header>

    <p class="theme-editor__hint">
      修改会实时写入 <code>&lt;html&gt;</code> 上的 <code>--u-*</code> CSS 变量并作用于整个
      playground；切换「浅色 / 深色」标签会同时切换全局明暗模式，便于对照编辑两套主题。
    </p>

    <section v-for="section in visibleSections" :key="section.key" class="theme-editor__section">
      <header class="theme-editor__section-head" @click="toggleSection(section.key)">
        <u-icon
          class="theme-editor__chevron"
          :class="{ 'is-collapsed': collapsedKeys.has(section.key) }"
        >
          <ArrowDown />
        </u-icon>
        <span class="theme-editor__section-title">{{ section.title }}</span>
        <span class="theme-editor__section-desc">{{ section.description }}</span>
        <span class="theme-editor__section-meta">
          {{ section.fields.length }} 项
          <template v-if="sectionChangedCount(section.key)">
            · {{ sectionChangedCount(section.key) }} 改动
          </template>
        </span>
      </header>

      <div v-show="!collapsedKeys.has(section.key)" class="theme-editor__grid">
        <div
          v-for="field in section.fields"
          :key="field.key"
          class="theme-editor__field"
          :class="{ 'is-changed': isChanged(field) }"
        >
          <div class="theme-editor__field-head">
            <span class="theme-editor__field-label">{{ field.label }}</span>
            <code class="theme-editor__field-var">{{ cssVarName(field.path) }}</code>
          </div>

          <div v-if="field.kind === 'color'" class="theme-editor__color-row">
            <u-palette
              size="small"
              :model-value="isHexColor(getValue(field)) ? getValue(field) : ''"
              @update:model-value="(v) => setValue(field, v)"
            />
            <u-input
              size="small"
              :model-value="getValue(field)"
              placeholder="#1E88E5 或 var(...)"
              @update:model-value="(v) => setValue(field, v)"
            />
          </div>

          <u-number-input
            v-else-if="field.kind === 'number'"
            size="small"
            :model-value="Number(getValue(field)) || 0"
            :min="field.min"
            :max="field.max"
            :step="field.step"
            @update:model-value="(v) => setValue(field, v)"
          />

          <u-select
            v-else-if="field.kind === 'select'"
            size="small"
            :model-value="getValue(field)"
            :options="field.options"
            @update:model-value="(v) => setValue(field, v)"
          />

          <u-input
            v-else
            size="small"
            :model-value="getValue(field)"
            :placeholder="field.placeholder"
            @update:model-value="(v) => setValue(field, v)"
          />
        </div>
      </div>
    </section>

    <div v-if="!visibleSections.length" class="theme-editor__empty">
      没有匹配「{{ keyword }}」的主题变量
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ArrowDown } from '@veltra/icons/normal'
import {
  UITheme,
  ancientLightTheme,
  darkTheme,
  glassDarkTheme,
  glassLightTheme,
  heroDarkTheme,
  heroLightTheme,
  lightTheme,
  shadcnDarkTheme,
  shadcnLightTheme,
  type Theme
} from '@veltra/styles/theme'
import { computed, reactive, shallowRef, watch } from 'vue'

import { THEME_SECTIONS, cssVarName, type ThemeField } from './schema'

type ThemeMode = 'light' | 'dark'

type PlainTheme = Record<string, any>

/** 与 App.vue 设置抽屉一致的主题包映射 */
function getThemesByPreset(preset: string): { light: UITheme; dark: UITheme } {
  if (preset === 'ancient') return { light: ancientLightTheme, dark: darkTheme }
  if (preset === 'shadcn') return { light: shadcnLightTheme, dark: shadcnDarkTheme }
  if (preset === 'hero') return { light: heroLightTheme, dark: heroDarkTheme }
  if (preset === 'glass') return { light: glassLightTheme, dark: glassDarkTheme }
  return { light: lightTheme, dark: darkTheme }
}

function readInitialMode(): ThemeMode {
  const stored = localStorage.getItem('themeMode')
  const attr = document.documentElement.dataset.theme
  const mode = attr === 'light' || attr === 'dark' ? attr : stored
  if (mode === 'light' || mode === 'dark') return mode
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function cloneTheme(theme: UITheme): PlainTheme {
  return JSON.parse(JSON.stringify(theme.theme)) as PlainTheme
}

const mode = shallowRef<ThemeMode>(readInitialMode())
const keyword = shallowRef('')
const collapsedKeys = reactive(new Set<string>())

const modeItems = [
  { label: '浅色', value: 'light' },
  { label: '深色', value: 'dark' }
]

function initialPreset() {
  const preset = localStorage.getItem('themePreset') || 'default'
  return getThemesByPreset(preset)
}

const preset0 = initialPreset()

/**
 * 可编辑的浅 / 深主题副本。
 * 注意必须深拷贝预设：UITheme 构造时对传入对象做 reactive()，
 * 直接包预设会改到全局共享的 preset 单例。
 */
const drafts = reactive<{ light: PlainTheme; dark: PlainTheme }>({
  light: cloneTheme(preset0.light),
  dark: cloneTheme(preset0.dark)
})
/** 初始快照，用于「改动」标记 */
const baselines = { light: cloneTheme(preset0.light), dark: cloneTheme(preset0.dark) }

// UITheme 的 reactive(theme) 包的是同一对象，drafts 的修改对其可见
const lightUI = new UITheme(drafts.light as Theme, { reactive: false })
const darkUI = new UITheme(drafts.dark as Theme, { reactive: false })

/** 用快照整体替换 draft 内容（保持对象身份，lightUI/darkUI 不失联） */
function replaceDraft(mode: ThemeMode, snapshot: PlainTheme) {
  const draft = drafts[mode]
  Object.keys(draft).forEach((k) => {
    if (!(k in snapshot)) delete draft[k]
  })
  Object.assign(draft, snapshot)
}

function loadFromPreset() {
  const { light, dark } = initialPreset()
  replaceDraft('light', cloneTheme(light))
  replaceDraft('dark', cloneTheme(dark))
  baselines.light = cloneTheme(light)
  baselines.dark = cloneTheme(dark)
}

/** 把当前草稿注入 :root（light / dark 两个声明块，保留全局明暗切换能力） */
function apply() {
  UITheme.injectBuiltInThemes(lightUI, darkUI)
}

apply()
UITheme.setTheme(mode.value)

watch(mode, (m) => {
  UITheme.setTheme(m)
})

function getByPath(source: PlainTheme, path: string[]) {
  return path.reduce<any>((current, key) => current?.[key], source)
}

function setByPath(source: PlainTheme, path: string[], value: unknown) {
  let current = source
  path.slice(0, -1).forEach((key) => {
    if (typeof current[key] !== 'object' || current[key] === null) current[key] = {}
    current = current[key]
  })
  current[path[path.length - 1]!] = value
}

function getValue(field: ThemeField): string {
  const v = getByPath(drafts[mode.value], field.path)
  return v === undefined || v === null ? '' : String(v)
}

function setValue(field: ThemeField, value: unknown) {
  const normalized =
    field.kind === 'number'
      ? typeof value === 'number'
        ? value
        : Number(value) || 0
      : String(value ?? '')
  setByPath(drafts[mode.value], field.path, normalized)
  apply()
}

function isHexColor(value: string): boolean {
  return /^#(?:[0-9a-f]{3}|[0-9a-f]{4}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(value)
}

/** 改动比较归一化：忽略大小写并展开短 hex（UPalette 挂载时会把 #fff 重写为 #FFFFFF 大写） */
function normalizeForCompare(value: unknown): unknown {
  if (typeof value !== 'string') return value
  const lower = value.toLowerCase()
  const m = /^#([0-9a-f]{3,4})$/.exec(lower)
  if (!m) return lower
  return `#${m[1]!
    .split('')
    .map((c) => c + c)
    .join('')}`
}

const changedKeys = computed(() => {
  const keys = new Set<string>()
  for (const m of ['light', 'dark'] as const) {
    THEME_SECTIONS.forEach((section) => {
      section.fields.forEach((field) => {
        const current = getByPath(drafts[m], field.path)
        const baseline = getByPath(baselines[m], field.path)
        const a = normalizeForCompare(current)
        const b = normalizeForCompare(baseline)
        if (a !== b) {
          keys.add(`${m}:${field.key}`)
        }
      })
    })
  }
  return keys
})

function isChanged(field: ThemeField): boolean {
  return changedKeys.value.has(`${mode.value}:${field.key}`)
}

function sectionChangedCount(sectionKey: string): number {
  const section = THEME_SECTIONS.find((s) => s.key === sectionKey)
  if (!section) return 0
  return section.fields.filter((f) => changedKeys.value.has(`${mode.value}:${f.key}`)).length
}

const visibleSections = computed(() => {
  const kw = keyword.value.trim().toLowerCase()
  if (!kw) return THEME_SECTIONS
  return THEME_SECTIONS.map((section) => {
    const sectionHit = `${section.title}${section.description}`.toLowerCase().includes(kw)
    const fields = section.fields.filter((field) => {
      return (
        sectionHit ||
        `${field.label}${field.key}${cssVarName(field.path)}`.toLowerCase().includes(kw)
      )
    })
    return { key: section.key, title: section.title, description: section.description, fields }
  }).filter((section) => section.fields.length > 0)
})

function toggleSection(key: string) {
  if (collapsedKeys.has(key)) {
    collapsedKeys.delete(key)
  } else {
    collapsedKeys.add(key)
  }
}

function handleReset() {
  replaceDraft('light', JSON.parse(JSON.stringify(baselines.light)) as PlainTheme)
  replaceDraft('dark', JSON.parse(JSON.stringify(baselines.dark)) as PlainTheme)
  apply()
}

function handleReloadPreset() {
  loadFromPreset()
  apply()
}

function handleExport() {
  const data = {
    light: JSON.parse(JSON.stringify(drafts.light)),
    dark: JSON.parse(JSON.stringify(drafts.dark))
  }
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'ultra-ui-theme.json'
  a.click()
  URL.revokeObjectURL(url)
}
</script>

<style lang="scss" scoped>
@function use-var($basename, $nodes...) {
  $suffix: '';

  @each $node in $nodes {
    $suffix: $suffix + '-' + $node;
  }

  @return var(--u-#{$basename}#{$suffix});
}

.theme-editor {
  display: flex;
  flex-direction: column;
  gap: 12px;

  &__toolbar {
    display: flex;
    align-items: center;
    gap: 12px;
    flex-wrap: wrap;
    padding: 10px 12px;
    border: 1px solid use-var(border, color);
    border-radius: use-var(radius);
    background: use-var(bg-color, top);
    position: sticky;
    top: 0;
    z-index: 5;
  }

  &__search {
    width: 260px;
  }

  &__stat {
    font-size: 12px;
    color: use-var(text-color, second);
    padding: 2px 10px;
    border-radius: 999px;
    border: 1px solid use-var(border, color);

    &.is-active {
      color: use-var(color, primary);
      border-color: use-var(color, primary);
    }
  }

  &__actions {
    margin-left: auto;
    display: flex;
    gap: 8px;
  }

  &__hint {
    margin: 0;
    font-size: 12px;
    color: use-var(text-color, second);
    line-height: 1.6;

    code {
      font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
      background: use-var(bg-color, hover);
      padding: 1px 5px;
      border-radius: 4px;
    }
  }

  &__section {
    border: 1px solid use-var(border, color);
    border-radius: use-var(radius);
    background: use-var(bg-color, top);
    overflow: hidden;
  }

  &__section-head {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 12px;
    cursor: pointer;
    user-select: none;
    border-bottom: 1px solid use-var(border, color);
    background: use-var(bg-color, middle);

    &:hover {
      background: use-var(bg-color, hover);
    }
  }

  &__chevron {
    font-size: 12px;
    color: use-var(text-color, second);
    transition: transform 0.2s ease;

    &.is-collapsed {
      transform: rotate(-90deg);
    }
  }

  &__section-title {
    font-size: 13px;
    font-weight: 600;
    color: use-var(text-color, title);
  }

  &__section-desc {
    font-size: 12px;
    color: use-var(text-color, second);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__section-meta {
    margin-left: auto;
    flex-shrink: 0;
    font-size: 12px;
    color: use-var(text-color, assist);
  }

  &__grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(230px, 1fr));
    gap: 1px;
    background: use-var(border, color);
  }

  &__field {
    padding: 8px 12px 10px;
    background: use-var(bg-color, top);
    display: flex;
    flex-direction: column;
    gap: 6px;
    position: relative;

    &.is-changed::before {
      content: '';
      position: absolute;
      left: 0;
      top: 8px;
      bottom: 8px;
      width: 2px;
      border-radius: 2px;
      background: use-var(color, primary);
    }
  }

  &__field-head {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 8px;
  }

  &__field-label {
    font-size: 12px;
    color: use-var(text-color, main);
    font-weight: 500;
    white-space: nowrap;
  }

  &__field-var {
    font-size: 11px;
    color: use-var(text-color, assist);
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__color-row {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  &__empty {
    padding: 48px 0;
    text-align: center;
    font-size: 13px;
    color: use-var(text-color, second);
    border: 1px dashed use-var(border, color);
    border-radius: use-var(radius);
  }
}
</style>
