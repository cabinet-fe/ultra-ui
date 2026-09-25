import { describe, expect, it } from 'vite-plus/test'
import { createApp, h, nextTick, ref, type Ref } from 'vue'

import UTreeSelect from '../tree-select.vue'

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

const treeData = [
  {
    label: '北京',
    value: 'beijing',
    children: [
      { label: '朝阳区（最新）', value: 'chaoyang' },
      { label: '海淀区（最新）', value: 'haidian' }
    ]
  },
  { label: '上海（最新）', value: 'shanghai' }
]

function mountTreeSelect(props: Record<string, unknown> = {}) {
  const host = document.createElement('div')
  document.body.appendChild(host)

  const model = ref(props.modelValue) as Ref<string | number | undefined>
  const data = ref(props.data ?? treeData)
  const texts: (string | undefined)[] = []

  const app = createApp({
    render() {
      return h(UTreeSelect, {
        ...props,
        modelValue: model.value,
        data: data.value,
        expandAll: true,
        'onUpdate:modelValue': (value?: string | number) => {
          model.value = value
        },
        'onUpdate:text': (text?: string) => {
          texts.push(text)
        }
      })
    }
  })

  app.mount(host)

  return {
    host,
    model,
    data,
    texts,
    unmount() {
      app.unmount()
      host.remove()
    }
  }
}

async function openDropdown(host: HTMLElement) {
  const input = host.querySelector('input')!
  input.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }))
  for (let attempt = 0; attempt < 20; attempt++) {
    await nextTick()
    await sleep(25)
    if (queryNodeContents().length > 0) return
  }
}

/** 打开面板并等待进入加载态（远程数据未返回前树不渲染） */
async function openPanelWithLoading(host: HTMLElement) {
  const input = host.querySelector('input')!
  input.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }))
  for (let attempt = 0; attempt < 20; attempt++) {
    await nextTick()
    await sleep(25)
    if (document.body.querySelector('.u-tree-select__loading') || queryNodeContents().length > 0) {
      return
    }
  }
}

async function typeQuery(host: HTMLElement, text: string) {
  const input = host.querySelector('input')!
  input.focus()
  // 清空查询串（查询态下 model 绑定查询串）
  input.value = ''
  input.dispatchEvent(
    new InputEvent('input', { bubbles: true, data: '', inputType: 'deleteContentBackward' })
  )
  await nextTick()

  input.value = text
  input.dispatchEvent(
    new InputEvent('input', { bubbles: true, data: text, inputType: 'insertText' })
  )
  await nextTick()
  // 远程搜索防抖 200ms
  await sleep(250)
}
function queryNodeContents() {
  return [...document.body.querySelectorAll<HTMLElement>('.u-tree__node-content')]
}

async function clickNodeByLabel(label: string) {
  const node = queryNodeContents().find((el) => el.textContent?.includes(label))
  expect(node, `tree node "${label}" not found`).toBeTruthy()
  node!.dispatchEvent(new MouseEvent('click', { bubbles: true }))
  await nextTick()
  await sleep(50)
}

describe('UTreeSelect', () => {
  it('emits update:text when modelValue echoes against data', async () => {
    const { host, texts, unmount } = mountTreeSelect({ modelValue: 'chaoyang' })

    try {
      await nextTick()
      expect(texts.at(-1)).toBe('朝阳区（最新）')
      expect(host.querySelector('input')!.value).toBe('朝阳区（最新）')
    } finally {
      unmount()
    }
  })

  it('emits update:text after data arrives for an existing modelValue', async () => {
    const { host, data, texts, unmount } = mountTreeSelect({ modelValue: 'shanghai', data: [] })

    try {
      await nextTick()
      expect(texts).toHaveLength(0)

      data.value = treeData
      await nextTick()
      await nextTick()

      expect(texts.at(-1)).toBe('上海（最新）')
      expect(host.querySelector('input')!.value).toBe('上海（最新）')
    } finally {
      unmount()
    }
  })

  it('emits update:text on user select and clear', async () => {
    const { host, model, texts, unmount } = mountTreeSelect({
      // filterable 下点击 input 会显式 open，避免非过滤态依赖冒泡开合的不稳定
      filterable: true
    })

    try {
      await openDropdown(host)
      await clickNodeByLabel('上海（最新）')
      expect(model.value).toBe('shanghai')
      expect(texts.at(-1)).toBe('上海（最新）')

      // 清除：父级清空值时回显同步发出 update:text
      model.value = undefined
      await nextTick()
      await nextTick()
      expect(texts.at(-1)).toBeUndefined()
      expect(host.querySelector('input')!.value).toBe('')
    } finally {
      unmount()
    }
  })

  it('loads default tree remotely on mount with loading state', async () => {
    let resolveRemote!: (data: Record<string, any>[]) => void
    const calls: string[] = []
    const { host, unmount } = mountTreeSelect({
      data: (qs: string) => {
        calls.push(qs)
        return new Promise((resolve) => {
          resolveRemote = resolve
        })
      }
    })

    try {
      // 挂载即以空串调用一次
      expect(calls).toEqual([''])

      await openPanelWithLoading(host)
      expect(document.body.querySelector('.u-tree-select__loading')).toBeTruthy()
      expect(queryNodeContents()).toHaveLength(0)

      resolveRemote(treeData)
      await sleep(50)
      expect(document.body.querySelector('.u-tree-select__loading')).toBeFalsy()
      expect(queryNodeContents().length).toBeGreaterThan(0)
    } finally {
      unmount()
    }
  })

  it('queries the remote function on input and expands the result', async () => {
    const calls: string[] = []
    const { host, unmount } = mountTreeSelect({
      data: (qs: string) => {
        calls.push(qs)
        return Promise.resolve(qs ? [treeData[0]!] : treeData)
      }
    })

    try {
      // 初始空串加载完成
      await sleep(50)
      expect(calls).toEqual([''])

      await openDropdown(host)
      await typeQuery(host, '朝阳区')
      expect(calls).toEqual(['', '朝阳区'])

      const contents = queryNodeContents()
      expect(contents.some((el) => el.textContent?.includes('朝阳区（最新）'))).toBe(true)
    } finally {
      unmount()
    }
  })

  it('discards stale remote responses when a newer query resolves first', async () => {
    const pending: ((data: Record<string, any>[]) => void)[] = []
    const { host, unmount } = mountTreeSelect({
      data: (qs: string) =>
        new Promise((resolve) => {
          pending.push(resolve)
        })
    })

    try {
      await openPanelWithLoading(host)
      expect(document.body.querySelector('.u-tree-select__loading')).toBeTruthy()

      await typeQuery(host, '上海')
      expect(pending).toHaveLength(2)

      // 新查询先返回
      pending[1]!([treeData[1]!])
      await sleep(20)
      expect(queryNodeContents().some((el) => el.textContent?.includes('上海'))).toBe(true)

      // 慢的旧响应（初始空串查询）后返回，不能覆盖新结果
      pending[0]!(treeData)
      await sleep(20)
      expect(queryNodeContents().some((el) => el.textContent?.includes('北京'))).toBe(false)
    } finally {
      unmount()
    }
  })
})
