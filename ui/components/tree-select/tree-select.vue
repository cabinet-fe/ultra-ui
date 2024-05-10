<template>
  <u-dropdown
    :class="[cls.b, cls.m(size), bem.is('disabled', disabled)]"
    trigger="click"
    max-width="auto"
    :disabled="disabled"
    :readonly="readonly"
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
      <div :class="[cls.e('content-header'), cls.m(size)]">
        <u-checkbox
          :model-value="allChecked"
          :indeterminate="indeterminate"
          @update:model-value="handleCheckAll"
        >
          全选
        </u-checkbox>
      </div>
      <!-- 过滤器 -->
      <div v-if="filterable" :class="cls.m(size)">
        <u-input placeholder="输入关键字进行过滤" v-model="queryString">
          <template #suffix>
            <u-icon><Search /></u-icon>
          </template>
        </u-input>
      </div>

      <u-scroll tag="div" height="300px">
        <u-tree
          checkable
          expandAll
          :data="treeData"
          :label-key="labelKey"
          :value-key="valueKey"
          :size="size"
          :disabled-node="disabledNode"
          @update:checked="handleCheck"
          @expand="handleExpand"
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
import type {UTree} from "../tree"
import {UScroll} from "../scroll"
import {UTag} from "../tag"
import {UIcon} from "../icon"
import {ArrowDown, Close, Search} from "icon-ultra"
import {computed, nextTick, shallowRef, watch} from "vue"
import {processRecursiveArray} from "../tree/utils"
import {UCheckbox} from "../checkbox"
import {TreeNode} from "../tree/tree-node"
import {Forest} from "cat-kit/fe"

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
  disabled: undefined,
  readonly: undefined,
  size: "default",
  filterable: false,
})

const emit = defineEmits<{
  (e: "update", value: Record<string, any>): void
}>()
/**过滤 */
const queryString = shallowRef("")

const mouse = shallowRef(false)

/**数据项 */
const treeData = shallowRef<Record<string, any>[]>(props.options)

/** 实际值 */
const model = defineModel<Val[]>()

/**界面展示的值 */
const tags = shallowRef<Record<string, any>[]>([])

/**保存所有props.valueKey的值 */
const valueKeyList = shallowRef<Val[]>([])

const {formProps} = useFormComponent()

const {size, disabled} = useFormFallbackProps([formProps ?? {}, props])

/**选中 */
const handleCheck = (checked: Val[], checkedData: Record<string, any>[]) => {
  model.value = checked
  tags.value = checkedData
  emit("update", checked)
}

/**节点收缩/展开 */
const handleExpand = (val) => {
  console.log(val)
}

/**删除 */
const handleRemove = (index: number) => {
  model.value = model.value?.filter((_, i) => i !== index)
  tags.value = tags.value?.filter((_, i) => i !== index)
  nextTick(() => {
    emit("update", model.value!)
  })
}

/**清空 */
const handleClear = () => {
  model.value = []
  tags.value = []
}

/** 初始化数据/是否禁用 */
const forest = computed(() => {
  return Forest.create(props.options, TreeNode, {
    onNodeCreated(node) {
      node.disabled = props.disabledNode?.(node.value, node) ?? false
    },
  })
})

/**遍历数据 */
const traverseData = () => {
  valueKeyList.value = []
  tags.value = []
  processRecursiveArray(forest.value.nodes, "children", (item) => {
    if (!item.disabled) {
      valueKeyList.value.push(item.value[props.valueKey])
    }
    if (!model.value?.length) return
    const isMatch = model.value!.includes(item.value[props.valueKey])
    if (isMatch) {
      tags.value.push(item.value)
    }
  })
}

traverseData()

watch(model, () => {
  traverseData()
})

/**是否全选 */
const allChecked = computed(() => {
  return model.value?.length === valueKeyList.value.length
})

/**部分 */
const indeterminate = computed(() => {
  return model.value?.length! > 0 && !allChecked.value
})

/** 全选*/
const handleCheckAll = (checked: boolean) => {
  if (checked) {
    model.value = valueKeyList.value
  } else {
    model.value = []
  }
}
</script>
