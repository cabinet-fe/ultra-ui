import { describe, expect, it, vi } from 'vitest'

import type { SheetTool } from '../registry'
import { DEFAULT_TOOL_GROUP, ToolRegistry } from '../registry'

function tool(partial: Partial<SheetTool> & { id: string }): SheetTool {
  return { title: partial.id, onClick: () => {}, ...partial }
}

describe('ToolRegistry', () => {
  it('注册工具 → 出现在指定分组/顺序位；缺省进 default 组', () => {
    const registry = new ToolRegistry()
    registry.register(tool({ id: 'a', group: 'g1', order: 2 }))
    registry.register(tool({ id: 'b' })) // 缺省分组
    registry.register(tool({ id: 'c', group: 'g1', order: 1 }))
    registry.register(tool({ id: 'd', group: 'g1' })) // 缺省 order 0
    registry.register(tool({ id: 'e', group: 'g2' }))

    const groups = registry.getGroups()
    // 组序 = 各组最早注册位置：g1（a）→ default（b）→ g2（e）
    expect(groups.map((group) => group.name)).toEqual(['g1', DEFAULT_TOOL_GROUP, 'g2'])
    // g1 组内按 (order, 注册序)：d(0) → c(1) → a(2)
    expect(groups[0]!.tools.map((t) => t.id)).toEqual(['d', 'c', 'a'])
    expect(groups[1]!.tools.map((t) => t.id)).toEqual(['b'])
    expect(groups[2]!.tools.map((t) => t.id)).toEqual(['e'])
  })

  it('同组同 order 按注册先后排序', () => {
    const registry = new ToolRegistry()
    registry.register(tool({ id: 'x' }))
    registry.register(tool({ id: 'y' }))
    registry.register(tool({ id: 'z' }))
    expect(registry.getGroups()[0]!.tools.map((t) => t.id)).toEqual(['x', 'y', 'z'])
  })

  it('重复 id 注册 = 替换定义并保留原位置，触发 change', () => {
    const registry = new ToolRegistry()
    const onChange = vi.fn()
    registry.onChange(onChange)
    registry.register(tool({ id: 'a', title: 'A1' }))
    registry.register(tool({ id: 'b' }))
    onChange.mockClear()

    registry.register(tool({ id: 'a', title: 'A2', order: 9 }))
    expect(registry.size).toBe(2)
    expect(registry.get('a')?.title).toBe('A2')
    // 替换只保留注册序（同 order 时的次序）；order 变更仍按新值排序
    expect(registry.getGroups()[0]!.tools.map((t) => t.id)).toEqual(['b', 'a'])
    expect(onChange).toHaveBeenCalledTimes(1)
  })

  it('重复 id 且 order 不变时严格原位替换', () => {
    const registry = new ToolRegistry()
    registry.register(tool({ id: 'a' }))
    registry.register(tool({ id: 'b' }))
    registry.register(tool({ id: 'a', title: 'A2' }))
    expect(registry.getGroups()[0]!.tools.map((t) => t.id)).toEqual(['a', 'b'])
    expect(registry.get('a')?.title).toBe('A2')
  })

  it('unregister：存在 → true + change；不存在 → false 且不触发 change', () => {
    const registry = new ToolRegistry()
    const onChange = vi.fn()
    registry.onChange(onChange)
    registry.register(tool({ id: 'a' }))
    onChange.mockClear()

    expect(registry.unregister('a')).toBe(true)
    expect(registry.has('a')).toBe(false)
    expect(onChange).toHaveBeenCalledTimes(1)

    expect(registry.unregister('a')).toBe(false)
    expect(registry.unregister('ghost')).toBe(false)
    expect(onChange).toHaveBeenCalledTimes(1)
  })

  it('注册校验：缺 id / title / onClick 抛错', () => {
    const registry = new ToolRegistry()
    expect(() => registry.register(tool({ id: '' }))).toThrow('id 不能为空')
    expect(() => registry.register({ id: 'x', title: '', onClick: () => {} })).toThrow('title')
    expect(() => registry.register({ id: 'x', title: 'X' } as unknown as SheetTool)).toThrow(
      'onClick'
    )
  })

  it('onChange 返回取消订阅函数', () => {
    const registry = new ToolRegistry()
    const onChange = vi.fn()
    const off = registry.onChange(onChange)
    off()
    registry.register(tool({ id: 'a' }))
    expect(onChange).not.toHaveBeenCalled()
  })

  it('getGroups 返回副本：调用方改数组不影响注册表', () => {
    const registry = new ToolRegistry()
    registry.register(tool({ id: 'a' }))
    const groups = registry.getGroups()
    groups[0]!.tools.length = 0
    expect(registry.getGroups()[0]!.tools).toHaveLength(1)
  })
})
