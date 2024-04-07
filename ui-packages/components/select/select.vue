<template>
  <div :class="classList">
    {{ props.multiple }}
    {{ props.options }}
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
                <!-- {{ item[labelKey] }} -->
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
      <!-- <span :class="cls.e('input')" @click="toggleOptions">
        {{ labelKey ? selectedOption[`${labelKey}`] : selectedOption.label }}

        <UIcon :class="cls.e('clear')" v-if="props.clearable">
          <CircleClose @click.stop="clearOption" />
        </UIcon>
      </span> -->
    </template>
  </div>
</template>

<script lang="ts" setup>
import { computed, ref, shallowRef, watch, watchEffect } from 'vue'
import type { SelectEmits, SelectProps } from '@ui/types/components/select'
import { bem } from '@ui/utils'
import { CircleClose } from 'icon-ultra'
import { UIcon } from '../icon'
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
const selectedOption = ref<Record<any, string>>({})

let selectedIndex = ref(0)

/** 是否显示选项列表 */
const showOptions = ref(false)

/** 展开/收起选项列表 */
const toggleOptions = () => {
  showOptions.value = !showOptions.value
}

/** 选中选项 */
const selectOption = (option: any, index: number) => {
  selectedOption.value = option
  showOptions.value = false
  selectedIndex.value = index
  emit('update:modelValue', option)
}

/** 清除选项 */
const clearOption = () => {
  selectedOption.value = {}
  selectedIndex.value = -1
  emit('clear')
}

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
  console.log('multipleIndex.value,', multipleIndex.value)
  multipleOptions.value = []
  console.log(options.value, 'options')

  options.value.forEach((optionsItem: any) => {
    multipleIndex.value.forEach((item: any) => {
      console.log(item, '11')
      // model.value?.push(item)
      if (optionsItem[props.valueKey] === item) {
        multipleOptions.value.push(optionsItem[props.labelKey])
      }
    })
  })

  checkAll.value = options.value.length == multipleOptions.value.length
})

const handleCheckAll = (checked: boolean) => {
  console.log(checked, 'checked')
  checkAll.value = checked
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
  console.log(item, 'item')
  console.log(multipleIndex.value, ' multipleIndex.value')

  console.log(multipleIndex.value.indexOf(item[props.valueKey]), '1')
  // 删除数组中的元素
  let delementElement = options.value.filter(itemList => {
    return item == itemList[props.labelKey]
  })
  console.log(delementElement, 'delementElement')

  delementElement &&
    multipleIndex.value.splice(multipleIndex.value.indexOf(delementElement[0]![props.valueKey]), 1)

  // multipleIndex.value.splice(index, 1)
  // multipleOptions.value.splice(index, 1)
}

/** 点击外部隐藏选项列表 */
// const handleToggleOptions = () => {
//   showOptions.value = false
// }
</script>
