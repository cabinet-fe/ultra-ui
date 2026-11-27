import {
  UITheme,
  componentCssVarsDarkDecls,
  componentCssVarsLightDecls,
  currentTheme,
  lightTheme,
  loadTheme,
  type Theme,
  type ThemeSeries
} from '@veltra/styles/theme'
import { computed, shallowRef, toRaw, watch, type ComputedRef } from 'vue'

import {
  ALL_THEME_FIELDS,
  THEME_PRESETS,
  getSectionFields,
  type ThemeField,
  type ThemeSection
} from './schema'

type PlainTheme = Record<string, any>

export interface GlassFilterState {
  enabled: boolean
  blur: number
  saturate: number
}

function cloneThemeData(theme: Theme): Theme {
  return JSON.parse(JSON.stringify(toRaw(theme))) as Theme
}

function getByPath(source: PlainTheme | undefined, path: string[]): unknown {
  return path.reduce<any>((curr, key) => curr?.[key], source)
}

function setByPath(source: PlainTheme, path: string[], value: unknown): void {
  let curr = source
  for (let i = 0; i < path.length - 1; i++) {
    const key = path[i]!
    if (typeof curr[key] !== 'object' || curr[key] === null) {
      curr[key] = {}
    }
    curr = curr[key]
  }
  curr[path[path.length - 1]!] = value
}

function deleteByPath(source: PlainTheme, path: string[]): void {
  const parents: PlainTheme[] = []
  let curr: PlainTheme = source
  for (let i = 0; i < path.length - 1; i++) {
    const next = curr[path[i]!]
    if (typeof next !== 'object' || next === null) return
    parents.push(curr)
    curr = next
  }
  delete curr[path[path.length - 1]!]

  // 从内向外清理空对象，避免导出 JSON 残留空壳并确保对比一致
  for (let i = parents.length - 1; i >= 0; i--) {
    const parent = parents[i]!
    const key = path[i]!
    const child = parent[key]
    if (child && typeof child === 'object' && Object.keys(child).length === 0) {
      delete parent[key]
    } else {
      break
    }
  }
}

function expandShortHex(value: string): string {
  const lower = value.toLowerCase()
  const match = /^#([0-9a-f]{3,4})$/.exec(lower)
  if (!match) return lower
  return `#${match[1]!
    .split('')
    .map((ch) => ch + ch)
    .join('')}`
}

function asPrimitiveStr(value: unknown): string | undefined {
  if (typeof value === 'string') return value
  if (typeof value === 'number' && Number.isFinite(value)) return String(value)
  return undefined
}

function parseDurationMs(value: unknown): number | undefined {
  const str = asPrimitiveStr(value)?.trim()
  if (!str) return undefined
  if (str.endsWith('ms')) {
    const num = parseFloat(str)
    return Number.isFinite(num) ? Math.round(num) : undefined
  }
  if (str.endsWith('s')) {
    const num = parseFloat(str)
    return Number.isFinite(num) ? Math.round(num * 1000) : undefined
  }
  const num = parseFloat(str)
  return Number.isFinite(num) ? Math.round(num) : undefined
}

function parseFocusRingWidth(value: string): string {
  const trimmed = value.trim().toLowerCase()
  if (trimmed === 'none' || trimmed === '0' || trimmed === '0px') return '0'
  const match = /0\s+0\s+0\s+(\d+)px/.exec(trimmed)
  if (match) {
    const w = match[1]!
    if (w === '2' || w === '3' || w === '4') return w
  }
  return '3'
}

function parseCssFnNumber(value: unknown, fallback: number): number {
  const str = asPrimitiveStr(value)
  if (!str || str === 'none') return fallback
  const match = /(-?\d+(?:\.\d+)?)/.exec(str)
  if (!match) return fallback
  const num = parseFloat(match[1]!)
  return Number.isFinite(num) ? Math.round(num) : fallback
}

function normalizeForCompare(value: unknown, kind: ThemeField['kind']): unknown {
  if (value === undefined || value === null || value === '') return undefined
  if (kind === 'number') {
    if (typeof value === 'number') return Number.isFinite(value) ? value : undefined
    if (typeof value === 'string') {
      const num = parseFloat(value)
      return Number.isFinite(num) ? num : undefined
    }
    return undefined
  }
  if (kind === 'duration') {
    return parseDurationMs(value)
  }
  if (kind === 'color' && typeof value === 'string') {
    return expandShortHex(value.trim())
  }
  return value
}

