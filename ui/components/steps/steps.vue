<template>
  <ol :class="[cls.b, cls.e(direction!), cls.m(size)]">
    <li
      :class="[
        cls.e('step'),
        bem.is('readonly', readonly),
        bem.is(processStatus!, active === item.key),
        bem.is(finishStatus!, index < currentIndex)
      ]"
      v-for="(item, index) in items"
      @click="readonly ? void 0 : stepClick(item)"
    >
      <div :class="[cls.e('icon'), bem.is(direction)]">
        <div
          :class="[
            cls.em('icon', 'line'),
            bem.is(processStatus!, active === item.key),
            bem.is(finishStatus!, index < currentIndex)
          ]"
          v-if="index !== 0"
        ></div>
        <div :class="cls.em('icon', 'placeholder')" v-else></div>
        <component
          v-if="slots.icon"
          :is="icons[index]"
          :class="[cls.em('icon', 'number')]"
        ></component>
        <div v-else :class="[cls.em('icon', 'number')]">
          <UIcon v-if="index < currentIndex"><Check /></UIcon>
          <span v-else>{{ index + 1 }}</span>
        </div>
        <div
          :class="[
            cls.em('icon', 'line'),
            bem.is(processStatus!, index === currentIndex - 1),
            bem.is(finishStatus!, index < currentIndex - 1)
          ]"
          v-if="index !== items.length - 1"
        ></div>
        <div :class="cls.em('icon', 'placeholder')" v-else></div>
      </div>

      <div :class="[cls.e('description')]">
        <component v-if="slots.desc && descs[index]" :is="descs[index]"></component>
        <span v-else>{{ item.label }}</span>
      </div>
    </li>
  </ol>
</template>

<script lang="ts" setup>
import { useSlots, computed } from 'vue'
import type { StepsProps, StepsEmits, StepItem } from '@ui/types/components/steps'
import { bem } from '@ui/utils'
import { useFallbackProps } from '@ui/compositions'
import { Check } from 'icon-ultra'
import { UIcon } from '../icon'
import type { ComponentSize } from '@ui/types/component-common'

defineOptions({
  name: 'Steps'
})

const slots = useSlots()
/** 图标位插槽 */
const icons = computed(() => {
  return slots.icon ? slots.icon()[0]?.children || [] : []
})
/** 描述位插槽 */
const descs = computed(() => {
  return slots.desc ? slots.desc()[0]?.children || [] : []
})
/** 当前活动序号 */
const currentIndex = computed(() => {
  return props.active
    ? props.items.findIndex((item) => item.key === props.active)
    : props.items.length + 1
})

const props = withDefaults(defineProps<StepsProps>(), {
  direction: 'horizontal',
  readonly: true,
  processStatus: 'default',
  finishStatus: 'success'
})

const emit = defineEmits<StepsEmits>()

const { size } = useFallbackProps([props], {
  size: 'default' as ComponentSize
})

const cls = bem('steps')
/** 点击步骤切换活动序号 */
const stepClick = (item: StepItem) => {
  emit('stepClick', item)
  emit('update:active', item.key)
}
</script>
