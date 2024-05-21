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
      <!-- 默认展示 -->
      <span :class="cls.e('placeholder')" v-if="!tags?.length">
        {{ placeholder }}
      </span>
      <!-- 选择的数据项 -->
      <div v-else :class="multiple ? cls.e('tags-multiple') : cls.e('tags')">
        <u-tag
          v-for="(item, index) in tags"
          :closable="!disabled && multiple"
          @close="handleRemove(index)"
          >{{ item[labelKey] }}</u-tag
        >
      </div>
      <!-- 清空 icon -->
      <transition name="zoom-in">
        <u-icon
          v-if="clearable && tags?.length && mouse && !disabled"
          :class="cls.e('clear')"
          @click.stop="handleClear"
        >
          <Close />
        </u-icon>
      </transition>
      <!-- 下拉 icon -->
      <u-icon :class="cls.e(`arrow`)">
        <ArrowDown />
      </u-icon>
    </template>
    <template #content>
      <!-- 全选 -->
      <div :class="[cls.e('content-header'), cls.m(size)]" v-if="multiple">
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
        <u-input placeholder="输入关键字进行过滤" v-model="qs">
          <template #suffix>
            <u-icon><Search /></u-icon>
          </template>
        </u-input>
      </div>
      <!-- 菜单列表 -->
      <u-scroll tag="div" height="300px">
        <template v-if="multiple">
          <u-tree
            v-bind="treeProps"
            v-model:checked="model"
            @update:checked="handleCheck"
            ref="treeRef"
            checkable
          ></u-tree>
        </template>
        <template v-else>
          <u-tree
            v-bind="treeProps"
            v-model:selected="model"
            @update:selected="handleSelect"
            ref="treeRef"
            selectable
          ></u-tree>
        </template>
      </u-scroll>
    </template>
  </u-dropdown>
</template>

<script lang="ts" setup generic="Val extends string | number">
import type {
  TreeSelectProps,
  TreeSelectEmits,
} from "@ui/types/components/tree-select"
import { useFormComponent, useFormFallbackProps } from "@ui/compositions"
import { bem } from "@ui/utils"
import { UDropdown } from "../dropdown"
import { TreeNode, type TreeExposed, type UTree } from "../tree"
import { UScroll } from "../scroll"
import { UTag } from "../tag"
import { UIcon } from "../icon"
import { ArrowDown, Close, Search } from "icon-ultra"
import { computed, onMounted, shallowRef, watch } from "vue"
import { UCheckbox } from "../checkbox"
import { Forest, isArray, omit } from "cat-kit/fe"

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

const treeProps = computed(() => {
  return omit(props, [
    "tips",
    "field",
    "placeholder",
    "disabled",
    "label",
    "checked",
    "selected",
    "readonly",
    "checkable",
    "selectable",
    "multiple",
  ])
})

const emit = defineEmits<TreeSelectEmits<Val>>()

/**过滤 */
const qs = shallowRef("")
watch(qs, (qs) => {
  treeRef.value?.filter(qs)
})

const model = shallowRef(props.checked || props.selected)

const mouse = shallowRef(false)

const tags = shallowRef<Record<string, any>[]>()

const { formProps } = useFormComponent()

const { size, disabled } = useFormFallbackProps([formProps ?? {}, props])

const treeRef = shallowRef<TreeExposed<Record<string, any>>>()

/**选中 */
const handleCheck = (checked: Val[], checkedData: Record<string, any>[]) => {
  tags.value = checkedData
  emit("update:checked", checked)
}

const handleSelect = (selected?: Val, selectedData?: Record<string, any>) => {
  tags.value = selectedData ? [selectedData] : []
  emit("update:selected", selected!)
}

/**删除 */
const handleRemove = (index: number) => {
  tags.value = tags.value?.filter((_, i) => i !== index)
  model.value = model.value?.filter((_, i) => i !== index)
  emit("update:checked", model.value!)
}

/**清空 */
const handleClear = () => {
  tags.value = []
  model.value = []
  emit("update:checked", model.value)
  emit("update:selected", undefined!)
}

/**是否全选 */
const allChecked = computed(() => {
  return model.value?.length === treeRef.value?.forest.size
})

/**部分 */
const indeterminate = computed(() => {
  return model.value?.length! > 0 && !allChecked.value
})

/** 全选*/
const handleCheckAll = (checked: boolean) => {
  treeRef.value?.checkAll(checked)
}
/** 森林 */
const forest = computed(() => {
  TreeNode.labelKey = props.labelKey
  TreeNode.valueKey = props.valueKey
  return Forest.create(props.data!, TreeNode)
})

/**回显 */
const echoTags = () => {
  if (model.value) {
    tags.value = []
    forest.value.dft((node) => {
      if (isArray(model.value)) {
        model.value.includes(node.value[props.valueKey]) &&
          tags.value?.push(node.value)
      } else {
        model.value === node.value[props.valueKey] &&
          tags.value?.push(node.value)
      }
    })
  }
}

onMounted(() => {
  echoTags()
})
</script>
