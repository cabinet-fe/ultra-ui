<template>
  <div :class="cls.b">
    <!-- 显示当前选中项 -->
    <span :class="cls.e('input')" @click.stop="toggleOptions">
      {{ labelKey ? selectedOption[`${labelKey}`] : selectedOption.label }}

      <span :class="cls.e('clear')" @click.stop="clearOption">x</span>
    </span>

    <!-- 展开/收起选项列表 -->
    <ul :class="{ show: showOptions }">
      <!-- 遍历所有选项并生成对应的li元素 -->
      <li
        v-for="(item, index) in props.options"
        :key="index"
        @click.stop="selectOption(item, index)"
        :class="{ actived: selectedIndex === index }"
      >
        {{ labelKey ? item[labelKey] : item }}
      </li>
    </ul>
  </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue'
import type { SelectEmits, SelectProps } from '@ui/types/components/select'
import { bem } from '@ui/utils'

defineOptions({
  name: 'Select'
})

const cls = bem('select')

const props = defineProps<SelectProps>()

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
}
</script>
