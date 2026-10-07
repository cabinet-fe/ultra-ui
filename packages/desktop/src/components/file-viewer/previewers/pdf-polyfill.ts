/**
 * Chrome 103 缺失 API 的手写 shim（cooking spec 决策 4）。
 * 仅供 import 副作用：须先于 pdfjs-dist 代码求值（主线程 chunk 顶部 / worker wrapper 首条 import）。
 * 各 API 已存在时不覆盖，可安全重复引入。
 */

// Promise.withResolvers：Chrome 119 引入
if (typeof Promise.withResolvers !== 'function') {
  Promise.withResolvers = function withResolvers<T>() {
    let resolve!: (value: T | PromiseLike<T>) => void
    let reject!: (reason?: unknown) => void
    const promise = new Promise<T>((res, rej) => {
      resolve = res
      reject = rej
    })
    return { promise, resolve, reject }
  }
}

// Promise.try：Chrome 134 引入；回调以 undefined this 同步调用，异常转为 rejection
if (typeof Promise.try !== 'function') {
  Promise.try = function try_<T, Args extends unknown[]>(
    this: PromiseConstructor,
    callbackfn: (...args: Args) => T | PromiseLike<T>,
    ...args: Args
  ): Promise<Awaited<T>> {
    return new this<Awaited<T>>((resolve) => {
      resolve(callbackfn(...args) as Awaited<T>)
    })
  }
}

// Set.prototype.intersection：Chrome 122 引入，返回新 Set
if (typeof Set.prototype.intersection !== 'function') {
  Set.prototype.intersection = function intersection<T, U>(
    this: Set<T>,
    other: ReadonlySetLike<U>
  ): Set<T> {
    const result = new Set<T>()
    for (const value of this) {
      if (other.has(value as unknown as U)) result.add(value)
    }
    return result
  }
}

// Iterator 全局：Chrome 122 随 iterator helpers 落地。pdfjs-dist 产物顶层执行
// typeof Iterator.prototype.join，Chrome 103 无该全局会直接 ReferenceError。
// 原型取内建 %IteratorPrototype%，pdfjs 追加的原型方法对全部内建迭代器可见；
// Chrome 122+ 存在原生 Iterator，本 shim 为空操作。
if ((globalThis as { Iterator?: unknown }).Iterator === undefined) {
  const iteratorPrototype = Object.getPrototypeOf(
    Object.getPrototypeOf(([] as unknown[])[Symbol.iterator]())
  )
  const IteratorShim = function IteratorShim() {
    throw new TypeError('Iterator is not constructable')
  }
  Object.defineProperty(IteratorShim, 'prototype', {
    value: iteratorPrototype,
    writable: false,
    enumerable: false,
    configurable: false
  })
  Object.defineProperty(globalThis, 'Iterator', {
    value: IteratorShim,
    writable: true,
    enumerable: false,
    configurable: true
  })
}

// URL.parse 静态方法：Chrome 126 引入，等价 new URL(url, base) 但解析失败返回 null 而非抛错。
// pdfjs-dist 在文档加载路径（createValidAbsoluteUrl 等）大量使用。
const URLCtor = URL as unknown as { parse?: (url: string | URL, base?: string | URL) => URL | null }
if (typeof URLCtor.parse !== 'function') {
  URLCtor.parse = function parse(url: string | URL, base?: string | URL): URL | null {
    try {
      return base === undefined ? new URL(url) : new URL(url, base)
    } catch {
      return null
    }
  }
}

// Uint8Array 编码扩展（toHex / toBase64 / fromBase64）：Chrome 140 引入。
// pdfjs-dist 用 toHex 算文档指纹（worker，每次加载必经）、toBase64 与 fromBase64
// 处理表单数据与签名数据；实现仅覆盖默认 base64 字母表。
const Uint8ArrayProto = Uint8Array.prototype as unknown as {
  toHex?: () => string
  toBase64?: () => string
}
const Uint8ArrayCtor = Uint8Array as unknown as { fromBase64?: (data: string) => Uint8Array }

const HEX = Array.from({ length: 256 }, (_, i) => i.toString(16).padStart(2, '0'))

if (typeof Uint8ArrayProto.toHex !== 'function') {
  Uint8ArrayProto.toHex = function toHex(this: Uint8Array): string {
    let out = ''
    for (let i = 0; i < this.length; i++) out += HEX[this[i] as number]
    return out
  }
}

if (typeof Uint8ArrayProto.toBase64 !== 'function') {
  Uint8ArrayProto.toBase64 = function toBase64(this: Uint8Array): string {
    // 大数组分块转字符串，避免 Function.prototype.apply 栈溢出
    const CHUNK = 0x8000
    let binary = ''
    for (let i = 0; i < this.length; i += CHUNK) {
      binary += String.fromCharCode.apply(null, [...this.subarray(i, i + CHUNK)] as number[])
    }
    return btoa(binary)
  }
}

if (typeof Uint8ArrayCtor.fromBase64 !== 'function') {
  Uint8ArrayCtor.fromBase64 = function fromBase64(data: string): Uint8Array {
    // 忽略 ASCII 空白（宽松方向：合法输入行为与规范一致）
    const cleaned = data.replace(/[\t\n\f\r ]/g, '')
    const binary = atob(cleaned)
    const bytes = new Uint8Array(binary.length)
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
    return bytes
  }
}

// Map upsert（getOrInsert / getOrInsertComputed）：Chrome 139 引入。
// pdfjs-dist 在主线程与 worker 中大量使用，以回调惰性初始化缓存 Map。
const MapProto = Map.prototype as unknown as {
  getOrInsert?: <K, V>(this: Map<K, V>, key: K, value: V) => V
  getOrInsertComputed?: <K, V>(this: Map<K, V>, key: K, callbackfn: (key: K) => V) => V
}

if (typeof MapProto.getOrInsert !== 'function') {
  MapProto.getOrInsert = function getOrInsert<V, K>(this: Map<K, V>, key: K, value: V): V {
    if (!this.has(key)) this.set(key, value)
    return this.get(key) as V
  }
}

if (typeof MapProto.getOrInsertComputed !== 'function') {
  MapProto.getOrInsertComputed = function getOrInsertComputed<V, K>(
    this: Map<K, V>,
    key: K,
    callbackfn: (key: K) => V
  ): V {
    if (!this.has(key)) this.set(key, callbackfn(key))
    return this.get(key) as V
  }
}
