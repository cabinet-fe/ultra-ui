import { describe, expect, it } from 'vitest'
import { createApp, h, nextTick, ref } from 'vue'

import USegment from '../segment.vue'

const defaultItems = [
  { label: 'Option A', value: 'a' },
  { label: 'Option B', value: 'b' },
  { label: 'Option C', value: 'c' }
]

function mountSegment(props: Record<string, unknown> = {}) {
  const host = document.createElement('div')
  document.body.appendChild(host)

  const model = ref(props.modelValue)
  const changes: unknown[] = []

  const app = createApp({
    render() {
      return h(USegment, {
        items: defaultItems,
        ...props,
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
  return host.querySelector<HTMLElement>('.u-segment')!
}

function queryItems(host: HTMLElement) {
  return [...host.querySelectorAll<HTMLElement>('.u-segment__item')]
}

describe('USegment', () => {
  it('基础渲染与默认选中态', async () => {
    const { host, unmount } = mountSegment({ modelValue: 'b' })
    await nextTick()

    try {
      const root = queryRoot(host)
      expect(root).toBeTruthy()
      expect(root.getAttribute('role')).toBe('radiogroup')

      const items = queryItems(host)
      expect(items.length).toBe(3)
      expect(items[0]!.textContent).toBe('Option A')
      expect(items[1]!.textContent).toBe('Option B')
      expect(items[2]!.textContent).toBe('Option C')

      expect(items[0]!.classList.contains('is-active')).toBe(false)
      expect(items[1]!.classList.contains('is-active')).toBe(true)
      expect(items[2]!.classList.contains('is-active')).toBe(false)

      expect(items[1]!.getAttribute('aria-checked')).toBe('true')
      expect(items[0]!.getAttribute('aria-checked')).toBe('false')
    } finally {
      unmount()
    }
  })

  it('点击选项触发 modelValue 更新与 change 事件', async () => {
    const { host, model, changes, unmount } = mountSegment({ modelValue: 'a' })
    await nextTick()

    try {
      const items = queryItems(host)
      expect(items[0]!.classList.contains('is-active')).toBe(true)

      items[1]!.click()
      await nextTick()

      expect(model.value).toBe('b')
      expect(changes).toEqual([defaultItems[1]])
      expect(items[1]!.classList.contains('is-active')).toBe(true)
      expect(items[0]!.classList.contains('is-active')).toBe(false)

      // 点击已选中项不重复触发 change
      items[1]!.click()
      await nextTick()
      expect(changes.length).toBe(1)
    } finally {
      unmount()
    }
  })

  it('支持键盘 Enter 和 Space 触发选择', async () => {
    const { host, model, changes, unmount } = mountSegment({ modelValue: 'a' })
    await nextTick()

    try {
      const items = queryItems(host)

      items[2]!.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }))
      await nextTick()

      expect(model.value).toBe('c')
      expect(changes).toEqual([defaultItems[2]])

      items[1]!.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true }))
      await nextTick()

      expect(model.value).toBe('b')
      expect(changes).toEqual([defaultItems[2], defaultItems[1]])
    } finally {
      unmount()
    }
  })

  it('支持 custom labelKey 和 valueKey', async () => {
    const customItems = [
      { name: 'First', id: 1 },
      { name: 'Second', id: 2 }
    ]
    const host = document.createElement('div')
    document.body.appendChild(host)
    const model = ref(1)
    const changes: unknown[] = []

    const app = createApp({
      render() {
        return h(USegment, {
          items: customItems,
          labelKey: 'name',
          valueKey: 'id',
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
    await nextTick()

    try {
      const items = queryItems(host)
      expect(items[0]!.textContent).toBe('First')
      expect(items[1]!.textContent).toBe('Second')
      expect(items[0]!.classList.contains('is-active')).toBe(true)

      items[1]!.click()
      await nextTick()

      expect(model.value).toBe(2)
      expect(changes).toEqual([customItems[1]])
    } finally {
      app.unmount()
      host.remove()
    }
  })

  it('整组 disabled 禁用控制', async () => {
    const { host, model, changes, unmount } = mountSegment({ modelValue: 'a', disabled: true })
    await nextTick()

    try {
      const root = queryRoot(host)
      expect(root.classList.contains('is-disabled')).toBe(true)

      const items = queryItems(host)
      expect(items[0]!.classList.contains('is-disabled')).toBe(true)
      expect(items[1]!.classList.contains('is-disabled')).toBe(true)

      items[1]!.click()
      await nextTick()

      expect(model.value).toBe('a')
      expect(changes.length).toBe(0)
    } finally {
      unmount()
    }
  })

  it('disabledItem 单项禁用控制', async () => {
    const { host, model, changes, unmount } = mountSegment({
      modelValue: 'a',
      disabledItem: (item: any) => item.value === 'b'
    })
    await nextTick()

    try {
      const items = queryItems(host)
      expect(items[0]!.classList.contains('is-disabled')).toBe(false)
      expect(items[1]!.classList.contains('is-disabled')).toBe(true)
      expect(items[2]!.classList.contains('is-disabled')).toBe(false)

      // 点击禁用项无反应
      items[1]!.click()
      await nextTick()
      expect(model.value).toBe('a')
      expect(changes.length).toBe(0)

      // 点击非禁用项正常切换
      items[2]!.click()
      await nextTick()
      expect(model.value).toBe('c')
      expect(changes).toEqual([defaultItems[2]])
    } finally {
      unmount()
    }
  })

  it('block 属性与 size 样式类名绑定', async () => {
    const { host, unmount } = mountSegment({ modelValue: 'a', block: true, size: 'small' })
    await nextTick()

    try {
      const root = queryRoot(host)
      expect(root.classList.contains('is-block')).toBe(true)
      expect(root.classList.contains('u-segment--small')).toBe(true)
    } finally {
      unmount()
    }
  })

  it('readonly 模式回退展示文本', async () => {
    const { host, unmount } = mountSegment({ modelValue: 'b', readonly: true })
    await nextTick()

    try {
      expect(host.querySelector('.u-segment')).toBeNull()
      expect(host.textContent?.trim()).toBe('Option B')
    } finally {
      unmount()
    }
  })

  it('readonly 模式未匹配到值时展示 FORM_EMPTY_CONTENT（-）', async () => {
    const { host, unmount } = mountSegment({ modelValue: 'non-existing', readonly: true })
    await nextTick()

    try {
      expect(host.querySelector('.u-segment')).toBeNull()
      expect(host.textContent?.trim()).toBe('-')
    } finally {
      unmount()
    }
  })
})
