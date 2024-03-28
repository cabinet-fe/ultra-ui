<template>
  <div :class="cls.b">
    <!-- <select
      v-model="selected"
      :multiple="props.multiple"
      :clearable="props.clearable"
      :class="cls.e('input')"
      @change="toggleOptions"
    >
      <option v-for="option in props.options" :key="option.value" :value="option.value">
        {{ option.label }}
      </option>
    </select> -->

    <!-- 多选 -->
    <template v-if="props.multiple">
      <div :class="cls.e('input-multiple')" @click="toggleOptions">
        <div v-for="(item, index) in multipleOptions">
          <span>{{ item }}</span>
          <UIcon>
            <CircleClose @click.stop="removeMultipleOption(index)" />
          </UIcon>
        </div>
      </div>
    </template>

    <!-- 显示当前选中项 -->
    <template v-else>
      <span :class="cls.e('input')" @click="toggleOptions">
        {{ labelKey ? selectedOption[`${labelKey}`] : selectedOption.label }}

        <UIcon :class="cls.e('clear')" v-if="props.clearable">
          <CircleClose @click.stop="clearOption" />
        </UIcon>
      </span>
    </template>
    <!-- 展开/收起选项列表 -->
    <ul :class="[cls.e('ul'), { show: showOptions }]">
      <template v-if="props.multiple">
        <li
          v-for="(item, index) in props.options"
          :key="index"
          @click.stop="selectMultipleOption(item, index)"
          :class="[{ actived: multipleIndex.includes(index) }]"
        >
          <span> {{ labelKey ? item[labelKey] : item }}</span>
          <UIcon v-show="multipleIndex.includes(index)">
            <Check />
          </UIcon>
        </li>
      </template>

      <template v-else>
        <li
          v-for="(item, index) in props.options"
          :key="index"
          @click.stop="selectOption(item, index)"
          :class="{ actived: selectedIndex === index }"
        >
          {{ labelKey ? item[labelKey] : item }}
        </li>
      </template>
    </ul>
  </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue'
import type { SelectEmits, SelectProps } from '@ui/types/components/select'
import { bem } from '@ui/utils'
import { CircleClose, Check } from 'icon-ultra'
import { UIcon } from '../icon'

defineOptions({
  name: 'Select'
})

const cls = bem('select')

const props = withDefaults(defineProps<SelectProps>(), {})

const emit = defineEmits<SelectEmits>()

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
  console.log(selectedOption.value, '00')
}

/** 多选索引 */
const multipleIndex = ref<number[]>([])
/** 多选列表 */
const multipleOptions = ref<Record<string, any>>([])
/** 多选是否被选中 */
const multipleSelected = ref<boolean>(false)

const selectMultipleOption = (item: any, index: number) => {
  console.log(item, 'item')
  if (multipleIndex.value.includes(index)) return
  multipleIndex.value.push(index)
  multipleOptions.value.push(item.label)
  console.log(multipleIndex.value, 'multipleIndex.value')
}

const removeMultipleOption = (index: number) => {
  multipleIndex.value.splice(index, 1)
  multipleOptions.value.splice(index, 1)
}
</script>
