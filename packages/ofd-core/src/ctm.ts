/**
 * CTM 变换与 Boundary 解析（GB/T 33190 对象定位的基础）。
 *
 * OFD 的 `CTM` 属性是 6 元素矩阵 `a b c d e f`，行向量左乘约定：
 *
 * ```
 * | a b 0 |     x' = a·x + c·y + e
 * | c d 0 |     y' = b·x + d·y + f
 * | e f 1 |
 * ```
 *
 * 数值上与 SVG 的 `matrix(a b c d e f)` 一致，可直接写入 transform。
 */

/** OFD 对象边界，`Boundary="x y w h"`，单位 0.1mm */
export interface OfdBoundary {
  x: number
  y: number
  width: number
  height: number
}

export interface OfdPoint {
  x: number
  y: number
}

/** 6 元素仿射矩阵 */
export type OfdMatrix = readonly [number, number, number, number, number, number]

/** 单位矩阵：不改变任何坐标 */
export const IDENTITY_MATRIX: OfdMatrix = [1, 0, 0, 1, 0, 0]

/** 矩阵乘法：`multiplyMatrix(outer, inner)` 等价于先 inner 后 outer */
export function multiplyMatrix(outer: OfdMatrix, inner: OfdMatrix): OfdMatrix {
  const [a1, b1, c1, d1, e1, f1] = outer
  const [a2, b2, c2, d2, e2, f2] = inner
  return [
    a1 * a2 + c1 * b2,
    b1 * a2 + d1 * b2,
    a1 * c2 + c1 * d2,
    b1 * c2 + d1 * d2,
    a1 * e2 + c1 * f2 + e1,
    b1 * e2 + d1 * f2 + f1
  ]
}

/** 矩阵作用于点 */
export function applyMatrixToPoint(matrix: OfdMatrix, x: number, y: number): OfdPoint {
  const [a, b, c, d, e, f] = matrix
  return { x: a * x + c * y + e, y: b * x + d * y + f }
}

/** 矩阵作用于边界：四角变换后取包围盒 */
export function applyMatrixToBoundary(matrix: OfdMatrix, boundary: OfdBoundary): OfdBoundary {
  const corners = [
    applyMatrixToPoint(matrix, boundary.x, boundary.y),
    applyMatrixToPoint(matrix, boundary.x + boundary.width, boundary.y),
    applyMatrixToPoint(matrix, boundary.x, boundary.y + boundary.height),
    applyMatrixToPoint(matrix, boundary.x + boundary.width, boundary.y + boundary.height)
  ]
  const xs = corners.map((corner) => corner.x)
  const ys = corners.map((corner) => corner.y)
  const minX = Math.min(...xs)
  const minY = Math.min(...ys)
  return { x: minX, y: minY, width: Math.max(...xs) - minX, height: Math.max(...ys) - minY }
}

/** 解析 `CTM` 属性；缺失或不合法返回 null（渲染时按单位矩阵处理） */
export function parseMatrix(value: string | null): OfdMatrix | null {
  const numbers = parseNumberList(value)
  return numbers.length === 6
    ? [numbers[0]!, numbers[1]!, numbers[2]!, numbers[3]!, numbers[4]!, numbers[5]!]
    : null
}

/** 解析 `Boundary="x y w h"` 属性；缺失或不完整返回 null */
export function parseBoundary(value: string | null): OfdBoundary | null {
  const numbers = parseNumberList(value)
  if (numbers.length !== 4) return null
  return { x: numbers[0]!, y: numbers[1]!, width: numbers[2]!, height: numbers[3]! }
}

/** 按空白或逗号切分数值列表（CTM / Boundary / DeltaX / DashPattern 共用） */
export function parseNumberList(value: string | null): number[] {
  if (!value) return []
  return value
    .trim()
    .split(/[\s,]+/)
    .filter((token) => token !== '')
    .map((token) => Number(token))
    .filter((number) => Number.isFinite(number))
}
