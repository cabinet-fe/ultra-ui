import { describe, expect, it } from 'vitest'
import { createApp, h } from 'vue'

import UButton from '../button.vue'

function mountButton(props: Record<string, unknown> = {}, slot = '新建用户') {
  const host = document.createElement('div')
  document.body.appendChild(host)

  const app = createApp({ render: () => h(UButton, props, () => slot) })
  app.mount(host)

  return {
    host,
    button: host.querySelector('button')!,
    unmount() {
      app.unmount()
      host.remove()
    }
  }
}

describe('UButton 原生属性与可访问名', () => {
  it('不注入默认 aria-label：可访问名来自默认插槽文本', () => {
    const { button, unmount } = mountButton()

    expect(button.getAttribute('aria-label')).toBeNull()
    expect(button.textContent?.trim()).toBe('新建用户')

    unmount()
  })

  it('自己传的 aria-label 透传到根元素，图标按钮仍可命名', () => {
    const { button, unmount } = mountButton({ 'aria-label': '编辑' }, '')

    expect(button.getAttribute('aria-label')).toBe('编辑')

    unmount()
  })

  it('原生 type 固定为 button，放进 form 里不会触发提交', () => {
    const { button, unmount } = mountButton()

    expect(button.getAttribute('type')).toBe('button')

    unmount()
  })
})
