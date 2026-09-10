import { describe, expect, it } from 'vitest'
import { createApp, h, nextTick, reactive, ref } from 'vue'

import { UInput } from '../../input'
import { USelect } from '../../select'
import { UForm } from '../index'

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

const behaviorOptions = [
  { label: '事件', value: 'event' },
  { label: '接口', value: 'api' }
]

async function openSelect(host: HTMLElement) {
  const input = host.querySelector('input')!
  input.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }))
  await nextTick()
  await nextTick()
}

async function clickSelectOption(label: string) {
  const option = [...document.body.querySelectorAll<HTMLElement>('.u-select__option')].find(
    (el) => el.textContent === label
  )
  expect(option, `选项「${label}」应存在`).toBeTruthy()
  option!.dispatchEvent(new MouseEvent('click', { bubbles: true }))
  await nextTick()
  await sleep(50)
}

describe('UForm field events', () => {
  it('field:update and field:change are separate', async () => {
    const host = document.createElement('div')
    document.body.appendChild(host)

    const model = reactive({ behavior: 'event' })
    const updates: { field: string; value: unknown }[] = []
    const changes: { field: string; args: unknown[] }[] = []

    const app = createApp({
      render() {
        return h(
          UForm,
          {
            model,
            'onField:update': (field: string, value: unknown) => {
              updates.push({ field, value })
            },
            'onField:change': (field: string, ...args: unknown[]) => {
              changes.push({ field, args })
            }
          },
          {
            default: () =>
              h(USelect, { field: 'behavior', label: '行为', options: behaviorOptions })
          }
        )
      }
    })

    app.mount(host)
    updates.length = 0
    changes.length = 0

    model.behavior = 'api'
    await nextTick()

    expect(updates.some((item) => item.field === 'behavior' && item.value === 'api')).toBe(true)
    expect(changes).toHaveLength(0)

    await openSelect(host)
    await clickSelectOption('事件')

    expect(changes).toHaveLength(1)
    expect(changes[0]).toEqual({ field: 'behavior', args: [{ label: '事件', value: 'event' }] })

    app.unmount()
    host.remove()
  })

  it('父级重渲染时动态 props 同步到插槽控件', async () => {
    const host = document.createElement('div')
    document.body.appendChild(host)

    const model = reactive({ username: '' })
    const disabled = ref(false)
    const placeholder = ref('第一次')

    const app = createApp({
      render() {
        return h(
          UForm,
          { model },
          {
            default: () =>
              h(UInput, {
                field: 'username',
                label: '账号',
                disabled: disabled.value,
                placeholder: placeholder.value
              })
          }
        )
      }
    })

    app.mount(host)

    const input = () => host.querySelector('input')!
    expect(input().disabled).toBe(false)
    expect(input().placeholder).toBe('第一次')

    disabled.value = true
    placeholder.value = '第二次'
    await nextTick()

    expect(input().disabled).toBe(true)
    expect(input().placeholder).toBe('第二次')

    app.unmount()
    host.remove()
  })
})
