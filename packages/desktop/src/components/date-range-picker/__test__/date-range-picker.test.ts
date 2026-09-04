import { date } from '@cat-kit/core'
import { describe, expect, it } from 'vitest'
import { createApp, h, nextTick, ref } from 'vue'

import UDateRangePicker from '../date-range-picker.vue'

function mountDateRangePicker(
  props: Record<string, unknown> = {},
  emits: Record<string, Function> = {}
) {
  const host = document.createElement('div')
  document.body.appendChild(host)

  const model = ref(props.modelValue)
  const app = createApp({
    render() {
      return h(UDateRangePicker, {
        ...props,
        modelValue: model.value,
        'onUpdate:modelValue': (value: unknown) => {
          model.value = value
          emits['update:modelValue']?.(value)
        },
        onChange: (dates?: [Date, Date]) => {
          emits.change?.(dates)
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

describe('UDateRangePicker', () => {
  it('defaults dataType to string and emits change with native Date tuple', async () => {
    let changedDates: [Date, Date] | undefined
    let updatedVal: unknown

    const { host, unmount } = mountDateRangePicker(
      {},
      {
        'update:modelValue': (val: unknown) => {
          updatedVal = val
        },
        change: (d?: [Date, Date]) => {
          changedDates = d
        }
      }
    )

    try {
      const inputEl = host.querySelector('input')
      expect(inputEl).not.toBeNull()
      inputEl?.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }))
      await nextTick()
      await nextTick()

      const cells = document.querySelectorAll<HTMLElement>('.u-date-panel__cell:not(.is-disabled)')
      expect(cells.length).toBeGreaterThanOrEqual(20)

      cells[10]!.click()
      await nextTick()
      cells[15]!.click()
      await nextTick()

      expect(Array.isArray(updatedVal)).toBe(true)
      const range = updatedVal as string[]
      expect(range.length).toBe(2)
      expect(typeof range[0]).toBe('string')
      expect(typeof range[1]).toBe('string')
      expect(range[0]).toMatch(/^\d{4}-\d{2}-\d{2}$/)
      expect(range[1]).toMatch(/^\d{4}-\d{2}-\d{2}$/)

      expect(Array.isArray(changedDates)).toBe(true)
      expect(changedDates![0] instanceof Date).toBe(true)
      expect(changedDates![1] instanceof Date).toBe(true)
    } finally {
      unmount()
    }
  })

  it('supports dataType="date" and emits native Date tuple for modelValue and change', async () => {
    let changedDates: [Date, Date] | undefined
    let updatedVal: unknown

    const { host, unmount } = mountDateRangePicker(
      { dataType: 'date', valueFormat: 'yyyyMMdd' },
      {
        'update:modelValue': (val: unknown) => {
          updatedVal = val
        },
        change: (d?: [Date, Date]) => {
          changedDates = d
        }
      }
    )

    try {
      const inputEl = host.querySelector('input')
      inputEl?.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }))
      await nextTick()
      await nextTick()

      const cells = document.querySelectorAll<HTMLElement>('.u-date-panel__cell:not(.is-disabled)')
      cells[10]!.click()
      await nextTick()
      cells[15]!.click()
      await nextTick()

      expect(Array.isArray(updatedVal)).toBe(true)
      const range = updatedVal as unknown[]
      expect(range[0] instanceof Date).toBe(true)
      expect(range[1] instanceof Date).toBe(true)

      expect(Array.isArray(changedDates)).toBe(true)
      expect(changedDates![0] instanceof Date).toBe(true)
      expect(changedDates![1] instanceof Date).toBe(true)
    } finally {
      unmount()
    }
  })

  it('supports dataType="timestamp" and emits timestamp tuple for modelValue and native Date tuple for change', async () => {
    let changedDates: [Date, Date] | undefined
    let updatedVal: unknown

    const { host, unmount } = mountDateRangePicker(
      { dataType: 'timestamp', valueFormat: 'yyyyMMdd' },
      {
        'update:modelValue': (val: unknown) => {
          updatedVal = val
        },
        change: (d?: [Date, Date]) => {
          changedDates = d
        }
      }
    )

    try {
      const inputEl = host.querySelector('input')
      inputEl?.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }))
      await nextTick()
      await nextTick()

      const cells = document.querySelectorAll<HTMLElement>('.u-date-panel__cell:not(.is-disabled)')
      cells[10]!.click()
      await nextTick()
      cells[15]!.click()
      await nextTick()

      expect(Array.isArray(updatedVal)).toBe(true)
      const range = updatedVal as number[]
      expect(typeof range[0]).toBe('number')
      expect(typeof range[1]).toBe('number')
      expect(range[0]).toBeGreaterThan(0)
      expect(range[1]).toBeGreaterThan(0)

      expect(Array.isArray(changedDates)).toBe(true)
      expect(changedDates![0] instanceof Date).toBe(true)
      expect(changedDates![1] instanceof Date).toBe(true)
    } finally {
      unmount()
    }
  })

  it('applies valueFormat when dataType="string"', async () => {
    let changedDates: [Date, Date] | undefined
    let updatedVal: unknown

    const { host, unmount } = mountDateRangePicker(
      { dataType: 'string', valueFormat: 'yyyy/MM/dd' },
      {
        'update:modelValue': (val: unknown) => {
          updatedVal = val
        },
        change: (d?: [Date, Date]) => {
          changedDates = d
        }
      }
    )

    try {
      const inputEl = host.querySelector('input')
      inputEl?.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }))
      await nextTick()
      await nextTick()

      const cells = document.querySelectorAll<HTMLElement>('.u-date-panel__cell:not(.is-disabled)')
      cells[10]!.click()
      await nextTick()
      cells[15]!.click()
      await nextTick()

      expect(Array.isArray(updatedVal)).toBe(true)
      const range = updatedVal as string[]
      expect(range[0]).toMatch(/^\d{4}\/\d{2}\/\d{2}$/)
      expect(range[1]).toMatch(/^\d{4}\/\d{2}\/\d{2}$/)
      expect(changedDates![0] instanceof Date).toBe(true)
      expect(changedDates![1] instanceof Date).toBe(true)
    } finally {
      unmount()
    }
  })

  it('emits undefined for modelValue and change when cleared', async () => {
    let changedDates: [Date, Date] | undefined = [new Date(), new Date()]
    let updatedVal: unknown = ['2024-05-01', '2024-05-10']

    const { host, unmount } = mountDateRangePicker(
      { modelValue: ['2024-05-01', '2024-05-10'], clearable: true },
      {
        'update:modelValue': (val: unknown) => {
          updatedVal = val
        },
        change: (d?: [Date, Date]) => {
          changedDates = d
        }
      }
    )

    try {
      const dropdown = host.firstElementChild as HTMLElement
      dropdown.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }))
      await new Promise((r) => setTimeout(r, 50))

      const clearBtn = host.querySelector('.u-date-range-picker__clear') as HTMLElement
      expect(clearBtn).not.toBeNull()
      clearBtn.click()
      await nextTick()

      expect(updatedVal).toBeUndefined()
      expect(changedDates).toBeUndefined()
    } finally {
      unmount()
    }
  })

  it('correctly parses modelValue of Date tuple, timestamp tuple, and custom formatted strings', async () => {
    const dates: [Date, Date] = [new Date(2024, 4, 15), new Date(2024, 4, 20)]
    const d1 = mountDateRangePicker({ modelValue: dates })
    await nextTick()
    const inputs1 = d1.host.querySelectorAll('input')
    expect(inputs1[0]?.value).toBe('2024-05-15')
    expect(inputs1[1]?.value).toBe('2024-05-20')
    d1.unmount()

    const ts1 = date('2024-06-20').timestamp
    const ts2 = date('2024-06-25').timestamp
    const d2 = mountDateRangePicker({ modelValue: [ts1, ts2] })
    await nextTick()
    const inputs2 = d2.host.querySelectorAll('input')
    expect(inputs2[0]?.value).toBe('2024-06-20')
    expect(inputs2[1]?.value).toBe('2024-06-25')
    d2.unmount()

    const d3 = mountDateRangePicker({
      modelValue: ['20240725', '20240730'],
      valueFormat: 'yyyyMMdd'
    })
    await nextTick()
    const inputs3 = d3.host.querySelectorAll('input')
    expect(inputs3[0]?.value).toBe('2024-07-25')
    expect(inputs3[1]?.value).toBe('2024-07-30')
    d3.unmount()
  })
})
