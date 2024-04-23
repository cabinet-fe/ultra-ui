import type {
  BreakCols,
  Breakpoint,
  BreakpointName
} from '@ui/types/components/grid'

export const DEFAULT_COLS = 24

const points: [number, BreakpointName][] = [
  [578, 'xs'],
  [960, 'sm'],
  [1280, 'md'],
  [1920, 'lg'],
  [Infinity, 'xl']
]

/**
 * 获取容器断点
 * @param width
 */
export function getContainerBreakpoint(width: number): Breakpoint {
  for (let i = 0; i < points.length; i++) {
    const point = points[i]!
    if (width < point[0]) {
      return {
        name: point[1],
        level: i + 1
      }
    }
  }
  return {
    name: 'xl',
    level: 5
  }
}

/**
 * 获取断点对应的列数
 * @param colConf 断点配置
 * @param breakpoint 断点
 */
export function getBreakpointCols(colConf: BreakCols, breakpoint?: Breakpoint) {
  if (!breakpoint) return DEFAULT_COLS
  const { name, level } = breakpoint
  const cols = colConf[name]
  if (cols !== undefined) return cols

  if (level === 5) return colConf.default ?? DEFAULT_COLS

  // 尝试寻找高级断点
  const highLevelPoints = points.slice(level - 1)
  for (let i = 0; i < highLevelPoints.length; i++) {
    const pointName = highLevelPoints[i]![1]
    if (colConf[pointName]) {
      return colConf[pointName]
    }
  }
  return DEFAULT_COLS
}
