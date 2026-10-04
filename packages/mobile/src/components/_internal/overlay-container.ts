/**
 * 弹层宿主容器（内部机制，不进公开导出）
 *
 * 设备外壳等嵌入场景把承载元素注册进来，底部弹层 / 对话框 / 抽屉 / 函数式消息
 * 改挂到该元素内，随容器一起定位与缩放，滚动锁定也作用于该容器；
 * 未注册时行为不变（挂 body、锁 body 滚动）。
 */
let container: HTMLElement | undefined

export function setOverlayContainer(el: HTMLElement | undefined): void {
  container = el
}

export function getOverlayContainer(): HTMLElement {
  return container ?? document.body
}
