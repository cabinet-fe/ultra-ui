import { zIndex } from '@veltra/utils'
import { afterEach, describe, expect, it } from 'vitest'
import { nextTick } from 'vue'

import { messageConfirm } from '../message-confirm'

function lastEl(selector: string) {
  const all = document.querySelectorAll<HTMLElement>(selector)
  return all[all.length - 1]
}

describe('messageConfirm zIndex', () => {
  afterEach(() => {
    messageConfirm.closeAll()
  })

  it('遮罩、白底与容器层级随 zIndex() 自增，且高于先前弹层', async () => {
    const dialogLayer = zIndex()
    messageConfirm('确认删除吗？')
    await nextTick()

    const container = lastEl('.u-message-confirm__container')
    const mask = lastEl('.u-message-confirm__mask')
    const box = lastEl('.u-message-confirm__box')
    expect(container).toBeTruthy()
    expect(mask).toBeTruthy()
    expect(box).toBeTruthy()

    const containerZ = Number(container!.style.zIndex)
    const maskZ = Number(mask!.style.zIndex)
    const boxZ = Number(box!.style.zIndex)

    expect(containerZ).toBeGreaterThan(dialogLayer)
    expect(maskZ).toBeGreaterThan(dialogLayer)
    expect(boxZ).toBeGreaterThan(dialogLayer)
    expect(maskZ).toBe(containerZ)
    expect(boxZ).toBe(containerZ)
  })

  it('后打开的确认框层级更高', async () => {
    messageConfirm('第一')
    await nextTick()
    messageConfirm('第二')
    await nextTick()

    const masks = [...document.querySelectorAll<HTMLElement>('.u-message-confirm__mask')]
    const [prev, next] = masks.slice(-2)
    expect(next).toBeTruthy()
    expect(Number(next!.style.zIndex)).toBeGreaterThan(Number(prev!.style.zIndex))
  })

  it('显式传入 zIndex 时使用该值', async () => {
    messageConfirm({ message: '自定义层级', zIndex: 5000 })
    await nextTick()

    expect(Number(lastEl('.u-message-confirm__container')!.style.zIndex)).toBe(5000)
    expect(Number(lastEl('.u-message-confirm__mask')!.style.zIndex)).toBe(5000)
    expect(Number(lastEl('.u-message-confirm__box')!.style.zIndex)).toBe(5000)
  })
})
