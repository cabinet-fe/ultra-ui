/* eslint-disable @typescript-eslint/unbound-method, @typescript-eslint/no-unsafe-type-assertion */
// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest'
import { createApp, h, nextTick, ref } from 'vue'

import UNumberInput from '../number-input.vue'

function mountNumberInput(props: Record<string, unknown>) {
  const host = document.createElement('div')
  document.body.appendChild(host)

  const model = ref(props.modelValue as number | undefined)
  const app = createApp({
    render() {
      return h(UNumberInput, {
        ...props,
        modelValue: model.value,
        'onUpdate:modelValue': (value: number | undefined) => {
          model.value = value
        }
      })
    }
  })

  app.mount(host)

  return {
    host,
    unmount() {
      app.unmount()
      host.remove()
    }
  }
}

describe('NumberInput', () => {
  it('keeps step controls visible while clear control is shown', async () => {
    const { host, unmount } = mountNumberInput({ modelValue: 1, step: 1, clearable: true })

    try {
      expect(host.querySelector('.u-number-input__step')).not.toBeNull()

      host.querySelector('.u-number-input')?.dispatchEvent(new MouseEvent('mouseenter'))
      await nextTick()

      expect(host.querySelector('.u-number-input__clear')).not.toBeNull()
      expect(host.querySelector('.u-number-input__step')).not.toBeNull()
    } finally {
      unmount()
    }
  })

  it('reserves clear control space before hover when clearable', () => {
    const { host, unmount } = mountNumberInput({ modelValue: 1, clearable: true })

    try {
      expect(host.querySelector('.u-number-input__clear')).not.toBeNull()
    } finally {
      unmount()
    }
  })
})
