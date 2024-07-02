<template>
  <u-scroll
    tag="ul"
    :class="[cls.e('options'),cls.m(size)]"
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
        ]"
        :key="option[labelKey!]"
        :data-depth="option.depth"
        @click.stop="handleClick(option, dataIndex)"
      >
        <slot :option="option" :index="index">
          {{ option[labelKey!] }}
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
import { ArrowRight } from "icon-ultra"
import { UScroll } from "../scroll"
import { UIcon } from "../icon"
import type {
  CascadeEmits,
  CascadeItemProps,
} from "@ui/types/components/cascade"
import type { CascadeNode } from "./cascade-node"

defineOptions({
  name: "CascadeItem",
})

const props = withDefaults(defineProps<CascadeItemProps>(), {})

const emit = defineEmits<CascadeEmits<Option>>()

const injected = inject(CascadeDIKey)

const { cls, cascadeProps, size, close, handleSelect, cascade } = injected!

const { labelKey, valueKey, childrenKey, multiple } = cascadeProps

const depthIndex = ref([0])

const parentNodes = ref<string[]>([])

let isEchoing = true // 添加一个标志变量

const shouldShowLevel = (leave, data) => {
  if (data.parentNodes === "") {
    return true
  }
  return (
    depthIndex.value.includes(leave) &&
    parentNodes.value.includes(data.parentNodes)
  )
}
function addUniqueItem(array, item) {
  if (!array.includes(item) && item) {
    array.push(item)
  }
}

/** 单选 */
const handleClick = (
  option: CascadeNode<Record<string, any>>,
  dataIndex: number
) => {
  isEchoing = false

  if (option.children === undefined) {
    close()
  } else {
    if (option.depth === 1) {
      parentNodes.value = []
      depthIndex.value = []
    } else {
      parentNodes.value.splice(option.depth - 1, 1)
      depthIndex.value.splice(option.depth, 1)
    }
    depthIndex.value = [...depthIndex.value, dataIndex + 1]
    parentNodes.value = [...parentNodes.value, option[valueKey!]]
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
      if (arr.includes(item[valueKey!])) {
        echoData.push(item)
      }
    })
  })

  echoData.forEach((item, index) => {
    item.selected = true
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
