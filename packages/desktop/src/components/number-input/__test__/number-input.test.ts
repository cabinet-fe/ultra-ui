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

  it('updates the input value immediately without animation when step is 1', async () => {
    const { host, unmount } = mountNumberInput({ modelValue: 1, step: 1 })

    try {
      const input = host.querySelector('input')!
      const [upIcon, downIcon] = Array.from(
        host.querySelectorAll('.u-number-input__step .u-icon')
      ) as HTMLElement[]

      upIcon!.dispatchEvent(new MouseEvent('click', { bubbles: true }))
      await nextTick()
      expect(input.value).toBe('2')

      downIcon!.dispatchEvent(new MouseEvent('click', { bubbles: true }))
      await nextTick()
      expect(input.value).toBe('1')
    } finally {
      unmount()
    }
  })

  it('keeps the rolling animation when step is greater than 1', () => {
    const { host, unmount } = mountNumberInput({ modelValue: 0, step: 5 })

    try {
      const input = host.querySelector('input')!
      const [upIcon] = Array.from(
        host.querySelectorAll('.u-number-input__step .u-icon')
      ) as HTMLElement[]

      upIcon!.dispatchEvent(new MouseEvent('click', { bubbles: true }))
      // 动画通过 requestAnimationFrame 逐帧更新, 同步阶段不应直接跳到目标值
      expect(input.value).toBe('0')
    } finally {
      unmount()
    }
  })
})
