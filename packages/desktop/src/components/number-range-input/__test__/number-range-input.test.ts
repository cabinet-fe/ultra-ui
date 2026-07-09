import { describe, expect, it } from 'vitest'
import { createApp, h, nextTick, ref } from 'vue'

import type { NumberRangeTuple } from '../../../types'
import UNumberRangeInput from '../number-range-input.vue'

function mountNumberRangeInput(initial: NumberRangeTuple) {
  const host = document.createElement('div')
  document.body.appendChild(host)

  const model = ref<NumberRangeTuple>([...initial])
  const changes: NumberRangeTuple[] = []

  const app = createApp({
    render() {
      return h(UNumberRangeInput, {
        modelValue: model.value,
        'onUpdate:modelValue': (value: NumberRangeTuple) => {
          model.value = value
        },
        onChange: (value: NumberRangeTuple) => {
          changes.push(value)
        }
      })
    }
  })

  app.mount(host)

  const inputs = () => host.querySelectorAll<HTMLInputElement>('input')

  return {
    host,
    model,
    changes,
    inputs,
    async setInputValue(index: 0 | 1, value: string) {
      const input = inputs()[index]
      if (!input) throw new Error(`input[${index}] not found`)
      input.value = value
      input.dispatchEvent(new Event('input', { bubbles: true }))
      await nextTick()
    },
    async blurInput(index: 0 | 1) {
      const input = inputs()[index]
      if (!input) throw new Error(`input[${index}] not found`)
      input.dispatchEvent(new Event('change', { bubbles: true }))
      input.dispatchEvent(new FocusEvent('blur', { bubbles: true }))
      await nextTick()
    },
    unmount() {
      app.unmount()
      host.remove()
    }
  }
}

describe('NumberRangeInput', () => {
  it('does not rewrite the other side while typing an intermediate value', async () => {
    const { model, setInputValue, unmount } = mountNumberRangeInput([50, 80])

    try {
      // 结束框键入 2（意图输入 20），输入过程中 start 不应被改写
      await setInputValue(1, '2')
      expect(model.value).toEqual([50, 2])
    } finally {
      unmount()
    }
  })

  it('clamps the edited end back to start on change when end < start', async () => {
    const { model, changes, setInputValue, blurInput, unmount } = mountNumberRangeInput([80, 100])

    try {
      await setInputValue(1, '10')
      expect(model.value).toEqual([80, 10])

      await blurInput(1)
      expect(model.value).toEqual([80, 80])
      expect(changes.at(-1)).toEqual([80, 80])
    } finally {
      unmount()
    }
  })

  it('clamps the edited start back to end on change when start > end', async () => {
    const { model, changes, setInputValue, blurInput, unmount } = mountNumberRangeInput([50, 80])

    try {
      await setInputValue(0, '90')
      expect(model.value).toEqual([90, 80])

      await blurInput(0)
      expect(model.value).toEqual([80, 80])
      expect(changes.at(-1)).toEqual([80, 80])
    } finally {
      unmount()
    }
  })
})
