<template>
  <transition>
    <div :class="cls.b" ref="watermarkRef">
      <slot></slot>
    </div>
  </transition>
</template>

<script lang="ts" setup>
import type { WatermarkProps } from '@ui/types/components/watermark'
import { bem, setStyles, zIndex } from '@ui/utils'
import { nextTick, onMounted, reactive, ref } from 'vue'
import type { WatermarkEmits } from '.'
import { downloadFileByBase64 } from './base64'

defineOptions({
  name: 'Watermark'
})
const cls = bem('watermark')
const props = withDefaults(defineProps<WatermarkProps>(), {
  text: ''
})
const emit = defineEmits<WatermarkEmits>()

const watermarkRef = ref<HTMLDivElement>()
const watermark = reactive({
  text: props.text,
  font: '',
  fontColor: 'rgba(0,0,0,.3)',
  fontSize: '60',
  fontWeight: '',
  fontStyle: 'rgba(0,0,0,.3)',
  fontFamily: 'Arial',
  rotate: 0,
  width: 0,
  height: 0,
  gapX: -10,
  gapY: 100,
  offsetX: 10,
  offsetY: 20,
  zIndex: 0,
  image: props.image,
  set: (str, container) => {
    const id = setWatermark(str, container)
    // setInterval(() => {
    //   if (document.getElementById(id) === null) {
    //     setWatermark(str, container)
    //   }
    // }, 500)
    window.onresize = () => {
      setWatermark(str, container)
    }
  }
})

const setWatermark = async (str, container) => {
  const id = 'watermark-' + new Date().getTime() // 使用更动态的ID

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

  nextTick(() => {
    // 获取canvas上下文
    canvas.width = container.clientWidth
    canvas.height = container.clientHeight
  })

  console.log(container.clientWidth, container.clientHeight, 'containter')
  // canvas.width = 390
  // canvas.height = 200

  // 创建canvs画布
  const ctx = canvas.getContext('2d')!

  // 逆时旋转
  ctx.rotate(-0.3)
  // ctx.rotate((Math.PI / 180) * watermark.rotate)

  // 字体
  ctx.font = `${watermark.fontSize}px ${watermark.fontFamily}`
  // 字体颜色
  ctx.fillStyle = watermark.fontColor
  // 对齐方式
  ctx.textAlign = 'left'
  // 文本基线
  ctx.textBaseline = 'top'
  // 编制文字
  // ctx.fillText(str, watermark.gapX - 10, 50)
  ctx.fillText(str, watermark.gapX - 10, watermark.gapY)
  // 创建水印div
  const watermarkDiv = document.createElement('div')
  watermarkDiv.id = id
  setStyles(watermarkDiv, {
    pointerEvents: 'none',
    top: '0',
    left: '0px',
    position: 'absolute',
    zIndex: zIndex(),
    // width: containerWidth + 'px',
    width: document.documentElement.clientWidth + 'px',
    height: container.clientHeight + 'px'
  })

  // watermarkDiv.style.pointerEvents = 'none'
  // watermarkDiv.style.top = '0px'
  // watermarkDiv.style.left = '0px'
  // watermarkDiv.style.position = 'absolute'
  // watermarkDiv.style.zIndex = zIndex()
  // watermarkDiv.style.width = containerWidth + 'px'
  // watermarkDiv.style.height = container.clientHeight + 'px'

  // 处理水印图片
  if (watermark.image) {
    const img = new Image()
    img.src = await downloadFileByBase64(watermark.image)
    // img.src = watermark.image
    img.onload = () => {
      // context.drawImage(img,sx,sy,swidth,sheight,x,y,width,height);
      ctx.drawImage(img, 0, 100, canvas.width / 2, canvas.height / 2)
      watermarkDiv.style.background = `url(${canvas.toDataURL('image/png')}) repeat`
      container.appendChild(watermarkDiv) // 异步操作后再添加水印
    }
  } else {
    watermarkDiv.style.background = `url(${canvas.toDataURL('image/png')}) repeat`
    container.appendChild(watermarkDiv)
  }
  return id
}

onMounted(() => {
  watermark.set(watermark.text, watermarkRef.value)
})
</script>
