<template>
  <u-dropdown
    :class="cls.b"
    trigger="click"
    min-width="260px"
    :content-class="cls.e('panel')"
  >
    <template #trigger>
      <u-input :size="size" />
    </template>

    <template #content>
      <div >
        <span></span>
        <span></span>

        <span>
          2024
        </span>
        <span>
          4月
        </span>


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
import { useFormComponent, useFormFallbackProps } from '@ui/compositions'
import { shallowRef } from 'vue'
import { date } from 'cat-kit/fe'

defineOptions({
  name: 'DatePicker'
})

const props = withDefaults(defineProps<DatePickerProps>(), {})

const cls = bem('date-picker')

const { formProps } = useFormComponent()

const { size } = useFormFallbackProps([formProps ?? {}, props], {
  size: 'small'
})

const days = shallowRef(Array.from({ length: 42 }).fill(0))

function getMonthDays(d: Date) {
  // 跳转到当月的第一天
  d.setDate(1)
  return 7 - d.getDay()
}

console.log(getMonthDays(new Date()))
</script>
