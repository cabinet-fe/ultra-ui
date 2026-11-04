// @vitest-environment happy-dom

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

/** 父节点不渲染复选框，叶子正常渲染 */
const leafOnlyCheckbox = (_item: Record<string, any>, node: Record<string, any>) =>
  !node.children?.length

function mountMultiTreeSelect(props: Record<string, unknown> = {}) {
  const host = document.createElement('div')
  document.body.appendChild(host)

  const model = ref(props.modelValue ?? []) as Ref<(string | number)[]>

  const app = createApp({
    render() {
      return h(UMultiTreeSelect, {
        data: treeData,
        expandAll: true,
        ...props,
        modelValue: model.value,
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

function headerCheckbox() {
  return document.body.querySelector(
    '.u-multi-tree-select__content-header .u-checkbox'
  ) as HTMLElement
}

async function clickNodeByLabel(label: string) {
  const node = queryNodeContents().find((el) => el.textContent?.includes(label))
  expect(node, `tree node "${label}" not found`).toBeTruthy()
  node!.dispatchEvent(new MouseEvent('click', { bubbles: true }))
  await nextTick()
  await sleep(50)
}

async function settle() {
  await nextTick()
  await sleep(50)
}

describe('UMultiTreeSelect showCheckbox', () => {
  it('renders checkboxes only for nodes whose showCheckbox is not false', async () => {
    const { host, unmount } = mountMultiTreeSelect({ showCheckbox: leafOnlyCheckbox })

    try {
      await openDropdown(host)
      expect(queryCheckboxes().length).toBe(4)
      // 展开图标与节点文本保持不变
      expect(queryNodeContents().map((el) => el.textContent)).toEqual([
        '亚洲',
        '中国',
        '日本',
        '欧洲',
        '英国',
        '法国'
      ])
    } finally {
      unmount()
    }
  })

  it('checks only leaves and keeps the parent out of modelValue', async () => {
    const { host, model, unmount } = mountMultiTreeSelect({ showCheckbox: leafOnlyCheckbox })

    try {
      await openDropdown(host)

      // 点击隐藏复选框的父节点不触发勾选
      await clickNodeByLabel('亚洲')
      expect(model.value).toEqual([])

      // 勾选全部叶子，父节点不进模型
      await clickNodeByLabel('中国')
      await clickNodeByLabel('日本')
      await clickNodeByLabel('英国')
      await clickNodeByLabel('法国')
      expect(model.value).toEqual(['cn', 'jp', 'uk', 'fr'])
    } finally {
      unmount()
    }
  })

  it('removes a leaf from modelValue when unchecking it', async () => {
    const { host, model, unmount } = mountMultiTreeSelect({ showCheckbox: leafOnlyCheckbox })

    try {
      await openDropdown(host)
      await clickNodeByLabel('中国')
      await clickNodeByLabel('日本')
      expect(model.value).toEqual(['cn', 'jp'])

      await clickNodeByLabel('中国')
      expect(model.value).toEqual(['jp'])
    } finally {
      unmount()
    }
  })

  it('counts only checkbox nodes for select all and shows all / indeterminate states', async () => {
    const { host, model, unmount } = mountMultiTreeSelect({ showCheckbox: leafOnlyCheckbox })

    try {
      await openDropdown(host)

      // 勾选一个叶子 -> 全选半选
      await clickNodeByLabel('中国')
      expect(headerCheckbox().classList.contains('is-checked')).toBe(true)
      expect(
        headerCheckbox().querySelector('.u-checkbox--indeterminate')?.classList.contains('is-on')
      ).toBe(true)

      // 点击全选 -> 只勾选有复选框的节点
      const native = headerCheckbox().querySelector('.u-checkbox__native') as HTMLInputElement
      native.click()
      await settle()
      expect(model.value).toEqual(['cn', 'jp', 'uk', 'fr'])
      expect(headerCheckbox().classList.contains('is-checked')).toBe(true)
      expect(
        headerCheckbox().querySelector('.u-checkbox--indeterminate')?.classList.contains('is-on')
      ).toBe(false)

      // 取消其中一个叶子 -> 再次半选
      await clickNodeByLabel('法国')
      expect(model.value).toEqual(['cn', 'jp', 'uk'])
      expect(
        headerCheckbox().querySelector('.u-checkbox--indeterminate')?.classList.contains('is-on')
      ).toBe(true)
    } finally {
      unmount()
    }
  })

  it('echoes only leaves and never turns hidden nodes into tags', async () => {
    const { host, model, unmount } = mountMultiTreeSelect({
      showCheckbox: leafOnlyCheckbox,
      modelValue: ['asia', 'cn']
    })

    try {
      await openDropdown(host)
      expect(model.value).toEqual(['asia', 'cn'])

      // 标签只有「中国」，隐藏复选框的「亚洲」不作为已选标签
      const tagTexts = [...host.querySelectorAll('.u-tag')].map((el) => el.textContent?.trim())
      expect(tagTexts).toEqual(['中国'])

      // 叶子回显为勾选
      const cnNode = queryNodeContents().find((el) => el.textContent?.includes('中国'))
      const cnCheckbox = cnNode?.closest('.u-tree__node')?.querySelector('.u-checkbox')
      expect(cnCheckbox?.classList.contains('is-checked')).toBe(true)
    } finally {
      unmount()
    }
  })
})
