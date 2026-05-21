// @vitest-environment happy-dom
import { createApp, h, nextTick, ref } from 'vue'

import UCollapseItem from '../collapse-item.vue'
import UCollapse from '../collapse.vue'

function mountCollapse(
  props: Record<string, unknown> = {},
  items: Array<{ value: string; title: string }> = [
    { value: 'a', title: 'Title A' },
    { value: 'b', title: 'Title B' }
  ]
) {
  const host = document.createElement('div')
  document.body.appendChild(host)

  const model = ref(props.modelValue)
  const app = createApp({
    render() {
      return h(
        UCollapse,
        {
          ...props,
          modelValue: model.value,
          'onUpdate:modelValue': (value: any) => {
            model.value = value
          }
        },
        () =>
          items.map((item) =>
            h(
              UCollapseItem,
              { value: item.value, title: item.title },
              () => `Content ${item.value}`
            )
          )
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

describe('Collapse', () => {
  it('defaultCollapseAll defaults to false, which expands all items when no initial modelValue is provided', async () => {
    const { host, model, unmount } = mountCollapse()

    try {
      await nextTick()
      // 默认展开全部：modelValue 应该包含所有项的 value
      expect(model.value).toEqual(['a', 'b'])

      const activeItems = host.querySelectorAll('.u-collapse__item.is-active')
      expect(activeItems.length).toBe(2)
    } finally {
      unmount()
    }
  })

  it('defaultCollapseAll sets to true collapses all items', async () => {
    const { host, model, unmount } = mountCollapse({ defaultCollapseAll: true })

    try {
      await nextTick()
      // 全部折叠：modelValue 应该为空或未定义，没有任何项具有 is-active 样式
      expect(model.value).toBeUndefined()

      const activeItems = host.querySelectorAll('.u-collapse__item.is-active')
      expect(activeItems.length).toBe(0)
    } finally {
      unmount()
    }
  })

  it('defaultCollapseAll sets to empty string collapses all items', async () => {
    const { host, model, unmount } = mountCollapse({ defaultCollapseAll: '' })

    try {
      await nextTick()
      expect(model.value).toBeUndefined()

      const activeItems = host.querySelectorAll('.u-collapse__item.is-active')
      expect(activeItems.length).toBe(0)
    } finally {
      unmount()
    }
  })

  it('defaultCollapseAll sets to "true" collapses all items', async () => {
    const { host, model, unmount } = mountCollapse({ defaultCollapseAll: 'true' })

    try {
      await nextTick()
      expect(model.value).toBeUndefined()

      const activeItems = host.querySelectorAll('.u-collapse__item.is-active')
      expect(activeItems.length).toBe(0)
    } finally {
      unmount()
    }
  })

  it('respects initial modelValue even if defaultCollapseAll is false', async () => {
    const { host, model, unmount } = mountCollapse({ modelValue: ['a'] })

    try {
      await nextTick()
      // 外部传入初始值：即使 defaultCollapseAll 为 false，也仅激活外部指定的项
      expect(model.value).toEqual(['a'])

      const activeItems = host.querySelectorAll('.u-collapse__item.is-active')
      expect(activeItems.length).toBe(1)
      expect(activeItems[0].querySelector('.u-collapse__title')?.textContent).toBe('Title A')
    } finally {
      unmount()
    }
  })

  it('accordion mode with defaultCollapseAll=false only expands the first item', async () => {
    const { host, model, unmount } = mountCollapse({ accordion: true })

    try {
      await nextTick()
      // 手风琴模式且没有初始值，默认只展开第一个
      expect(model.value).toBe('a')

      const activeItems = host.querySelectorAll('.u-collapse__item.is-active')
      expect(activeItems.length).toBe(1)
      expect(activeItems[0].querySelector('.u-collapse__title')?.textContent).toBe('Title A')
    } finally {
      unmount()
    }
  })

  it('toggles collapse items on header click', async () => {
    const { host, model, unmount } = mountCollapse({ defaultCollapseAll: true })

    try {
      await nextTick()
      expect(model.value).toBeUndefined()

      const headers = host.querySelectorAll('.u-collapse__header')
      expect(headers.length).toBe(2)

      // 点击第一个 header 展开它
      ;(headers[0] as HTMLElement).click()
      await nextTick()

      expect(model.value).toEqual(['a'])
      expect(host.querySelectorAll('.u-collapse__item.is-active').length).toBe(1)

      // 点击第二个 header 展开它
      ;(headers[1] as HTMLElement).click()
      await nextTick()

      expect(model.value).toEqual(['a', 'b'])
      expect(host.querySelectorAll('.u-collapse__item.is-active').length).toBe(2)

      // 再次点击第一个 header 收起它
      ;(headers[0] as HTMLElement).click()
      await nextTick()

      expect(model.value).toEqual(['b'])
      expect(host.querySelectorAll('.u-collapse__item.is-active').length).toBe(1)
    } finally {
      unmount()
    }
  })
})
