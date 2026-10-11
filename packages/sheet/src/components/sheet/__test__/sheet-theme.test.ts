import { currentTheme, lightTheme } from '@veltra/styles/theme'
import { Workbook } from 'infinitable/sheet'
import { afterEach, describe, expect, it, vi } from 'vite-plus/test'
import { createApp, h, nextTick, type App } from 'vue'

import { USheet } from '../../../index'
import type { SheetExposed } from '../../../types'
import { resolveCanvasThemeOverride } from '../use-sheet-grid'

/**
 * 画布主题接入（B3）：CSS 变量 → 引擎 ThemeOverride 映射 + loadTheme 后缓存
 * 实例原地换肤。变量样本值刻意避开引擎内置缺省色（body #FFF / 表头 #F5F5F5 /
 * 网格线 #E1E4E8 / 冻结线 #B6BABF），断言命中即可区分 override 生效而非缺省。
 */
const THEME_VARS = {
  '--u-bg-color-top': '#123456',
  '--u-bg-color-bottom': '#234567',
  '--u-text-color-main': '#abcdef',
  '--u-border-color': '#987654',
  '--u-border-muted-color': '#654321'
} as const

/**
 * mock 全局 getComputedStyle：仅覆盖 getPropertyValue 返回的主题 CSS 变量，
 * 未给的变量回退真实计算值，其余属性 / 方法原样透传（挂载路径中引擎
 * normalizeContainer 等仍真实消费 computed style）。返回还原函数。
 */
function mockThemeVars(vars: Record<string, string>): () => void {
  const real = getComputedStyle
  vi.stubGlobal('getComputedStyle', (el: Element, pseudo?: string | null): CSSStyleDeclaration => {
    const style = real(el, pseudo ?? undefined)
    return new Proxy(style, {
      get(target, prop) {
        if (prop === 'getPropertyValue') {
          return (name: string) => (name in vars ? vars[name]! : target.getPropertyValue(name))
        }
        const value = Reflect.get(target, prop, target)
        return typeof value === 'function' ? value.bind(target) : value
      }
    })
  })
  return () => vi.unstubAllGlobals()
}

const apps: App[] = []
const containers: HTMLElement[] = []

function mount(props: () => Record<string, unknown>): {
  exposed: { value: SheetExposed | undefined }
  el: HTMLElement
} {
  const exposed: { value: SheetExposed | undefined } = { value: undefined }
  const el = document.createElement('div')
  el.style.width = '800px'
  el.style.height = '600px'
  document.body.appendChild(el)
  containers.push(el)
  const app = createApp({
    render: () =>
      h(USheet, {
        ...props(),
        ref: (value: unknown) => {
          exposed.value = value as SheetExposed | undefined
        }
      })
  })
  app.mount(el)
  apps.push(app)
  return { exposed, el }
}

function tabs(el: HTMLElement): HTMLButtonElement[] {
  return [...el.querySelectorAll<HTMLButtonElement>('.u-sheet__tab')]
}

afterEach(() => {
  while (apps.length) apps.pop()!.unmount()
  while (containers.length) containers.pop()!.remove()
  // 主题单例复位（换肤测试副作用），避免用例间串扰；此时实例已卸载、watcher 已停
  currentTheme.value = undefined
  vi.unstubAllGlobals()
})

describe('resolveCanvasThemeOverride：CSS 变量 → 引擎 ThemeOverride', () => {
  it('变量齐全：按映射表换算（底色/表头/文字/网格线/冻结分隔线）', () => {
    const restore = mockThemeVars({ ...THEME_VARS })
    try {
      expect(resolveCanvasThemeOverride(document.createElement('div'))).toEqual({
        body: { background: '#123456', color: '#abcdef', borderColor: '#987654' },
        header: { background: '#234567', color: '#abcdef', borderColor: '#987654' },
        underlayBackgroundColor: '#123456',
        interaction: { freezeDividerColor: '#654321' },
        frameStyle: { color: '#987654' }
      })
    } finally {
      restore()
    }
  })

  it('未 loadTheme（变量全空）：返回 undefined，保持引擎缺省白底', () => {
    const restore = mockThemeVars({})
    try {
      expect(resolveCanvasThemeOverride(document.createElement('div'))).toBeUndefined()
    } finally {
      restore()
    }
  })

  it('任一变量为空：返回 undefined，不半套主题', () => {
    for (const key of Object.keys(THEME_VARS)) {
      const restore = mockThemeVars({ ...THEME_VARS, [key]: '' })
      try {
        expect(resolveCanvasThemeOverride(document.createElement('div'))).toBeUndefined()
      } finally {
        restore()
      }
    }
  })
})

