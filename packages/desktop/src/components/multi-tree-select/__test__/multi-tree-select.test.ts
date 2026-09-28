import { describe, expect, it } from 'vite-plus/test'
import { createApp, h, nextTick, ref, type Ref } from 'vue'

import UMultiTreeSelect from '../multi-tree-select.vue'

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

const treeData = [
  {
    label: '亚洲',
    value: 'asia',
    children: [
      { label: '中国', value: 'cn' },
      { label: '日本', value: 'jp' }
    ]
  },
  {
    label: '欧洲',
    value: 'europe',
    children: [
      { label: '英国', value: 'uk' },
      { label: '法国', value: 'fr' }
    ]
  }
]

function mountMultiTreeSelect(props: Record<string, unknown> = {}) {
  const host = document.createElement('div')
  document.body.appendChild(host)

  const model = ref(props.modelValue ?? []) as Ref<(string | number)[]>
  const data = ref(props.data ?? treeData)

  const app = createApp({
    render() {
      return h(UMultiTreeSelect, {
        ...props,
        modelValue: model.value,
        data: data.value,
        expandAll: true,
        'onUpdate:modelValue': (value: (string | number)[]) => {
          model.value = value
        }
      })
    }
  })

  app.mount(host)

  return {
    host,
    model,
    data,
    unmount() {
      app.unmount()
      host.remove()
    }
  }
}

async function openDropdown(host: HTMLElement) {
  const trigger = host.querySelector('.u-multi-tree-select') as HTMLElement
  trigger.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }))
  for (let attempt = 0; attempt < 20; attempt++) {
    await nextTick()
    await sleep(25)
    if (queryNodeContents().length > 0) return
  }
}

function queryNodeContents() {
  return [...document.body.querySelectorAll<HTMLElement>('.u-tree__node-content')]
}

function queryCheckboxes() {
  return [...document.body.querySelectorAll<HTMLInputElement>('.u-tree .u-checkbox__native')]
}

async function clickNodeByLabel(label: string, ctrlKey = false) {
  const node = queryNodeContents().find((el) => el.textContent?.includes(label))
  expect(node, `tree node "${label}" not found`).toBeTruthy()
  node!.dispatchEvent(new MouseEvent('click', { bubbles: true, ctrlKey }))
  await nextTick()
  await sleep(50)
}

describe('UMultiTreeSelect check-strictly and ctrl-key behavior', () => {
  it('cascades check and uncheck to children by default (checkStrictly = false)', async () => {
    const { host, model, unmount } = mountMultiTreeSelect()

    try {
      await openDropdown(host)
      await clickNodeByLabel('亚洲')
      expect(model.value).toEqual(['asia', 'cn', 'jp'])

      // 取消勾选「亚洲」时级联取消子节点
      await clickNodeByLabel('亚洲')
      expect(model.value).toEqual([])
    } finally {
      unmount()
    }
  })

  it('independently checks node when pressing ctrl in default mode', async () => {
    const { host, model, unmount } = mountMultiTreeSelect()

    try {
      await openDropdown(host)
      // 按住 ctrl 点击「亚洲」，仅勾选「亚洲」自身
      await clickNodeByLabel('亚洲', true)
      expect(model.value).toEqual(['asia'])

      // 按住 ctrl 再次点击「亚洲」，仅取消「亚洲」自身
      await clickNodeByLabel('亚洲', true)
      expect(model.value).toEqual([])
    } finally {
      unmount()
    }
  })

  it('cascades children on check, but only unchecks self on uncheck in checkStrictly mode', async () => {
    const { host, model, unmount } = mountMultiTreeSelect({ 'check-strictly': true })

    try {
      await openDropdown(host)
      // 勾选父节点「亚洲」-> 把所有子节点都勾上
      await clickNodeByLabel('亚洲')
      expect(model.value).toEqual(['asia', 'cn', 'jp'])

      // 取消勾选父节点「亚洲」-> 只取消自己，子节点保持勾选
      await clickNodeByLabel('亚洲')
      expect(model.value).toEqual(['cn', 'jp'])
    } finally {
      unmount()
    }
  })

  it('does not show indeterminate on parent when only child is checked in checkStrictly mode', async () => {
    const { host, unmount } = mountMultiTreeSelect({ checkStrictly: true })

    try {
      await openDropdown(host)
      await clickNodeByLabel('中国')

      // 父节点「亚洲」不应有半选状态
      const asiaNodeContent = queryNodeContents().find((el) => el.textContent?.includes('亚洲'))
      const asiaCheckbox = asiaNodeContent?.closest('.u-tree__node')?.querySelector('.u-checkbox')
      expect(asiaCheckbox?.classList.contains('is-indeterminate')).toBe(false)
      expect(asiaCheckbox?.querySelector('.u-checkbox--indeterminate')).toBeNull()
    } finally {
      unmount()
    }
  })

  it('selects all nodes when clicking select all in checkStrictly mode', async () => {
    const { host, model, unmount } = mountMultiTreeSelect({ checkStrictly: true })

    try {
      await openDropdown(host)
      // 点击全选 checkbox
      const allCheckboxInput = document.body.querySelector(
        '.u-multi-tree-select__content-header .u-checkbox__native'
      ) as HTMLInputElement
      expect(allCheckboxInput).toBeTruthy()
      allCheckboxInput.click()
      await nextTick()
      await sleep(50)

      expect(model.value).toEqual(['asia', 'cn', 'jp', 'europe', 'uk', 'fr'])

      // 再次点击取消全选
      allCheckboxInput.click()
      await nextTick()
      await sleep(50)
      expect(model.value).toEqual([])
    } finally {
      unmount()
    }
  })

  it('echoes only parent node when initialized with parent id in checkStrictly mode', async () => {
    const { host, model, unmount } = mountMultiTreeSelect({
      checkStrictly: true,
      modelValue: ['asia']
    })

    try {
      await openDropdown(host)
      expect(model.value).toEqual(['asia'])

      // tags 只有「亚洲」
      const tags = host.querySelectorAll('.u-tag')
      expect(tags.length).toBe(1)
      expect(tags[0].textContent).toContain('亚洲')
    } finally {
      unmount()
    }
  })

  it('directly clicking checkbox cascades on check and only unchecks self on uncheck in checkStrictly mode', async () => {
    const { host, model, unmount } = mountMultiTreeSelect({ checkStrictly: true })

    try {
      await openDropdown(host)
      const checkboxes = queryCheckboxes()
      expect(checkboxes.length).toBeGreaterThan(0)
      // 点击第一个 checkbox（亚洲）-> 勾选所有子节点
      checkboxes[0].click()
      await nextTick()
      await sleep(50)
      expect(model.value).toEqual(['asia', 'cn', 'jp'])

      // 再次点击第一个 checkbox（亚洲）-> 仅取消亚洲自身
      checkboxes[0].click()
      await nextTick()
      await sleep(50)
      expect(model.value).toEqual(['cn', 'jp'])
    } finally {
      unmount()
    }
  })
})
