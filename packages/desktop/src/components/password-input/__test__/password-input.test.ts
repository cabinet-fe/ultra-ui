import { describe, expect, it } from 'vitest'
import { createApp, h, nextTick, ref } from 'vue'

import UPasswordInput from '../password-input.vue'

function mountPasswordInput(props: Record<string, unknown>) {
  const host = document.createElement('div')
  document.body.appendChild(host)

  const model = ref(props.modelValue as string | undefined)
  const app = createApp({
    render() {
      return h(UPasswordInput, {
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

describe('PasswordInput', () => {
  it('keeps visibility toggle while clear control is shown on hover', async () => {
    const { host, unmount } = mountPasswordInput({ modelValue: 'secret', clearable: true })

    try {
      expect(host.querySelector('.u-password-input__visibility-toggle')).not.toBeNull()

      host.querySelector('.u-password-input')?.dispatchEvent(new MouseEvent('mouseenter'))
      await nextTick()

      expect(host.querySelector('.u-password-input__clear')).not.toBeNull()
      expect(host.querySelector('.u-password-input__visibility-toggle')).not.toBeNull()
    } finally {
      unmount()
    }
  })

  it('toggles password visibility when clearable', async () => {
    const { host, unmount } = mountPasswordInput({ modelValue: 'secret', clearable: true })

    try {
      const native = host.querySelector('.u-input__native') as HTMLInputElement
      expect(native.value).toBe('●●●●●●')

      host
        .querySelector('.u-password-input__visibility-toggle')
        ?.dispatchEvent(new MouseEvent('click', { bubbles: true }))
      await nextTick()

      expect(native.value).toBe('secret')
    } finally {
      unmount()
    }
  })

  it('toggles password visibility when clear control is visible on hover', async () => {
    const { host, unmount } = mountPasswordInput({ modelValue: 'secret', clearable: true })

    try {
      const native = host.querySelector('.u-input__native') as HTMLInputElement
      host.querySelector('.u-password-input')?.dispatchEvent(new MouseEvent('mouseenter'))
      await nextTick()

      expect(host.querySelector('.u-password-input__clear')).not.toBeNull()

      host
        .querySelector('.u-password-input__visibility-toggle')
        ?.dispatchEvent(new MouseEvent('click', { bubbles: true }))
      await nextTick()

      expect(native.value).toBe('secret')
    } finally {
      unmount()
    }
  })
})
