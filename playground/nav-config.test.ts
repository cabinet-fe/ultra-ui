import { describe, expect, it } from 'vite-plus/test'

import type { NavSearchGroup, NavSearchItem } from './nav-config'
import { buildPlaygroundMenus, flattenPlaygroundNavItems, searchNavItems } from './nav-config'

const navItems = flattenPlaygroundNavItems(buildPlaygroundMenus())

const flatTitles = (groups: NavSearchGroup[]) =>
  groups.flatMap((group) => group.items.map((item) => item.title))

describe('searchNavItems 匹配与排序', () => {
  it('空查询返回全量分组，分区顺序与扁平化顺序一致且无高亮区间', () => {
    const groups = searchNavItems(navItems)

    expect(groups.map((group) => group.section)).toEqual([
      'Icons 图标',
      'Desktop 组件',
      'Mobile 组件',
      'AI Chat',
      'Sheet 电子表格',
      'Smart Table 智慧表格'
    ])
    const results = groups.flatMap((group) => group.items)
    expect(results).toHaveLength(navItems.length)
    expect(groups.every((group) => group.items.length > 0)).toBe(true)
    expect(results.every((item) => item.titleRanges.length === 0)).toBe(true)
  })

  it('token 间 AND 匹配：「表单 输入」命中「输入框 Input」且排除「表单容器 Form」', () => {
    const titles = flatTitles(searchNavItems(navItems, '表单 输入'))

    expect(titles).toContain('输入框 Input')
    expect(titles).not.toContain('表单容器 Form')
  })

  it('英文匹配不区分大小写：「button」命中「按钮 Button」', () => {
    expect(flatTitles(searchNavItems(navItems, 'button'))).toContain('按钮 Button')
  })

  it('组内权重排序：「表单」下 Desktop 分组首项为标题命中的「表单容器 Form」', () => {
    const desktop = searchNavItems(navItems, '表单').find(
      (group) => group.section === 'Desktop 组件'
    )
    const hitFlags = (desktop?.items ?? []).map((item) => item.titleRanges.length > 0)

    expect(desktop?.items[0]?.title).toBe('表单容器 Form')
    // 标题直接命中的项全部排在仅分类/分区/路径命中的项之前
    expect(hitFlags).toEqual(hitFlags.slice().sort((a, b) => Number(b) - Number(a)))
  })

  it('无匹配查询返回空结果', () => {
    expect(searchNavItems(navItems, 'zzzzz')).toEqual([])
  })
})

describe('searchNavItems 标题高亮区间', () => {
  const searchOne = (title: string, query: string) => {
    const item: NavSearchItem = { title, path: '/p', section: 'S' }
    return searchNavItems([item], query)[0].items[0].titleRanges
  }

  it('单 token 命中返回对应区间', () => {
    expect(searchOne('输入框 Input', '输入')).toEqual([{ start: 0, end: 2 }])
    expect(searchOne('按钮 Button', 'button')).toEqual([{ start: 3, end: 9 }])
  })

  it('同一 token 多处命中返回多个不相交区间', () => {
    expect(searchOne('输入框 Input 输入框', '输入')).toEqual([
      { start: 0, end: 2 },
      { start: 10, end: 12 }
    ])
  })

  it('不同 token 的重叠区间合并为一个', () => {
    expect(searchOne('输入框 Input', '输入 入框')).toEqual([{ start: 0, end: 3 }])
  })
})
