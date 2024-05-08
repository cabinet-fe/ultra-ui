<template>
  <UNodeRender
    :content="slots.default?.()?.[0]"
    @mouseenter.self="handleMouseEnter"
    @mouseleave.self="handleMouseLeave"
    @click.self="handleClick"
    :class="cls.b"
    ref="tipRef"
  />

  <teleport to="body">
    <div
      :class="contentClass"
      ref="tipContentRef"
      v-if="visible"
      @mouseenter.stop="handleContentMouseEnter"
      @mouseleave.stop="handleMouseLeave"
      @click.stop
      v-click-outside="handleClickOutside"
    >
      <slot name="content">
        {{ modelValue }}
      </slot>
    </div>
  </teleport>
</template>

<script lang="ts" setup>
import type { TipProps } from '@ui/types/components/tip'
import { bem, nextFrame, setStyles } from '@ui/utils'
import { shallowRef, nextTick, computed, useSlots, onBeforeUnmount } from 'vue'
import calcPosition from './position'
import { vClickOutside } from '@ui/directives'
import { UNodeRender } from '../node-render'
import {
  calculateMaxWidth,
  calculateRightMaxWidth,
  calculateLeftMaxWidth
} from './calculate'
import type { ScrollDirection } from './type'
import { useFormComponent, useFormFallbackProps } from '@ui/compositions'

defineOptions({
  name: 'Tip'
})

const props = withDefaults(defineProps<TipProps>(), {
  modelValue: '提示内容',
  trigger: 'hover',
  position: 'top',
  mouseEnterable: true
})

const cls = bem('tip')

const slots = useSlots()

const { formProps } = useFormComponent()

const { size } = useFormFallbackProps([formProps ?? {}, props], {
  size: 'default'
})

/**tip弹窗class */
const contentClass = computed(() => {
  return [cls.e('content'), bem.is(props.position), cls.m(size.value)]
})

/**页面元素的DOM信息 */
let tipRef = shallowRef<InstanceType<typeof UNodeRender>>()

/**弹窗显示的DOM信息 */
let tipContentRef = shallowRef<HTMLElement>()

/**是否显示 */
let visible = shallowRef(false)

// 使用Map管理所有定时器，便于统一清理
const timers = new Map<string, number>()

/**弹窗style样式 */
let dynamicStyle = shallowRef<Record<string, any>>({})

/**鼠标移入元素 */
const handleMouseEnter = () => {
  if (props.trigger !== 'hover') return
  clearTimeout(timers.get('timerMouseEnter'))
  timers.set(
    'timerMouseEnter',
    setTimeout(async () => {
      visible.value = true
      await nextTick()
      addListener()
      popup()
    }, 300)
  )
}

/**鼠标离开元素 */
const handleMouseLeave = () => {
  if (props.trigger !== 'hover') return
  clearTimeout(timers.get('timerMouseLeave'))
  timers.set(
    'timerMouseLeave',
    setTimeout(() => {
      removeListener()
    }, 300)
  )
}

/**鼠标移入弹窗内容区域 */
const handleContentMouseEnter = () => {
  if (!props.mouseEnterable) return
  timers.forEach(clearTimeout)
}

const handleClick = () => {
  if (props.trigger !== 'click') return
  
  clearTimeout(timers.get('timerTip'))
  timers.set(
    'timerTip',
    setTimeout(async () => {
      visible.value = !visible.value
      if (visible.value) {
        await nextTick()
        addListener()
        popup()
      } else {
        removeListener()
      }
    }, 300)
  )
}

const handleClickOutside = () => {
  clearInterval(timers.get('timerTip'))
  if (props.trigger === 'hover') return
  clearTimeout(timers.get('outside'))
  timers.set(
    'outside', 
    setTimeout(async () => {
      visible.value = false
      removeListener()
    }, 301)
  )
}

/** 提示框到屏幕边缘的间距 */
const gap = 16

/**页面滚动元素大小 */
const screenSize = {
  width: 0,
  height: 0
}

const setPositionParams = maxWidth => {
  const tipContentRefDom = tipContentRef.value
  setStyles(tipContentRefDom!, {
    maxWidth
  })
}
/**tip弹出 */
const popup = (scrollDirection?: ScrollDirection) => {
  screenSize.width = scrollDom.value?.clientWidth!
  screenSize.height = scrollDom.value?.clientHeight!
  
  // 获取页面元素的DOM信息
  const tipRefDom = tipRef.value?.$el as HTMLElement
  const tipContentRefDom = tipContentRef.value
  if (!tipRefDom || !tipContentRefDom) return
  // 获取元素的位置和大小信息
  const { clientWidth, clientHeight } = tipRefDom
  const rect = tipRefDom.getBoundingClientRect()

  // 计算弹出层样式
  let maxWidth
  if (props.position.match(/^(top|bottom)/)) {
    maxWidth = calculateMaxWidth(screenSize.width,rect, props.position, gap)
  } else if (props.position.match(/^right/)) {
    maxWidth = calculateRightMaxWidth(gap, screenSize.width, rect.width, rect.x)
  } else if (props.position.match(/^left/)) {
    maxWidth = calculateLeftMaxWidth(gap, screenSize.width, rect.width, rect.x)
  }

  if (maxWidth) {
    console.log(maxWidth,'===');
    
    setPositionParams(maxWidth)
  }

  // 将计算出的样式作用于弹出内容元素上，并显示
  nextFrame(async () => {
    const positionParams = {
      position: props.position,
      elementWidth: clientWidth,
      elementHeight: clientHeight,
      tipRefDom,
      tipContentRefDom,
      scrollDirection: scrollDirection!,
      screenSize
    }
    const { dynamicCss } = await calcPosition(positionParams)
    dynamicStyle.value = {
      ...dynamicCss.value,
      ...props.customStyle
    }
    setStyles(tipContentRefDom, dynamicStyle.value)
  })
}

let scrollDom = shallowRef<HTMLElement | null>()

let lastScrollTop = 0

/**监听屏幕滚动 */
const addListener = () => {
  const tipRefDom = tipRef.value?.$el as HTMLElement
  if (!tipRefDom) return
  
  scrollDom.value = tipRefDom.closest('.u-scroll')!
    .childNodes[1] as HTMLElement
  if (!scrollDom.value) return
  scrollDom.value.addEventListener('scroll', scrollEvent)
}

const removeListener = () => {
  visible.value = false
  scrollDom.value?.removeEventListener('scroll', scrollEvent)
  dynamicStyle.value = {}
}

const scrollEvent = () => {
  const currentScrollTop = scrollDom.value ? scrollDom.value?.scrollTop : 0
  const scrollDirection = currentScrollTop > lastScrollTop ? 'down' : 'up'
  popup(scrollDirection)
  lastScrollTop = currentScrollTop
}

onBeforeUnmount(() => {
  timers.forEach(clearTimeout)
  scrollDom.value?.removeEventListener('scroll', scrollEvent)
})
</script>
