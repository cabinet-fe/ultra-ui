import { describe, expect, it, vi } from 'vitest'
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
      expect(activeItems[0]?.querySelector('.u-collapse__title')?.textContent).toBe('Title A')
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
      expect(activeItems[0]?.querySelector('.u-collapse__title')?.textContent).toBe('Title A')
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

function mountStandaloneItem(props: Record<string, unknown> = {}) {
  const host = document.createElement('div')
  document.body.appendChild(host)

  const model = ref(props.modelValue ?? false)
  const onChange = vi.fn()

  const app = createApp({
    render() {
      return h(
        UCollapseItem,
        {
          ...props,
          modelValue: model.value,
          'onUpdate:modelValue': (value: boolean) => {
            model.value = value
          },
          onChange
        },
        () => 'Standalone content'
      )
    }
  })

  app.mount(host)

  return {
    host,
    model,
    onChange,
    unmount() {
      app.unmount()
      host.remove()
    }
  }
}

describe('CollapseItem standalone', () => {
  it('renders bordered card styles without UCollapse parent', async () => {
    const { host, unmount } = mountStandaloneItem({ title: 'Standalone' })

    try {
      await nextTick()
      expect(host.querySelector('.u-collapse__item')).toBeTruthy()
      expect(host.querySelector('.u-collapse__header')).toBeTruthy()
      expect(host.querySelector('.u-collapse__title')?.textContent).toBe('Standalone')
    } finally {
      unmount()
    }
  })

  it('defaults to collapsed when no v-model is provided', async () => {
    const { host, model, unmount } = mountStandaloneItem({ title: 'Standalone' })

    try {
      await nextTick()
      expect(model.value).toBe(false)
      expect(host.querySelector('.u-collapse__item.is-active')).toBeFalsy()
      expect(host.querySelector('.u-collapse__content-wrapper')?.getAttribute('aria-hidden')).toBe(
        'true'
      )
    } finally {
      unmount()
    }
  })

  it('respects v-model initial expanded state', async () => {
    const { host, model, unmount } = mountStandaloneItem({ title: 'Standalone', modelValue: true })

    try {
      await nextTick()
      expect(model.value).toBe(true)
      expect(host.querySelector('.u-collapse__item.is-active')).toBeTruthy()
    } finally {
      unmount()
    }
  })

  it('toggles via header click and emits update:modelValue / change', async () => {
    const { host, model, onChange, unmount } = mountStandaloneItem({ title: 'Standalone' })

    try {
      await nextTick()
      const header = host.querySelector('.u-collapse__header') as HTMLElement

      header.click()
      await nextTick()

      expect(model.value).toBe(true)
      expect(onChange).toHaveBeenCalledWith(true)
      expect(host.querySelector('.u-collapse__item.is-active')).toBeTruthy()

      header.click()
      await nextTick()

      expect(model.value).toBe(false)
      expect(onChange).toHaveBeenLastCalledWith(false)
      expect(host.querySelector('.u-collapse__item.is-active')).toBeFalsy()
    } finally {
      unmount()
    }
  })

  it('does not toggle when disabled', async () => {
    const { host, model, onChange, unmount } = mountStandaloneItem({
      title: 'Standalone',
      disabled: true
    })

    try {
      await nextTick()
      ;(host.querySelector('.u-collapse__header') as HTMLElement).click()
      await nextTick()

      expect(model.value).toBe(false)
      expect(onChange).not.toHaveBeenCalled()
    } finally {
      unmount()
    }
  })

  it('ignores v-model when nested inside UCollapse', async () => {
    const host = document.createElement('div')
    document.body.appendChild(host)

    const standaloneModel = ref(true)
    const collapseModel = ref<string[] | undefined>()

    const app = createApp({
      render() {
        return h(
          UCollapse,
          {
            modelValue: collapseModel.value,
            defaultCollapseAll: true,
            'onUpdate:modelValue': (value: string[] | undefined) => {
              collapseModel.value = value
            }
          },
          () =>
            h(
              UCollapseItem,
              {
                value: 'a',
                title: 'Nested',
                modelValue: standaloneModel.value,
                'onUpdate:modelValue': (value: boolean) => {
                  standaloneModel.value = value
                }
              },
              () => 'Nested content'
            )
        )
      }
    })

    app.mount(host)

    try {
      await nextTick()
      expect(collapseModel.value).toBeUndefined()
      expect(standaloneModel.value).toBe(true)
      expect(host.querySelector('.u-collapse__item.is-active')).toBeFalsy()

      ;(host.querySelector('.u-collapse__header') as HTMLElement).click()
      await nextTick()

      expect(collapseModel.value).toEqual(['a'])
      expect(standaloneModel.value).toBe(true)
      expect(host.querySelector('.u-collapse__item.is-active')).toBeTruthy()
    } finally {
      app.unmount()
      host.remove()
    }
  })
})

describe('CollapseItem destroyOnCollapse', () => {
  it('keeps content mounted by default even when collapsed', async () => {
    const { host, unmount } = mountStandaloneItem({ title: 'Standalone' })

    try {
      await nextTick()
      expect(host.querySelector('.u-collapse__item.is-active')).toBeFalsy()
      expect(host.querySelector('.u-collapse__content')?.textContent).toBe('Standalone content')
    } finally {
      unmount()
    }
  })

  it('does not mount content when initially collapsed', async () => {
    const { host, unmount } = mountStandaloneItem({ title: 'Standalone', destroyOnCollapse: true })

    try {
      await nextTick()
      expect(host.querySelector('.u-collapse__item.is-active')).toBeFalsy()
      // 内容未挂载，但包装容器仍在（承载高度动画与 aria-hidden）
      expect(host.querySelector('.u-collapse__content')).toBeFalsy()
      expect(host.querySelector('.u-collapse__content-wrapper')).toBeTruthy()
    } finally {
      unmount()
    }
  })

  it('unmounts content after collapse and remounts on expand', async () => {
    const { host, model, unmount } = mountStandaloneItem({
      title: 'Standalone',
      modelValue: true,
      destroyOnCollapse: true
    })

    try {
      await nextTick()
      expect(host.querySelector('.u-collapse__content')?.textContent).toBe('Standalone content')

      const header = host.querySelector('.u-collapse__header') as HTMLElement
      header.click()
      await nextTick()

      expect(model.value).toBe(false)
      // happy-dom 无真实布局，收起动画直接落定，内容随即卸载
      await nextTick()
      expect(host.querySelector('.u-collapse__content')).toBeFalsy()

      header.click()
      await nextTick()
      await nextTick()

      expect(model.value).toBe(true)
      expect(host.querySelector('.u-collapse__content')?.textContent).toBe('Standalone content')
    } finally {
      unmount()
    }
  })
})
