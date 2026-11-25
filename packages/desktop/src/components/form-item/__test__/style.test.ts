import { fileURLToPath } from 'node:url'

import { compile, NodePackageImporter } from 'sass-embedded'
import { describe, expect, it } from 'vite-plus/test'

const css = compile(fileURLToPath(new URL('../style.scss', import.meta.url)), {
  importers: [new NodePackageImporter(fileURLToPath(new URL('../../../../../..', import.meta.url)))]
}).css

/** 取指定选择器那条规则的声明表；没有这条规则时为 undefined */
function declarations(selector: string): Record<string, string> | undefined {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const body = css
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .match(new RegExp(`(?:^|[{}])\\s*${escaped}\\s*\\{([^}]*)\\}`))?.[1]
  if (!body) return undefined

  return Object.fromEntries(
    body
      .split(';')
      .map((declaration) => declaration.trim())
      .filter(Boolean)
      .map((declaration) => {
        const colon = declaration.indexOf(':')
        return [declaration.slice(0, colon), declaration.slice(colon + 1).trim()]
      })
  )
}

const topLabel = '.u-form-item.is-label-top .u-form-item__label'
const topRequired = `${topLabel}.is-required`

describe('UFormItem 样式', () => {
  describe('顶部布局', () => {
    it('label 用主文字色、字重 500、20/14 行高，与控件间距 8px', () => {
      const label = declarations(topLabel)!

      expect(label).toMatchObject({
        color: 'var(--u-text-color-main)',
        'font-weight': '500',
        'padding-bottom': '8px'
      })
      // 无单位比例，三档字号下按同一比例缩放
      expect(label['line-height']).toMatch(/^\d+(\.\d+)?$/)
      expect(Number(label['line-height'])).toBeCloseTo(20 / 14, 6)
    })

    it('必填星号改由 ::after 输出在文字后', () => {
      expect(declarations(`${topRequired}::before`)).toEqual({ content: 'none' })
      expect(declarations(`${topRequired}::after`)).toEqual({
        content: '"*"',
        'padding-left': '2px',
        color: 'var(--u-color-danger)'
      })
    })

    it('错误文字只在既有外高内下移', () => {
      expect(declarations('.u-form-item.is-label-top .u-form-item__error')).toEqual({
        'padding-top': '2px'
      })
    })

    it('只读态 label 退为次级色的规则比顶部分支多一个类', () => {
      // form 的只读规则（.u-form.is-readonly .u-form-item__label）与顶部分支同为三个类，
      // 两份样式的加载顺序不定，同权重压不住顶部分支的主文字色
      expect(
        declarations('.u-form.is-readonly .u-form-item.is-label-top .u-form-item__label')
      ).toEqual({ color: 'var(--u-text-color-second)' })
    })
  })

  describe('左侧布局（基础规则现状）', () => {
    it('label', () => {
      expect(declarations('.u-form-item__label')).toMatchObject({
        color: 'var(--u-text-color-main)',
        'line-height': '1.3',
        'font-weight': '400',
        'padding-right': '8px',
        'text-align': 'right'
      })
    })

    it('必填星号仍由 ::before 输出在文字前', () => {
      expect(declarations('.u-form-item__label.is-required::before')).toEqual({
        content: '"*"',
        'padding-right': '2px',
        color: 'var(--u-color-danger)'
      })
      expect(declarations('.u-form-item__label.is-required::after')).toBeUndefined()
    })

    it('错误位外高与行高', () => {
      expect(declarations('.u-form-item__error')).toMatchObject({
        height: 'calc(var(--u-font-size-main-default) + 4px)',
        'line-height': 'calc(var(--u-font-size-main-default) + 2px)'
      })
    })
  })
})
