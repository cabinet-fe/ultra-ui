// @vitest-environment happy-dom

import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test'
import { createApp, h } from 'vue'

import { UAiAttachments } from '..'
import type { ChatAttachment } from '../../../chat/types'
import type { AiAttachmentsProps } from '../../../types'

let warnSpy: ReturnType<typeof vi.spyOn>

beforeEach(() => {
  warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
})

afterEach(() => {
  const injectionWarnings = warnSpy.mock.calls.filter((args) =>
    args.some(
      (arg) => typeof arg === 'string' && (arg.includes('injection') || arg.includes('AiChatDIKey'))
    )
  )
  expect(injectionWarnings).toEqual([])
  warnSpy.mockRestore()
})

function mountAttachments(
  props: AiAttachmentsProps & Record<string, unknown>,
  slots?: Record<string, (scope: any) => any>
) {
  const host = document.createElement('div')
  document.body.appendChild(host)
  const app = createApp({ render: () => h(UAiAttachments, props, slots) })
  app.mount(host)

  return {
    host,
    unmount() {
      app.unmount()
      host.remove()
    }
  }
}

const ITEMS: ChatAttachment[] = [
  { name: 'avatar.png', mimeType: 'image/png', size: 2048, dataUrl: 'data:image/png;base64,AAA' },
  { name: 'notes.md', mimeType: 'text/markdown', size: 512, dataUrl: '' },
  { name: 'Makefile', mimeType: 'text/plain', size: 128, dataUrl: '' }
]

describe('UAiAttachments', () => {
  it('空列表不渲染，非空正确渲染图片与非图片文件卡片', () => {
    const empty = mountAttachments({ items: [] })
    expect(empty.host.querySelector('.u-ai-attachments')).toBeFalsy()
    empty.unmount()

    const { host, unmount } = mountAttachments({ items: ITEMS })
    expect(host.querySelector('.u-ai-attachments--default')).toBeTruthy()
    expect(host.querySelectorAll('.u-ai-attachments__item.is-image')).toHaveLength(1)
    expect(host.querySelectorAll('.u-ai-attachments__item.is-file')).toHaveLength(2)
    expect(
      [...host.querySelectorAll('.u-ai-attachments__ext')].map((el) => el.textContent)
    ).toEqual(['MD', 'FILE'])
    expect(host.querySelector('.u-ai-attachments__name')?.textContent).toBe('notes.md')
    expect(host.querySelector('.u-ai-attachments__size')?.textContent).toBe('512 B')
    unmount()
  })

  it('支持 compact 与 default 尺寸类切换', () => {
    const compact = mountAttachments({ items: ITEMS, size: 'compact' })
    expect(compact.host.querySelector('.u-ai-attachments--compact')).toBeTruthy()
    compact.unmount()

    const def = mountAttachments({ items: ITEMS, size: 'default' })
    expect(def.host.querySelector('.u-ai-attachments--default')).toBeTruthy()
    def.unmount()
  })

  it('removable 控制移除按钮并触发 remove 事件，阻止冒泡至 preview', () => {
    const onRemove = vi.fn()
    const onPreview = vi.fn()

    const readonly = mountAttachments({ items: ITEMS, removable: false })
    expect(readonly.host.querySelector('.u-ai-attachments__remove')).toBeFalsy()
    readonly.unmount()

    const removable = mountAttachments({ items: ITEMS, removable: true, onRemove, onPreview })
    const removeIcons = removable.host.querySelectorAll<HTMLElement>('.u-ai-attachments__remove')
    expect(removeIcons).toHaveLength(3)
    expect(removable.host.querySelector('.u-ai-attachments__item.is-removable')).toBeTruthy()

    removeIcons[1]!.click()
    expect(onRemove).toHaveBeenCalledWith(1, ITEMS[1])
    expect(onPreview).not.toHaveBeenCalled()
    removable.unmount()
  })

  it('点击图片触发 preview 事件', () => {
    const onPreview = vi.fn()
    const { host, unmount } = mountAttachments({ items: ITEMS, onPreview })

    host.querySelector<HTMLElement>('.u-ai-attachments__image')!.click()
    expect(onPreview).toHaveBeenCalledWith(ITEMS[0], 0)
    unmount()
  })

  it('支持 #item 作用域插槽并透传 remove 与 preview 回调', () => {
    const onRemove = vi.fn()
    const onPreview = vi.fn()
    const { host, unmount } = mountAttachments(
      { items: ITEMS, removable: true, onRemove, onPreview },
      {
        item: (scope) =>
          h('div', { class: `slot-item-${scope.index}` }, [
            h('span', { class: 'slot-flag' }, String(scope.isImage)),
            h('button', { type: 'button', class: 'slot-preview', onClick: scope.preview }, '预览'),
            h('button', { type: 'button', class: 'slot-remove', onClick: scope.remove }, '删除')
          ])
      }
    )

    expect(host.querySelector('.slot-item-0 .slot-flag')?.textContent).toBe('true')
    expect(host.querySelector('.slot-item-1 .slot-flag')?.textContent).toBe('false')

    host.querySelector<HTMLElement>('.slot-item-0 .slot-preview')!.click()
    expect(onPreview).toHaveBeenCalledWith(ITEMS[0], 0)

    host.querySelector<HTMLElement>('.slot-item-2 .slot-remove')!.click()
    expect(onRemove).toHaveBeenCalledWith(2, ITEMS[2])
    unmount()
  })
})
