import { describe, expect, it } from 'vitest'

import {
  applyMatrixToBoundary,
  applyMatrixToPoint,
  IDENTITY_MATRIX,
  multiplyMatrix,
  parseBoundary,
  parseMatrix
} from '../ctm'

describe('CTM 矩阵运算', () => {
  it('单位矩阵不改变点与边界', () => {
    expect(applyMatrixToPoint(IDENTITY_MATRIX, 12.5, -3)).toEqual({ x: 12.5, y: -3 })
    const boundary = { x: 10, y: 20, width: 30, height: 40 }
    expect(applyMatrixToBoundary(IDENTITY_MATRIX, boundary)).toEqual(boundary)
  })

  it('平移：e f 生效', () => {
    expect(applyMatrixToPoint([1, 0, 0, 1, 100, 50], 10, 5)).toEqual({ x: 110, y: 55 })
  })

  it('缩放：a d 生效', () => {
    expect(applyMatrixToPoint([2, 0, 0, 3, 0, 0], 4, 5)).toEqual({ x: 8, y: 15 })
  })

  it('旋转 90°（0 1 -1 0）：x 轴单位向量转到 y 轴', () => {
    expect(applyMatrixToPoint([0, 1, -1, 0, 0, 0], 10, 0)).toEqual({ x: 0, y: 10 })
  })

  it('矩阵乘法：先内后外（复合变换）', () => {
    const rotate90 = multiplyMatrix([0, 1, -1, 0, 0, 0], IDENTITY_MATRIX)
    const rotateThenTranslate = multiplyMatrix([1, 0, 0, 1, 100, 0], rotate90)
    expect(applyMatrixToPoint(rotateThenTranslate, 10, 0)).toEqual({ x: 100, y: 10 })
    // 与单步执行等价
    const rotated = applyMatrixToPoint(rotate90, 10, 0)
    const stepped = applyMatrixToPoint([1, 0, 0, 1, 100, 0], rotated.x, rotated.y)
    expect(applyMatrixToPoint(rotateThenTranslate, 10, 0)).toEqual(stepped)
  })

  it('边界变换取旋转后的包围盒', () => {
    expect(
      applyMatrixToBoundary([0, 1, -1, 0, 0, 0], { x: 0, y: 0, width: 10, height: 20 })
    ).toEqual({ x: -20, y: 0, width: 20, height: 10 })
  })
})

describe('CTM 与 Boundary 属性解析', () => {
  it('parseMatrix 解析 6 值（空格与逗号分隔）', () => {
    expect(parseMatrix('0.5 0 0 0.5 100 200')).toEqual([0.5, 0, 0, 0.5, 100, 200])
    expect(parseMatrix('1,2,3,4,5,6')).toEqual([1, 2, 3, 4, 5, 6])
  })

  it('parseMatrix 缺失或非 6 值返回 null', () => {
    expect(parseMatrix(null)).toBeNull()
    expect(parseMatrix('')).toBeNull()
    expect(parseMatrix('1 2 3')).toBeNull()
    expect(parseMatrix('a b c d e f')).toBeNull()
  })

  it('parseBoundary 解析 x y w h', () => {
    expect(parseBoundary('10 20 300 400')).toEqual({ x: 10, y: 20, width: 300, height: 400 })
    expect(parseBoundary('1.5 -2 3.25 4')).toEqual({ x: 1.5, y: -2, width: 3.25, height: 4 })
  })

  it('parseBoundary 缺失或不完整返回 null', () => {
    expect(parseBoundary(null)).toBeNull()
    expect(parseBoundary('10 20 300')).toBeNull()
  })
})
