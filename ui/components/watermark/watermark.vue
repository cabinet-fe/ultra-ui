<template>
  <transition>
    <div :class="cls.b" ref="watermarkRef">
      <slot></slot>
    </div>
  </transition>
</template>

<script lang="ts" setup>
import type { WatermarkProps } from '@ui/types/components/watermark'
import { bem } from '@ui/utils'
import { onMounted, reactive, ref } from 'vue'
import type { WatermarkEmits } from '.'

defineOptions({
  name: 'Watermark'
})
const cls = bem('watermark')
const props = withDefaults(defineProps<WatermarkProps>(), {
  text:'默认水印'
})
const emit = defineEmits<WatermarkEmits>()

const watermarkRef = ref<HTMLDivElement>()
const watermark = reactive({
  text: props.text,
  font: '',
  fontColor: '',
  fontSize: '',
  fontWeight: '',
  fontStyle: '',
  fontFamily: '',
  rotate: 0,
  width: 0,
  height: 0,
  gapX: 0,
  gapY: 0,
  offsetX: 0,
  offsetY: 0,
  zIndex: 0,
  image: '',
  set: (str, container) => {
    const id = setWatermark(str, container)
    setInterval(() => {
      if (document.getElementById(id) === null) {
        setWatermark(str, container)
      }
    }, 500)
    window.onresize = () => {
      setWatermark(str, container)
    }
  }
})

const setWatermark = (str, container) => {
  console.log(str, 'str')
  console.log(watermarkRef.value?.getClientRects(), 'container')
  const id = '1.23452384164.123412415'
  let rect = watermarkRef.value?.getBoundingClientRect()
  if (container === undefined) return
  if (document.getElementById(id) !== null) {
    const childElement = document.getElementById(id)
    childElement?.parentNode?.removeChild(childElement)
  }
  // 父容器宽
  var containerWidth = container.clientWidth
  // 父容器高
  var containerHeight = `calc(100vh - ${rect?.top}px)`
  container.style.position = 'relative'
  
  // 创建canvas
  const canvas = document.createElement('canvas')
  canvas.width = 390
  canvas.height = 200
  // 创建canvs画布
  const ctx = canvas.getContext('2d')!
  // 逆时旋转
  ctx.rotate((Math.PI / 180) * watermark.rotate)
  // 字体
  ctx.font = `${watermark.fontSize}px ${watermark.fontFamily}`
  // 字体颜色
  ctx.fillStyle = watermark.fontColor
  // 对齐方式
  ctx.textAlign = 'left'
  // 文本基线
  ctx.textBaseline = 'middle'
  // 编制文字
  ctx.fillText(str, watermark.gapX, watermark.gapY + 20)
  console.log(containerHeight);
  
  // 创建div
  const div = document.createElement('div')
  div.id = id
  div.style.pointerEvents = 'none'
  div.style.top = '0px'
  div.style.left = '0px'
  div.style.position = 'absolute'
  div.style.zIndex = '9999'
  div.style.width = containerWidth + 'px'
  div.style.height = containerHeight
  div.style.background = `url(${canvas.toDataURL('image/png')}) repeat`
  container.appendChild(div)

  return id
}

onMounted(() => {
  watermark.set(watermark.text, watermarkRef.value)
})
</script>
