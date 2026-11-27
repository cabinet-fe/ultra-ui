// @vitest-environment happy-dom

import { describe, expect, it } from 'vite-plus/test'
import { createApp, h } from 'vue'

import UTimelineItem from '../timeline-item.vue'
import UTimeline from '../timeline.vue'

function mountTimeline(renderItems: () => ReturnType<typeof h>[]) {
  const host = document.createElement('div')
  document.body.appendChild(host)

  const app = createApp({ render: () => h(UTimeline, null, { default: renderItems }) })
  app.mount(host)

  return {
    host,
    unmount() {
      app.unmount()
      host.remove()
    }
  }
}

describe('UTimeline', () => {
  it('渲染节点、颜色语义类与内容', () => {
    const { host, unmount } = mountTimeline(() => [
      h(UTimelineItem, { color: 'success', timestamp: '2026-10-01' }, () => '发布完成'),
      h(UTimelineItem, null, () => '默认节点')
    ])

    try {
      const items = host.querySelectorAll('.u-timeline__item')
      expect(items).toHaveLength(2)

      const firstNode = items[0]!.querySelector('.u-timeline__node')!
      expect(firstNode.classList.contains('u-timeline__node--success')).toBe(true)
      expect(firstNode.classList.contains('is-custom')).toBe(false)

      const secondNode = items[1]!.querySelector('.u-timeline__node')!
      expect(secondNode.classList.contains('u-timeline__node--default')).toBe(true)
      expect(items[0]!.querySelector('.u-timeline__timestamp')?.textContent).toBe('2026-10-01')
      expect(items[1]!.querySelector('.u-timeline__timestamp')).toBeNull()
    } finally {
      unmount()
    }
  })

  it('提供 #dot 插槽时标记 is-custom', () => {
    const { host, unmount } = mountTimeline(() => [
      h(
        UTimelineItem,
        { color: 'primary' },
        { dot: () => h('span', { class: 'custom-dot' }, '*'), default: () => '自定义节点' }
      )
    ])

    try {
      const node = host.querySelector('.u-timeline__node')!
      expect(node.classList.contains('is-custom')).toBe(true)
      expect(node.classList.contains('u-timeline__node--primary')).toBe(true)
      expect(node.querySelector('.custom-dot')?.textContent).toBe('*')
    } finally {
      unmount()
    }
  })

  it('timestampPlacement 控制 wrapper 的 is-timestamp-top 类名与 DOM 顺序', () => {
    const { host, unmount } = mountTimeline(() => [
      h(UTimelineItem, { timestamp: '下方时间' }, () => '内容一'),
      h(UTimelineItem, { timestamp: '上方时间', timestampPlacement: 'top' }, () => '内容二')
    ])

    try {
      const wrappers = host.querySelectorAll('.u-timeline__wrapper')
      expect(wrappers[0]!.classList.contains('is-timestamp-top')).toBe(false)
      expect(wrappers[1]!.classList.contains('is-timestamp-top')).toBe(true)
      expect(wrappers[0]!.firstElementChild?.classList.contains('u-timeline__content')).toBe(true)
      expect(wrappers[0]!.lastElementChild?.classList.contains('u-timeline__timestamp')).toBe(true)
    } finally {
      unmount()
    }
  })
})
