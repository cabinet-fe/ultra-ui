/** 格式化工作时长：整秒显示，≥60s 显示 Xm Ys */
export const formatDuration = (ms: number): string => {
  const seconds = Math.round(ms / 1000)
  if (seconds < 60) return `${seconds}s`
  const minutes = Math.floor(seconds / 60)
  const rest = seconds % 60
  return rest ? `${minutes}m ${rest}s` : `${minutes}m`
}
