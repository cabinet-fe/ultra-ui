<template>
  <ol :class="className" ref="steps">
    <li
      v-for="(item, index) in items"
      :class="[
        cls.e('item'),
        bem.is('current', index === currentIndex),
        bem.is('finished', currentIndex === undefined || index < currentIndex)
      ]"
      @click="handleStepClick(item, index)"
    >
      <div :class="cls.e('node')">
        <i :class="cls.e('link')" v-if="index !== items.length - 1"></i>

        <span
          :class="cls.e('icon')"
          @mouseenter="handleStepMouseenter($event, item, index)"
          @mouseleave="handleStepMouseleave"
        >
          <slot name="icon" :item="item" :index="index">
            <UIcon v-if="currentIndex === undefined || index < currentIndex">
              <Check />
            </UIcon>

            <template v-else>
              {{ index + 1 }}
            </template>
          </slot>
        </span>
      </div>

      <div :class="cls.e('content')">
        <slot name="content" :item="item" :index="index">
          {{ o(item).get(labelKey) }}
        </slot>
      </div>
    </li>

    <u-tip
      v-if="slots.tip"
      ref="tip"
      :trigger-dom="tipTriggerDom"
      v-model:visible="tipVisible"
      @update:visible="handleTipUpdateVisible"
    >
      <template #content>
        <UNodeRender :content="tipContent" />
      </template>
    </u-tip>
  </ol>
</template>

<script lang="ts" setup>
import { n, o } from '@cat-kit/core'
import { useFallbackProps } from '@veltra/compositions'
import { Check } from '@veltra/icons/normal'
import { bem } from '@veltra/utils'
import { computed, shallowRef, useTemplateRef, watch } from 'vue'

import type { StepsProps, StepsEmits, ComponentSize, StepsSlotScope } from '../../types'
import { UIcon } from '../icon'
import { UNodeRender } from '../node-render'
import { UTip } from '../tip'

defineOptions({ name: 'Steps' })

const props = withDefaults(defineProps<StepsProps>(), {
  direction: 'horizontal',
  finishedStepType: 'success',
  labelKey: 'label'
})

const emit = defineEmits<StepsEmits>()

const slots = defineSlots<{
  icon?: (scope: StepsSlotScope) => any
  content?: (scope: StepsSlotScope) => any
  tip?: (scope: StepsSlotScope) => any
}>()

const cls = bem('steps')

const { size } = useFallbackProps([props], { size: 'default' as ComponentSize })

const className = computed(() => {
  const { direction, currentStepType, finishedStepType } = props
  const ret: string[] = [
    cls.b,
    bem.is(direction),
    cls.m(size.value),
    bem.is('align-center', props.alignCenter),
    cls.em('finished', finishedStepType)
  ]
  currentStepType && ret.push(cls.em('current', currentStepType))
  return ret
})

const stepsRef = useTemplateRef('steps')

const currentToIndexMap = computed<Record<string, number> | undefined>(() => {
  const { currentKey, items } = props
  if (!currentKey) return undefined
  return items.reduce(
    (acc, item, index) => {
      acc[o(item).get(currentKey)] = index
      return acc
    },
    {} as Record<string, number>
  )
})

/** 当前索引 */
const currentIndex = computed<number | undefined>(() => {
  const { currentKey, current } = props
  if (current === undefined) return undefined

  if (currentKey) {
    return currentToIndexMap.value?.[current]
  }

  if (typeof current !== 'number') return undefined
  return n(current).range(0, props.items.length - 1)
})

watch(currentIndex, (index) => {
  if (index === undefined || props.direction === 'vertical') return
  const step = stepsRef.value?.children[index]
  if (step) {
    step.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }
})

// 点击步骤项
function handleStepClick(item: Record<string, any>, index: number) {
  emit('item-click', item, index)
  emit('update:current', props.currentKey ? o(item).get(props.currentKey) : index)
}

// 提示
const tipVisible = shallowRef(false)
const tipTriggerDom = shallowRef<HTMLElement>()
const tipContent = shallowRef()

function handleStepMouseenter(event: MouseEvent, item: Record<string, any>, index: number) {
  if (!slots.tip) return
  tipTriggerDom.value = event.target as HTMLElement
  tipVisible.value = true
  tipContent.value = slots.tip?.({ item, index })
}

let timer: number | undefined = undefined
function closeTip() {
  timer = setTimeout(() => {
    tipVisible.value = false
    tipContent.value = undefined
    tipTriggerDom.value = undefined
  }, 250)
}

function handleTipUpdateVisible(visible: boolean) {
  visible && clearTimeout(timer)
}

function handleStepMouseleave() {
  if (!slots.tip) return
  closeTip()
}
</script>
