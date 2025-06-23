export function value2SliderOffset(
  value: number,
  props: {
    min: number
    max: number
    step?: number
    slideSize: number
  }
): number {
  const { min, max, step, slideSize } = props
  const progress = (value - min!) / (max - min!)
  return slideSize * progress
}

export function sliderOffset2Value(
  offset: number,
  props: {
    slideSize: number
    min: number
    max: number
    step?: number
  }
): number {
  const { slideSize, min, max, step } = props
  const progress = offset / slideSize

  return progress * (max - min) + min
}
