<template>
  <ol :class="className">
    <li
      v-for="(item, index) in items"
      :class="[
        cls.e('item'),
        bem.is('current', index === currentIndex),
        bem.is('finished', index < currentIndex)
      ]"
      @click="handleStepClick(item, index)"
    >
      <div :class="cls.e('node')">
        <i :class="cls.e('link')" v-if="index !== items.length - 1"></i>

        <span :class="cls.e('icon')">
          <slot name="icon" :item="item" :index="index">
            <UIcon v-if="index < currentIndex">
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
          {{ getChainValue(item, labelKey) }}
        </slot>
      </div>
    </li>
  </ol>
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import type {
  StepsProps,
  StepsEmits,
  ComponentSize,
  StepsSlotScope
} from '@ui/types'
import { bem } from '@ui/utils'
import { useFallbackProps } from '@ui/compositions'
import { Check } from '@ultra/icon'
import { UIcon } from '../icon'
import { getChainValue } from 'cat-kit/fe'

defineOptions({
  name: 'Steps'
})

const props = withDefaults(defineProps<StepsProps>(), {
  direction: 'horizontal',
  finishedStepType: 'success',
  labelKey: 'label'
})

const emit = defineEmits<StepsEmits>()

defineSlots<{
  icon?: (scope: StepsSlotScope) => any
  content?: (scope: StepsSlotScope) => any
}>()

const cls = bem('steps')

const { size } = useFallbackProps([props], {
  size: 'default' as ComponentSize
})

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

const currentToIndexMap = computed<Record<string, number> | undefined>(() => {
  const { currentKey, items } = props
  if (!currentKey) return undefined
  return items.reduce(
    (acc, item, index) => {
      acc[getChainValue(item, currentKey)] = index
      return acc
    },
    {} as Record<string, number>
  )
})

/** 当前活动序号 */
const currentIndex = computed(() => {
  const { currentKey, current } = props
  if (!currentKey) return current as number
  if (!current) return -1
  return currentToIndexMap.value?.[current] ?? -1
})

// 点击步骤项
function handleStepClick(item: Record<string, any>, index: number) {
  emit('item-click', item, index)
  emit(
    'update:current',
    props.currentKey ? getChainValue(item, props.currentKey) : index
  )
}
</script>
