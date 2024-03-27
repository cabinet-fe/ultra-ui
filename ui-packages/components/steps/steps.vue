<template>
  <ol :class="[cls.b, cls.e(direction!)]">
    <li
      :class="[
        cls.e('step'),
        bem.is('readonly', readonly),
        bem.is(processStatus!, active === item.key),
        bem.is(finishStatus!, index < currentIndex)
      ]"
      v-for="(item, index) in items"
      @click="readonly ? void 0 : selectStep(item.key)"
    >
      <div :class="[cls.e('icon'), bem.is('active', active === item.key)]">
        <div
          :class="[
            cls.em('icon', 'line'),
            bem.is(processStatus!, active === item.key),
            bem.is(finishStatus!, index < currentIndex)
          ]"
          v-if="index !== 0"
        ></div>
        <div :class="cls.em('icon', 'placeholder')" v-else></div>
        <component v-if="slots.icon" :is="icons[index]"></component>
        <div v-else :class="[cls.em('icon', 'number'), bem.is('active', active === item.key)]">
          <UIcon v-if="index < currentIndex" :size="16"><Check /></UIcon>
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

      <div :class="[cls.e('description'), bem.is('active', active === item.key)]">
        <component v-if="slots.desc && descs[index]" :is="descs[index]"></component>
        <span v-else>{{ item.label }}</span>
      </div>
    </li>
  </ol>
</template>

<script lang="ts" setup>
import { useSlots, computed } from 'vue'
import type { StepsProps, StepsEmits } from '@ui/types/components/steps'
import { bem } from '@ui/utils'
import { useFormFallbackProps, useFormComponent } from '@ui/compositions'
import { Check } from 'icon-ultra'
import { UIcon } from '../icon'

defineOptions({
  name: 'Steps'
})

const slots = useSlots()

const icons = computed(() => {
  return slots.icon ? slots.icon()[0]?.children || [] : []
})

const descs = computed(() => {
  return slots.desc ? slots.desc()[0]?.children || [] : []
})

const currentIndex = computed(() => {
  return props.active
    ? props.items.findIndex((item) => item.key === props.active)
    : props.items.length + 1
})

const props = defineProps<StepsProps>()

const emit = defineEmits<StepsEmits>()

const { formProps } = useFormComponent()

const { readonly } = useFormFallbackProps([formProps ?? {}, props], {
  direction: 'horizontal',
  readonly: true,
  processStatus: 'primary',
  finishStatus: 'success'
})

const cls = bem('steps')

const selectStep = (key: string) => {
  emit('update:active', key)
}
</script>
