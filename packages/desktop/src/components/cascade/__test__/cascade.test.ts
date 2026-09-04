import { describe, expect, it } from 'vitest'
import { createApp, h, nextTick, ref } from 'vue'

import UCascade from '../cascade.vue'

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

const cascadeData = [
  {
    label: '浙江省',
    value: 'zhejiang',
    children: [
      {
        label: '杭州市',
        value: 'hangzhou',
        children: [
          { label: '西湖区', value: 'xihu' },
          { label: '余杭区', value: 'yuhang' }
        ]
      }
    ]
  },
  {
    label: '江苏省',
    value: 'jiangsu',
    children: [
      { label: '南京市', value: 'nanjing', children: [{ label: '玄武区', value: 'xuanwu' }] }
    ]
  }
]

function queryCascadeItems() {
  return [...document.body.querySelectorAll<HTMLElement>('.u-cascade-panel-item__option')]
}

async function openDropdown(host: HTMLElement) {
  const trigger = (host.querySelector('.u-cascade') ||
    host.querySelector('.u-dropdown') ||
    host.firstElementChild) as HTMLElement
  trigger.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }))
  for (let attempt = 0; attempt < 20; attempt++) {
    await nextTick()
    await sleep(25)
    if (queryCascadeItems().length > 0) return
  }
}

async function clickItemByLabel(label: string) {
  const item = queryCascadeItems().find((el) => el.textContent?.includes(label))
  expect(item, `cascade item "${label}" not found`).toBeTruthy()
  item!.dispatchEvent(new MouseEvent('click', { bubbles: true }))
  await nextTick()
  await sleep(30)
}

describe('UCascade change event fullLabel', () => {
  it('should emit fullLabel in change event for single select', async () => {
    const host = document.createElement('div')
    document.body.appendChild(host)

    const model = ref<string | undefined>()
    let changeResult: { item: any; fullLabel?: string } | undefined

    const app = createApp({
      render() {
        return h(UCascade, {
          data: cascadeData,
          modelValue: model.value,
          'onUpdate:modelValue': (val: string) => {
            model.value = val
          },
          onChange: (item: any, fullLabel?: string) => {
            changeResult = { item, fullLabel }
          }
        })
      }
    })

    app.mount(host)
    await nextTick()

    await openDropdown(host)

    // 点击第一列 "浙江省"
    await clickItemByLabel('浙江省')

    // 点击第二列 "杭州市"
    await clickItemByLabel('杭州市')

    // 点击第三列 "西湖区"
    await clickItemByLabel('西湖区')

    expect(changeResult).toBeDefined()
    expect(changeResult?.fullLabel).toBe('浙江省/杭州市/西湖区')
    expect(changeResult?.item).toBeDefined()
    expect(changeResult?.item.value).toBe('xihu')
    expect(changeResult?.item.label).toBe('西湖区')
    expect(changeResult?.item.fullLabel).toBe('浙江省/杭州市/西湖区')

    app.unmount()
    host.remove()
  })
})
