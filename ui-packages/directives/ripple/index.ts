import type { DirectiveBinding, ObjectDirective } from 'vue'
import { bem } from '@ui/utils'
import { debounce } from 'cat-kit/fe'

const cls = bem('ripple')
const clsWrap = cls.e('wrap')

const removeClass = debounce(
  (el: HTMLElement) => {
    el.classList.remove(cls.b)
  },
  350,
  false
)

const showRipple = (el: HTMLElement, offsetX: number, offsetY: number) => {
  !el.classList.contains(cls.b) && el.classList.add(cls.b)

  const rect = el.getBoundingClientRect()

  const wrapSize = Math.ceil(Math.sqrt(rect.width ** 2 + rect.height ** 2))
  const wrap = document.createElement('span')
  wrap.classList.add(clsWrap)

  wrap.style.width = `${wrapSize}px`
  wrap.style.height = `${wrapSize}px`
  let transX = offsetX - wrapSize / 2
  let transY = offsetY - wrapSize / 2
  wrap.style.transform = `translate(${transX}px, ${transY}px) scale3d(0, 0, 0)`

  if (el.dataset.rippleClass) {
    wrap.classList.add(el.dataset.rippleClass)
  }

  el.appendChild(wrap)

  // 在下一帧添加动画
  requestAnimationFrame(() => {
    wrap.style.transform = `translate(${transX}px, ${transY}px) scale3d(2, 2, 2)`
  })

  // 延迟300移除波纹
  setTimeout(() => {
    removeRipple(el)
  }, 340)

  // 显示完之后移除
  removeClass(el)
}

/**
 * 移除波纹元素
 * 首先要保证波纹被移除才能够移除rippleClass
 */
const removeRipple = (el: HTMLElement) => {
  const wrap = el.getElementsByClassName(clsWrap)
  Array.prototype.forEach.call(wrap, item => {
    item.parentNode?.removeChild(item)
  })
}

function showEvent(this: HTMLElement, e: MouseEvent) {
  showRipple(this, e.offsetX, e.offsetY)
}

const addEvents = (el: HTMLElement, binding: DirectiveBinding<any>) => {
  if (binding.value === false) return
  if (typeof binding.value === 'string') {
    el.dataset.rippleClass = binding.value
  }
  el.addEventListener('mousedown', showEvent)
}

const removeEvents = (el: HTMLElement) => {
  el.removeEventListener('mousedown', showEvent)
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
