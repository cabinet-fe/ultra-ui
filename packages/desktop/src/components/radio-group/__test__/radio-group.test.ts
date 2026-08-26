import { describe, expect, it } from 'vitest'
import { createApp, h, nextTick, ref } from 'vue'

import URadioGroup from '../radio-group.vue'

const items = [
  { label: 'A', value: 'a' },
  { label: 'B', value: 'b' }
]

function mountRadioGroup(props: Record<string, unknown> = {}) {
  const host = document.createElement('div')
  document.body.appendChild(host)

  const model = ref(props.modelValue)
  const changes: unknown[] = []

  const app = createApp({
    render() {
      return h(URadioGroup, {
        ...props,
        items: items as any,
        modelValue: model.value,
        'onUpdate:modelValue': (value: any) => {
          model.value = value
        },
        onChange: (item: any) => {
          changes.push(item)
        }
      })
    }
  })

  app.mount(host)

  return {
    host,
    model,
    changes,
    unmount() {
      app.unmount()
      host.remove()
    }
  }
}

function queryRoot(host: HTMLElement) {
  return host.querySelector<HTMLElement>('.u-radio-group')!
}

function queryRadios(host: HTMLElement) {
  return [...host.querySelectorAll<HTMLElement>('.u-radio')]
}

function pick(host: HTMLElement, index: number) {
  const input = queryRadios(host)[index]!.querySelector<HTMLInputElement>('input')!
  input.checked = true
  input.dispatchEvent(new Event('change', { bubbles: true }))
}

describe('RadioGroup', () => {
  it('缺省 variant 保持现状结构：无 button 修饰类且圆点元素存在', async () => {
    const { host, unmount } = mountRadioGroup({ modelValue: 'a' })
    await nextTick()

    try {
      const root = queryRoot(host)
      expect(root.className).not.toContain('u-radio-group--button')
      expect(root.querySelector('.u-radio__button')).toBeTruthy()
    } finally {
      unmount()
    }
  })

  it("variant='default' 与缺省一致", async () => {
    const { host, unmount } = mountRadioGroup({ modelValue: 'a', variant: 'default' })
    await nextTick()

    try {
      expect(queryRoot(host).className).not.toContain('u-radio-group--button')
    } finally {
      unmount()
    }
  })

  it("variant='button' 容器带修饰类，选中项高亮、未选中透明", async () => {
    const { host, unmount } = mountRadioGroup({ modelValue: 'b', variant: 'button' })
    await nextTick()

    try {
      expect(queryRoot(host).className).toContain('u-radio-group--button')

      const radios = queryRadios(host)
      expect(radios[0]!.classList.contains('is-checked')).toBe(false)
      expect(radios[1]!.classList.contains('is-checked')).toBe(true)
    } finally {
      unmount()
    }
  })

  it("variant='button' 禁用项呈禁用态且原生不可选中", async () => {
    const { host, unmount } = mountRadioGroup({
      modelValue: 'a',
      variant: 'button',
      disabledItem: (item: any) => item.value === 'b'
    })
    await nextTick()

    try {
      const radios = queryRadios(host)
      expect(radios[1]!.classList.contains('is-disabled')).toBe(true)

      // 原生 radio disabled 由浏览器保证不触发 change
      const inputs = radios.map((radio) => radio.querySelector<HTMLInputElement>('input')!)
      expect(inputs[0]!.disabled).toBe(false)
      expect(inputs[1]!.disabled).toBe(true)
    } finally {
      unmount()
    }
  })

  it("variant='button' 点击选项更新 modelValue 并 emit change（参数为 item）", async () => {
    const { host, model, changes, unmount } = mountRadioGroup({
      modelValue: 'a',
      variant: 'button'
    })
    await nextTick()

    try {
      pick(host, 1)
      await nextTick()

      expect(model.value).toBe('b')
      expect(changes).toEqual([items[1]])
      expect(queryRadios(host)[1]!.classList.contains('is-checked')).toBe(true)
    } finally {
      unmount()
    }
  })
})
