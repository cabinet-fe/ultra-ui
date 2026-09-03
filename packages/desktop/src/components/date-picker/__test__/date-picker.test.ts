import { date } from '@cat-kit/core'
import { describe, expect, it } from 'vitest'
import { createApp, h, nextTick, ref } from 'vue'

import UDatePicker from '../date-picker.vue'

function mountDatePicker(
  props: Record<string, unknown> = {},
  emits: Record<string, Function> = {}
) {
  const host = document.createElement('div')
  document.body.appendChild(host)

  const model = ref(props.modelValue)
  const app = createApp({
    render() {
      return h(UDatePicker, {
        ...props,
        modelValue: model.value,
        'onUpdate:modelValue': (value: unknown) => {
          model.value = value
          emits['update:modelValue']?.(value)
        },
        onChange: (date?: Date) => {
          emits.change?.(date)
        }
      })
    }
  })

  app.component('Transition', (_, { slots }) => slots.default?.())

  app.mount(host)

  return {
    host,
    model,
    app,
    unmount() {
      app.unmount()
      host.remove()
    }
  }
}

describe('UDatePicker', () => {
  it('defaults dataType to string and emits change with native Date', async () => {
    let changedDate: Date | undefined
    let updatedVal: unknown

    const { host, unmount } = mountDatePicker(
      {},
      {
        'update:modelValue': (val: unknown) => {
          updatedVal = val
        },
        change: (d?: Date) => {
          changedDate = d
        }
      }
    )

    try {
      const inputEl = host.querySelector('input')
      expect(inputEl).not.toBeNull()
      inputEl?.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }))
      await nextTick()
      await nextTick()

      const cell = document.querySelector('.u-date-panel__cell.is-current') as HTMLElement
      expect(cell).not.toBeNull()
      cell.click()
      await nextTick()

      expect(typeof updatedVal).toBe('string')
      expect(updatedVal).toMatch(/^\d{4}-\d{2}-\d{2}$/)
      expect(changedDate instanceof Date).toBe(true)
    } finally {
      unmount()
    }
  })

  it('supports dataType="date" and emits native Date for modelValue and change', async () => {
    let changedDate: Date | undefined
    let updatedVal: unknown

    const { host, unmount } = mountDatePicker(
      { dataType: 'date', valueFormat: 'yyyyMMdd' },
      {
        'update:modelValue': (val: unknown) => {
          updatedVal = val
        },
        change: (d?: Date) => {
          changedDate = d
        }
      }
    )

    try {
      const inputEl = host.querySelector('input')
      inputEl?.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }))
      await nextTick()
      await nextTick()

      const cell = document.querySelector('.u-date-panel__cell.is-current') as HTMLElement
      cell.click()
      await nextTick()

      expect(updatedVal instanceof Date).toBe(true)
      expect(changedDate instanceof Date).toBe(true)
    } finally {
      unmount()
    }
  })

  it('supports dataType="timestamp" and emits timestamp for modelValue and native Date for change', async () => {
    let changedDate: Date | undefined
    let updatedVal: unknown

    const { host, unmount } = mountDatePicker(
      { dataType: 'timestamp', valueFormat: 'yyyyMMdd' },
      {
        'update:modelValue': (val: unknown) => {
          updatedVal = val
        },
        change: (d?: Date) => {
          changedDate = d
        }
      }
    )

    try {
      const inputEl = host.querySelector('input')
      inputEl?.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }))
      await nextTick()
      await nextTick()

      const cell = document.querySelector('.u-date-panel__cell.is-current') as HTMLElement
      cell.click()
      await nextTick()

      expect(typeof updatedVal).toBe('number')
      expect(updatedVal).toBeGreaterThan(0)
      expect(changedDate instanceof Date).toBe(true)
    } finally {
      unmount()
    }
  })

  it('applies valueFormat when dataType="string"', async () => {
    let changedDate: Date | undefined
    let updatedVal: unknown

    const { host, unmount } = mountDatePicker(
      { dataType: 'string', valueFormat: 'yyyy/MM/dd' },
      {
        'update:modelValue': (val: unknown) => {
          updatedVal = val
        },
        change: (d?: Date) => {
          changedDate = d
        }
      }
    )

    try {
      const inputEl = host.querySelector('input')
      inputEl?.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }))
      await nextTick()
      await nextTick()

      const cell = document.querySelector('.u-date-panel__cell.is-current') as HTMLElement
      cell.click()
      await nextTick()

      expect(typeof updatedVal).toBe('string')
      expect(updatedVal).toMatch(/^\d{4}\/\d{2}\/\d{2}$/)
      expect(changedDate instanceof Date).toBe(true)
    } finally {
      unmount()
    }
  })

  it('emits undefined for modelValue and change when cleared', async () => {
    let changedDate: Date | undefined = new Date()
    let updatedVal: unknown = '2024-05-01'

    const { host, unmount } = mountDatePicker(
      { modelValue: '2024-05-01', clearable: true },
      {
        'update:modelValue': (val: unknown) => {
          updatedVal = val
        },
        change: (d?: Date) => {
          changedDate = d
        }
      }
    )

    try {
      const inputWrapper = host.querySelector('.u-input') as HTMLElement
      inputWrapper.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }))
      await new Promise((r) => setTimeout(r, 50))

      const clearBtn = host.querySelector('.u-input__clear') as HTMLElement
      expect(clearBtn).not.toBeNull()
      clearBtn.click()
      await nextTick()

      expect(updatedVal).toBeUndefined()
      expect(changedDate).toBeUndefined()
    } finally {
      unmount()
    }
  })

  it('correctly parses modelValue of Date, timestamp, and custom formatted string', async () => {
    const dateObj = new Date(2024, 4, 15)
    const d1 = mountDatePicker({ modelValue: dateObj })
    await nextTick()
    expect(d1.host.querySelector('input')?.value).toBe('2024-05-15')
    d1.unmount()

    const ts = date('2024-06-20').timestamp
    const d2 = mountDatePicker({ modelValue: ts })
    await nextTick()
    expect(d2.host.querySelector('input')?.value).toBe('2024-06-20')
    d2.unmount()

    const d3 = mountDatePicker({ modelValue: '20240725', valueFormat: 'yyyyMMdd' })
    await nextTick()
    expect(d3.host.querySelector('input')?.value).toBe('2024-07-25')
    d3.unmount()
  })
})
