import {
  listFormulaFunctions,
  registerFormulaFunction
} from '@veltra/sheet-core/core/formula/functions'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createApp, h, type App } from 'vue'

import USheetFunctionsPopup from '../popups/functions-popup.vue'

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

function mountPopup() {
  const el = document.createElement('div')
  document.body.appendChild(el)
  containers.push(el)
  const app = createApp({
    setup() {
      return () => h(USheetFunctionsPopup)
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

afterEach(() => {
  apps.splice(0).forEach((app) => app.unmount())
  containers.splice(0).forEach((el) => el.remove())
  vi.clearAllMocks()
})

describe('USheetFunctionsPopup', () => {
  it('默认列出全部已注册函数（含签名与描述）', () => {
    const { el } = mountPopup()
    const items = el.querySelectorAll('.u-sheet__functions-item')
    expect(items.length).toBe(listFormulaFunctions().length)

    const signatures = [...el.querySelectorAll('.u-sheet__functions-signature')].map(
      (node) => node.textContent
    )
    expect(signatures).toContain('SUM(number1, number2, ...)')
    // 无参函数签名仅名称
    expect(signatures).toContain('TODAY')
  })

  it('搜索按名称 / 描述大小写不敏感过滤；无匹配显空态', async () => {
    registerFormulaFunction('MYTESTFN', {
      meta: { params: ['value'], description: '测试自定义函数' },
      impl: () => 1
    })
    const { el } = mountPopup()

    // 名称过滤（小写命中大写注册名）
    await typeKeyword(el, 'mytest')
    let items = el.querySelectorAll('.u-sheet__functions-item')
    expect(items.length).toBe(1)
    expect(items[0]!.textContent).toContain('MYTESTFN(value)')
    expect(items[0]!.textContent).toContain('测试自定义函数')

    // 中文描述过滤（SUM：求参数之和）
    await typeKeyword(el, '之和')
    items = el.querySelectorAll('.u-sheet__functions-item')
    expect(items.length).toBe(1)
    expect(items[0]!.textContent).toContain('SUM')

    // 无匹配 → 空态
    await typeKeyword(el, '不存在的关键字zzz')
    expect(el.querySelectorAll('.u-sheet__functions-item').length).toBe(0)
    expect(el.querySelector('.u-sheet__functions-empty')?.textContent).toContain('无匹配函数')

    // 清空关键词 → 恢复全量
    await typeKeyword(el, '')
    expect(el.querySelectorAll('.u-sheet__functions-item').length).toBe(
      listFormulaFunctions().length
    )
  })
})
