// @vitest-environment happy-dom

import { describe, expect, it, vi } from 'vite-plus/test'
import { createApp, h, nextTick, ref } from 'vue'

import UChipGroup from '../chip-group.vue'

const items = [
  { label: 'A', value: 'a' },
  { label: 'B', value: 'b' },
  { label: 'C', value: 'c' }
]

function mountChipGroup(props: Record<string, unknown> = {}, groupItems = items) {
  const host = document.createElement('div')
  document.body.appendChild(host)

  const model = ref(props.modelValue)
  const changes: unknown[] = []

  const app = createApp({
    render() {
      return h(UChipGroup, {
        ...props,
        items: groupItems as any,
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
  return host.querySelector<HTMLElement>('.u-chip-group')!
}

function queryViewport(host: HTMLElement) {
  return host.querySelector<HTMLElement>('.u-chip-group__viewport')!
}

function queryChips(host: HTMLElement) {
  return [...host.querySelectorAll<HTMLElement>('.u-chip')]
}

function queryInputs(host: HTMLElement) {
  return queryChips(host).map((chip) => chip.querySelector<HTMLInputElement>('input')!)
}

function rect(left: number, width: number): DOMRect {
  return {
    x: left,
    y: 0,
    left,
    top: 0,
    width,
    height: 32,
    right: left + width,
    bottom: 32,
    toJSON() {
      return {}
    }
  } as DOMRect
}

function mockOverflow(
  viewport: HTMLElement,
  chip: HTMLElement,
  chipLeft: number,
  chipWidth: number
) {
  let scrollLeft = 0
  vi.spyOn(viewport, 'getBoundingClientRect').mockReturnValue(rect(0, 200))
  vi.spyOn(chip, 'getBoundingClientRect').mockImplementation(() =>
    rect(chipLeft - scrollLeft, chipWidth)
  )
  Object.defineProperty(viewport, 'clientWidth', { configurable: true, value: 200 })
  Object.defineProperty(viewport, 'scrollWidth', { configurable: true, value: 800 })
  Object.defineProperty(viewport, 'scrollLeft', {
    configurable: true,
    get: () => scrollLeft,
    set: (value: number) => {
      scrollLeft = value
    }
  })
}

function pick(host: HTMLElement, index: number) {
  const input = queryInputs(host)[index]!
  input.checked = true
  input.dispatchEvent(new Event('change', { bubbles: true }))
}

describe('ChipGroup', () => {
  it('基础渲染：胶囊选项与选中态', async () => {
    const { host, unmount } = mountChipGroup({ modelValue: 'a' })
    await nextTick()

    try {
      const root = queryRoot(host)
      expect(root).toBeTruthy()
      expect(host.querySelector('[role="radiogroup"]')?.getAttribute('aria-orientation')).toBe(
        'horizontal'
      )

      const chips = queryChips(host)
      expect(chips.length).toBe(3)
      expect(chips[0]!.textContent).toContain('A')
      expect(chips[0]!.classList.contains('is-checked')).toBe(true)
      expect(chips[1]!.classList.contains('is-checked')).toBe(false)
      expect(chips.every((chip) => chip.querySelector('.u-chip__face'))).toBe(true)
    } finally {
      unmount()
    }
  })

  it('同一组 radio 共享 name', async () => {
    const { host, unmount } = mountChipGroup({ modelValue: 'a' })
    await nextTick()

    try {
      const names = queryInputs(host).map((input) => input.name)
      expect(names[0]).toBeTruthy()
      expect(new Set(names).size).toBe(1)
    } finally {
      unmount()
    }
  })

  it('禁用项呈禁用态且原生不可选中', async () => {
    const { host, unmount } = mountChipGroup({
      modelValue: 'a',
      disabledItem: (item: any) => item.value === 'b'
    })
    await nextTick()

    try {
      const chips = queryChips(host)
      expect(chips[1]!.classList.contains('is-disabled')).toBe(true)

      const inputs = queryInputs(host)
      expect(inputs[0]!.disabled).toBe(false)
      expect(inputs[1]!.disabled).toBe(true)
    } finally {
      unmount()
    }
  })

  it('点击选项更新 modelValue 并 emit change（参数为 item）', async () => {
    const { host, model, changes, unmount } = mountChipGroup({ modelValue: 'a' })
    await nextTick()

    try {
      pick(host, 1)
      await nextTick()

      expect(model.value).toBe('b')
      expect(changes).toEqual([items[1]])
      expect(queryChips(host)[1]!.classList.contains('is-checked')).toBe(true)
    } finally {
      unmount()
    }
  })

  it('完全可见时点击直接选中', async () => {
    const { host, model, unmount } = mountChipGroup({ modelValue: 'a' })
    await nextTick()

    try {
      const viewport = queryViewport(host)
      const scrollTo = vi.spyOn(viewport, 'scrollTo')
      queryChips(host)[2]!.click()
      await nextTick()

      expect(scrollTo).not.toHaveBeenCalled()
      expect(model.value).toBe('c')
    } finally {
      unmount()
    }
  })

  it('贴边或被截断时先滚入可视区再选中', async () => {
    const { host, model, changes, unmount } = mountChipGroup({ modelValue: 'a' })
    await nextTick()

    try {
      const viewport = queryViewport(host)
      const chip = queryChips(host)[2]!
      mockOverflow(viewport, chip, 180, 80)

      const scrollTo = vi.spyOn(viewport, 'scrollTo').mockImplementation(function (
        this: HTMLElement,
        options
      ) {
        const left = typeof options === 'number' ? options : (options?.left ?? 0)
        this.scrollLeft = left
        this.dispatchEvent(new Event('scrollend'))
      })

      chip.click()
      await nextTick()
      await Promise.resolve()

      expect(scrollTo).toHaveBeenCalled()
      expect(viewport.scrollLeft).toBe(90)
      expect(model.value).toBe('c')
      expect(changes).toEqual([items[2]])
    } finally {
      unmount()
    }
  })

  it('焦点落到未完全露出的纸片时把它滚入可视区', async () => {
    const { host, unmount } = mountChipGroup({ modelValue: 'a' })
    await nextTick()

    try {
      const viewport = queryViewport(host)
      const chip = queryChips(host)[2]!
      mockOverflow(viewport, chip, 180, 80)

      const scrollTo = vi.spyOn(viewport, 'scrollTo').mockImplementation(function (
        this: HTMLElement,
        options
      ) {
        const left = typeof options === 'number' ? options : (options?.left ?? 0)
        this.scrollLeft = left
        this.dispatchEvent(new Event('scrollend'))
      })

      queryInputs(host)[2]!.dispatchEvent(new FocusEvent('focusin', { bubbles: true }))
      await nextTick()

      expect(scrollTo).toHaveBeenCalled()
      expect(viewport.scrollLeft).toBe(90)
    } finally {
      unmount()
    }
  })

  it('滚动位置决定左右遮罩', async () => {
    const { host, unmount } = mountChipGroup({ modelValue: 'a' })
    await nextTick()

    try {
      const viewport = queryViewport(host)
      Object.defineProperty(viewport, 'clientWidth', { configurable: true, value: 100 })
      Object.defineProperty(viewport, 'scrollWidth', { configurable: true, value: 500 })
      Object.defineProperty(viewport, 'scrollLeft', {
        configurable: true,
        writable: true,
        value: 40
      })

      viewport.dispatchEvent(new Event('scroll'))
      await nextTick()

      expect(viewport.classList.contains('is-mask-start')).toBe(true)
      expect(viewport.classList.contains('is-mask-end')).toBe(true)
    } finally {
      unmount()
    }
  })

  it('方向键在未禁用项之间移动并绕回', async () => {
    const { host, model, changes, unmount } = mountChipGroup({
      modelValue: 'a',
      disabledItem: (item: any) => item.value === 'b'
    })
    await nextTick()

    try {
      const input = queryInputs(host)[0]!
      input.focus()
      input.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true, cancelable: true })
      )
      await nextTick()

      expect(model.value).toBe('c')
      expect(changes).toEqual([items[2]])

      const last = queryInputs(host)[2]!
      last.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true, cancelable: true })
      )
      await nextTick()
      expect(model.value).toBe('a')
    } finally {
      unmount()
    }
  })

  it('纵向滚轮转为横向滚动，到头后不再拦截', async () => {
    const { host, unmount } = mountChipGroup({ modelValue: 'a' })
    await nextTick()

    try {
      const viewport = queryViewport(host)
      mockOverflow(viewport, queryChips(host)[0]!, 0, 80)

      const wheel = (deltaY: number, deltaX = 0) => {
        const event = new WheelEvent('wheel', { bubbles: true, cancelable: true })
        Object.defineProperty(event, 'deltaY', { value: deltaY })
        Object.defineProperty(event, 'deltaX', { value: deltaX })
        viewport.dispatchEvent(event)
        return event
      }

      const forward = wheel(40)
      expect(forward.defaultPrevented).toBe(true)
      expect(viewport.scrollLeft).toBe(40)

      const horizontal = wheel(10, 30)
      expect(horizontal.defaultPrevented).toBe(false)
      expect(viewport.scrollLeft).toBe(40)

      viewport.scrollLeft = 600
      host.style.overflowY = 'auto'
      let pageTop = 0
      Object.defineProperty(host, 'clientHeight', { configurable: true, value: 80 })
      Object.defineProperty(host, 'scrollHeight', { configurable: true, value: 400 })
      Object.defineProperty(host, 'scrollTop', {
        configurable: true,
        get: () => pageTop,
        set: (value: number) => {
          pageTop = value
        }
      })
      const atEnd = wheel(40)
      expect(atEnd.defaultPrevented).toBe(true)
      expect(viewport.scrollLeft).toBe(600)
      expect(host.scrollTop).toBe(40)
    } finally {
      unmount()
    }
  })

  it('拖过阈值才滚动，并且松手不选中', async () => {
    const { host, model, unmount } = mountChipGroup({ modelValue: 'a' })
    await nextTick()

    try {
      const viewport = queryViewport(host)
      const chip = queryChips(host)[1]!
      mockOverflow(viewport, chip, 0, 80)
      viewport.dispatchEvent(new Event('scroll'))
      await nextTick()

      const pointer = (type: string, clientX: number) => {
        chip.dispatchEvent(
          new PointerEvent(type, {
            button: 0,
            pointerId: 1,
            pointerType: 'mouse',
            clientX,
            bubbles: true,
            cancelable: true
          })
        )
      }

      pointer('pointerdown', 20)
      pointer('pointermove', 22)
      pointer('pointerup', 22)
      chip.click()
      await nextTick()
      expect(model.value).toBe('b')
      expect(viewport.scrollLeft).toBe(0)

      pointer('pointerdown', 20)
      pointer('pointermove', 40)
      pointer('pointerup', 40)
      chip.click()
      await nextTick()
      expect(viewport.scrollLeft).toBe(-20)
      expect(model.value).toBe('b')
      expect(viewport.classList.contains('is-dragging')).toBe(false)
    } finally {
      unmount()
    }
  })

  it('只读时展示选中项文本', async () => {
    const { host, unmount } = mountChipGroup({ modelValue: 'b', readonly: true })
    await nextTick()

    try {
      expect(host.querySelector('.u-chip')).toBeNull()
      expect(host.textContent).toContain('B')
    } finally {
      unmount()
    }
  })
})
