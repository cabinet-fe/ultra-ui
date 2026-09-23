import { describe, expect, it } from 'vitest'
import { createApp, h, nextTick, ref } from 'vue'

import type { KanbanColumnItem } from '../../types'
import UKanban from '../kanban.vue'

const defaultColumns: KanbanColumnItem[] = [
  {
    key: 'todo',
    title: '待办',
    items: [
      { id: 1, title: '任务 1' },
      { id: 2, title: '任务 2' }
    ]
  },
  { key: 'done', title: '已完成', items: [{ id: 3, title: '任务 3' }] },
  { key: 'archive', title: '归档', items: [] }
]

function mountKanban(
  props: Record<string, unknown> = {},
  columns: KanbanColumnItem[] = defaultColumns,
  slots: Record<string, any> = {}
) {
  const host = document.createElement('div')
  document.body.appendChild(host)

  const model = ref(columns)
  const changes: KanbanColumnItem[][] = []

  const app = createApp({
    render() {
      return h(
        UKanban,
        {
          columns: model.value,
          ...props,
          'onUpdate:columns': (value: KanbanColumnItem[]) => {
            model.value = value
          },
          onChange: (value: KanbanColumnItem[]) => {
            changes.push(value)
          }
        },
        slots
      )
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
  return host.querySelector<HTMLElement>('.u-kanban')!
}

function queryColumns(host: HTMLElement) {
  return [...host.querySelectorAll<HTMLElement>('.u-kanban__column')]
}

function queryCards(host: HTMLElement) {
  return [...host.querySelectorAll<HTMLElement>('.u-kanban__card')]
}

describe('UKanban', () => {
  it('基础渲染：列、列头标题、计数徽标与卡片', async () => {
    const { host, unmount } = mountKanban()
    await nextTick()

    try {
      const root = queryRoot(host)
      expect(root).toBeTruthy()

      const columns = queryColumns(host)
      expect(columns.length).toBe(3)

      const titles = [...host.querySelectorAll('.u-kanban__column-title')].map(
        (el) => el.textContent
      )
      expect(titles).toEqual(['待办', '已完成', '归档'])

      const counts = [...host.querySelectorAll('.u-kanban__column-count')].map(
        (el) => el.textContent
      )
      expect(counts).toEqual(['2', '1', '0'])

      const cards = queryCards(host)
      expect(cards.length).toBe(3)
      expect(cards[0]!.textContent).toContain('任务 1')
      expect(cards[0]!.querySelector('.u-kanban__card-handle')).toBeTruthy()
    } finally {
      unmount()
    }
  })

  it('空列渲染占位文案，自定义 placeholder 生效', async () => {
    const { host, unmount } = mountKanban({ placeholder: '拖卡片到这里' })
    await nextTick()

    try {
      const empties = [...host.querySelectorAll('.u-kanban__empty')]
      expect(empties.length).toBe(1)
      expect(empties[0]!.textContent).toBe('拖卡片到这里')
      // 空列的卡片容器仍存在，作为拖放目标
      expect(queryColumns(host)[2]!.querySelector('.u-kanban__cards')).toBeTruthy()
    } finally {
      unmount()
    }
  })

  it('countable 为 false 时不显示计数徽标', async () => {
    const { host, unmount } = mountKanban({ countable: false })
    await nextTick()

    try {
      expect(host.querySelector('.u-kanban__column-count')).toBeNull()
    } finally {
      unmount()
    }
  })

  it('支持自定义 cardKey 与 titleKey', async () => {
    const columns: KanbanColumnItem[] = [
      {
        key: 'list',
        name: '自定义列',
        items: [
          { no: 'a', name: '卡片 A' },
          { no: 'b', name: '卡片 B' }
        ]
      }
    ]
    const { host, unmount } = mountKanban({ cardKey: 'no', titleKey: 'name' }, columns)
    await nextTick()

    try {
      expect(host.querySelector('.u-kanban__column-title')!.textContent).toBe('自定义列')

      const cards = queryCards(host)
      expect(cards.length).toBe(2)
      expect(cards[0]!.textContent).toContain('卡片 A')
      expect(cards[1]!.textContent).toContain('卡片 B')
    } finally {
      unmount()
    }
  })

  it('header / card / empty 插槽自定义内容', async () => {
    const { host, unmount } = mountKanban({}, defaultColumns, {
      header: ({ column, count }: { column: KanbanColumnItem; count: number }) =>
        h('span', { class: 'custom-header' }, `${column.title}(${count})`),
      card: ({ card }: { card: Record<string, any> }) =>
        h('span', { class: 'custom-card' }, `#${card.id} ${card.title}`),
      empty: ({ column }: { column: KanbanColumnItem }) =>
        h('span', { class: 'custom-empty' }, `${column.title}空`)
    })
    await nextTick()

    try {
      const headers = [...host.querySelectorAll('.custom-header')].map((el) => el.textContent)
      expect(headers).toEqual(['待办(2)', '已完成(1)', '归档(0)'])

      const cards = [...host.querySelectorAll('.custom-card')].map((el) => el.textContent)
      expect(cards).toEqual(['#1 任务 1', '#2 任务 2', '#3 任务 3'])

      expect(host.querySelector('.custom-empty')!.textContent).toBe('归档空')
    } finally {
      unmount()
    }
  })

  it('disabled 时根节点带 is-disabled 类名', async () => {
    const { host, unmount } = mountKanban({ disabled: true })
    await nextTick()

    try {
      expect(queryRoot(host).classList.contains('is-disabled')).toBe(true)
    } finally {
      unmount()
    }
  })

  it('外部替换 columns 数据视图响应更新', async () => {
    const { host, model, unmount } = mountKanban()
    await nextTick()

    try {
      expect(queryCards(host).length).toBe(3)

      model.value = [{ key: 'only', title: '唯一列', items: [{ id: 9, title: '新卡片' }] }]
      await nextTick()

      expect(queryColumns(host).length).toBe(1)
      expect(queryCards(host).length).toBe(1)
      expect(queryCards(host)[0]!.textContent).toContain('新卡片')
      // 原空列占位消失
      expect(host.querySelector('.u-kanban__empty')).toBeNull()
    } finally {
      unmount()
    }
  })
})
