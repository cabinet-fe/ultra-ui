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
      <span :class="cls.e('placeholder')" v-if="!model?.length">
        {{ placeholder }}
      </span>
      <!-- 选择的数据项 -->
      <div v-else :class="cls.e('tags')">
        <u-tag
          v-for="(item, index) in tags"
          :closable="!disabled"
          @close="handleRemove(index)"
          >{{ item[labelKey] }}</u-tag
        >
      </div>
      <!-- 清空 icon -->
      <transition name="zoom-in">
        <u-icon
          v-if="clearable && model?.length && mouse && !disabled"
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
      <div :class="[cls.e('content-header'), cls.m(size)]">
        <u-checkbox
          :model-value="allChecked"
          :indeterminate="indeterminate"
          @update:model-value="handleCheckAll"
        >
          {{ allChecked ? "全不选" : "全选" }}
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
      <!-- 菜单列表 -->
      <u-scroll tag="div" height="300px">
        <u-tree
          checkable
          :expand-all="expandAll"
          :data="optionsData"
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
import type { TreeSelectProps } from "@ui/types/components/tree-select"
import { useFormComponent, useFormFallbackProps } from "@ui/compositions"
import { bem } from "@ui/utils"
import { UDropdown } from "../dropdown"
import type { TreeExposed, UTree } from "../tree"
import { UScroll } from "../scroll"
import { UTag } from "../tag"
import { UIcon } from "../icon"
import { ArrowDown, Close, Search } from "icon-ultra"
import { computed, nextTick, shallowRef, watch } from "vue"
import { UCheckbox } from "../checkbox"
import { TreeNode } from "../tree/tree-node"
import { Forest } from "cat-kit/fe"

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

const model = defineModel<Val[]>()

const tags = shallowRef<Record<string, any>[]>([])

const { formProps } = useFormComponent()

const { size, disabled } = useFormFallbackProps([formProps ?? {}, props])

const treeRef = shallowRef<TreeExposed<Record<string, any>>>()

/**选中 */
const handleCheck = (checked: Val[], checkedData: Record<string, any>[]) => {
  model.value = checked
  tags.value = checkedData
  emit("update", checked)
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

/**显示Tags */
const tagsData = () => {
  tags.value = []
  if (!model.value?.length) return
  forest.value.dft((node) => {
    const isMatch = model.value!.includes(node.value[props.valueKey])
    if (isMatch) {
      tags.value.push(node.value)
    }
  })
}
tagsData()

watch(model, () => {
  tagsData()
})

/**过滤数据项 */
const treeFiltet = (node: TreeNode<Record<string, any>>) => {
  return node.value[props.labelKey].includes(queryString.value)
}

/**树形数据 */
const optionsData = computed(() => {
  const { options } = props
  const filteredNodes: Record<string, any>[] = []
  if (queryString.value !== "") {
    forest.value.dft((node) => {
      if (treeFiltet(node)) {
        filteredNodes.push(node.value)
      }
    })
  } else {
    return options
  }
  return filteredNodes
})


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
  forest.value.nodes.forEach((node) => {
    treeRef.value?.checkNode(node, checked)
  })
}
</script>
