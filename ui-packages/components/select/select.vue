<template>
  <div :class="classList">
    <!-- 多选 -->

    <template v-if="props.multiple">
      <UDropdown :class="[cls.e('dropdown')]" v-if="props.multiple" trigger="click">
        <template #trigger>
          <div :class="[cls.e('input-multiple')]">
            <UTag
              v-for="(item, index) in multipleOptions"
              :key="index"
              type="primary"
              closable
              @click.stop="removeMultipleOption(item)"
            >
              {{ item }}
            </UTag>
          </div>
        </template>
        <template #content>
          <div :class="cls.e('content')">
            <div>
              <UCheckbox
                v-model="checkAll"
                indeterminate
                @update:model-value="handleCheckAll($event)"
              >
                全选
              </UCheckbox>
            </div>
            <div>
              <UCheckbox
                v-for="(item, index) in options"
                :key="item[valueKey]"
                :model-value="getCheckStatus(item)"
                @update:modelValue="selectMultipleOption($event, item, index)"
              >
                {{ labelKey ? item[labelKey] : item }}
              </UCheckbox>
            </div>
          </div>
        </template>
      </UDropdown>
    </template>

    <!-- 显示当前选中项 -->
    <template v-else>
      <UDropdown trigger="click">
        <template #trigger>
          <div :class="[cls.e('input')]">
            <span>{{ labelKey ? selectedOption[`${labelKey}`] : selectedOption.label }}</span>
          </div>
        </template>

        <template #content>
          <div :class="cls.e('content')">
            <ul>
              <li
                v-for="(item, index) in props.options"
                :key="index"
                @click.stop="selectOption(item, index)"
                :class="{ actived: selectedIndex === index }"
              >
                <span> {{ labelKey ? item[labelKey] : item }}</span>
              </li>
            </ul>
          </div>
        </template>
      </UDropdown>
    </template>
  </div>
</template>

<script lang="ts" setup>
import { computed, ref, shallowRef, watch, watchEffect } from 'vue'
import type { SelectEmits, SelectProps } from '@ui/types/components/select'
import { bem } from '@ui/utils'

import { UTag } from '../tag'
import { useFormComponent, useFormFallbackProps } from '@ui/compositions'
import { UCheckbox, type Val } from '..'
import { UDropdown } from '..'

defineOptions({
  name: 'Select'
})

const cls = bem('select')

const props = withDefaults(defineProps<SelectProps>(), {
  labelKey: 'label',
  valueKey: 'value'
})

const emit = defineEmits<SelectEmits>()

const { formProps } = useFormComponent()
const { size, disabled } = useFormFallbackProps([formProps ?? {}, props], {
  size: 'default',
  disabled: false
})

const classList = computed(() => {
  return [cls.b, cls.m(size.value)]
})

let labelKey = ref(props.labelKey)

let options = ref(props.options)

/** 当前选中的选项 */
const selectedOption = ref<Record<string, any>>({})

let selectedIndex = ref(-1)
const singleIndex = ref(props.modelValue)

/** 选中选项 */
const selectOption = (option: any, index: number) => {
  selectedOption.value = option
  selectedIndex.value = index

  emit('update:modelValue', option)
}
watch(
  singleIndex,
  (newValue, oldValue) => {
    if (newValue === oldValue) return
    singleIndex.value = newValue
    selectedOption.value = options.value.filter((e: any) => e[props.valueKey] == newValue)[0]!
    selectedIndex.value = options.value.findIndex((e: any) => e[props.valueKey] == newValue)
  },
  {
    immediate: true,
    deep: true
  }
)

/** 全选 */
const checkAll = shallowRef(false)
/** 多选索引 */
// const multipleIndex = ref<number[]>([])
const multipleIndex = ref<number[]>(props.modelValue)

/** 多选列表 */
const multipleOptions = ref<Record<string, any>>([])

// const model = defineModel<Val[]>()

const getCheckStatus = (item: Record<string, any>) => {
  const { valueKey } = props
  let value = item[valueKey] as Val

  if (!value || !multipleIndex.value) return false

  return multipleIndex.value.includes(value as any)
}

/** 多选选中 */
const selectMultipleOption = (
  checked: boolean,
  item: Record<string, string | number>,
  index: number
) => {
  const { valueKey } = props

  if (checked) {
    multipleIndex.value.push(item[valueKey] as any)
  } else {
    multipleIndex.value.splice(multipleIndex.value.indexOf(item[valueKey] as any), 1)
  }
  emit('update:modelValue', multipleOptions.value)
}

watchEffect(() => {
  if (props.multiple == false) return
  multipleOptions.value = []
  options.value.forEach((optionsItem: any) => {
    multipleIndex.value.forEach((item: any) => {
      // model.value?.push(item)
      if (optionsItem[props.valueKey] === item) {
        multipleOptions.value.push(optionsItem[props.labelKey])
      }
    })
  })
  checkAll.value = options.value.length == multipleOptions.value.length
})

/** 全选 */
const handleCheckAll = (checked: boolean) => {
  checkAll.value = checked
  let seletItem = multipleIndex.value.findIndex((item: any) => item)
  if (seletItem == -1) {
    multipleIndex.value = options.value.map((item: any) => item.value)
  } else {
    multipleIndex.value = []
  }
  if (checked) {
    options.value.forEach((item: any) => {
      multipleIndex.value.push(item[props.valueKey])
    })
    emit('update:modelValue', multipleIndex.value)
  } else {
    multipleIndex.value = []
    multipleOptions.value = []
  }
}

/** 删除多选选项 */
const removeMultipleOption = item => {
  // 删除数组中的元素
  let delementElement = options.value.filter(itemList => {
    return item == itemList[props.labelKey]
  })
  delementElement &&
    multipleIndex.value.splice(multipleIndex.value.indexOf(delementElement[0]![props.valueKey]), 1)
}
</script>
