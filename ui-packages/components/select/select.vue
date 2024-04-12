<template>
  <div :class="classList">
    <!-- 多选 -->
    <template v-if="props.multiple">
      <UDropdown
        :class="[cls.e('dropdown')]"
        v-if="props.multiple"
        trigger="click"
        :disabled="props.disabled"
        min-width="200px"
      >
        <template #trigger>
          <div :class="[cls.e('input-multiple')]">
            <!-- <div :class="cls.e('multiple-tags-input')">
              <u-input
                style="overflow: auto; width: 100%; height: 30px"
                placeholder=" "
                v-model="inputValue"
              />
            </div> -->

            <div>
              <div :class="cls.e('multiple-tags-input')" contenteditable="false" style="">
                <Transition :class="cls.e('clear-multiple')">
                  <UIcon :size="14" @click.prevent="handleClearMultiple"><CircleClose /></UIcon>
                </Transition>

                <!-- 折叠标签 -->
                <template v-if="props.collapseTags && multipleOptions.length > 0">
                  <!-- 最大折叠标签 -->
                  <template
                    222
                    v-if="props.collapseTags && props.maxCollapseTags && multipleOptions.length > 0"
                  >
                    <template v-for="(item, index) in multipleOptions">
                      <UTag
                        type="primary"
                        closable
                        @click.stop="removeMultipleOption(item)"
                        v-if="index < props.maxCollapseTags"
                      >
                        {{ item[labelKey] }}
                      </UTag>
                    </template>

                    <UTag type="primary">+{{ multipleOptions.length }}</UTag>
                  </template>

                  <template v-else>
                    <UTag type="primary">{{ multipleOptions[0][labelKey] }}</UTag>
                    <UTag type="primary">+{{ multipleOptions.length }}</UTag>
                  </template>
                </template>

                <template v-else>
                  <div :class="cls.e('multiple-tags')">
                    <UTag
                      v-for="(item, index) in multipleOptions"
                      :key="index"
                      closable
                      @click.stop="removeMultipleOption(item)"
                    >
                      {{ item[labelKey] }}
                    </UTag>
                  </div>
                </template>
              </div>
            </div>
          </div>
        </template>
        <template #content>
          <u-scroll style="max-height: 200px" :class="cls.e('content')">
            <div>
              <UCheckbox
                :model-value="allChecked"
                :indeterminate="indeterminate"
                @update:model-value="handleCheckAll"
              >
                全选
              </UCheckbox>
            </div>
            <ul>
              <li v-for="item in options" :key="item[valueKey]">
                <UCheckbox
                  :model-value="checkedData.has(item[valueKey])"
                  @update:modelValue="selectMultipleOption($event, item)"
                >
                </UCheckbox>
                <span>
                  {{ item[labelKey] }}
                </span>
              </li>
            </ul>
          </u-scroll>
        </template>
      </UDropdown>
    </template>

    <!-- 单选 -->
    <template v-else>
      <UDropdown trigger="click" :disabled="props.disabled" ref="dropdownRef" content-class="">
        <template #trigger>
          <UInput :model-value="selected?.[labelKey]" @clear="handleClear" :disabled="disabled" />
        </template>

        <template #content>
          <u-input v-if="filterable" v-model="queryString" style="margin: 6px">
            <template #suffix>
              <u-icon><Search /></u-icon>
            </template>
          </u-input>

          <u-scroll tag="ul" :class="cls.e('content')" style="max-height: 156px">
            <li
              v-for="(item, index) in filteredOptions"
              :key="index"
              @click.stop="selectOption(item, index)"
              :class="{ actived: item === selected }"
            >
              <span> {{ labelKey ? item[labelKey] : item }}</span>
            </li>
          </u-scroll>
        </template>
      </UDropdown>
    </template>
  </div>
</template>

<script lang="ts" setup>
import { computed, ref, reactive, watch, watchEffect, shallowRef, Transition } from 'vue'
import type { SelectEmits, SelectProps } from '@ui/types/components/select'
import { bem } from '@ui/utils'

import { UTag } from '../tag'
import { useFormComponent, useFormFallbackProps } from '@ui/compositions'
import { UCheckbox } from '../checkbox'
import { UDropdown, type DropdownExposed } from '../dropdown'
import { UScroll } from '../scroll'
import { UInput } from '../input'
import { UIcon } from '../icon'
import { CircleClose, Search } from 'icon-ultra'

defineOptions({
  name: 'Select'
})

const cls = bem('select')

const props = withDefaults(defineProps<SelectProps>(), {
  labelKey: 'label',
  valueKey: 'value',
  clearable: true,
  maxCollapseTags: 0
})

const model = defineModel<any[] | string | number>()

const emit = defineEmits<SelectEmits>()

const { formProps } = useFormComponent()
const { size, disabled } = useFormFallbackProps([formProps ?? {}, props], {
  size: 'default',
  disabled: false
})

const classList = computed(() => {
  return [cls.b, cls.m(size.value), bem.is('disabled', disabled.value)]
})

let labelKey = ref(props.labelKey)

/** 当前选中的选项 */
const selected = shallowRef<Record<string, any>>()

const dropdownRef = shallowRef<DropdownExposed>()
/** 选中选项 */
const selectOption = (option: any, index: number) => {
  model.value = selected[props.valueKey]
  selected.value = option

  emit('change', option)
  dropdownRef.value?.close()
}

/** 筛选 */
const queryString = shallowRef('')

const filteredOptions = computed(() => {
  if (queryString.value === '') return props.options

  return props.options.filter(item => item[props.labelKey].includes(queryString.value))
})

const inputValue = ref()

/** 多选列表 */
const multipleOptions = ref<Record<string, any>>([])

/** 选中数据 */
const checkedData = reactive(new Set<string | number>())

/** 全选 */
const allChecked = computed(() => {
  if (!Array.isArray(model.value)) return false
  return checkedData.size == props.options.length
})

/** 部分选中 */
const indeterminate = computed(() => {
  return !allChecked.value && checkedData.size > 0
})

watchEffect(() => {
  if (Array.isArray(model.value)) {
    model.value.forEach(v => {
      checkedData.add(v)
    })
  } else {
    selected.value = props.options.find(item => item[props.valueKey] == model.value)
  }
})

watch(checkedData, c => {
  model.value = Array.from(c)
})

/** 多选选中 */
const selectMultipleOption = (checked: boolean, item: Record<string, string | number>) => {
  const { valueKey } = props

  if (checked) {
    checkedData.add(item[valueKey]!)
  } else {
    checkedData.delete(item[valueKey]!)
  }
}

watchEffect(() => {
  if (props.multiple == false) return
  multipleOptions.value = props.options.filter(item => checkedData.has(item[props.valueKey]!))
})

/** 全选 */
const handleCheckAll = (checked: boolean) => {
  if (checked) {
    props.options.forEach(item => {
      checkedData.add(item[props.valueKey]!)
    })
  } else {
    checkedData.clear()
  }
}

/** 删除多选选项 */
const removeMultipleOption = item => {
  checkedData.delete(item[props.valueKey]!)
}

/** 单选删除 */
const handleClear = () => {
  selected.value = undefined
  model.value = undefined
}

const handleClearMultiple = () => {
  checkedData.clear()
}
</script>
