<template>
  <div :class="classList">
    <div
      :class="headerClassList"
      role="button"
      :aria-expanded="isActive"
      :aria-disabled="disabled"
      :tabindex="disabled ? -1 : 0"
      @click="handleClick"
      @keydown.enter.prevent="handleClick"
      @keydown.space.prevent="handleClick"
    >
      <slot name="header" :is-active="isActive">
        <span :class="cls.e('title')">{{ title }}</span>

        <span :class="cls.e('icon')">
          <UIcon><component :is="iconComponent" /></UIcon>
        </span>
      </slot>
    </div>
    <div ref="wrapperEl" :class="cls.e('content-wrapper')" :aria-hidden="!isActive">
      <div :class="cls.e('content')">
        <slot />
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { useModel } from '@veltra/compositions'
import { ArrowDown } from '@veltra/icons/normal'
import { bem, ExpandTransition } from '@veltra/utils'
import { computed, inject, onBeforeUnmount, onMounted, ref, watch } from 'vue'

import type { CollapseItemEmits, CollapseItemProps } from '../../types'
import { UIcon } from '../icon'
import { CollapseDIKey } from './di'

defineOptions({ name: 'UCollapseItem' })

const props = withDefaults(defineProps<CollapseItemProps>(), { modelValue: false })
const emit = defineEmits<CollapseItemEmits>()

defineSlots<{
  /** 自定义整个头部，作用域参数 `isActive` 指示展开状态；缺省渲染 title + 展开图标 */
  header?: (scope: { isActive: boolean }) => any
  /** 折叠面板内容 */
  default?: () => any
}>()

const context = inject(CollapseDIKey, undefined)

const cls = context?.cls ?? bem('collapse')

const standaloneModel = useModel<CollapseItemProps, 'modelValue'>({
  props,
  emit,
  defaultValue: false
})

const isActive = computed(() => {
  if (context) {
    return props.value !== undefined && context.activeValues.value.includes(props.value)
  }
  return !!standaloneModel.value
})

const iconComponent = computed(() => context?.expandIcon.value ?? props.expandIcon ?? ArrowDown)

const classList = computed(() => [
  cls.e('item'),
  bem.is('active', isActive.value),
  bem.is('disabled', props.disabled)
])

const headerClassList = computed(() => [
  cls.e('header'),
  bem.is('disabled', props.disabled),
  bem.is('active', isActive.value)
])

const expandTransition =
  context?.expandTransition ??
  new ExpandTransition({ transition: 'height 0.24s cubic-bezier(0.4, 0, 0.2, 1)' })

const handleClick = () => {
  if (props.disabled) return

  if (context) {
    if (props.value === undefined) return
    context.toggle(props.value)
    return
  }

  const next = !standaloneModel.value
  standaloneModel.value = next
  emit('change', next)
}

const wrapperEl = ref<HTMLElement>()

onMounted(() => {
  if (context && props.value !== undefined) {
    context.register(props.value)
  }
  if (!wrapperEl.value) return
  expandTransition.setExpanded(wrapperEl.value, isActive.value)
})

watch(isActive, (active) => {
  if (!wrapperEl.value) return
  active ? expandTransition.expand(wrapperEl.value) : expandTransition.collapse(wrapperEl.value)
})

onBeforeUnmount(() => {
  if (context && props.value !== undefined) {
    context.unregister(props.value)
  }
  if (!wrapperEl.value) return
  expandTransition.cancel(wrapperEl.value)
})
</script>
