// @vitest-environment happy-dom

import { describe, expect, it } from 'vite-plus/test'
import { createApp, h, nextTick, ref, type Ref } from 'vue'

import UTree from '../tree.vue'

const data = [
  {
    label: '亚洲',
    value: 'asia',
    children: [
      { label: '中国', value: 'cn' },
      { label: '日本', value: 'jp' }
    ]
  }
]

function mountTree(props: Record<string, unknown> = {}) {
  const host = document.createElement('div')
  document.body.appendChild(host)

  const checked = ref(props.checked ?? []) as Ref<(string | number)[]>
  const emitted: (string | number)[][] = []

  const app = createApp({
    render() {
      return h(UTree, {
        data,
        checkable: true,
        expandAll: true,
        ...props,
        checked: checked.value,
        'onUpdate:checked': (value: (string | number)[]) => {
          checked.value = value
          emitted.push(value)
        }
      })
    }
  })

  app.mount(host)

  return {
    host,
    checked,
    emitted,
    unmount() {
      app.unmount()
      host.remove()
    }
  }
}

function queryNodeContents() {
  return [...document.body.querySelectorAll<HTMLElement>('.u-tree__node-content')]
}

function queryCheckboxes() {
  return [...document.body.querySelectorAll<HTMLInputElement>('.u-tree .u-checkbox__native')]
}

function findNode(label: string) {
  const node = queryNodeContents().find((el) => el.textContent?.includes(label))
  expect(node, `tree node "${label}" not found`).toBeTruthy()
  return node!
}

describe('UTree showCheckbox', () => {
  it('renders every checkbox when showCheckbox is not provided', async () => {
    const { unmount } = mountTree()

    try {
      await nextTick()
      expect(queryCheckboxes()).toHaveLength(3)
    } finally {
      unmount()
    }
  })

  it('skips the checkbox of nodes whose showCheckbox returns false', async () => {
    const { unmount } = mountTree({
      showCheckbox: (_item: Record<string, any>, node: any) => !node.children?.length
    })

    try {
      await nextTick()
      // 只有两个叶子节点渲染复选框
      expect(queryCheckboxes()).toHaveLength(2)
      // 展开图标与节点文本保持不变
      expect(findNode('亚洲')).toBeTruthy()
      expect(document.body.querySelectorAll('.u-tree__expand-icon').length).toBe(1)
    } finally {
      unmount()
    }
  })

  it('does not check a hidden node when checkOnClickNode clicks it', async () => {
    const { checked, unmount } = mountTree({
      showCheckbox: (_item: Record<string, any>, node: any) => !node.children?.length
    })

    try {
      await nextTick()
      findNode('亚洲').dispatchEvent(new MouseEvent('click', { bubbles: true }))
      await nextTick()
      expect(checked.value).toEqual([])

      // 叶子仍可单独勾选
      findNode('中国').dispatchEvent(new MouseEvent('click', { bubbles: true }))
      await nextTick()
      expect(checked.value).toEqual(['cn'])
    } finally {
      unmount()
    }
  })

  it('keeps the parent out of checked when all its leaves are checked', async () => {
    const { checked, unmount } = mountTree({
      showCheckbox: (_item: Record<string, any>, node: any) => !node.children?.length
    })

    try {
      await nextTick()
      findNode('中国').dispatchEvent(new MouseEvent('click', { bubbles: true }))
      await nextTick()
      findNode('日本').dispatchEvent(new MouseEvent('click', { bubbles: true }))
      await nextTick()

      expect(checked.value).toEqual(['cn', 'jp'])
    } finally {
      unmount()
    }
  })

  it('does not treat hidden nodes in checked as selected values', async () => {
    const { checked, unmount } = mountTree({
      checked: ['asia', 'cn'],
      showCheckbox: (_item: Record<string, any>, node: any) => !node.children?.length
    })

    try {
      await nextTick()

      // 隐藏复选框的节点不进入勾选数据：触发一次事件即可观察到 update:checked 内容
      findNode('日本').dispatchEvent(new MouseEvent('click', { bubbles: true }))
      await nextTick()
      expect(checked.value).toEqual(['cn', 'jp'])
    } finally {
      unmount()
    }
  })
})
