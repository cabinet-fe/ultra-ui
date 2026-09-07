import { afterEach, describe, expect, it, vi } from 'vitest'
import { createApp, shallowRef } from 'vue'

import { useTransform } from '../use-transform'

/** 挂载一个空组件以提供组合式函数所需的组件上下文 */
function mountTransform(options?: { onReset?: () => void }) {
  const target = shallowRef<HTMLElement>()
  let api!: ReturnType<typeof useTransform>

  const app = createApp({
    setup() {
      api = useTransform({
        target,
        // 画布 400×300，图片 800×600：适应缩放为 0.5
        canvasSize: () => ({ width: 400, height: 300 }),
        imageWidth: () => 800,
        imageHeight: () => 600,
        onReset: options?.onReset ?? (() => {})
      })
      return () => null
    }
  })

  const host = document.createElement('div')
  document.body.appendChild(host)
  app.mount(host)

  return {
    api,
    target,
    unmount() {
      app.unmount()
      host.remove()
    }
  }
}

describe('useTransform', () => {
  let unmount: (() => void) | undefined

  afterEach(() => {
    unmount?.()
  })

  it('fit：按容器适应缩放并居中', () => {
    const { api, unmount: u } = mountTransform()
    unmount = u

    api.fit()
    expect(api.transform.scale).toBe(0.5)
    expect(api.transform.translateX).toBe(-200)
    expect(api.transform.translateY).toBe(-150)
  })

  it('zoomTo：钳制在适应缩放与其 10 倍之间', () => {
    const { api, unmount: u } = mountTransform()
    unmount = u
    api.fit()

    api.zoomTo(0.1)
    expect(api.transform.scale).toBe(0.5)

    api.zoomTo(100)
    expect(api.transform.scale).toBe(5)
  })

  it('zoomIn / zoomOut：默认以画布中心为锚，中心点平移不变', () => {
    const { api, unmount: u } = mountTransform()
    unmount = u
    api.fit()

    api.zoomIn()
    expect(api.transform.scale).toBeCloseTo(0.6, 10)
    expect(api.transform.translateX).toBeCloseTo(-200, 10)
    expect(api.transform.translateY).toBeCloseTo(-150, 10)

    api.zoomOut()
    expect(api.transform.scale).toBeCloseTo(0.5, 10)
  })

  it('zoomIn：以指定锚点缩放时锚点下的图片点保持不动', () => {
    const { api, unmount: u } = mountTransform()
    unmount = u
    api.fit()

    api.zoomIn({ x: 0, y: 0 })
    expect(api.transform.scale).toBeCloseTo(0.6, 10)
    expect(api.transform.translateX).toBeCloseTo(-160, 8)
    expect(api.transform.translateY).toBeCloseTo(-120, 8)
  })

  it('rotate：90° 步进并归一化，90° / 270° 按交换宽高重新适应', () => {
    const { api, unmount: u } = mountTransform()
    unmount = u
    api.fit()

    api.rotate(1)
    expect(api.transform.rotation).toBe(90)
    // 交换宽高后：min(400/600, 300/800) = 0.375
    expect(api.transform.scale).toBe(0.375)

    api.rotate(-1)
    expect(api.transform.rotation).toBe(0)
    expect(api.transform.scale).toBe(0.5)

    api.rotate(-1)
    expect(api.transform.rotation).toBe(270)
    api.rotate(1)
    api.rotate(1)
    expect(api.transform.rotation).toBe(90)
  })

  it('flip：水平 / 垂直翻转互不影响', () => {
    const { api, unmount: u } = mountTransform()
    unmount = u

    api.flip('horizontal')
    expect(api.transform.flipX).toBe(true)
    expect(api.transform.flipY).toBe(false)

    api.flip('vertical')
    expect(api.transform.flipX).toBe(true)
    expect(api.transform.flipY).toBe(true)

    api.flip('horizontal')
    expect(api.transform.flipX).toBe(false)
  })

  it('resetTransform：恢复初始变换、重新适应并复位选区', () => {
    const onReset = vi.fn()
    const { api, unmount: u } = mountTransform({ onReset })
    unmount = u
    api.fit()

    api.zoomIn()
    api.rotate(1)
    api.flip('horizontal')

    api.resetTransform()
    expect(api.transform).toMatchObject({
      scale: 0.5,
      translateX: -200,
      translateY: -150,
      rotation: 0,
      flipX: false,
      flipY: false
    })
    expect(onReset).toHaveBeenCalledTimes(1)
  })

  it('toImageDelta：按缩放 / 旋转 / 翻转换算屏幕位移', () => {
    const { api, unmount: u } = mountTransform()
    unmount = u
    api.fit()

    expect(api.toImageDelta(60, 30)).toEqual({ x: 120, y: 60 })

    // 旋转 90°（顺时针）：屏幕右移对应图片 -y 方向
    api.rotate(1)
    const rotated = api.toImageDelta(10, 0)
    expect(rotated.x).toBeCloseTo(0, 10)
    expect(rotated.y).toBeCloseTo(-10 / 0.375, 10)

    api.resetTransform()
    api.flip('horizontal')
    expect(api.toImageDelta(10, 0).x).toBeCloseTo(-20, 10)
  })

  it('图片未超出容器时选区外拖动不平移，超出后拖动平移', async () => {
    const { api, target, unmount: u } = mountTransform()
    unmount = u
    api.fit()

    const canvas = document.createElement('div')
    // happy-dom 的 DOMRect 字段为 undefined，补零保证锚点计算
    canvas.getBoundingClientRect = () => ({ left: 0, top: 0 }) as DOMRect
    target.value = canvas
    await Promise.resolve()

    // 适应尺寸 400×300 未超出容器：拖动不平移
    canvas.dispatchEvent(new MouseEvent('mousedown', { button: 0, clientX: 100, clientY: 100 }))
    document.dispatchEvent(new MouseEvent('mousemove', { clientX: 130, clientY: 115 }))
    document.dispatchEvent(new MouseEvent('mouseup'))
    expect(api.transform.translateX).toBe(-200)
    expect(api.transform.translateY).toBe(-150)

    // 放大到 0.6 后显示尺寸 480×360 超出容器：拖动平移
    api.zoomIn()
    canvas.dispatchEvent(new MouseEvent('mousedown', { button: 0, clientX: 100, clientY: 100 }))
    document.dispatchEvent(new MouseEvent('mousemove', { clientX: 130, clientY: 115 }))
    document.dispatchEvent(new MouseEvent('mouseup'))
    expect(api.transform.translateX).toBeCloseTo(-170, 10)
    expect(api.transform.translateY).toBeCloseTo(-135, 10)

    // 抬起后再次移动不再平移
    document.dispatchEvent(new MouseEvent('mousemove', { clientX: 200, clientY: 200 }))
    expect(api.transform.translateX).toBeCloseTo(-170, 10)
  })

  it('wheel：以指针位置为锚缩放', async () => {
    const { api, target, unmount: u } = mountTransform()
    unmount = u
    api.fit()

    const canvas = document.createElement('div')
    // happy-dom 的 DOMRect 字段为 undefined，补零保证锚点计算
    canvas.getBoundingClientRect = () => ({ left: 0, top: 0 }) as DOMRect
    target.value = canvas
    await Promise.resolve()

    // happy-dom 的 WheelEvent 不携带 clientX / clientY，用 MouseEvent 模拟并补 deltaY
    const wheel = (deltaY: number) => {
      const e = new MouseEvent('wheel', { clientX: 0, clientY: 0 })
      Object.defineProperty(e, 'deltaY', { value: deltaY })
      canvas.dispatchEvent(e)
    }

    wheel(-100)
    expect(api.transform.scale).toBeCloseTo(0.6, 10)
    expect(api.transform.translateX).toBeCloseTo(-160, 8)
    expect(api.transform.translateY).toBeCloseTo(-120, 8)

    // 缩小被钳制在适应缩放
    wheel(100)
    wheel(100)
    expect(api.transform.scale).toBe(0.5)
  })
})
