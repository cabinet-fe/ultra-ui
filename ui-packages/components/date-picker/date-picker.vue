<template>
  <u-dropdown
    :class="className"
    trigger="click"
    min-width="260px"
    :content-class="cls.e('panel')"
  >
    <template #trigger>
      <u-input :size="size" :placeholder="placeholder">
        <template #suffix>
          <u-icon :class="cls.e('icon')"><Calendar /></u-icon>
        </template>
      </u-input>
    </template>

    <template #content>
      <div>
        <span></span>
        <span></span>

        <span> 2024 </span>
        <span> 4月 </span>

        <span></span>
        <span></span>
      </div>
      <ul :class="cls.e('days')">
        <li :class="cls.e('day')" v-for="day of days">
          {{ day }}
        </li>
      </ul>
    </template>
  </u-dropdown>
</template>

<script lang="ts" setup>
import type { DatePickerProps } from '@ui/types/components/date-picker'
import { bem } from '@ui/utils'
import { UDropdown } from '../dropdown'
import { UInput } from '../input'
import { UIcon } from '../icon'
import { useFormComponent, useFormFallbackProps } from '@ui/compositions'
import { computed, shallowRef } from 'vue'
import { Calendar } from 'icon-ultra'
import { date } from 'cat-kit/fe'

defineOptions({
  name: 'DatePicker'
})

const props = withDefaults(defineProps<DatePickerProps>(), {
  placeholder: '选择日期'
})

const cls = bem('date-picker')

const { formProps } = useFormComponent()

const { size } = useFormFallbackProps([formProps ?? {}, props], {
  size: 'default'
})

const className = computed(() => {
  return [cls.b, cls.m(size.value)]
})

const days = shallowRef(Array.from({ length: 42 }).fill(0))

function getMonthDays(d: Date) {
  // 跳转到当月的第一天
  d.setDate(1)
  return 7 - d.getDay()
}

console.log(getMonthDays(new Date()))
</script>
