import {
  cloneImageAnchor,
  cloneSheetImage,
  createImageId,
  imageAnchorsEqual,
  type ImageInput,
  type SheetImageAnchor
} from '../image'
import type { Command, CommandResult, ImagePatch } from './types'

export interface InsertImageParams {
  image: ImageInput
}

/**
 * 插入浮动图片：生成 id、捕获 before/after、立即 applyPatch('redo')、返回 mutations。
 * 模式同 SetCellValueCommand。
 */
export const InsertImageCommand: Command<InsertImageParams, string> = {
  id: 'sheet.insert-image',

  handler(ctx, params): CommandResult<string> {
    const id = params.image.id?.trim() || createImageId()
    if (ctx.sheet.getImage(id)) {
      // id 冲突：视为无操作（避免覆盖既有图）
      return { mutations: [] }
    }
    const after = cloneSheetImage({
      id,
      data: params.image.data,
      type: params.image.type,
      anchor: cloneImageAnchor(params.image.anchor),
      ...(params.image.width != null ? { width: params.image.width } : {}),
      ...(params.image.height != null ? { height: params.image.height } : {}),
      ...(params.image.altText != null ? { altText: params.image.altText } : {}),
      ...(params.image.title != null ? { title: params.image.title } : {})
    })
    const patch: ImagePatch = { kind: 'image', id, before: undefined, after }
    ctx.applyPatch(patch, 'redo')
    return { mutations: [{ redo: [patch], undo: [patch] }], result: id }
  }
}

export interface RemoveImageParams {
  id: string
}

/** 删除浮动图片：捕获 before、立即 applyPatch('redo')、返回 mutations */
export const RemoveImageCommand: Command<RemoveImageParams> = {
  id: 'sheet.remove-image',

  handler(ctx, params): CommandResult {
    const before = ctx.sheet.getImage(params.id)
    if (!before) return { mutations: [] }
    const patch: ImagePatch = {
      kind: 'image',
      id: params.id,
      before: cloneSheetImage(before),
      after: undefined
    }
    ctx.applyPatch(patch, 'redo')
    return { mutations: [{ redo: [patch], undo: [patch] }] }
  }
}

/**
 * 更新浮动图片的可变字段（锚点 / 宽高 / 文案）。
 * 未出现在 patch 中的字段保持原值；整段替换 anchor。
 */
export interface ImageUpdateFields {
  anchor?: SheetImageAnchor
  width?: number
  height?: number
  altText?: string
  title?: string
}

export interface UpdateImageParams {
  id: string
  patch: ImageUpdateFields
}

/**
 * 更新浮动图片：捕获 before/after、立即 applyPatch('redo')、返回 mutations。
 * 无变更或不存在时不入历史。
 */
export const UpdateImageCommand: Command<UpdateImageParams> = {
  id: 'sheet.update-image',

  handler(ctx, params): CommandResult {
    const before = ctx.sheet.getImage(params.id)
    if (!before) return { mutations: [] }

    const after = cloneSheetImage(before)
    const { patch } = params
    if (patch.anchor) after.anchor = cloneImageAnchor(patch.anchor)
    if (patch.width != null) after.width = patch.width
    if (patch.height != null) after.height = patch.height
    if (patch.altText != null) after.altText = patch.altText
    if (patch.title != null) after.title = patch.title

    // 无实际变更：不入历史
    const sameAnchor = imageAnchorsEqual(before.anchor, after.anchor)
    const sameMeta =
      before.width === after.width &&
      before.height === after.height &&
      before.altText === after.altText &&
      before.title === after.title
    if (sameAnchor && sameMeta) return { mutations: [] }

    const imagePatch: ImagePatch = {
      kind: 'image',
      id: params.id,
      before: cloneSheetImage(before),
      after
    }
    ctx.applyPatch(imagePatch, 'redo')
    return { mutations: [{ redo: [imagePatch], undo: [imagePatch] }] }
  }
}
