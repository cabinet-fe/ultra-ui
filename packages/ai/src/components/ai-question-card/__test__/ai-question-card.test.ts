// @vitest-environment happy-dom

import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test'
import { createApp, h, nextTick } from 'vue'

import { UAiQuestionCard } from '..'
import type { AiQuestionCardProps } from '../../../types'

let warnSpy: ReturnType<typeof vi.spyOn>

beforeEach(() => {
  warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
})

afterEach(() => {
  const injectionWarnings = warnSpy.mock.calls.filter((args) =>
    args.some(
      (arg) => typeof arg === 'string' && (arg.includes('injection') || arg.includes('AiChatDIKey'))
    )
  )
  expect(injectionWarnings).toEqual([])
  warnSpy.mockRestore()
})

function mountCard(props: AiQuestionCardProps & Record<string, unknown>) {
  const host = document.createElement('div')
  document.body.appendChild(host)
  const app = createApp({ render: () => h(UAiQuestionCard, props) })
  app.mount(host)
  return {
    host,
    unmount() {
      app.unmount()
      host.remove()
    }
  }
}

const actionBtn = (host: HTMLElement, text: string) =>
  [...host.querySelectorAll<HTMLElement>('.u-ai-question-card__actions button')].find((b) =>
    b.textContent?.includes(text)
  )

const optionBtn = (host: HTMLElement, text: string) =>
  [...host.querySelectorAll<HTMLElement>('.u-ai-question-card__opt')].find((el) =>
    el.textContent?.includes(text)
  )

