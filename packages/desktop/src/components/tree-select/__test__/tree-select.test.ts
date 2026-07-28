import { describe, expect, it } from 'vitest'
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
})