function resolveVarValue(value: string, tokenMap: Map<string, string>): string {
  let resolved = value.trim()
  for (let depth = 0; depth < 6 && resolved.includes('var(--u-'); depth++) {
    const next = resolved.replace(/var\((--u-[\w-]+)\)/g, (raw, name: string) => {
      const hit = tokenMap.get(name)
      return hit !== undefined ? hit : raw
    })
    if (next === resolved) break
    resolved = next
  }
  return resolved
}

function buildTokenMap(ui: UITheme, series: ThemeSeries): Map<string, string> {
  const raw = toRaw(ui.theme) as Theme
  const componentDecls = series === 'dark' ? componentCssVarsDarkDecls : componentCssVarsLightDecls
  const decls = [...componentDecls, ...ui.themeToDeclarationList(raw), ...ui.navSidebarDecls(raw)]
  const map = new Map<string, string>()
  for (const decl of decls) {
    const idx = decl.indexOf(':')
    if (idx < 0) continue
    map.set(decl.slice(0, idx).trim(), decl.slice(idx + 1).trim())
  }
  return map
}

function resolvePresetKey(theme: UITheme): string {
  const hit = THEME_PRESETS.find((p) => p.theme === theme)
  if (hit) return hit.value
  const serialized = JSON.stringify(toRaw(theme.theme))
  const byContent = THEME_PRESETS.find(
    (p) => p.series === theme.series && JSON.stringify(p.theme.theme) === serialized
  )
  return byContent?.value ?? ''
}

