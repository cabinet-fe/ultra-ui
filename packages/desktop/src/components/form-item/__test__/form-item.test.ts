import { describe, expect, it } from 'vitest'
import { createApp, h, nextTick, reactive, ref } from 'vue'

import { UForm } from '../../form'
import { UInput } from '../../input'
import { USelect } from '../../select'
import { UFormItem } from '../index'

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

describe('UFormItem change', () => {
  it('forwards Select change with option object', async () => {
    const host = document.createElement('div')
    document.body.appendChild(host)

    const model = reactive({ behavior: 'event' })
    const itemChanges: unknown[][] = []
    const formChanges: { field: string; args: unknown[] }[] = []

    const app = createApp({
      render() {
        return h(
          UForm,
          {
            model,
            'onField:change': (field: string, ...args: unknown[]) => {
              formChanges.push({ field, args })
            }
          },
          {
            default: () =>
              h(
                UFormItem,
                {
                  field: 'behavior',
                  label: '行为',
                  onChange: (...args: unknown[]) => itemChanges.push(args)
                },
                {
                  default: () =>
                    h(USelect, {
                      modelValue: model.behavior,
                      'onUpdate:modelValue': (value: string) => {
                        model.behavior = value
                      },
                      options: behaviorOptions
                    })
                }
              )
          }
        )
      }
    })

    app.mount(host)

    await openSelect(host)
    await clickSelectOption('接口')

    expect(itemChanges).toHaveLength(1)
    expect(itemChanges[0]![0]).toEqual({ label: '接口', value: 'api' })

    expect(formChanges).toHaveLength(1)
    expect(formChanges[0]).toEqual({ field: 'behavior', args: [{ label: '接口', value: 'api' }] })

    app.unmount()
    host.remove()
  })

  it('显式 UFormItem 内控件的动态 props 随父级更新', async () => {
    const host = document.createElement('div')
    document.body.appendChild(host)

    const model = reactive({ name: '' })
    const disabled = ref(false)

    const app = createApp({
      render() {
        return h(
          UForm,
          { model },
          {
            default: () =>
              h(
                UFormItem,
                { field: 'name', label: '姓名' },
                { default: () => h(UInput, { modelValue: model.name, disabled: disabled.value }) }
              )
          }
        )
      }
    })

    app.mount(host)

    const input = () => host.querySelector('input')!
    expect(input().disabled).toBe(false)

    disabled.value = true
    await nextTick()

    expect(input().disabled).toBe(true)

    app.unmount()
    host.remove()
  })
})
