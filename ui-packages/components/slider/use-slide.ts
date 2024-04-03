import type { SliderProps, SliderEmits } from '@ui/types/components/slider'
import { computed, type ShallowRef } from 'vue'

export const useSlide = (
  props: SliderProps,
  emit: SliderEmits,
  sliderSize: ShallowRef<number>
) => {
  // const barSize = () => {
  //   // console.log(props.modelValue, 'value')
  //   if (typeof props.modelValue === 'number') {
  //     return `${
  //       ((props.modelValue! - props.min!) / (props.max! - props.min!)) *
  //       sliderSize?.value!
  //     }px`
  //   } else {

  //   }
  // }

  // /** bar的长度 */
  // const barStyles = computed(() => {
  //   return props.vertical ? { height: barSize() } : { width: barSize() }
  // })

  const handleSliderDown = () => {}

  return { handleSliderDown }
}
