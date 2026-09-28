import {
  listFormulaFunctions,
  registerFormulaFunction
} from '@veltra/sheet-core/core/formula/functions.js'
import { afterEach, describe, expect, it, vi } from 'vite-plus/test'
import { createApp, h, nextTick, type App } from 'vue'

import USheetFunctionsPopup from '../popups/functions-popup.vue'
import { COMMON_FORMULA_NAMES, FUNCTION_POPUP_CATEGORIES } from '../use-formula-suggest'

vi.mock('@veltra/desktop', async () => {
  const { defineComponent, h } = await import('vue')
  return {
    UInput: defineComponent({
      name: 'UInputStub',
      props: ['modelValue'],
      emits: ['update:modelValue'],
      setup(props, { emit }) {
        return () =>
          h('input', {
            class: 'search-stub',
            value: props.modelValue as string,
            onInput: (e: Event) => emit('update:modelValue', (e.target as HTMLInputElement).value)
          })
      }
    }),
    UScroll: defineComponent({
      name: 'UScrollStub',
      setup(_, { slots }) {
        return () => h('div', { class: 'scroll-stub' }, slots.default?.())
      }
    })
  }
})

const apps: App[] = []
const containers: HTMLElement[] = []

function mountPopup(onSelect?: (name: string) => void) {
  const el = document.createElement('div')
  document.body.appendChild(el)
  containers.push(el)
  const app = createApp({
    setup() {
      return () => h(USheetFunctionsPopup, onSelect ? { onSelect } : undefined)
    }
  })
  app.mount(el)
  apps.push(app)
  return { el }
}

async function typeKeyword(el: HTMLElement, keyword: string): Promise<void> {
  const input = el.querySelector<HTMLInputElement>('.search-stub')!
  input.value = keyword
  input.dispatchEvent(new Event('input'))
  await Promise.resolve()
}

/** 点击左侧分类导航项（等一帧渲染） */
async function clickCategory(el: HTMLElement, category: string): Promise<void> {
  const item = [...el.querySelectorAll<HTMLButtonElement>('.u-sheet__functions-nav-item')].find(
    (button) => button.textContent?.trim() === category
  )
  item!.click()
  await nextTick()
}

function signatures(el: HTMLElement): (string | null)[] {
  return [...el.querySelectorAll('.u-sheet__functions-signature')].map((node) => node.textContent)
}

function items(el: HTMLElement): HTMLElement[] {
  return [...el.querySelectorAll<HTMLElement>('.u-sheet__functions-item')]
}

afterEach(() => {
  apps.splice(0).forEach((app) => app.unmount())
  containers.splice(0).forEach((el) => el.remove())
  vi.clearAllMocks()
})

describe('USheetFunctionsPopup', () => {
  it('分类导航渲染固定集合（顺序一致）；默认「常用」列全部常用函数', () => {
    const { el } = mountPopup()
    const navLabels = [...el.querySelectorAll('.u-sheet__functions-nav-item')].map(
      (node) => node.textContent
    )
    expect(navLabels).toEqual([...FUNCTION_POPUP_CATEGORIES])

    // 「常用」= 前端固定清单（COMMON_FORMULA_NAMES 顺序），全部内置注册 → 一一列出
    expect(signatures(el).map((sig) => sig?.split('(')[0])).toEqual([...COMMON_FORMULA_NAMES])
    expect(el.querySelector('.u-sheet__functions-nav-item')!.classList.contains('is-active')).toBe(
      true
    )
  })

  it('「全部」列出全部已注册函数；分类项只列声明该分类的函数', async () => {
    registerFormulaFunction('MYTESTFN', {
      meta: { params: ['value'], description: '测试未分类自定义函数' },
      impl: () => 1
    })
    const { el } = mountPopup()

    await clickCategory(el, '全部')
    expect(items(el).length).toBe(listFormulaFunctions().length)
    // 未分类函数仅出现在「全部」
    expect(signatures(el)).toContain('MYTESTFN(value)')

    await clickCategory(el, '数学')
    const expected = listFormulaFunctions().filter((fn) => fn.category === '数学')
    expect(items(el).length).toBe(expected.length)
    expect(signatures(el)).toContain('SUM(number1, number2, ...)')
    expect(signatures(el)).not.toContain('MYTESTFN(value)')

    // 「常用」也不含未分类自定义函数
    await clickCategory(el, '常用')
    expect(signatures(el)).not.toContain('MYTESTFN(value)')
  })

  it('搜索跨分类（含未分类函数）：名称 / 描述大小写不敏感；无匹配显空态', async () => {
    registerFormulaFunction('MYTESTFN', {
      meta: { params: ['value'], description: '测试未分类自定义函数' },
      impl: () => 1
    })
    const { el } = mountPopup()
    await clickCategory(el, '数学')

    // 在「数学」分类下搜索未分类函数名 → 仍可命中（跨分类）
    await typeKeyword(el, 'mytest')
    let names = signatures(el).map((sig) => sig?.split('(')[0])
    expect(names).toEqual(['MYTESTFN'])

    // 中文描述过滤（SUM：求参数之和）
    await typeKeyword(el, '之和')
    names = signatures(el).map((sig) => sig?.split('(')[0])
    expect(names).toEqual(['SUM'])

    // 无匹配 → 空态
    await typeKeyword(el, '不存在的关键字zzz')
    expect(el.querySelectorAll('.u-sheet__functions-item').length).toBe(0)
    expect(el.querySelector('.u-sheet__functions-empty')?.textContent).toContain('无匹配函数')

    // 清空关键词 → 回到当前分类（数学）
    await typeKeyword(el, '')
    expect(items(el).length).toBe(
      listFormulaFunctions().filter((fn) => fn.category === '数学').length
    )
  })

  it('点击函数项 → emit select(name)', () => {
    const selected: string[] = []
    const { el } = mountPopup((name) => selected.push(name))

    items(el)[0]!.click()
    expect(selected).toEqual(['SUM'])
  })

  it('键盘路径：↑↓ 移动高亮（循环），Enter 确认选中', async () => {
    const selected: string[] = []
    const { el } = mountPopup((name) => selected.push(name))
    const panel = el.querySelector<HTMLElement>('.u-sheet__functions-panel')!

    // 初始高亮第一项（SUM）
    expect(items(el)[0]!.classList.contains('is-active')).toBe(true)

    panel.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown' }))
    await nextTick()
    expect(items(el)[1]!.classList.contains('is-active')).toBe(true)

    panel.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }))
    expect(selected).toEqual(['AVERAGE'])

    // ↑ 回到第一项，再 ↑ 循环到最后一项
    panel.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp' }))
    await nextTick()
    expect(items(el)[0]!.classList.contains('is-active')).toBe(true)
    panel.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp' }))
    await nextTick()
    expect(items(el).at(-1)!.classList.contains('is-active')).toBe(true)
  })
})
