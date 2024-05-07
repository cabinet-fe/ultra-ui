<template>
  <u-dropdown
    :class="[cls.b, cls.m(size), bem.is('disabled', disabled)]"
    trigger="click"
    width="50%"
    :disabled="disabled"
    @mouseenter="mouse = true"
    @mouseleave="mouse = false"
  >
    <template #trigger>
      <span :class="cls.e('placeholder')" v-if="!model?.length">
        {{ placeholder }}
      </span>
      <div v-else :class="cls.e('tags')">
        <u-tag
          v-for="(item, index) in model"
          :closable="!disabled"
          @close="handleRemove(index)"
          >{{ item[labelKey] }}</u-tag
        >
      </div>
      <transition name="zoom-in">
        <u-icon
          v-if="clearable && model?.length && mouse && !disabled"
          :class="cls.e('clear')"
          @click.stop="handleClear"
        >
          <Close />
        </u-icon>
      </transition>
      <u-icon :class="cls.e(`arrow`)">
        <ArrowDown />
      </u-icon>
    </template>
    <template #content>
      <!-- <div :class="[cls.e('content-header'), cls.m(size)]">
        <u-checkbox
          :model-value="allChecked"
          :indeterminate="indeterminate"
          @update:model-value="handleCheckAll"
        >
          全选
        </u-checkbox>
      </div> -->
      <u-scroll height="300px">
        <u-tree
          checkable
          expandAll
          :data="options"
          :label-key="labelKey"
          :value-key="valueKey"
          :size="size"
          :disabled-node="disabledNode"
          @check="handleCheck"
          ref="treeRef"
        />
      </u-scroll>
    </template>
  </u-dropdown>
</template>

<script lang="ts" setup generic="Option extends Record<string, any>">
import type {TreeSelectProps} from "@ui/types/components/tree-select"
import {useFormComponent, useFormFallbackProps} from "@ui/compositions"
import {bem} from "@ui/utils"
import {UDropdown} from "../dropdown"
import {UTree} from "../tree"
import {UScroll} from "../scroll"
import {UTag} from "../tag"
import {UIcon} from "../icon"
import {ArrowDown, Close} from "icon-ultra"
import {shallowRef} from "vue"
// import {UCheckbox} from "../checkbox"
// import {computed, shallowRef} from "vue"

defineOptions({
  name: "TreeSelect",
})

const cls = bem("tree-select")

const props = withDefaults(defineProps<TreeSelectProps<Option>>(), {
  labelKey: "label",
  valueKey: "value",
  placeholder: "请选择",
  expandAll: true,
  clearable: true,
})

const mouse = shallowRef(false)

/** 实际值 */
const model = defineModel<Option[]>()

const {formProps} = useFormComponent()

const {size, disabled} = useFormFallbackProps([formProps ?? {}, props], {
  size: "default",
  disabled: false,
})

const handleCheck = (checked) => {
  model.value = checked
}

/**删除 */
const handleRemove = (index: number) => {
  model.value = model.value?.filter((_, i) => i !== index)
}

const handleClear = () => {
  model.value = []
}

// /**是否全选 */
// const allChecked = computed(() => {
//   return model.value?.length === props.options.length
// })

// /**部分 */
// const indeterminate = computed(() => {
//   return model.value?.length! > 0 && !allChecked.value
// })

// /** 全选*/
// const handleCheckAll = (checked: boolean) => {
//   if (checked) {
//     model.value = props.options
//   } else {
//     model.value = []
//   }
// }
</script>