<template>
  <u-scroll
    tag="div"
    :class="[cls.e('options'), cls.m(size)]"
    ref="scrollRef"
    v-for="(data, dataIndex) in cascadeData"
    :key="dataIndex"
  >
    <ul v-for="(option, index) in data">
      <li
        v-if="shouldShowLevel(dataIndex, option)"
        :class="[
          cls.e('option'),
          bem.is('selected', option.selected),
          bem.is('checked', option.checked),
        ]"
        :key="option.data[labelKey!]"
        :data-depth="option.depth"
        @click="handleClick(option, dataIndex)"
        v-ripple="disabled ? false : cls.e('ripple')"
      >
        <slot :option="option" :index="index">
          <div>
            <u-checkbox
              v-if="multiple"
              :model-value="option.checked"
              :indeterminate="option.indeterminate"
              @update:model-value="handleCheck(option, $event)"
            ></u-checkbox>
            {{ option.data[labelKey!] }}
          </div>
          <u-icon v-if="option[childrenKey!]"><ArrowRight /></u-icon>
        </slot>
      </li>
    </ul>
  </u-scroll>
</template>

<script lang="ts" setup generic="Option extends Record<string, any>">
import { ref, watch, inject } from "vue"
import { bem } from "@ui/utils"
import { CascadeDIKey } from "./di"
import { vRipple } from "@ui/directives"
import { ArrowRight } from "icon-ultra"
import { UScroll } from "../scroll"
import { UIcon } from "../icon"
import { UCheckbox } from "../checkbox"
import type { CascadeItemProps } from "@ui/types/components/cascade"
import type { CascadeNode } from "./cascade-node"

defineOptions({
  name: "CascadeItem",
})

const props = withDefaults(defineProps<CascadeItemProps>(), {})

const injected = inject(CascadeDIKey)

const {
  cls,
  cascadeProps,
  size,
  close,
  handleSelect,
  handleCheck,
  cascade,
  disabled,
} = injected!

const { labelKey, childrenKey, multiple } = cascadeProps

const depthIndex = ref([0])

const parentNodes = ref<string[]>([])

let isEchoing = true // 添加一个标志变量

const shouldShowLevel = (level: number, data: Option) => {
  return (
    data.parentNodes === "" ||
    (depthIndex.value.includes(level) &&
      parentNodes.value.includes(data.parentNodes))
  )
}
const addUniqueItem = (array: any[], item: any) => {
  if (!array.includes(item) && item) array.push(item)
}

const handleClick = (
  option: CascadeNode<Record<string, any>>,
  dataIndex: number
) => {
  isEchoing = false

  if (option.children === undefined) {
    !multiple && close()
  } else {
    if (option.depth === 1) {
      parentNodes.value = []
      depthIndex.value = []
    } else {
      parentNodes.value.splice(option.depth - 1, 1)
      depthIndex.value.splice(option.depth, 1)
    }
    depthIndex.value = [...depthIndex.value, dataIndex + 1]
    parentNodes.value = [...parentNodes.value, option.data[labelKey!]]
    initData()
  }

  !multiple && handleSelect(option)
}
/**数据初始化 */
const initData = () => {
  props.cascadeData?.some((node) => {
    node.forEach((item) => {
      if (!depthIndex.value.includes(item.depth)) {
        item.selected = false
      }
    })
  })
}
/**回显 */
const echo = (arr) => {
  let echoData: any = []
  depthIndex.value = []
  parentNodes.value = []
  props.cascadeData?.some((node) => {
    node.forEach((item) => {
      if (arr.includes(item.data[labelKey!])) {
        echoData.push(item)
      }
    })
  })
  console.log(echoData, "echoData")

  echoData.forEach((item, index) => {
    multiple ? (item.checked = true) : (item.selected = true)
    addUniqueItem(parentNodes.value, item.parentNodes)
    addUniqueItem(depthIndex.value, index + 1)
    shouldShowLevel(index, item)
  })
}

watch(
  () => cascade.value,
  (val) => {
    let arr = []
    if (val && isEchoing) {
      arr = val.split(" / ")
      echo(arr)
    }
  },
  { immediate: true }
)
</script>
