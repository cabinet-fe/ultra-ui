<template>
  <u-dropdown
    v-if="!readonly"
    :class="[cls.b, bem.is('disabled', disabled), cls.m(size)]"
    trigger="click"
    ref="dropdownRef"
    :disabled="disabled"
    width="auto"
  >
    <template #trigger>
      <u-input
        style="width: 240px"
        :size="size"
        :disabled="disabled"
        :placeholder="placeholder"
        :clearable="clearable"
        v-model="cascade"
        :native-readonly="filterable"
      >
        <template #suffix>
          <u-icon :class="cls.e('arrow')"><ArrowDown /></u-icon>
        </template>
      </u-input>
    </template>

    <template #content>
      <div :class="cls.e('content')" v-if="cascadeData.length">
        <CascadeItem v-bind="$attrs" :cascadeData="cascadeData" />
      </div>
    </template>
  </u-dropdown>
  <template v-else>
    <div :class="[cls.m(size)]">
      <div v-if="modelValue?.length" :class="cls.e('tags')">
        <u-tag v-for="option of modelValue" :key="option[labelKey]">
          {{ option }}
        </u-tag>
      </div>
    </div>
  </template>
</template>

<script lang="ts" setup generic="Option extends Record<string, any>">
import { useFormComponent, useFormFallbackProps } from "@ui/compositions"
import type { CascadeProps, CascadeEmits } from "@ui/types/components/cascade"
import { bem } from "@ui/utils"
import { computed, provide, shallowRef, watch } from "vue"
import { ArrowDown } from "icon-ultra"
import CascadeItem from "./cascade-item.vue"
import { CascadeDIKey } from "./di"
import { UInput } from "../input"
import { UDropdown, type DropdownExposed } from "../dropdown"
import { Forest, Tree } from "cat-kit/fe"
import { CascadeNode } from "./cascade-node"
import { useSelect } from "./use-select"
import { UTag } from "../tag"
import { UIcon } from "../icon"
defineOptions({
  name: "Cascade",
})

const cls = bem("cascade")

const emit = defineEmits<CascadeEmits>()

const props = withDefaults(defineProps<CascadeProps>(), {
  labelKey: "label",
  valueKey: "value",
  placeholder: "请选择",
  clearable: true,
  disabled: undefined,
  readonly: undefined,
  childrenKey: "children",
  filterable: false,
})

const { formProps } = useFormComponent()
const { size, disabled, readonly } = useFormFallbackProps(
  [formProps ?? {}, props],
  {
    size: "default",
    disabled: false,
    readonly: false,
  }
)

const cascadeData = shallowRef<Record<string, any>[]>([])

/** 森林 */
const forest = computed(() => {
  const { options, valueKey, labelKey } = props
  return Forest.create(options!, {
    createNode: (data, index) => {
      const node = new CascadeNode({
        data,
        index,
        valueKey: valueKey!,
        labelKey: labelKey!,
      })
      return node
    },
  })
})

/**
 * 节点的字典，key为指定的valueKey的值
 */
const nodeDict = computed(() => {
  const dict = new Map<string | number, CascadeNode<Record<string, any>>>()

  forest.value.dft((node) => {
    dict.set(node.key, node)
  })

  return dict
})

const dropdownRef = shallowRef<DropdownExposed>()

const close = () => {
  dropdownRef.value?.close()
}

const open = () => {
  dropdownRef.value?.open()
}

const { handleSelect } = useSelect<Record<string, any>>({
  props,
  emit,
  nodeDict,
  forest,
})

function separateByDepth(data) {
  const result = {}

  function traverse(node, parent?: Record<string, any>) {
    // 如果当前深度不存在于结果中，初始化一个空数组
    if (!result[node.depth]) {
      result[node.depth] = []
    }

    // 添加节点到对应深度的数组中
    result[node.depth].push(node)

    // 设置当前节点的父节点
    node.parentNodes = parent ? parent.data[props.labelKey] : ""

    // 遍历子节点
    if (node.children) {
      node.children.forEach((child) => traverse(child, node))
    }
  }

  // 遍历整个数据结构
  data.forEach((item) => traverse(item))

  return Object.keys(result)
    .sort((a: any, b: any) => a - b)
    .map((key) => result[key])
}

const cascade = shallowRef("")

watch(
  () => [forest.value.nodes, props.modelValue],
  ([option, model]) => {
    let arr: Record<string, any> = []
    if (option?.length && model?.length) {
      forest.value.nodes.some((node) => {
        Tree.bft(node, (item) => {
          if (model?.includes(item.data[props.valueKey!])) {
            arr.push(item.data)
          }
        })
      })
      cascade.value = arr.map((node) => node[props.labelKey!]).join(" / ")
      console.log(cascade.value);
      
    }
    cascadeData.value = separateByDepth(forest.value.nodes)
  },
  { immediate: true }
)

provide(CascadeDIKey, {
  cls,
  cascadeProps: props,
  size,
  disabled,
  readonly,
  close,
  open,
  forest,
  nodeDict,
  handleSelect,
  cascade,
})
</script>
