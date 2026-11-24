import type { BreakpointName, BreakCols, Breakpoint } from '../../types'

export const DEFAULT_COLS = 24

const points: [number, BreakpointName][] = [
  [578, 'xs'],
  [960, 'sm'],
  [1366, 'md'],
  [1920, 'lg'],
  [Infinity, 'xl']
]

export function getContainerBreakpoint(width: number): Breakpoint {
  for (let i = 0; i < points.length; i++) {
    const point = points[i]!
    if (width < point[0]) {
      return { name: point[1], level: i + 1 }
    }
  }
  return { name: 'xl', level: 5 }
}

export function getBreakpointCols(colConf: BreakCols, breakpoint?: Breakpoint): number {
  if (!breakpoint) return DEFAULT_COLS
  const { name, level } = breakpoint
  const cols = colConf[name]
  if (cols !== undefined) return cols

  if (level === 5) return colConf.default ?? DEFAULT_COLS

  const highLevelPoints = points.slice(level - 1)
  for (let i = 0; i < highLevelPoints.length; i++) {
    const pointName = highLevelPoints[i]![1]
    if (colConf[pointName]) {
      return colConf[pointName]
    }
  }
  return DEFAULT_COLS
}
