/**
 * 打印 HTML 文档：隐藏 iframe 装载后调起浏览器打印，结束（或兜底超时）销毁。
 *
 * 路线取舍：相对 `window.open` 不被弹窗拦截；相对 `@media print` 直打宿主页，
 * 不侵入应用布局，也不受网格 canvas 虚拟滚动（只绘制视口）限制。
 * iframe 用 0×0 定位隐藏而非 `display:none`（部分浏览器不打印 none 的 iframe）。
 */
export function printHtmlDocument(html: string): void {
  const iframe = document.createElement('iframe')
  iframe.setAttribute('aria-hidden', 'true')
  iframe.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0;'
  document.body.appendChild(iframe)

  const win = iframe.contentWindow
  const doc = iframe.contentDocument
  if (!win || !doc || typeof win.print !== 'function') {
    iframe.remove()
    throw new Error('当前环境不支持打印')
  }

  let cleaned = false
  const cleanup = (): void => {
    if (cleaned) return
    cleaned = true
    iframe.remove()
  }
  win.addEventListener('afterprint', cleanup)

  doc.open()
  doc.write(html)
  doc.close()

  // 等内嵌图片（data URL）解码完再打印，避免打印快照取到未解码图片
  const decoding = Array.from(doc.images).map((img) =>
    typeof img.decode === 'function' ? img.decode().catch(() => undefined) : Promise.resolve()
  )
  void Promise.all(decoding).then(() => {
    if (cleaned) return
    win.focus()
    win.print()
    // 兜底回收：afterprint 在部分环境不触发，或用户长期挂着打印对话框
    setTimeout(cleanup, 60_000)
  })
}
