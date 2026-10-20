// @vitest-environment happy-dom

import { describe, expect, it } from 'vite-plus/test'
import { createApp, h, nextTick, ref } from 'vue'

import UChip from '../chip.vue'

function mountChip(props: Record<string, unknown> = {}) {
  const host = document.createElement('div')
  document.body.appendChild(host)

  const model = ref(props.modelValue)

  const app = createApp({
    render() {
      return h(
        UChip,
        {
          ...props,
          modelValue: model.value,
          'onUpdate:modelValue': (value: any) => {
            model.value = value
          }
        },
        () => '选项'
      )
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

describe('Chip', () => {
  it('选中态与文案', async () => {
    const { host, unmount } = mountChip({ modelValue: 'a', value: 'a' })
    await nextTick()

    try {
      const chip = host.querySelector<HTMLElement>('.u-chip')!
      expect(chip.classList.contains('is-checked')).toBe(true)
      expect(chip.textContent).toContain('选项')
      expect(chip.querySelector('input')?.checked).toBe(true)
    } finally {
      unmount()
    }
  })

  it('禁用时原生 input 不可选', async () => {
    const { host, unmount } = mountChip({ modelValue: 'a', value: 'b', disabled: true })
    await nextTick()

    try {
      const chip = host.querySelector<HTMLElement>('.u-chip')!
      expect(chip.classList.contains('is-disabled')).toBe(true)
      expect(chip.querySelector('input')?.disabled).toBe(true)
    } finally {
      unmount()
    }
  })
})
