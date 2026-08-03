import { BORDER_SIDES, type BorderEdge, type CellStyle, type StyleId } from './types'

/**
 * 样式池：样式定义全表集中存储、按内容去重。
 *
 * - `intern(style)`：规范化（剔除空 fill/border/空边）→ 稳定序列化 key →
 *   相同内容返回同一 id；单元格只存 id，共享定义
 * - 序列化 key 按固定字段顺序输出（fill → border 四边固定序），与写入顺序无关
 * - `snapshot/restore`：按 id 升序导出定义数组，还原后 id 映射一致
 *   （单元格 s 引用在 restore 后仍然有效）
 * - 池只增不减（undo 回放不回收定义）：被引用的 id 永远可解析
 */

/** 边是否没有任何有效字段（空边，归一化时应剔除） */
function isEdgeEmpty(edge: BorderEdge | undefined): boolean {
  return (
    edge !== undefined &&
    edge.style === undefined &&
    edge.width === undefined &&
    edge.color === undefined
  )
}

/**
 * 规范化样式：剔除空 fill / 空 border / 空边，返回不可变语义的副本；
 * 全部为空时返回 undefined（调用方据此删除 s 字段，保持空单元格不占存储）。
 */
export function normalizeStyle(style: CellStyle): CellStyle | undefined {
  const normalized: CellStyle = {}
  if (style.fill?.color) normalized.fill = { color: style.fill.color }
  const border: NonNullable<CellStyle['border']> = {}
  for (const side of BORDER_SIDES) {
    const edge = style.border?.[side]
    if (!edge || isEdgeEmpty(edge)) continue
    border[side] = { style: edge.style, width: edge.width, color: edge.color }
  }
  if (Object.keys(border).length > 0) normalized.border = border
  return Object.keys(normalized).length > 0 ? normalized : undefined
}

/** 样式副本（深拷贝一层：fill 与各边独立对象，外部修改不影响池内定义） */
export function cloneStyle(style: CellStyle): CellStyle {
  const border: NonNullable<CellStyle['border']> = {}
  for (const side of BORDER_SIDES) {
    const edge = style.border?.[side]
    if (edge) border[side] = { ...edge }
  }
  return {
    ...(style.fill ? { fill: { ...style.fill } } : {}),
    ...(Object.keys(border).length > 0 ? { border } : {})
  }
}

/**
 * 稳定序列化：fill → border 按固定边序，字段固定顺序，输出与书写顺序无关。
 * 调用方需先 normalize（本函数对空字段做同样剔除，保证 key 最小化）。
 */
export function serializeStyleKey(style: CellStyle): string {
  const border: Record<string, unknown> = {}
  for (const side of BORDER_SIDES) {
    const edge = style.border?.[side]
    if (!edge || isEdgeEmpty(edge)) continue
    border[side] = { style: edge.style, width: edge.width, color: edge.color }
  }
  return JSON.stringify({
    fill: style.fill ? { color: style.fill.color } : undefined,
    border: Object.keys(border).length > 0 ? border : undefined
  })
}

export class StylePool {
  private readonly styles = new Map<StyleId, CellStyle>()
  private readonly keys = new Map<string, StyleId>()
  private nextId = 1

  /** 池内样式定义数量 */
  get size(): number {
    return this.styles.size
  }

  /**
   * 内部化样式：相同内容返回同一 id（内容去重）。
   * 空样式（无 fill 无 border）抛错——空样式不应入库，调用方应先删 s 字段。
   */
  intern(style: CellStyle): StyleId {
    const normalized = normalizeStyle(style)
    if (!normalized) {
      throw new Error('StylePool.intern：空样式不能内部化')
    }
    const key = serializeStyleKey(normalized)
    const existing = this.keys.get(key)
    if (existing !== undefined) return existing
    const id = this.nextId++
    this.styles.set(id, cloneStyle(normalized))
    this.keys.set(key, id)
    return id
  }

  /** 按 id 取样式定义（返回副本）；不存在返回 undefined */
  get(id: StyleId): CellStyle | undefined {
    const style = this.styles.get(id)
    return style ? cloneStyle(style) : undefined
  }

  /** 序列化导出：按 id 升序的样式定义数组（供快照；与单元格 s 引用配套） */
  snapshot(): CellStyle[] {
    const items: CellStyle[] = []
    for (let id = 1; id < this.nextId; id++) {
      const style = this.styles.get(id)
      if (style) items.push(cloneStyle(style))
    }
    return items
  }

  /**
   * 从快照恢复：清空重建，id 与导出时一一对应（按序分配 1..N）；
   * 快照中重复定义防御性跳过（保持首个 id）。
   */
  restore(items: readonly CellStyle[]): void {
    this.clear()
    for (const item of items) {
      const normalized = normalizeStyle(item)
      if (!normalized) continue
      const key = serializeStyleKey(normalized)
      if (this.keys.has(key)) continue
      const id = this.nextId++
      this.styles.set(id, cloneStyle(normalized))
      this.keys.set(key, id)
    }
  }

  clear(): void {
    this.styles.clear()
    this.keys.clear()
    this.nextId = 1
  }
}
