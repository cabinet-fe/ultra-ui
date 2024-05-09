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
          v-for="(item, index) in tags"
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
          @update:checked="handleCheck"
          ref="treeRef"
          :checked="model"
        />
      </u-scroll>
    </template>
  </u-dropdown>
</template>

<script lang="ts" setup generic="Val extends string | number">
import type {TreeSelectProps} from "@ui/types/components/tree-select"
import {useFormComponent, useFormFallbackProps} from "@ui/compositions"
import {bem} from "@ui/utils"
import {UDropdown} from "../dropdown"
import {UTree} from "../tree"
import {UScroll} from "../scroll"
import {UTag} from "../tag"
import {UIcon} from "../icon"
import {ArrowDown, Close} from "icon-ultra"
import {nextTick, shallowRef} from "vue"
import {processRecursiveArray} from "../tree/utils"

defineOptions({
  name: "TreeSelect",
})

const cls = bem("tree-select")

const props = withDefaults(defineProps<TreeSelectProps<Val>>(), {
  labelKey: "label",
  valueKey: "value",
  placeholder: "请选择",
  expandAll: true,
  clearable: true,
})

const emit = defineEmits<{
  (e: "update", value: Record<string, any>): void
}>()

const mouse = shallowRef(false)

/** 实际值 */
const model = defineModel<Val[]>()

/**界面展示的值 */
const tags = shallowRef<Record<string, any>[]>([])

/**保存所有props.valueKey的值 */
const valueList = shallowRef<Val[]>([])

const {formProps} = useFormComponent()

const {size, disabled} = useFormFallbackProps([formProps ?? {}, props], {
  size: "default",
  disabled: false,
})

const handleCheck = (checked: Val[], checkedData: Record<string, any>[]) => {
  model.value = checked
  tags.value = checkedData
  emit("update", checked)
}

/**删除 */
const handleRemove = (index: number) => {
  model.value = model.value?.filter((_, i) => i !== index)
  nextTick(() => {
    emit("update", model.value!)
  })
}

const handleClear = () => {
  model.value = []
}

const viewport = () => {
  processRecursiveArray(props.options, "children", (item) => {
    valueList.value.push(item.id)
    const isMatch = model.value!.includes(item.id)
    if (isMatch) {
      tags.value.push(item)
    }
  })
}
viewport()

// /**是否全选 */
// const allChecked = computed(() => {
//   return model.value?.length === valueList.value.length
// })

// /**部分 */
// const indeterminate = computed(() => {
//   return model.value?.length! > 0 && !allChecked.value
// })

// /** 全选*/
// const handleCheckAll = (checked: boolean) => {
//   if (checked) {
//     model.value = valueList.value
//   } else {
//     model.value = []
//   }
// }
</script>
