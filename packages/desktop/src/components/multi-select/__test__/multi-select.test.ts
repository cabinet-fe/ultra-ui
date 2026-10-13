import { describe, expect, it } from 'vite-plus/test'
import { createApp, h, nextTick, ref, type Ref } from 'vue'

import UMultiSelect from '../multi-select.vue'

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

function mountMultiSelect(props: Record<string, unknown> = {}) {
  const host = document.createElement('div')
  document.body.appendChild(host)

  const model = ref(props.modelValue ?? []) as Ref<any[]>
  const options = ref(props.options)

  const app = createApp({
    render() {
      return h(UMultiSelect, {
        ...props,
        modelValue: model.value,
        options: options.value as any,
        'onUpdate:modelValue': (value: any[]) => {
          model.value = value
        }
      })
    }
  })

  app.mount(host)

  return {
    host,
    model,
    options,
    unmount() {
      app.unmount()
      host.remove()
    }
  }
}

async function openDropdown(host: HTMLElement) {
  const trigger = host.querySelector('.u-multi-select') as HTMLElement
  trigger.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }))
  for (let attempt = 0; attempt < 20; attempt++) {
    await nextTick()
    await sleep(25)
    if (queryOptions().length > 0) return
  }
}

function queryOptions() {
  return [...document.body.querySelectorAll<HTMLElement>('.u-multi-select__option')]
}

function queryTags(host: HTMLElement) {
  return [...host.querySelectorAll<HTMLElement>('.u-tag')]
}

async function clickOption(option: HTMLElement) {
  option.dispatchEvent(new MouseEvent('click', { bubbles: true }))
  await nextTick()
  await sleep(50)
}

async function typeQuery(host: HTMLElement, text: string) {
  const input = host.querySelector<HTMLInputElement>('.u-multi-select__input')!
  input.focus()
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

describe('UMultiSelect labelTemplate', () => {
  const templateOptions = [
    { label: '启用', code: 'ENABLED', value: 'enabled' },
    { label: '禁用', value: 'disabled' }
  ]

  it('renders tags and panel options with the template, falling back to label', async () => {
    const { host, model, unmount } = mountMultiSelect({
      modelValue: ['enabled'],
      labelTemplate: '{label}（{code}）',
      options: templateOptions
    })

    try {
      await nextTick()
      // 已选标签渲染模板结果
      expect(queryTags(host).map((el) => el.textContent)).toEqual(['启用（ENABLED）'])

      await openDropdown(host)
      expect(queryOptions().map((el) => el.textContent)).toEqual(['启用（ENABLED）', '禁用'])

      // 勾选缺 code 的选项：标签回退纯 label
      await clickOption(queryOptions().find((el) => el.textContent === '禁用')!)
      expect(model.value).toEqual(['enabled', 'disabled'])
      expect(queryTags(host).map((el) => el.textContent)).toEqual(['启用（ENABLED）', '禁用'])
    } finally {
      unmount()
    }
  })

  it('matches filter queries against the rendered template result', async () => {
    const { host, unmount } = mountMultiSelect({
      filterable: true,
      labelTemplate: '{label}（{code}）',
      options: templateOptions
    })

    try {
      await openDropdown(host)
      // 按编码搜索命中
      await typeQuery(host, 'ENABLED')
      expect(queryOptions().map((el) => el.textContent)).toEqual(['启用（ENABLED）'])

      // 按原始 label 搜索仍然命中
      await typeQuery(host, '禁用')
      expect(queryOptions().map((el) => el.textContent)).toEqual(['禁用'])
    } finally {
      unmount()
    }
  })
})
