import { describe, expect, it, vi } from 'vitest'
import { computed, createApp, reactive, ref } from 'vue'

import { useDnD, type UseDnDResult } from '../index'
import { mergeView } from '../merge-view'

/** 在组件 setup 上下文中执行组合式函数（提供生命周期与 effect scope） */
function withSetup<T>(fn: () => T): T {
  let result!: T
  const app = createApp({
    setup() {
      result = fn()
      return () => null
    }
  })
  app.mount(document.createElement('div'))
  return result
}

describe('mergeView', () => {
  it('排序：视图重排合并回完整数组，未参与项保持相对顺序', () => {
    const [a, b, c, h1, h2] = ['a', 'b', 'c', 'h1', 'h2']
    const source = [h1, a, b, h2, c]
    // 隐藏项锚定在其前驱可见项之后：h2 跟随 b
    expect(mergeView(source, [a, b, c], [c, a, b])).toEqual([h1, c, a, b, h2])
  })

  it('完全逆序', () => {
    const [a, b] = ['a', 'b']
    expect(mergeView([a, b], [a, b], [b, a])).toEqual([b, a])
  })

  it('跨容器移出：新视图缺少的成员从源数组移除', () => {
    const [a, b, c, h] = ['a', 'b', 'c', 'h']
    expect(mergeView([a, h, b, c], [a, b, c], [a, c])).toEqual([a, h, c])
  })

  it('跨容器移入：新成员按相对位置插入（头部 / 中间 / 末尾）', () => {
    const [a, b, x, y, z, h] = ['a', 'b', 'x', 'y', 'z', 'h']
    expect(mergeView([a, b], [a, b], [x, a, b])).toEqual([x, a, b])
    expect(mergeView([a, h, b], [a, b], [a, y, b])).toEqual([a, h, y, b])
    expect(mergeView([a, b], [a, b], [a, b, z])).toEqual([a, b, z])
  })

  it('不修改入参', () => {
    const [a, b] = ['a', 'b']
    const source = [a, b]
    mergeView(source, [a, b], [b, a])
    expect(source).toEqual([a, b])
  })
})

describe('useDnD 数据写回', () => {
  function sortBySetter<T>(dnd: UseDnDResult<T>, next: T[]) {
    // 模拟库排序后通过 setValues 写回
    dnd.values.value = next
  }

  it('ref 数据源：排序结果直接写回 ref', () => {
    const list = ref([{ id: 'a' }, { id: 'b' }])
    const dnd = withSetup(() => useDnD({ values: list }))

    const [a, b] = dnd.values.value
    sortBySetter(dnd, [b!, a!])

    expect(list.value.map((i) => i.id)).toEqual(['b', 'a'])
  })

  it('响应式数组数据源：原地 splice 写回', () => {
    const items = reactive([{ id: 'a' }, { id: 'b' }])
    const dnd = withSetup(() => useDnD({ values: items }))

    const [a, b] = dnd.values.value
    sortBySetter(dnd, [b!, a!])

    expect(items.map((i) => i.id)).toEqual(['b', 'a'])
  })

  it('filter 模式：仅可见项参与排序，结果自动合并回原数组', () => {
    const items = reactive([
      { id: 'h1', visible: false },
      { id: 'a', visible: true },
      { id: 'h2', visible: false },
      { id: 'b', visible: true }
    ])
    const dnd = withSetup(() => useDnD({ values: items, filter: (i) => i.visible }))

    expect(dnd.values.value.map((i) => i.id)).toEqual(['a', 'b'])

    const [a, b] = dnd.values.value
    sortBySetter(dnd, [b!, a!])

    expect(items.map((i) => i.id)).toEqual(['h1', 'b', 'a', 'h2'])
  })

  it('filter 模式：跨容器移出时移除对应源数据项', () => {
    const items = reactive([
      { id: 'a', visible: true },
      { id: 'h', visible: false },
      { id: 'b', visible: true }
    ])
    const dnd = withSetup(() => useDnD({ values: items, filter: (i) => i.visible }))

    const [, b] = dnd.values.value
    // b 被移出到其他容器
    sortBySetter(dnd, [b!].slice(0, 0).concat(dnd.values.value.filter((i) => i.id === 'a')))

    expect(items.map((i) => i.id)).toEqual(['a', 'h'])
  })

  it('非响应式纯数组数据源：内部副本驱动视图，原数组保持同步', () => {
    const items = [{ id: 'a' }, { id: 'b' }]
    const dnd = withSetup(() => useDnD({ values: items }))

    const [a, b] = dnd.values.value
    sortBySetter(dnd, [b!, a!])

    // 返回的 values 已更新（内部响应式副本）
    expect(dnd.values.value.map((i) => i.id)).toEqual(['b', 'a'])
    // 原数组同步
    expect(items.map((i) => i.id)).toEqual(['b', 'a'])
  })

  it('getter 数据源：通过 onReorder 接收合并后的完整数组', () => {
    const items = reactive([
      { id: 'a', visible: true },
      { id: 'h', visible: false },
      { id: 'b', visible: true }
    ])
    const onReorder = vi.fn()
    const dnd = withSetup(() =>
      useDnD({ values: () => items, filter: (i) => i.visible, onReorder })
    )

    const [a, b] = dnd.values.value
    sortBySetter(dnd, [b!, a!])

    expect(onReorder).toHaveBeenCalledTimes(1)
    expect(onReorder.mock.calls[0]![0].map((i: { id: string }) => i.id)).toEqual(['b', 'a', 'h'])
  })

  it('只读 computed 数据源：通过 onReorder 写回', () => {
    const list = ref([{ id: 'a' }, { id: 'b' }])
    const onReorder = vi.fn()
    const dnd = withSetup(() => useDnD({ values: computed(() => list.value), onReorder }))

    const [a, b] = dnd.values.value
    sortBySetter(dnd, [b!, a!])

    expect(onReorder).toHaveBeenCalledTimes(1)
    expect(list.value.map((i) => i.id)).toEqual(['a', 'b'])
  })

  it('可写 computed 数据源：排序结果进入其 setter', () => {
    const list = ref([{ id: 'a' }, { id: 'b' }])
    const setter = vi.fn()
    const dnd = withSetup(() =>
      useDnD({ values: computed({ get: () => list.value, set: setter }) })
    )

    const [a, b] = dnd.values.value
    sortBySetter(dnd, [b!, a!])

    expect(setter).toHaveBeenCalledTimes(1)
    expect(setter.mock.calls[0]![0].map((i: { id: string }) => i.id)).toEqual(['b', 'a'])
  })

  it('外部数据变化时视图自动更新', () => {
    const items = reactive([{ id: 'a', visible: true }])
    const dnd = withSetup(() => useDnD({ values: items, filter: (i) => i.visible }))

    items.push({ id: 'b', visible: true })

    expect(dnd.values.value.map((i) => i.id)).toEqual(['a', 'b'])
  })
})
