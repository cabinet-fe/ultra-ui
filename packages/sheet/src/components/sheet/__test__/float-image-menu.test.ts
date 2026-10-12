import { Sheet } from 'infinitable/sheet'
import { describe, expect, it } from 'vite-plus/test'

import { createSheetContext } from '../../../tools/context'
import { buildFloatImageMenus, embedFloatImageToCell } from '../float-image-menu'
import type { ImagePreviewSource } from '../popup-helpers'

/** 插入一张浮动图（data 字节 + 可选 src/link），返回 id */
function insertFloatImage(sheet: Sheet, input: { src?: string; link?: string } = {}): string {
  return sheet.insertImage({
    data: new Uint8Array([1, 2, 3]),
    type: 'png',
    anchor: { from: { row: 0, col: 0 } },
    src: input.src,
    link: input.link
  })
}

/** 句柄 spy：记录预览源与弹窗调用（mode + 回填 + 目标） */
function handlesSpy() {
  const previews: ImagePreviewSource[] = []
  const popups: Array<{
    mode: 'image'
    initial?: { url: string }
    target?: { kind: 'float'; id: string }
  }> = []
  return {
    previews,
    popups,
    handles: {
      openImagePreview: (source: ImagePreviewSource): void => {
        previews.push(source)
      },
      openHyperlinkPopup: (
        mode: 'image',
        initial?: { url: string },
        target?: { kind: 'float'; id: string }
      ): void => {
        popups.push({ mode, initial, target })
      }
    }
  }
}

