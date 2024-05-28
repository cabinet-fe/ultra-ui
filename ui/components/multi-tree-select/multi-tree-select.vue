<template>
  <u-dropdown
    :class="[
      cls.b,
      cls.m(size),
      bem.is('disabled', disabled),
      bem.is('readonly', readonly),
    ]"
    trigger="click"
    max-width="auto"
    :disabled="disabled"
    :readonly="readonly"
    @mouseenter="mouse = true"
    @mouseleave="mouse = false"
    ref="dropdownRef"
  >
    <template #trigger>
      <!-- 默认展示 -->
      <span :class="cls.e('placeholder')" v-if="!tags?.length">
        {{ placeholder }}
      </span>
      <!-- 选择的数据项 -->
      <div v-else :class="cls.e('tags-multiple')">
        <u-tag
          v-for="(item, index) in tags"
          :closable="!disabled && !readonly"
          @close="handleRemove(index)"
          >{{ item[labelKey] }}</u-tag
        >
      </div>
      <!-- 清空 icon -->
      <transition name="zoom-in">
        <u-icon
          v-if="clearable && tags?.length && mouse && !disabled && !readonly"
          :class="cls.e('clear')"
          @click.stop="handleClear"
        >
          <Close />
        </u-icon>
      </transition>
      <!-- 下拉 icon -->
      <u-icon :class="cls.e(`arrow`)" v-if="!readonly">
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
          全选
        </u-checkbox>
      </div>
      <!-- 过滤器 -->
      <div v-if="filterable" :class="[cls.e('content-filter'), cls.m(size)]">
        <u-input placeholder="输入关键字进行过滤" v-model="qs">
          <template #suffix>
            <u-icon><Search /></u-icon>
          </template>
        </u-input>
      </div>
      <!-- 菜单列表 -->
      <u-scroll
        tag="div"
        height="300px"
        ref="scrollRef"
        :class="cls.e('content-option')"
      >
        <u-tree
          v-bind="treeProps"
          v-model:checked="model"
          @update:checked="handleCheck"
          ref="treeRef"
          checkable
        ></u-tree>
      </u-scroll>
    </template>
  </u-dropdown>
</template>

<script lang="ts" setup generic="Val extends string | number">
import type {
  MultiTreeSelectProps,
  MultiTreeSelectEmits,
} from "@ui/types/components/multi-tree-select"
import { useFormComponent, useFormFallbackProps } from "@ui/compositions"
import { bem } from "@ui/utils"
import { UDropdown } from "../dropdown"
import { type TreeExposed, type UTree } from "../tree"
import { UScroll, type ScrollExposed } from "../scroll"
import { UTag } from "../tag"
import { UIcon } from "../icon"
import { ArrowDown, Close, Search } from "icon-ultra"
import { computed, ref, shallowRef, watch } from "vue"
import { UCheckbox } from "../checkbox"
import { omit, Tree } from "cat-kit/fe"

defineOptions({
  name: "MultiTreeSelect",
})

const cls = bem("multi-tree-select")

const props = withDefaults(defineProps<MultiTreeSelectProps<Val>>(), {
  labelKey: "label",
  valueKey: "value",
  placeholder: "请选择",
  expandAll: true,
  clearable: true,
  disabled: undefined,
  readonly: undefined,
  size: "default",
  filterable: false,
  closeOnSelect: false,
})

const treeProps = computed(() => {
  return omit(props, [
    "tips",
    "field",
    "placeholder",
    "disabled",
    "label",
    "checked",
    "readonly",
    "checkable",
  ])
})

const emit = defineEmits<MultiTreeSelectEmits<Val>>()

/**过滤 */
const qs = shallowRef("")
watch(qs, (qs) => {
  treeRef.value?.filter(qs)
})

const model = defineModel<Val[]>()

const mouse = shallowRef(false)

const tags = ref<Record<string, any>[]>([])

const { formProps } = useFormComponent()

const { size, disabled, readonly } = useFormFallbackProps([
  formProps ?? {},
  props,
])

const treeRef = shallowRef<TreeExposed<Record<string, any>>>()

const dropdownRef = shallowRef<InstanceType<typeof UDropdown>>()

const scrollRef = shallowRef<ScrollExposed>()

/**选中 */
const handleCheck = (checked: Val[], checkedData: Record<string, any>[]) => {
  tags.value = checkedData
  emit("update:modelValue", checked)
  closeDrop()
}

/**关闭弹窗 */
const closeDrop = () => {
  if (!props.closeOnSelect) return
  dropdownRef.value?.close()
}

/**删除 */
const handleRemove = (index: number) => {
  tags.value = tags.value?.filter((_, i) => i !== index)
  model.value = model.value?.filter((_, i) => i !== index)
  emit("update:modelValue", model.value!)
}

/**清空 */
const handleClear = () => {
  tags.value = []
  model.value = []
  emit("update:modelValue", [])
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

watch(
  () => [props.data!, model.value!],
  ([data, modelValue]) => {
    if (data?.length && modelValue?.length) {
      tags.value = [] // 重置tags
      let matchCount = 0

      const matchNode = (node) => {
        if (modelValue.includes(node[props.valueKey])) {
          tags.value.push(node)
          matchCount++
        }
        if (matchCount === modelValue.length) {
          return false
        }
      }

      for (const item of data as Record<string, any>[]) {
        if (matchCount === modelValue.length) {
          break
        }
        Tree.dft(item, (node) => {
          if (matchNode(node) === false) {
            return false
          }
        })
      }
    }
  }
)

watch(scrollRef, (scroll) => {
  if (scroll && model.value !== undefined) {
    const treeNode =
      scroll.contentRef!.getElementsByClassName("is-checked")[
        model.value.length - 1
      ]!
    treeNode?.scrollIntoView({ block: "nearest", inline: "start" })
  }
})
</script>