export function useThemeEditor(getPropTheme: () => UITheme | undefined) {
  const editorTheme = shallowRef<UITheme>()
  const baselineTheme = shallowRef<Theme>(cloneThemeData(lightTheme.theme))
  const baselineSeries = shallowRef<ThemeSeries>('light')
  const activePresetValue = shallowRef<string>('light')
  const revision = shallowRef(0)

  // 记录最近一次开启毛玻璃时的非零参数，关闭后重新打开可恢复手感
  let lastGlassBlur = 16
  let lastGlassSaturate = 180

  const sourceTheme = computed(() => getPropTheme() ?? currentTheme.value ?? lightTheme)

  watch(
    sourceTheme,
    (theme) => {
      const propTheme = getPropTheme()
      if (!propTheme && theme === editorTheme.value) return

      const nextTheme = propTheme
        ? theme
        : new UITheme(cloneThemeData(theme.theme), { reactive: false, series: theme.series })

      editorTheme.value = nextTheme
      baselineTheme.value = cloneThemeData(nextTheme.theme)
      baselineSeries.value = nextTheme.series
      activePresetValue.value = resolvePresetKey(theme)

      const filter = nextTheme.theme.bg?.filter
      if (filter?.blur && filter.blur !== 'none') {
        lastGlassBlur = parseCssFnNumber(filter.blur, 16)
      }
      if (filter?.saturate && filter.saturate !== 'none') {
        lastGlassSaturate = parseCssFnNumber(filter.saturate, 180)
      }

      revision.value++

      if (!propTheme && currentTheme.value !== nextTheme) {
        loadTheme(nextTheme)
      }
    },
    { immediate: true }
  )

  const tokenMap = computed(() => {
    void revision.value
    const ui = editorTheme.value ?? lightTheme
    return buildTokenMap(ui, ui.series)
  })

  function getActiveNavVariant(rawTheme: PlainTheme): 'dark' | 'light' {
    return rawTheme.nav?.variant === 'light' ? 'light' : 'dark'
  }

  function resolveFieldPath(
    field: ThemeField,
    rawTheme: PlainTheme,
    variant = getActiveNavVariant(rawTheme)
  ): string[] {
    if (!field.navVariant) return field.path
    return ['nav', 'variants', variant, field.path[field.path.length - 1]!]
  }

  function getRawFieldValue(
    field: ThemeField,
    rawTheme: PlainTheme,
    variant = getActiveNavVariant(rawTheme)
  ): unknown {
    if (field.navVariant) {
      const variantVal = getByPath(rawTheme, resolveFieldPath(field, rawTheme, variant))
      if (variantVal !== undefined) return variantVal
      return getByPath(rawTheme, ['nav', field.path[field.path.length - 1]!])
    }
    return getByPath(rawTheme, field.path)
  }

  function renderAndNotify() {
    if (!editorTheme.value) return
    editorTheme.value.render()
    revision.value++
  }

  const changedFieldKeys: ComputedRef<Set<string>> = computed(() => {
    void revision.value
    const keys = new Set<string>()
    const current = (editorTheme.value?.theme ?? lightTheme.theme) as PlainTheme
    const base = baselineTheme.value as PlainTheme
    const activeVariant = getActiveNavVariant(current)
    const seriesChanged = (editorTheme.value?.series ?? 'light') !== baselineSeries.value

    for (const field of ALL_THEME_FIELDS) {
      const curRaw = getRawFieldValue(field, current, activeVariant)
      const baseRaw = getRawFieldValue(field, base, activeVariant)
      const curVal = normalizeForCompare(curRaw, field.kind)
      const baseVal = normalizeForCompare(baseRaw, field.kind)
      if (curVal !== baseVal || (seriesChanged && curVal !== undefined)) {
        keys.add(field.key)
      }
    }
    return keys
  })

  function getFieldValue(field: ThemeField): string | number {
    void revision.value
    const ui = editorTheme.value ?? lightTheme
    const rawTheme = ui.theme as PlainTheme
    const explicit = getRawFieldValue(field, rawTheme)

    if (field.key === 'nav.variant') {
      return explicit === 'light' ? 'light' : 'dark'
    }

    if (field.kind === 'duration') {
      const rawStr = asPrimitiveStr(explicit) ?? tokenMap.value.get(field.cssVar)
      return parseDurationMs(rawStr) ?? 200
    }

    if (field.kind === 'focus-ring') {
      const rawStr = asPrimitiveStr(explicit) ?? tokenMap.value.get(field.cssVar) ?? ''
      return parseFocusRingWidth(rawStr)
    }

    if (field.kind === 'number') {
      if (typeof explicit === 'number' && Number.isFinite(explicit)) return explicit
      const fromMap = tokenMap.value.get(field.cssVar)
      const rawStr = asPrimitiveStr(explicit) ?? fromMap
      if (rawStr) {
        const resolved = resolveVarValue(rawStr, tokenMap.value)
        const parsed = parseFloat(resolved)
        if (Number.isFinite(parsed)) return parsed
      }
      return field.min ?? 0
    }

    const fallback =
      ui.series === 'dark' && field.darkFallback !== undefined ? field.darkFallback : field.fallback
    const explicitStr = asPrimitiveStr(explicit)
    const rawStr =
      explicitStr !== undefined && explicitStr !== ''
        ? explicitStr
        : (tokenMap.value.get(field.cssVar) ?? fallback ?? '')

    if (field.kind === 'color') {
      const resolved = resolveVarValue(rawStr, tokenMap.value)
      if (
        !resolved ||
        resolved === 'inherit' ||
        resolved === 'none' ||
        resolved === 'transparent'
      ) {
        return ''
      }
      return resolved
    }

    return rawStr
  }

  function updateField(field: ThemeField, value: string | number | undefined) {
    if (!editorTheme.value) return
    const ui = editorTheme.value
    const rawTheme = ui.theme as PlainTheme
    const targetPath = resolveFieldPath(field, rawTheme)

    if (field.kind === 'duration') {
      const ms = typeof value === 'number' ? value : parseFloat(String(value ?? ''))
      if (!Number.isFinite(ms)) {
        const baseVal = getByPath(baselineTheme.value as PlainTheme, targetPath)
        setByPath(rawTheme, targetPath, baseVal ?? '0.2s')
      } else {
        const clamped = Math.max(0, Math.min(1000, Math.round(ms)))
        setByPath(rawTheme, targetPath, `${Number((clamped / 1000).toFixed(3))}s`)
      }
      renderAndNotify()
      return
    }

    if (field.kind === 'focus-ring') {
      const width = String(value ?? '3')
      if (width === '0') {
        setByPath(rawTheme, targetPath, 'none')
      } else {
        const token = field.focusToken ?? 'primary'
        const alpha = ui.series === 'dark' ? '35' : '28'
        setByPath(rawTheme, targetPath, `0 0 0 ${width}px var(--u-color-${token}-a-${alpha})`)
      }
      renderAndNotify()
      return
    }

    if (field.kind === 'number') {
      const num = typeof value === 'number' ? value : parseFloat(String(value ?? ''))
      if (!Number.isFinite(num)) {
        if (field.scope === 'components') {
          deleteByPath(rawTheme, targetPath)
        } else {
          const baseVal = getByPath(baselineTheme.value as PlainTheme, targetPath)
          setByPath(rawTheme, targetPath, baseVal ?? field.min ?? 0)
        }
      } else {
        setByPath(rawTheme, targetPath, num)
      }
      renderAndNotify()
      return
    }

    const strVal = value === undefined || value === null ? '' : String(value)

    if (strVal.trim() === '') {
      if (field.scope === 'components') {
        deleteByPath(rawTheme, targetPath)
      } else if (field.kind === 'color') {
        // 全局色被调色盘清空时回退到基线值，避免整站色彩变量失效
        const baseVal = getByPath(baselineTheme.value as PlainTheme, targetPath)
        if (baseVal !== undefined) setByPath(rawTheme, targetPath, baseVal)
      } else {
        setByPath(rawTheme, targetPath, '')
      }
    } else {
      setByPath(rawTheme, targetPath, strVal)
    }

    renderAndNotify()
  }

  const glassState: ComputedRef<GlassFilterState> = computed(() => {
    void revision.value
    const filter = editorTheme.value?.theme.bg?.filter
    const blurStr = filter?.blur ?? 'none'
    const satStr = filter?.saturate ?? 'none'
    const enabled = blurStr !== 'none'
    return {
      enabled,
      blur: enabled ? parseCssFnNumber(blurStr, lastGlassBlur) : lastGlassBlur,
      saturate:
        enabled && satStr !== 'none'
          ? parseCssFnNumber(satStr, lastGlassSaturate)
          : lastGlassSaturate
    }
  })

  function toggleGlass(enabled: boolean) {
    if (!editorTheme.value) return
    const rawTheme = editorTheme.value.theme as PlainTheme
    if (enabled) {
      setByPath(rawTheme, ['bg', 'filter', 'blur'], `blur(${lastGlassBlur}px)`)
      setByPath(rawTheme, ['bg', 'filter', 'saturate'], `saturate(${lastGlassSaturate}%)`)
    } else {
      setByPath(rawTheme, ['bg', 'filter', 'blur'], 'none')
      setByPath(rawTheme, ['bg', 'filter', 'saturate'], 'none')
    }
    renderAndNotify()
  }

  function updateGlassBlur(px: number) {
    if (!editorTheme.value) return
    const next = Math.max(0, Math.min(40, Math.round(px)))
    lastGlassBlur = next
    const rawTheme = editorTheme.value.theme as PlainTheme
    setByPath(rawTheme, ['bg', 'filter', 'blur'], `blur(${next}px)`)
    const sat = getByPath(rawTheme, ['bg', 'filter', 'saturate'])
    if (!sat || sat === 'none') {
      setByPath(rawTheme, ['bg', 'filter', 'saturate'], `saturate(${lastGlassSaturate}%)`)
    }
    renderAndNotify()
  }

  function updateGlassSaturate(pct: number) {
    if (!editorTheme.value) return
    const next = Math.max(100, Math.min(260, Math.round(pct)))
    lastGlassSaturate = next
    const rawTheme = editorTheme.value.theme as PlainTheme
    setByPath(rawTheme, ['bg', 'filter', 'saturate'], `saturate(${next}%)`)
    const blur = getByPath(rawTheme, ['bg', 'filter', 'blur'])
    if (!blur || blur === 'none') {
      setByPath(rawTheme, ['bg', 'filter', 'blur'], `blur(${lastGlassBlur}px)`)
    }
    renderAndNotify()
  }

  function resetGlass() {
    if (!editorTheme.value) return
    const rawTheme = editorTheme.value.theme as PlainTheme
    const baseFilter = baselineTheme.value.bg?.filter
    setByPath(rawTheme, ['bg', 'filter', 'blur'], baseFilter?.blur ?? 'none')
    setByPath(rawTheme, ['bg', 'filter', 'saturate'], baseFilter?.saturate ?? 'none')
    if (baseFilter?.blur && baseFilter.blur !== 'none') {
      lastGlassBlur = parseCssFnNumber(baseFilter.blur, 16)
    }
    if (baseFilter?.saturate && baseFilter.saturate !== 'none') {
      lastGlassSaturate = parseCssFnNumber(baseFilter.saturate, 180)
    }
    renderAndNotify()
  }

  function resetField(field: ThemeField) {
    if (!editorTheme.value) return
    const rawTheme = editorTheme.value.theme as PlainTheme
    const baseTheme = baselineTheme.value as PlainTheme
    const activeVariant = getActiveNavVariant(rawTheme)
    const targetPath = resolveFieldPath(field, rawTheme, activeVariant)
    const baseVal = getRawFieldValue(field, baseTheme, activeVariant)

    if (baseVal === undefined) {
      deleteByPath(rawTheme, targetPath)
    } else {
      setByPath(rawTheme, targetPath, JSON.parse(JSON.stringify(baseVal)))
    }
    renderAndNotify()
  }

  function resetSection(section: ThemeSection) {
    if (!editorTheme.value) return
    const rawTheme = editorTheme.value.theme as PlainTheme
    const baseTheme = baselineTheme.value as PlainTheme
    for (const field of getSectionFields(section)) {
      if (field.navVariant) {
        for (const variant of ['dark', 'light'] as const) {
          const targetPath = resolveFieldPath(field, rawTheme, variant)
          const baseVal = getByPath(baseTheme, targetPath)
          if (baseVal === undefined) {
            deleteByPath(rawTheme, targetPath)
          } else {
            setByPath(rawTheme, targetPath, JSON.parse(JSON.stringify(baseVal)))
          }
        }
        continue
      }
      const targetPath = resolveFieldPath(field, rawTheme)
      const baseVal = getRawFieldValue(field, baseTheme)
      if (baseVal === undefined) {
        deleteByPath(rawTheme, targetPath)
      } else {
        setByPath(rawTheme, targetPath, JSON.parse(JSON.stringify(baseVal)))
      }
    }
    renderAndNotify()
  }

  function replaceThemeContent(target: PlainTheme, snapshot: Theme) {
    const next = cloneThemeData(snapshot) as PlainTheme
    for (const key of Object.keys(target)) {
      if (!(key in next)) delete target[key]
    }
    Object.assign(target, next)
  }

  function applyPreset(presetValue: string) {
    const preset = THEME_PRESETS.find((item) => item.value === presetValue)
    if (!preset || !editorTheme.value) return
    editorTheme.value.series = preset.series
    replaceThemeContent(editorTheme.value.theme as PlainTheme, preset.theme.theme)
    baselineTheme.value = cloneThemeData(editorTheme.value.theme)
    baselineSeries.value = preset.series
    activePresetValue.value = preset.value

    const filter = preset.theme.theme.bg?.filter
    if (filter?.blur && filter.blur !== 'none') {
      lastGlassBlur = parseCssFnNumber(filter.blur, 16)
    }
    if (filter?.saturate && filter.saturate !== 'none') {
      lastGlassSaturate = parseCssFnNumber(filter.saturate, 180)
    }

    renderAndNotify()
  }

  function resetAll() {
    if (!editorTheme.value) return
    editorTheme.value.series = baselineSeries.value
    replaceThemeContent(editorTheme.value.theme as PlainTheme, baselineTheme.value)
    renderAndNotify()
  }

  function exportTheme() {
    if (!editorTheme.value) return
    const themeConfig = JSON.stringify(cloneThemeData(editorTheme.value.theme), null, 2)
    const blob = new Blob([themeConfig], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'theme-config.json'
    a.click()
    URL.revokeObjectURL(url)
  }

  return {
    editorTheme,
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
    applyLightPreset: () => applyPreset('light'),
    applyDarkPreset: () => applyPreset('dark'),
    exportTheme
  }
}
