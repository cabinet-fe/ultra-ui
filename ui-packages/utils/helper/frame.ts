/**
 * 下一帧运行
 * @param cb 回调
 */
export function nextFrame(cb: () => void) {
  requestAnimationFrame(() => {
    requestAnimationFrame(cb)
  })
}