describe('buildFloatImageMenus（浮动图右键独立菜单）', () => {
  it('无链接浮动图：预览 / 设置超链接 / 嵌入单元格 / 删除图片（无取消超链接）；预览源 src 优先', () => {
    const sheet = new Sheet()
    const ctx = createSheetContext(sheet)
    const id = insertFloatImage(sheet, { src: 'https://example.com/a.png' })
    const spy = handlesSpy()

    const menus = buildFloatImageMenus(ctx, id, spy.handles)
    expect(menus.map((m) => m.label)).toEqual(['预览', '设置超链接', '嵌入单元格', '删除图片'])

    menus.find((m) => m.label === '预览')!.callback!()
    expect(spy.previews).toEqual([{ src: 'https://example.com/a.png' }])

    menus.find((m) => m.label === '设置超链接')!.callback!()
    expect(spy.popups).toEqual([
      { mode: 'image', initial: undefined, target: { kind: 'float', id } }
    ])
  })

  it('data 字节图预览源：字节 + 引擎 type 映射 MIME', () => {
    const sheet = new Sheet()
    const ctx = createSheetContext(sheet)
    const id = insertFloatImage(sheet)
    const spy = handlesSpy()

    buildFloatImageMenus(ctx, id, spy.handles).find((m) => m.label === '预览')!.callback!()
    expect(spy.previews).toEqual([{ data: new Uint8Array([1, 2, 3]), mime: 'image/png' }])
  })

  it('有链接浮动图：含取消超链接；设置超链接回填原 url；取消清 link 且 undo 还原', () => {
    const sheet = new Sheet()
    const ctx = createSheetContext(sheet)
    const id = insertFloatImage(sheet, { link: 'https://example.com' })
    const spy = handlesSpy()

    const menus = buildFloatImageMenus(ctx, id, spy.handles)
    expect(menus.map((m) => m.label)).toEqual([
      '预览',
      '设置超链接',
      '取消超链接',
      '嵌入单元格',
      '删除图片'
    ])

    menus.find((m) => m.label === '设置超链接')!.callback!()
    expect(spy.popups).toEqual([
      { mode: 'image', initial: { url: 'https://example.com' }, target: { kind: 'float', id } }
    ])

    menus.find((m) => m.label === '取消超链接')!.callback!()
    expect(ctx.getImages().find((img) => img.id === id)?.link).toBeUndefined()
    expect(ctx.undo()).toBe(true)
    expect(ctx.getImages().find((img) => img.id === id)?.link).toBe('https://example.com')
  })

  it('删除图片：getImages 不含该 id 且 undo 还原', () => {
    const sheet = new Sheet()
    const ctx = createSheetContext(sheet)
    const id = insertFloatImage(sheet)

    buildFloatImageMenus(ctx, id, handlesSpy().handles).find((m) => m.label === '删除图片')!
      .callback!()
    expect(ctx.getImages().some((img) => img.id === id)).toBe(false)
    expect(ctx.undo()).toBe(true)
    expect(ctx.getImages().some((img) => img.id === id)).toBe(true)
  })

  it('id 不存在（并发删除）：返回空菜单', () => {
    const sheet = new Sheet()
    const ctx = createSheetContext(sheet)
    expect(buildFloatImageMenus(ctx, 'missing', handlesSpy().handles)).toEqual([])
  })

  it('嵌入单元格：浮动图转锚点格嵌入图（src 优先 / data 字节两形态，link 随迁），单 undo 还原', () => {
    const sheet = new Sheet()
    const ctx = createSheetContext(sheet)
    const addr = { row: 2, col: 3 }
    const id = sheet.insertImage({
      data: new Uint8Array([1, 2, 3]),
      type: 'png',
      anchor: { from: addr },
      src: 'https://example.com/a.png',
      link: 'https://example.com'
    })

    embedFloatImageToCell(ctx, id)
    // 浮动图消失，锚点格出现同源嵌入图（src 优先于字节），link 随迁
    expect(ctx.getImages().some((img) => img.id === id)).toBe(false)
    expect(ctx.getCellImage(addr)).toEqual({
      src: 'https://example.com/a.png',
      type: 'png',
      link: 'https://example.com'
    })

    // 事务合并：一次 undo 同时还原浮动图、清掉嵌入图
    expect(ctx.undo()).toBe(true)
    expect(ctx.getImages().some((img) => img.id === id)).toBe(true)
    expect(ctx.hasCellImage(addr)).toBe(false)
  })

  it('嵌入单元格：data 字节图迁字节；目标格已有嵌入图则覆盖；id 不存在无操作', () => {
    const sheet = new Sheet()
    const ctx = createSheetContext(sheet)
    const addr = { row: 1, col: 1 }
    const id = sheet.insertImage({
      data: new Uint8Array([1, 2, 3]),
      type: 'png',
      anchor: { from: addr }
    })

    embedFloatImageToCell(ctx, id)
    expect(ctx.getCellImage(addr)).toEqual({ data: new Uint8Array([1, 2, 3]), type: 'png' })

    // 目标格已有嵌入图 → 覆盖（undo 一次仍回到转换前）
    const other = insertFloatImage(sheet)
    sheet.updateImage(other, { anchor: { from: { row: 5, col: 5 } } })
    embedFloatImageToCell(ctx, other)
    expect(ctx.hasCellImage({ row: 5, col: 5 })).toBe(true)
    expect(ctx.getCellImage({ row: 5, col: 5 })).toEqual({
      data: new Uint8Array([1, 2, 3]),
      type: 'png'
    })
    expect(ctx.undo()).toBe(true)
    expect(ctx.hasCellImage({ row: 5, col: 5 })).toBe(false)
    expect(ctx.getImages().some((img) => img.id === other)).toBe(true)

    // id 不存在（并发删除）：无操作
    embedFloatImageToCell(ctx, 'missing')
    expect(ctx.getImages().some((img) => img.id === other)).toBe(true)
  })

  it('readonly：设置/取消/删除/嵌入单元格禁用、预览可用；句柄缺省：预览/设置禁用', () => {
    const sheet = new Sheet()
    const ctx = createSheetContext(sheet)
    const id = insertFloatImage(sheet, { link: 'https://example.com' })

    const readonly = buildFloatImageMenus(ctx, id, handlesSpy().handles, { readonly: true })
    expect(readonly.find((m) => m.label === '预览')?.disabled).toBeFalsy()
    expect(readonly.find((m) => m.label === '设置超链接')?.disabled).toBe(true)
    expect(readonly.find((m) => m.label === '取消超链接')?.disabled).toBe(true)
    expect(readonly.find((m) => m.label === '嵌入单元格')?.disabled).toBe(true)
    expect(readonly.find((m) => m.label === '删除图片')?.disabled).toBe(true)

    const noHandles = buildFloatImageMenus(ctx, id)
    expect(noHandles.find((m) => m.label === '预览')?.disabled).toBe(true)
    expect(noHandles.find((m) => m.label === '设置超链接')?.disabled).toBe(true)
    // 取消/嵌入/删除只依赖 ctx，句柄缺省仍可用
    expect(noHandles.find((m) => m.label === '取消超链接')?.disabled).toBeFalsy()
    expect(noHandles.find((m) => m.label === '嵌入单元格')?.disabled).toBeFalsy()
    expect(noHandles.find((m) => m.label === '删除图片')?.disabled).toBeFalsy()
  })
})
