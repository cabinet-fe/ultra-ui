import { createEditor, type LexicalEditor } from 'lexical'
import { afterAll, beforeAll, describe, expect, it } from 'vite-plus/test'

import { $createImageNode, $isImageNode, ImageNode } from '../image-node'

let editor: LexicalEditor
let container: HTMLDivElement

beforeAll(() => {
  container = document.createElement('div')
  document.body.appendChild(container)
  editor = createEditor({
    namespace: 'test',
    nodes: [ImageNode],
    onError: (error) => {
      throw error
    }
  })
  editor.setRootElement(container)
})

afterAll(() => {
  editor.setRootElement(null)
  container.remove()
})

function createImage(options: { src?: string; width?: number; height?: number } = {}) {
  return $createImageNode({
    src: options.src ?? 'https://cdn.example.com/a.png',
    alt: '示例图',
    width: options.width,
    height: options.height
  })
}

/** 节点构造与写方法要求可写上下文（Lexical 0.50 在 read 回调内禁止 new 节点） */
function inUpdate<T>(fn: () => T): T {
  let result!: T
  editor.update(() => {
    result = fn()
  })
  return result
}

describe('ImageNode', () => {
  it('createDOM 返回 wrapper + img + 缩放手柄，未设置尺寸时无内联宽高', () => {
    const { wrapper, key } = inUpdate(() => {
      const node = createImage()
      return { wrapper: node.createDOM(), key: node.getKey() }
    })

    expect(wrapper.className).toBe('u-rte-image-wrap')
    expect(wrapper.getAttribute('data-rte-image-key')).toBe(key)

    const img = wrapper.querySelector('img')
    expect(img?.className).toBe('u-rte-image')
    expect(img?.getAttribute('src')).toBe('https://cdn.example.com/a.png')
    expect(img?.getAttribute('alt')).toBe('示例图')
    expect(img?.style.width).toBe('')
    expect(img?.style.height).toBe('')

    expect(wrapper.querySelector('.u-rte-image-resizer')).not.toBeNull()
  })

  it('createDOM 应用节点上的显示尺寸', () => {
    const img = inUpdate(() =>
      createImage({ width: 320, height: 180 }).createDOM().querySelector('img')!
    )

    expect(img.style.width).toBe('320px')
    expect(img.style.height).toBe('180px')
  })

  it('updateDOM 在尺寸变化时同步 img 内联样式', () => {
    const { img } = inUpdate(() => {
      const node = createImage({ width: 320, height: 180 })
      const wrapper = node.createDOM()
      const resized = createImage({ width: 480, height: 270 })
      resized.updateDOM(node, wrapper)
      return { img: wrapper.querySelector('img')! }
    })

    expect(img.style.width).toBe('480px')
    expect(img.style.height).toBe('270px')
  })

  it('exportDOM 仅在设置尺寸时输出 width / height 属性', () => {
    const { sizedEl, unsizedEl } = inUpdate(() => ({
      sizedEl: createImage({ width: 480, height: 270 }).exportDOM().element as HTMLImageElement,
      unsizedEl: createImage().exportDOM().element as HTMLImageElement
    }))

    expect(sizedEl.getAttribute('width')).toBe('480')
    expect(sizedEl.getAttribute('height')).toBe('270')
    expect(sizedEl.className).toBe('u-rte-image')

    expect(unsizedEl.hasAttribute('width')).toBe(false)
    expect(unsizedEl.hasAttribute('height')).toBe(false)
  })

  it('importDOM 读取 img 的 width / height 属性，缺失时为 0', () => {
    const { sized, unsized } = inUpdate(() => {
      const conversion = ImageNode.importDOM()!.img().conversion
      const dom = document.createElement('img')
      dom.setAttribute('src', 'https://cdn.example.com/a.png')
      dom.setAttribute('width', '640')
      dom.setAttribute('height', '360')

      const noSizeDom = document.createElement('img')
      noSizeDom.setAttribute('src', 'https://cdn.example.com/b.png')

      return { sized: conversion(dom).node, unsized: conversion(noSizeDom).node }
    })

    expect($isImageNode(sized)).toBe(true)
    expect(sized!.exportJSON()).toMatchObject({
      src: 'https://cdn.example.com/a.png',
      width: 640,
      height: 360
    })
    expect(unsized!.exportJSON()).toMatchObject({ width: 0, height: 0 })
  })

  it('exportJSON / importJSON roundtrip 保留尺寸', () => {
    const json = inUpdate(() => createImage({ width: 480, height: 270 }).exportJSON())

    const restored = inUpdate(() => ImageNode.importJSON(json).exportJSON())
    expect(restored).toEqual(json)
  })

  it('editor update 中 setWidthAndHeight 写入尺寸', () => {
    const json = inUpdate(() => {
      const node = createImage()
      node.setWidthAndHeight(200, 100)
      return node.exportJSON()
    })

    expect(json).toMatchObject({ width: 200, height: 100 })
  })
})
