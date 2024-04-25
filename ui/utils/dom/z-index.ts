import { createIncrease } from '../helper/create-increase'

/**
 * z轴层级
 * 保证每个新打开的弹框的位置都处于上层
 */
export const zIndex = createIncrease(1000)
