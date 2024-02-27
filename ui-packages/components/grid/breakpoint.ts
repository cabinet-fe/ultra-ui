import type { Breakpoint, BreakpointName } from '@ui/types/components/grid'

/**
 * 获取容器断点
 * @param width
 */
export function getContainerBreakpoint(width: number): Breakpoint {
  const points: [number, BreakpointName][] = [
    [578, 'xs'],
    [960, 'sm'],
    [1280, 'md'],
    [1920, 'lg']
  ]

  let name: BreakpointName = 'lg'
  let level: number = 5

  points.some((point, index) => {
    if (width < point[0]) {
      name = point[1]
      level = index + 1
      return true
    }
  })

  return {
    name,
    level
  }
}
