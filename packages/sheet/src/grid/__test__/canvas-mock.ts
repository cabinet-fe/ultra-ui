/**
 * happy-dom 不实现 canvas 2d 上下文（getContext 返回 null），
 * 这里用 Proxy 提供最小可用的 mock，让 @visactor/vrender 能在无头环境
 * 完成挂载与绘制调用。仅用于测试（vp test setupFiles）。
 */

type Context2dMock = Record<string | symbol, unknown>

function createContext2dMock(canvas: HTMLCanvasElement): Context2dMock {
  const store: Context2dMock = { canvas }

  return new Proxy(store, {
    get(target, prop) {
      if (prop in target) return target[prop]
      if (prop === 'measureText') return (text: unknown) => ({ width: String(text).length * 8 })
      if (prop === 'getImageData')
        return () => ({ data: new Uint8ClampedArray(0), width: 0, height: 0 })
      if (
        prop === 'createLinearGradient' ||
        prop === 'createRadialGradient' ||
        prop === 'createPattern'
      ) {
        return () => ({ addColorStop: () => {} })
      }
      if (prop === 'getLineDash') return () => []
      // 其余一律视为无操作绘制方法
      return () => {}
    },
    set(target, prop, value) {
      target[prop] = value
      return true
    }
  })
}

/** 补丁 HTMLCanvasElement，使 getContext('2d') 返回可用 mock */
export function setupCanvasMock(): void {
  const getContext = function (this: HTMLCanvasElement, contextId: string): unknown {
    if (contextId !== '2d') return null
    return createContext2dMock(this)
  }

  HTMLCanvasElement.prototype.getContext =
    getContext as unknown as typeof HTMLCanvasElement.prototype.getContext

  if (typeof HTMLCanvasElement.prototype.toDataURL !== 'function') {
    HTMLCanvasElement.prototype.toDataURL = () => 'data:,'
  }
}
