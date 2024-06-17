<template>
  <!-- 触发 -->
  <u-node-render
    v-bind="{ ...eventsHandlers, ...$attrs }"
    :content="slots.default?.()?.[0]"
    :class="cls.b"
    ref="triggerRef"
  />

  <!-- 弹出内容 -->
  <teleport to="body">
    <Transition :name="transitionName">
      <component
        v-if="visible"
        :is="contentTag"
        :class="contentClass"
        ref="tipContentRef"
        @mouseenter="eventsHandlers.onMouseenter"
        @mouseleave="eventsHandlers.onMouseleave"
        @click.stop
        v-click-outside="handleClickOutside"
      >
        <slot name="content">{{ content }}</slot>
      </component>
    </Transition>
  </teleport>
</template>

<script lang="ts" setup>
import {
  shallowRef,
  nextTick,
  computed,
  useSlots,
  onBeforeUnmount,
  watch,
  inject,
  provide,
  defineComponent
} from 'vue'
import { bem, getScrollParents, observeTrigger, setStyles } from '@ui/utils'
import { vClickOutside } from '@ui/directives'
import { type TipProps } from '@ui/types/components/tip'
import { useFallbackProps } from '@ui/compositions'
import calcPosition from './position'
import countMaxWidth from './countMaxWidth'
import { TipNestDIKey } from './di'
import type { ComponentSize } from '@ui/types'
defineOptions({ name: 'Tip' })
import { UNodeRender } from '../node-render'

const props = withDefaults(defineProps<TipProps>(), {
  content: '提示内容',
  trigger: 'hover',
  position: 'top',
  mouseEnterable: true,
  mouseLeaveClose: true,
  clickClose: false,
  contentTag: 'div',
  disabled: false
})

const cls = bem('tip')
const slots = useSlots()
const { size } = useFallbackProps([props], {
  size: 'default' as ComponentSize
})

const transitionName = computed(() => `tip-${props.position.split('-')[0]}`)
const contentClass = computed(() => [
  cls.e('content'),
  bem.is(props.position),
  cls.m(size.value)
])

const triggerRef = shallowRef<InstanceType<typeof UNodeRender>>()

const tipContentRef = shallowRef<HTMLElement>()
const visible = shallowRef(false)
const dynamicStyle = shallowRef<Record<string, any>>({})
const gap = 8
const screenSize = { width: 0, height: 0 }

/**
 * 是否是嵌套tip，即在tip组件中嵌套其他的tip
 */
const isNested = inject(TipNestDIKey, false)
if (!isNested) {
  provide(TipNestDIKey, true)
}

let scrollDom = shallowRef<HTMLElement | null>()

const eventsHandlers = computed(() => {
  const { trigger, disabled } = props

  const handlers: Record<string, Function> = {}
  if (disabled) return handlers

  if (trigger === 'click') {
    handlers.onClick = open
  } else if (trigger === 'hover') {
    handlers.onMouseenter = open

    if (isNested) {
      handlers.onMouseleave = open
    } else {
      handlers.onMouseleave = close
    }
  }

  return handlers
})

const handleClickOutside = (e: MouseEvent) => {
  if (props.clickClose ?? isNested) return
  if (props.trigger === 'hover') return

  if (
    props.trigger === 'click' &&
    triggerRef.value?.$el?.contains(e.target as Node)
  ) {
    return
  }
  close()
}

let closeTimer: number | undefined = undefined

/** 弹出 */
const open = () => {
  closeTimer !== undefined && clearTimeout(closeTimer)
  visible.value = true
}
/** 关闭 */
const close = () => {
  if (props.trigger === 'hover') {
    closeTimer = setTimeout(() => {
      visible.value = false
    }, 200)
  } else {
    visible.value = false
  }
}

watch(visible, async v => {
  if (v) {
    await nextTick()
    window.addEventListener('resize', close)

    /** 添加滚动事件 */
    scrollParents = getScrollParents(triggerRef.value?.$el!)
    scrollDom.value = scrollParents[0]
    addScrollEvent()
  } else {
    removeScrollEvent()
    window.removeEventListener('resize', close)
  }
})

let scrollParents: HTMLElement[] = []

function addScrollEvent() {
  scrollParents.forEach(el => {
    el.addEventListener('scroll', close)
  })
  popup()
}

function removeScrollEvent() {
  scrollParents.forEach(el => {
    el.removeEventListener('scroll', close)
  })

  scrollParents = []
}

/** 弹出 */
const popup = async () => {
  screenSize.width = scrollDom.value?.clientWidth!
  screenSize.height = scrollDom.value?.clientHeight!

  const tipRefDom = triggerRef.value?.$el as HTMLElement
  const tipContentRefDom = tipContentRef.value
  if (!tipRefDom || !tipContentRefDom) return

  const { clientWidth, clientHeight } = tipRefDom
  const rect = tipRefDom.getBoundingClientRect()

  setStyles(tipContentRef.value!, {
    maxWidth: countMaxWidth(props.position, gap, rect)
  })

  const positionParams = {
    position: props.position,
    elementWidth: clientWidth,
    elementHeight: clientHeight,
    tipRefDom,
    tipContentRefDom,
    screenSize,
    gap
  }
  const { dynamicCss } = await calcPosition(positionParams)
  dynamicStyle.value = { ...dynamicCss.value, ...props.customStyle }
  setStyles(tipContentRefDom, { ...dynamicStyle.value })
  const { top } = tipContentRef.value!.getBoundingClientRect()
  nextTick(() => {
    setStyles(tipContentRef.value!, {
      ...dynamicStyle.value,
      maxHeight: `${window.innerHeight - top - gap * 2}px`
    })
  })
}

onBeforeUnmount(() => {
  clearTimeout(closeTimer)
})

defineExpose({ close })
</script>
