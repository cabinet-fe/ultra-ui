// @vitest-environment happy-dom

import { celadonTheme, lightTheme } from '@veltra/styles/theme'
import { afterEach, beforeEach, describe, expect, it } from 'vite-plus/test'
import { createApp, nextTick, ref } from 'vue'

import type { ThemeExposed } from '../../../types'
import UTheme from '../theme.vue'

function getInjectedCss(): string {
  const adopted = [...document.adoptedStyleSheets]
    .flatMap((sheet) => [...sheet.cssRules].map((rule) => rule.cssText))
    .join('\n')
  const fallback = document.getElementById('ultra-ui-theme')?.textContent ?? ''
  return adopted || fallback
}

function mountTheme(customTheme = lightTheme.new({})) {
  const host = document.createElement('div')
  document.body.appendChild(host)
  const themeRef = ref<ThemeExposed>()

  const app = createApp({
    components: { UTheme },
    setup() {
      return { customTheme, themeRef }
    },
    template: '<UTheme ref="themeRef" :theme="customTheme" />'
  })

  app.mount(host)

  return {
    host,
    customTheme,
    themeRef,
    unmount() {
      app.unmount()
      host.remove()
    }
  }
}

describe('UTheme', () => {
  beforeEach(() => {
    if (!document.getElementById('pop-container')) {
      const popContainer = document.createElement('div')
      popContainer.id = 'pop-container'
      document.body.appendChild(popContainer)
    }
  })

  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('基础样式按颜色、字体排版、尺寸、其它四大类组织，且不暴露 --u- 变量名', async () => {
    const { host, unmount } = mountTheme()
    try {
      await nextTick()
      const navTitles = [...host.querySelectorAll('.u-theme__nav-title')].map((el) =>
        el.textContent?.trim()
      )
      expect(navTitles).toEqual(['颜色', '字体排版', '尺寸', '其它'])
      expect(host.textContent).not.toContain('--u-')
      expect(host.textContent).not.toContain('theme.color')
    } finally {
      unmount()
    }
  })

  it('毛玻璃开关可切换开启/关闭并注入合法 --u-bg-filter，且其它大类无裸文本输入框', async () => {
    const draft = lightTheme.new({})
    const { host, unmount } = mountTheme(draft)

    try {
      await nextTick()
      const navButtons = [...host.querySelectorAll<HTMLButtonElement>('.u-theme__nav-item')]
      const otherBtn = navButtons.find((btn) => btn.textContent?.includes('其它'))
      otherBtn!.click()
      await nextTick()

      // 编辑区仅保留数字步进器/下拉/分段/开关/滑块，无纯文本 UInput
      const rawTextInputs = [
        ...host.querySelectorAll('.u-theme__groups .u-input:not(.u-number-input):not(.u-select *)')
      ]
      expect(rawTextInputs.length).toBe(0)

      // 打开毛玻璃开关
      const switchInput = host.querySelector<HTMLInputElement>('.u-theme__glass .u-switch__native')
      expect(switchInput).not.toBeNull()
      switchInput!.checked = true
      switchInput!.dispatchEvent(new Event('input', { bubbles: true }))
      await nextTick()

      expect(draft.theme.bg.filter).toEqual({ blur: 'blur(16px)', saturate: 'saturate(180%)' })
      expect(getInjectedCss()).toContain('--u-bg-filter: blur(16px) saturate(180%)')
      expect(getInjectedCss()).toContain('--u-bg-surface-top: rgba(')

      // 关闭毛玻璃开关
      switchInput!.checked = false
      switchInput!.dispatchEvent(new Event('input', { bubbles: true }))
      await nextTick()

      expect(draft.theme.bg.filter).toEqual({ blur: 'none', saturate: 'none' })
      expect(getInjectedCss()).toContain('--u-bg-filter: none')
      expect(getInjectedCss()).toContain('--u-bg-surface-top: var(--u-bg-color-top)')
    } finally {
      unmount()
    }
  })

  it('可切换到组件样式分组并编辑组件级与基础数字项，重置可恢复基线', async () => {
    const draft = lightTheme.new({})
    const { host, themeRef, unmount } = mountTheme(draft)

    try {
      await nextTick()

      // 切换到「尺寸」并修改小号圆角
      const navButtons = [...host.querySelectorAll<HTMLButtonElement>('.u-theme__nav-item')]
      const sizeBtn = navButtons.find((btn) => btn.textContent?.includes('尺寸'))
      expect(sizeBtn).toBeDefined()
      sizeBtn!.click()
      await nextTick()

      const numberInputs = host.querySelectorAll<HTMLInputElement>('.u-theme__number-control input')
      expect(numberInputs.length).toBeGreaterThan(0)
      numberInputs[0]!.value = '14'
      numberInputs[0]!.dispatchEvent(new Event('input', { bubbles: true }))
      await nextTick()

      expect(draft.theme.radius.small).toBe(14)
      expect(host.textContent).toContain('仅看改动 (1)')
      expect(getInjectedCss()).toContain('--u-radius-small: 14px')

      // 切换到「组件样式」并选中「表格」
      const segmentItems = [...host.querySelectorAll<HTMLElement>('.u-segment__item')]
      const compSegment = segmentItems.find((el) => el.textContent?.includes('组件样式'))
      expect(compSegment).toBeDefined()
      compSegment!.click()
      await nextTick()

      const compNavs = [...host.querySelectorAll<HTMLButtonElement>('.u-theme__nav-item')]
      const tableNav = compNavs.find((btn) => btn.textContent?.includes('表格'))
      expect(tableNav).toBeDefined()
      tableNav!.click()
      await nextTick()

      draft.theme.table = { 'header-bg': '#123456' }
      draft.render()
      expect(getInjectedCss()).toContain('--u-table-header-bg: #123456')

      themeRef.value?.reset()
      await nextTick()

      expect(draft.theme.radius.small).toBe(lightTheme.theme.radius.small)
      expect(draft.theme.table).toBeUndefined()
      expect(host.textContent).not.toContain('仅看改动 (')
    } finally {
      unmount()
    }
  })

  it('暴露的 applyDarkPreset 与 applyLightPreset 可切换主题系列并更新基线', async () => {
    const draft = lightTheme.new({})
    const { themeRef, unmount } = mountTheme(draft)

    try {
      await nextTick()
      themeRef.value?.applyDarkPreset()
      await nextTick()
      expect(draft.series).toBe('dark')
      expect(document.documentElement.dataset.theme).toBe('dark')

      themeRef.value?.applyLightPreset()
      await nextTick()
      expect(draft.series).toBe('light')
      expect(document.documentElement.dataset.theme).toBe('light')
    } finally {
      unmount()
    }
  })

  it('含 nav.variants 预设切换默认侧栏风格时不误标未改动颜色，且单项恢复按当前变体基线还原', async () => {
    const draft = celadonTheme.new({})
    const { host, unmount } = mountTheme(draft)

    try {
      await nextTick()

      const compSegment = [...host.querySelectorAll<HTMLElement>('.u-segment__item')].find((el) =>
        el.textContent?.includes('组件样式')
      )
      compSegment!.click()
      await nextTick()

      const navBtn = [...host.querySelectorAll<HTMLButtonElement>('.u-theme__nav-item')].find(
        (btn) => btn.textContent?.includes('导航栏')
      )
      navBtn!.click()
      await nextTick()

      const lightOption = [...host.querySelectorAll<HTMLElement>('.u-segment__item')].find((el) =>
        el.textContent?.includes('浅色侧栏')
      )
      lightOption!.click()
      await nextTick()

      expect(host.textContent).toContain('仅看改动 (1)')
      const navColorsGroup = [...host.querySelectorAll<HTMLElement>('.u-theme__group-card')].find(
        (el) => el.textContent?.includes('当前变体色彩')
      )
      expect(navColorsGroup?.textContent).not.toContain('已修改')
    } finally {
      unmount()
    }
  })
})
