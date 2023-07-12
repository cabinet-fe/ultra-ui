import './style.scss'
import { DirectiveBinding, ObjectDirective } from 'vue'
import { bem } from '@ui/utils'

const cls = bem('ripple')
const clsE = cls.e('wrap')

const showRipple = (el: HTMLElement, offsetX: number, offsetY: number) => {
  el.classList.add(cls.b)
  const rect = el.getBoundingClientRect()

  const wrapSize = Math.max(rect.width, rect.height)
  const wrap = document.createElement('span')
  // 初始样式
  wrap.classList.add(clsE)

  wrap.style.width = `${wrapSize}px`
  wrap.style.height = `${wrapSize}px`
  let transX = offsetX - wrapSize / 2
  let transY = offsetY - wrapSize / 2
  wrap.style.transform = `translate(${transX}px, ${transY}px) scale(0, 0)`

  if (el.dataset.rippleClass) {
    wrap.classList.add(el.dataset.rippleClass)
  }

  el.appendChild(wrap)

  // 在下一帧添加动画
  setTimeout(() => {
    wrap.style.transform = `translate(${transX}px, ${transY}px) scale(2, 2)`
  })

  setTimeout(() => {
    hideRipple(el)
  }, 300)
}

const hideRipple = (el: HTMLElement) => {
  const wrap = el.getElementsByClassName(clsE)

  Array.prototype.forEach.call(wrap, item => {
    item.parentNode?.removeChild(item)
  })
}

const showEvent = (e: MouseEvent) => {
  showRipple(e.target as HTMLElement, e.offsetX, e.offsetY)
}

const addEvents = (el: HTMLElement, binding: DirectiveBinding<any>) => {
  if (!binding.value) return
  if (typeof binding.value === 'string') {
    el.dataset.rippleClass = binding.value
  }

  el.addEventListener('mousedown', showEvent)

  // el.addEventListener('mouseup', hideRipple)
}

const removeEvents = (el: HTMLElement) => {
  el.removeEventListener('mousedown', showEvent)
  // el.removeEventListener('mouseup', hideRipple)
}

const Ripple: ObjectDirective<HTMLElement> = {
  // 挂载
  mounted(el, binding) {
    addEvents(el, binding)
  },
  // 卸载
  unmounted(el) {
    removeEvents(el)
  },

  // 更新
  updated(el, binding) {
    // hideRipple(el)
    removeEvents(el)
    addEvents(el, binding)
  }
}

// 实现一个vue3的波纹指令
export default Ripple
