<template>
  <ol :class="className" ref="steps">
    <li
      v-for="(item, index) in items"
      :key="index"
      :class="[
        cls.e('item'),
        bem.is('current', index === currentIndex),
        bem.is('finished', currentIndex === undefined || index < currentIndex)
      ]"
      @click="handleStepClick(item, index)"
    >
      <div :class="cls.e('node')">
        <i :class="cls.e('link')" v-if="index !== items.length - 1"></i>

        <span :class="cls.e('icon')">
          <slot name="icon" :item="item" :index="index">
            <Check v-if="currentIndex === undefined || index < currentIndex" />

            <template v-else>
              {{ index + 1 }}
            </template>
          </slot>
        </span>
      </div>

      <div :class="cls.e('content')">
        <slot name="content" :item="item" :index="index">
          {{ item[labelKey] }}
        </slot>
      </div>
    </li>
  </ol>
</template>

<script lang="ts" setup>
import { Check } from '@veltra/icons/normal'
import { bem, fieldKey } from '@veltra/utils'
import { computed, useTemplateRef, watch } from 'vue'

import type { StepsEmits, StepsProps, StepsSlotScope } from '../../types/steps'

defineOptions({ name: 'USteps' })

const props = withDefaults(defineProps<StepsProps>(), {
  direction: 'horizontal',
  finishedStepType: 'success',
  labelKey: 'label'
})

const emit = defineEmits<StepsEmits>()

defineSlots<{ icon?: (scope: StepsSlotScope) => any; content?: (scope: StepsSlotScope) => any }>()

const cls = bem('steps')

const labelKey = computed(() => fieldKey(props.labelKey, 'label'))

const className = computed(() => {
  const { direction, currentStepType, finishedStepType } = props
  const ret: string[] = [
    cls.b,
    bem.is(direction),
    cls.m(props.size ?? 'default'),
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
      acc[item[currentKey]] = index
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
  return Math.min(Math.max(current, 0), props.items.length - 1)
})

// 横向滚动形态下把当前步骤滚入视野
watch(currentIndex, (index) => {
  if (index === undefined || props.direction === 'vertical') return
  const step = stepsRef.value?.children[index]
  if (step) {
    step.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
  }
})

// 点击步骤项
function handleStepClick(item: Record<string, any>, index: number) {
  emit('item-click', item, index)
  emit('update:current', props.currentKey ? item[props.currentKey] : index)
}
</script>
