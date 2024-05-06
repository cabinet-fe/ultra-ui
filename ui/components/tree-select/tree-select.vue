<template>
  <u-dropdown :class="[cls.b, cls.m(size)]" trigger="click" width="50%">
    <template #trigger>
      {{ model?.length }}
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
      <u-icon :class="cls.e(`arrow`)">
        <ArrowDown />
      </u-icon>
    </template>
    <template #content>
      <div :class="[cls.e('content-header'), cls.m(size)]">
        <u-checkbox
          :model-value="allChecked"
          :indeterminate="indeterminate"
          @update:model-value="handleCheckAll"
        >
          全选
        </u-checkbox>
      </div>
      <u-scroll height="300px">
        <u-tree
          checkable
          expandAll
          :data="options"
          :label-key="labelKey"
          :value-key="valueKey"
          :size="size"
          :disabled="disabled"
          :disabled-node="disabledNode"
          @check="handleCheck"
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
import {UCheckbox} from "../checkbox"
import {UTag} from "../tag"
import {computed, shallowRef} from "vue"
import {UIcon} from "../icon"
import {ArrowDown} from "icon-ultra"

defineOptions({
  name: "TreeSelect",
})

const cls = bem("tree-select")

const props = withDefaults(defineProps<TreeSelectProps<Option>>(), {
  labelKey: "label",
  valueKey: "value",
  placeholder: "请选择",
  expandAll: true,
})

/** 实际值 */
const model = defineModel<Option[]>()

const valueTree = shallowRef<Record<string, any>[]>([])

valueTree.value = [{name: "烤冷面", id: 1}]

const {formProps} = useFormComponent()

const {size, disabled} = useFormFallbackProps([formProps ?? {}, props], {
  size: "default",
  disabled: false,
})

const handleCheck = (selectd) => {
  model.value = selectd
}

/**删除 */
const handleRemove = (index: number) => {
  model.value = model.value?.filter((_, i) => i !== index)
}

/**是否全选 */
const allChecked = computed(() => {
  return model.value?.length === props.options.length
})

/**部分 */
const indeterminate = computed(() => {
  return model.value?.length! > 0 && !allChecked.value
})

/** 全选*/
const handleCheckAll = (checked: boolean) => {
  console.log(props.options)
  console.log(checked)
  if (checked) {
    model.value = props.options
  } else {
    model.value = []
  }
}
</script>
