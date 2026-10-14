// @vitest-environment happy-dom

import { describe, expect, it } from 'vite-plus/test'
import { createApp, h } from 'vue'

import UEmpty from '../empty.vue'

function mountEmpty(props: Record<string, unknown> = {}) {
  const host = document.createElement('div')
  document.body.appendChild(host)

  const app = createApp({ render: () => h(UEmpty, props) })
  app.mount(host)

  return {
    root: () => host.querySelector<HTMLElement>('.u-empty'),
    unmount() {
      app.unmount()
      host.remove()
    }
  }
}

describe('UEmpty block', () => {
  it('默认 inline-block，不输出 is-block 类', () => {
    const ctx = mountEmpty()

    expect(ctx.root()!.className).toBe('u-empty')

    ctx.unmount()
  })

  it('block 时输出 is-block 类', () => {
    const ctx = mountEmpty({ block: true })

    expect(ctx.root()!.className).toBe('u-empty is-block')

    ctx.unmount()
  })
})
