import { describe, expect, it } from 'vite-plus/test'
import { createApp, h, nextTick, ref } from 'vue'

import UInput from '../input.vue'

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

function mountInput(props: Record<string, unknown>) {
  const host = document.createElement('div')
  document.body.appendChild(host)

  const model = ref(props.modelValue as string | undefined)
  const app = createApp({
    render() {
      return h(UInput, {
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

function hover(host: HTMLElement) {
  host.querySelector('.u-input')?.dispatchEvent(new MouseEvent('mouseenter'))
}

describe('Input', () => {
  it('reserves suffix space before hover when clearable', () => {
    const { host, unmount } = mountInput({ modelValue: 'a' })

    try {
      expect(host.querySelector('.u-input__suffix')).not.toBeNull()
      expect(host.querySelector('.u-input__clear')).toBeNull()
    } finally {
      unmount()
    }
  })

  it('does not render suffix when clearable is false and no suffix content', () => {
    const { host, unmount } = mountInput({ modelValue: 'a', clearable: false })

    try {
      expect(host.querySelector('.u-input__suffix')).toBeNull()
    } finally {
      unmount()
    }
  })

  it('renders suffix content with the suffix prop', () => {
    const { host, unmount } = mountInput({ modelValue: 'a', clearable: false, suffix: '元' })

    try {
      expect(host.querySelector('.u-input__suffix-content')?.textContent).toContain('元')
    } finally {
      unmount()
    }
  })

  it('replaces suffix content with the clear icon on hover', async () => {
    const { host, unmount } = mountInput({ modelValue: 'a', suffix: '元' })

    try {
      hover(host)
      await nextTick()
      // out-in 过渡：等前一个节点离场、清除图标入场
      await sleep(50)

      expect(host.querySelector('.u-input__clear')).not.toBeNull()
      expect(host.querySelector('.u-input__suffix-content')).toBeNull()
    } finally {
      unmount()
    }
  })

  it('clears the value on clear icon click', async () => {
    const { host, model, unmount } = mountInput({ modelValue: 'a' })

    try {
      hover(host)
      await nextTick()
      await sleep(50)

      host
        .querySelector<HTMLElement>('.u-input__clear')!
        .dispatchEvent(new MouseEvent('click', { bubbles: true }))
      await nextTick()
      expect(model.value).toBe('')
    } finally {
      unmount()
    }
  })
})
