import { computed, type Ref, type ShallowRef } from 'vue'

interface Options {
  name: ShallowRef<string> | string | Ref<string>
}
export function useCssTransition(options: Options): void {
  const { name } = options

  const classes =
    typeof name === 'string'
      ? {
          enterTo: `${name}-enter-to`,
          enterActive: `${name}-enter-active`,
          leaveActive: `${name}-leave-active`
        }
      : computed(() => {
          return {
            enterTo: `${name.value}-enter-to`,
            enterActive: `${name.value}-enter-active`,
            leaveActive: `${name.value}-leave-active`
          }
        })

  const transitionActive = () => {
    const { enterActive, enterTo } = classes.value
    const dom = childRef.value?.$el
    // 标记进入动画激活状态
    dom?.classList.add(enterActive)
    // 在下一帧插入动画运动目标状态
    requestAnimationFrame(() => {
      dom?.classList.add(enterTo)
    })
  }
}
