import { ref } from 'vue'

export const useSelect = () => {
  /** 单选是否选中 */
  let active = ref(false)

  /** 切换单选高亮状态 */
  const toggleNodeSelect = () => {
    active.value = !active.value
  }

  return { active, toggleNodeSelect }
}