describe('USheet 画布主题跟随', () => {
  it('挂载时主题已生效：构造期 override 进入引擎主题', async () => {
    const restore = mockThemeVars({ ...THEME_VARS })
    try {
      const { exposed } = mount(() => ({ workbook: new Workbook(), rows: 10, cols: 6 }))
      await nextTick()

      const theme = exposed.value!.getGrid()!.getTable().getTheme()
      expect(theme.body.background).toBe('#123456')
      expect(theme.header.background).toBe('#234567')
      expect(theme.body.color).toBe('#abcdef')
      expect(theme.header.color).toBe('#abcdef')
      expect(theme.body.borderColor).toBe('#987654')
      expect(theme.underlayBackgroundColor).toBe('#123456')
      expect(theme.interaction.freezeDividerColor).toBe('#654321')
      expect(theme.frameStyle.color).toBe('#987654')
    } finally {
      restore()
    }
  })

  it('未 loadTheme 挂载：不带 override，保持引擎内置缺省色', async () => {
    const { exposed } = mount(() => ({ workbook: new Workbook(), rows: 10, cols: 6 }))
    await nextTick()

    const theme = exposed.value!.getGrid()!.getTable().getTheme()
    expect(theme.body.background).toBe('#FFF')
    expect(theme.header.background).toBe('#F5F5F5')
  })

  it('loadTheme 实例替换：缓存中所有实例原地 updateTheme，零重建', async () => {
    const workbook = new Workbook()
    workbook.addSheet('Sheet2')
    const { exposed, el } = mount(() => ({ workbook, rows: 10, cols: 6 }))
    await nextTick()

    // 切到 Sheet2 再切回：两个实例均入缓存（LRU）
    tabs(el)[1]!.click()
    await nextTick()
    const grid2 = exposed.value!.getGrid()!
    tabs(el)[0]!.click()
    await nextTick()
    const grid1 = exposed.value!.getGrid()!
    expect(el.querySelectorAll('.u-sheet__grid-instance')).toHaveLength(2)
    const instancesBefore = [...el.querySelectorAll('.u-sheet__grid-instance')]

    // 换主题：CSS 变量就位 + loadTheme 替换主题实例 → flush 'post' 后全实例换肤
    const restore = mockThemeVars({ ...THEME_VARS })
    try {
      currentTheme.value = lightTheme
      await nextTick()
    } finally {
      restore()
    }

    // 缓存中所有实例（含隐藏的 Sheet2 实例）都已换肤
    for (const grid of [grid1, grid2]) {
      const theme = grid.getTable().getTheme()
      expect(theme.body.background).toBe('#123456')
      expect(theme.header.background).toBe('#234567')
      expect(theme.interaction.freezeDividerColor).toBe('#654321')
    }
    // 零重建：实例容器与激活实例都是原对象（updateTheme 原地覆盖，不重建网格）
    const instancesAfter = el.querySelectorAll('.u-sheet__grid-instance')
    expect(instancesAfter).toHaveLength(2)
    expect(instancesAfter[0]).toBe(instancesBefore[0])
    expect(instancesAfter[1]).toBe(instancesBefore[1])
    expect(exposed.value!.getGrid()).toBe(grid1)
  })

  it('主题 token 原地修改（deep）：同样触发换肤', async () => {
    const { exposed } = mount(() => ({ workbook: new Workbook(), rows: 10, cols: 6 }))
    await nextTick()
    const grid = exposed.value!.getGrid()!

    // 实例替换但变量未注入：不换肤，保持缺省白底
    currentTheme.value = lightTheme
    await nextTick()
    expect(grid.getTable().getTheme().body.background).toBe('#FFF')

    // 主题 token 原地改（reactive deep）→ 重读 CSS 变量 → updateTheme
    const restore = mockThemeVars({ ...THEME_VARS })
    try {
      lightTheme.theme.bg.color.top = '#123456'
      await nextTick()
    } finally {
      restore()
      lightTheme.theme.bg.color.top = '#ffffff'
    }
    expect(grid.getTable().getTheme().body.background).toBe('#123456')
  })
})
