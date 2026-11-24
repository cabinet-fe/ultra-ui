export function nextFrame(cb: () => void): void {
  requestAnimationFrame(() => {
    requestAnimationFrame(cb)
  })
}
