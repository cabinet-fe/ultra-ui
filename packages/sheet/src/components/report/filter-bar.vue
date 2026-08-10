<template>
  <section v-if="queryParams.length" :class="cls.b">
    <span :class="cls.e('label')">筛选参数</span>
    <div :class="cls.e('fields')">
      <div v-for="param in queryParams" :key="param.id" :class="cls.e('field')">
        <span :class="cls.e('field-label')">{{ param.label }}</span>
        <u-date-picker
          v-if="param.type === 'date'"
          :model-value="String(values[param.id] ?? '')"
          size="small"
          @update:model-value="(v) => emitChange(param.id, v)"
        />
        <u-date-range-picker
          v-else-if="param.type === 'date-range'"
          :model-value="dateRangeModel(param.id)"
          size="small"
          @update:model-value="(v) => emitDateRangeChange(param.id, v)"
        />
        <u-select
          v-else-if="param.type === 'select'"
          :model-value="String(values[param.id] ?? '')"
          size="small"
          :options="param.options ?? []"
          @update:model-value="(v) => emitChange(param.id, v)"
        />
        <u-number-input
          v-else-if="param.type === 'number'"
          :model-value="numberModel(param.id)"
          size="small"
          @update:model-value="(v) => emitChange(param.id, v)"
        />
        <u-input
          v-else
          :model-value="String(values[param.id] ?? '')"
          size="small"
          @update:model-value="(v) => emitChange(param.id, v)"
        />
      </div>
    </div>
  </section>
</template>

<script lang="ts" setup>
import { UDatePicker, UDateRangePicker, UInput, UNumberInput, USelect } from '@veltra/desktop'
import { bem } from '@veltra/utils'

import {
  parseDateRangeValue,
  patchParamValues,
  resolveNumberParamValue
} from '../../report/filter-bar'
import type { ParamValues, QueryParamDef } from '../../report/types'

defineOptions({ name: 'UReportFilterBar' })

const props = defineProps<{ queryParams: QueryParamDef[]; values: ParamValues }>()

const emit = defineEmits<{ 'update:values': [values: ParamValues] }>()

const cls = bem('report-filter-bar')

function dateRangeModel(paramId: string): [string, string] {
  return parseDateRangeValue(props.values[paramId])
}

function numberModel(paramId: string): number | undefined {
  return resolveNumberParamValue(props.values[paramId])
}

function emitChange(id: string, value: unknown): void {
  emit('update:values', patchParamValues(props.values, id, value))
}

function emitDateRangeChange(id: string, value?: [string, string]): void {
  emit('update:values', patchParamValues(props.values, id, value ?? ['', '']))
}
</script>
