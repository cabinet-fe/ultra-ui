// @vitest-environment happy-dom

import { describe, expect, it } from 'vite-plus/test'
import { createApp, h, nextTick, ref } from 'vue'

import UTextarea from '../textarea.vue'

function mountTextarea(props: Record<string, unknown>) {
  const host = document.createElement('div')
  document.body.appendChild(host)

  const model = ref(props.modelValue as string | undefined)
  const app = createApp({
    render() {
      return h(UTextarea, {
        ...props,
        modelValue: model.value,
        'onUpdate:modelValue': (value: string | undefined) => {
          model.value = value
        }
      })
    }
  })

  app.mount(host)

  return {
    host,
    model,
    unmount() {
      app.unmount()
      host.remove()
    }
  }
}

describe('UTextarea', () => {
  it('计数显示「已输入/上限」，达到上限加 is-limit', async () => {
    const { host, model, unmount } = mountTextarea({
      modelValue: 'abc',
      maxlength: 5,
      showCount: true
    })

    const count = () => host.querySelector('.u-textarea__count')!
    expect(count().textContent?.trim()).toBe('3/5')
    expect(count().classList.contains('is-limit')).toBe(false)

    model.value = 'abcde'
    await nextTick()
    expect(count().textContent?.trim()).toBe('5/5')
    expect(count().classList.contains('is-limit')).toBe(true)

    unmount()
  })

  it('清空按钮悬停且有内容时才可见并预留右侧内边距，点击后清空', async () => {
    const { host, model, unmount } = mountTextarea({ modelValue: 'hello' })

    const root = host.querySelector('.u-textarea')!
    const clear = () => host.querySelector<HTMLButtonElement>('.u-textarea__clear')!
    expect(clear().classList.contains('is-visible')).toBe(false)
    expect(root.classList.contains('is-clear-visible')).toBe(false)

    root.dispatchEvent(new MouseEvent('mouseenter'))
    await nextTick()
    expect(clear().classList.contains('is-visible')).toBe(true)
    expect(root.classList.contains('is-clear-visible')).toBe(true)

    clear().click()
    await nextTick()
    expect(model.value).toBe('')
    expect(clear().classList.contains('is-visible')).toBe(false)
    expect(root.classList.contains('is-clear-visible')).toBe(false)

    unmount()
  })

  it('disabled 时不渲染清空按钮', () => {
    const { host, unmount } = mountTextarea({ modelValue: 'hello', disabled: true })

    expect(host.querySelector('.u-textarea__clear')).toBeNull()
    expect(host.querySelector('.u-textarea')!.classList.contains('is-clear-visible')).toBe(false)

    unmount()
  })

  it('resize=false 或 autosize 时禁止拖拽', () => {
    const a = mountTextarea({ resize: false })
    expect(a.host.querySelector('.u-textarea')!.classList.contains('is-resize-none')).toBe(true)
    a.unmount()

    const b = mountTextarea({ autosize: true })
    expect(b.host.querySelector('.u-textarea')!.classList.contains('is-resize-none')).toBe(true)
    b.unmount()
  })
})
