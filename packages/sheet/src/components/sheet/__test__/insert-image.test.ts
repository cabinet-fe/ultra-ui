import { Sheet } from '@veltra/sheet-core/core/sheet'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { createSheetContext } from '../../../tools/context'
import {
  INSERT_IMAGE_ACCEPT,
  insertImageFromFile,
  pickAndInsertImage,
  resolveImageType
} from '../insert-image'

const mocks = vi.hoisted(() => {
  const message = Object.assign(vi.fn(), {
    success: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
    error: vi.fn(),
    default: vi.fn()
  })
  return { message }
})

vi.mock('@veltra/desktop', () => ({ message: mocks.message }))

function makeFile(name: string, type: string, bytes: number[] = [0x89, 0x50]): File {
  return new File([new Uint8Array(bytes)], name, { type })
}

afterEach(() => {
  vi.clearAllMocks()
  document.body.querySelectorAll('input[type="file"]').forEach((el) => el.remove())
})

describe('resolveImageType', () => {
  it('按 MIME 映射 png/jpeg/gif/svg/webp', () => {
    expect(resolveImageType(makeFile('a.png', 'image/png'))).toBe('png')
    expect(resolveImageType(makeFile('a.jpg', 'image/jpeg'))).toBe('jpeg')
    expect(resolveImageType(makeFile('a.gif', 'image/gif'))).toBe('gif')
    expect(resolveImageType(makeFile('a.svg', 'image/svg+xml'))).toBe('svg')
    expect(resolveImageType(makeFile('a.webp', 'image/webp'))).toBe('webp')
  })

  it('MIME 为空时回落扩展名；不支持则 undefined', () => {
    expect(resolveImageType(makeFile('logo.PNG', ''))).toBe('png')
    expect(resolveImageType(makeFile('photo.jpg', ''))).toBe('jpeg')
    expect(resolveImageType(makeFile('x.bmp', 'image/bmp'))).toBeUndefined()
    expect(resolveImageType(makeFile('x.txt', 'text/plain'))).toBeUndefined()
  })
})

describe('insertImageFromFile', () => {
  it('支持格式 → 锚定活动格并经 ctx.insertImage 写入', async () => {
    const sheet = new Sheet()
    const ctx = createSheetContext(sheet)
    ctx.selectCell({ row: 2, col: 3 })
    const bytes = [1, 2, 3, 4]
    const id = await insertImageFromFile(ctx, makeFile('logo.png', 'image/png', bytes))
    expect(id).toBeTruthy()
    const images = ctx.getImages()
    expect(images).toHaveLength(1)
    expect(images[0]?.type).toBe('png')
    expect(images[0]?.anchor.from).toEqual({ row: 2, col: 3 })
    expect([...images[0]!.data]).toEqual(bytes)
    expect(mocks.message.error).not.toHaveBeenCalled()
  })

  it('不支持格式 → message.error，不写入', async () => {
    const sheet = new Sheet()
    const ctx = createSheetContext(sheet)
    const id = await insertImageFromFile(ctx, makeFile('x.bmp', 'image/bmp'))
    expect(id).toBeUndefined()
    expect(ctx.getImages()).toHaveLength(0)
    expect(mocks.message.error).toHaveBeenCalledWith(expect.stringContaining('不支持的图片格式'))
  })

  it('无活动格 → message.error，不写入', async () => {
    const sheet = new Sheet()
    const ctx = createSheetContext(sheet)
    sheet.selection.clear()
    const id = await insertImageFromFile(ctx, makeFile('a.png', 'image/png'))
    expect(id).toBeUndefined()
    expect(ctx.getImages()).toHaveLength(0)
    expect(mocks.message.error).toHaveBeenCalledWith('请先选择单元格')
  })
})

describe('pickAndInsertImage', () => {
  it('创建隐藏 file input（同一 accept）并 click', () => {
    const sheet = new Sheet()
    const ctx = createSheetContext(sheet)
    const click = vi.spyOn(HTMLInputElement.prototype, 'click').mockImplementation(() => {})
    pickAndInsertImage(ctx)
    const input = document.body.querySelector<HTMLInputElement>('input[type="file"]')
    expect(input).toBeTruthy()
    expect(input!.accept).toBe(INSERT_IMAGE_ACCEPT)
    expect(input!.hidden).toBe(true)
    expect(click).toHaveBeenCalled()
    click.mockRestore()
  })
})
