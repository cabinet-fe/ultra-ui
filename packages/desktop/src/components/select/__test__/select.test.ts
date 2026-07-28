import { describe, expect, it } from 'vitest'
import { createApp, h, nextTick, ref, type Ref } from 'vue'

import USelect from '../select.vue'

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

function mountSelect(props: Record<string, unknown> = {}) {
  const host = document.createElement('div')
  document.body.appendChild(host)

  const model = ref(props.modelValue)
  const options = ref(props.options) as Ref<unknown>
  const texts: (string | undefined)[] = []

  const app = createApp({
    render() {
      return h(USelect, {
        ...props,
        modelValue: model.value,
        options: options.value as any,
        'onUpdate:modelValue': (value: unknown) => {
          model.value = value
        },
        'onUpdate:text': (text?: string) => {
          texts.push(text)
        }
      })
    }
  })

  app.mount(host)

  return {
    host,
    model,
    options,
    texts,
    unmount() {
      app.unmount()
      host.remove()
    }
  }
}

function queryOptions() {
  return [...document.body.querySelectorAll<HTMLElement>('.u-select__option')]
}

async function openDropdown(host: HTMLElement) {
  const input = host.querySelector('input')!
  // 与组件 capture 拦截一致：点击原生 input 打开面板并进入查询态
  input.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }))
  await nextTick()
  await nextTick()
}

async function typeQuery(host: HTMLElement, text: string) {
  const input = host.querySelector('input')!
  input.focus()
  // 清空查询串（查询态下 model 绑定 queryString）
  input.value = ''
  input.dispatchEvent(
    new InputEvent('input', { bubbles: true, data: '', inputType: 'deleteContentBackward' })
  )
  await nextTick()

  input.value = text
  input.dispatchEvent(
    new InputEvent('input', { bubbles: true, data: text, inputType: 'insertText' })
  )
  await nextTick()
  // 本地过滤防抖 200ms
  await sleep(250)
}

async function clickOption(option: HTMLElement) {
  option.dispatchEvent(new MouseEvent('click', { bubbles: true }))
  await nextTick()
  await sleep(50)
}

describe('USelect', () => {
  it('highlights the latest created option after consecutive creations', async () => {
    const { host, model, unmount } = mountSelect({
      filterable: true,
      creatable: true,
      options: [
        { label: '选项0', value: '0' },
        { label: '选项1', value: '1' }
      ]
    })

    try {
      // 创建并选择第一个选项
      await openDropdown(host)
      await typeQuery(host, '新A')
      expect(queryOptions().some((el) => el.textContent === '新A')).toBe(true)
      await clickOption(queryOptions().find((el) => el.textContent === '新A')!)
      expect(model.value).toBe('新A')

      // 创建并选择第二个选项
      await openDropdown(host)
      await typeQuery(host, '新B')
      expect(queryOptions().some((el) => el.textContent === '新B')).toBe(true)
      await clickOption(queryOptions().find((el) => el.textContent === '新B')!)
      expect(model.value).toBe('新B')
      expect(host.querySelector('input')!.value).toBe('新B')

      // 重新展开，高亮应落在后创建的“新B”上，而非停留在“新A”
      await openDropdown(host)
      const selected = queryOptions().filter((el) => el.classList.contains('is-selected'))
      expect(selected).toHaveLength(1)
      expect(selected[0]!.textContent).toBe('新B')
    } finally {
      unmount()
    }
  })

  it('emits update:text with option label when modelValue echoes against options', async () => {
    const { host, texts, unmount } = mountSelect({
      modelValue: 'beijing',
      options: [
        { label: '北京（最新）', value: 'beijing' },
        { label: '上海（最新）', value: 'shanghai' }
      ]
    })

    try {
      await nextTick()
      expect(texts.at(-1)).toBe('北京（最新）')
      expect(host.querySelector('input')!.value).toBe('北京（最新）')
    } finally {
      unmount()
    }
  })

  it('emits update:text on user select and clear', async () => {
    const { host, model, texts, unmount } = mountSelect({
      filterable: true,
      options: [
        { label: '北京', value: 'beijing' },
        { label: '上海', value: 'shanghai' }
      ]
    })

    try {
      await openDropdown(host)
      await clickOption(queryOptions().find((el) => el.textContent === '上海')!)
      expect(model.value).toBe('shanghai')
      expect(texts.at(-1)).toBe('上海')

      // 清除：父级清空值时回显同步发出 update:text
      model.value = undefined
      await nextTick()
      await nextTick()
      expect(texts.at(-1)).toBeUndefined()
      expect(host.querySelector('input')!.value).toBe('')
    } finally {
      unmount()
    }
  })

  it('emits update:text after async options arrive for an existing modelValue', async () => {
    const { host, options, texts, unmount } = mountSelect({ modelValue: 'shanghai', options: [] })

    try {
      await nextTick()
      expect(texts).toHaveLength(0)
      expect(host.querySelector('input')!.value).toBe('shanghai')

      options.value = [
        { label: '北京（最新）', value: 'beijing' },
        { label: '上海（最新）', value: 'shanghai' }
      ]
      await nextTick()
      await nextTick()

      expect(texts.at(-1)).toBe('上海（最新）')
      expect(host.querySelector('input')!.value).toBe('上海（最新）')
    } finally {
      unmount()
    }
  })
})