describe('UAiQuestionCard', () => {
  it('脱离 UAiChat 独立挂载支持单选、翻页、跳过与 submit(answers)', async () => {
    const onSubmit = vi.fn()
    const { host, unmount } = mountCard({
      questions: [
        { question: '语言？', options: ['TypeScript', 'JavaScript'] },
        { question: '框架？', options: ['Vue 3 (推荐)', 'React'] },
        { question: '补充？', placeholder: '选填' }
      ],
      onSubmit
    })

    expect(host.querySelector('.u-ai-question-card__count')?.textContent).toBe('1 / 3')
    expect(actionBtn(host, '上一个')?.className).toContain('is-disabled')

    // 单选选中后自动前进到第 2 题
    optionBtn(host, 'TypeScript')!.click()
    await nextTick()
    expect(host.querySelector('.u-ai-question-card__q')?.textContent).toContain('框架？')
    expect(host.querySelector('.u-ai-question-card__badge')?.textContent?.trim()).toBe('推荐')

    // 返回第 1 题检查选中态保持
    actionBtn(host, '上一个')!.click()
    await nextTick()
    expect(optionBtn(host, 'TypeScript')?.className).toContain('is-selected')

    // 前进到第 2 题跳过，再到第 3 题自定义输入并提交
    actionBtn(host, '下一个')!.click()
    await nextTick()
    actionBtn(host, '跳过')!.click()
    await nextTick()
    expect(host.querySelector('.u-ai-question-card__q')?.textContent).toContain('补充？')

    const input = host.querySelector<HTMLInputElement>('.u-ai-question-card__input')!
    input.value = '无补充'
    input.dispatchEvent(new Event('input', { bubbles: true }))
    await nextTick()

    actionBtn(host, '提交')!.click()
    await nextTick()
    expect(onSubmit).toHaveBeenCalledWith([
      { question: '语言？', answer: 'TypeScript' },
      { question: '框架？', answer: '', skipped: true },
      { question: '补充？', answer: '无补充' }
    ])
    unmount()
  })

  it('支持多选（预设与自定义共存）与自定义输入 IME 保护', async () => {
    const onSubmit = vi.fn()
    const { host, unmount } = mountCard({
      questions: [
        {
          header: '能力',
          question: '选能力',
          multiple: true,
          options: [{ label: 'SSR', description: '服务端渲染' }, { label: 'PWA' }]
        },
        { question: '备注？' }
      ],
      onSubmit
    })

    expect(host.querySelector('.u-ai-question-card__tag')?.textContent?.trim()).toBe('能力')
    expect(host.querySelector('.u-ai-question-card__mode')?.textContent?.trim()).toBe('多选')
    expect(host.querySelector('.u-ai-question-card__opt-desc')?.textContent).toContain('服务端渲染')

    optionBtn(host, 'SSR')!.click()
    optionBtn(host, 'PWA')!.click()
    const input1 = host.querySelector<HTMLInputElement>('.u-ai-question-card__input')!
    input1.value = 'i18n'
    input1.dispatchEvent(new Event('input', { bubbles: true }))
    await nextTick()

    // 多选选中后停留在当前题，且 IME Enter 不前进
    expect(host.querySelector('.u-ai-question-card__q')?.textContent).toContain('选能力')
    input1.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Enter', isComposing: true, bubbles: true })
    )
    await nextTick()
    expect(host.querySelector('.u-ai-question-card__q')?.textContent).toContain('选能力')

    // 正常 Enter 前进到第 2 题
    input1.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }))
    await nextTick()
    expect(host.querySelector('.u-ai-question-card__q')?.textContent).toContain('备注？')

    const input2 = host.querySelector<HTMLInputElement>('.u-ai-question-card__input')!
    input2.value = '尽快'
    input2.dispatchEvent(new Event('input', { bubbles: true }))
    await nextTick()

    // keyCode 229 不误提交
    const phantom = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true })
    Object.defineProperty(phantom, 'keyCode', { value: 229 })
    input2.dispatchEvent(phantom)
    await nextTick()
    expect(onSubmit).not.toHaveBeenCalled()

    input2.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }))
    await nextTick()
    expect(onSubmit).toHaveBeenCalledWith([
      { question: '选能力', answer: 'SSR、PWA、i18n', answers: ['SSR', 'PWA', 'i18n'] },
      { question: '备注？', answer: '尽快' }
    ])
    unmount()
  })

  it('卡片快捷键 1-9 / Enter / 方向键工作正常', async () => {
    const onSubmit = vi.fn()
    const { host, unmount } = mountCard({
      questions: [
        { question: 'Q1', options: ['A', 'B'] },
        { question: 'Q2', options: ['C', 'D'] }
      ],
      onSubmit
    })

    const card = host.querySelector<HTMLElement>('.u-ai-question-card')!
    card.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }))
    await nextTick()
    expect(host.querySelector('.u-ai-question-card__q')?.textContent).toContain('Q2')

    card.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }))
    await nextTick()
    expect(host.querySelector('.u-ai-question-card__q')?.textContent).toContain('Q1')

    // 按 2 选 B（单选自动跳 Q2）
    card.dispatchEvent(new KeyboardEvent('keydown', { key: '2', bubbles: true }))
    await nextTick()
    expect(host.querySelector('.u-ai-question-card__q')?.textContent).toContain('Q2')

    // 按 1 选 C，再按 Enter 提交
    card.dispatchEvent(new KeyboardEvent('keydown', { key: '1', bubbles: true }))
    await nextTick()
    card.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }))
    await nextTick()

    expect(onSubmit).toHaveBeenCalledWith([
      { question: 'Q1', answer: 'B' },
      { question: 'Q2', answer: 'C' }
    ])
    unmount()
  })

  it('支持已答摘要态与 error 状态展示', () => {
    const answered = mountCard({
      questions: [],
      answers: [
        { question: '问题 1', answer: '答案 1' },
        { question: '问题 2', answer: '', skipped: true },
        { question: '问题 3', answer: '' }
      ]
    })
    expect(answered.host.querySelector('.u-ai-question-card__head')?.textContent).toContain(
      '已回答 3 个问题'
    )
    const results = answered.host.querySelectorAll('.u-ai-question-card__result-a')
    expect(results[0]?.textContent?.trim()).toBe('答案 1')
    expect(results[1]?.textContent?.trim()).toBe('已跳过')
    expect(results[2]?.textContent?.trim()).toBe('未作答')
    answered.unmount()

    const errored = mountCard({ questions: [{ question: 'Q' }], error: '已取消' })
    expect(errored.host.querySelector('.u-ai-question-card__status')?.textContent).toBe('已取消')
    expect(errored.host.querySelector('.u-ai-question-card__actions')).toBeFalsy()
    errored.unmount()
  })
})
