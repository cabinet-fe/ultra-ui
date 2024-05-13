<template>
  <div :class="[cls.b, cls.e(position!), cls.m(size)]">
    <div :class="[cls.e('header'), cls.em('header', position!)]" ref="headerRef">
      <div
        v-for="(item, index) in standardItems"
        :key="item.key"
        :class="[
          cls.em('header', 'label'),
          bem.is('active', modelValue === item.key),
          bem.is('disabled', item.disabled === true)
        ]"
        @click="item.disabled || active.index === index ? void 0 : clickTab(item, index)"
        ref="labRef"
        :draggable="sortable"
        v-ripple="item.disabled || active.index === index ? false : 'ripple-color'"
      >
        <slot :name="`${item?.name}-label`">
          {{ item.name }}
        </slot>
        <div
          v-if="showClose(item.key!)"
          :class="bem.is('close')"
          @click.stop="handleClose(item, index)"
        >
          <UIcon><Close /></UIcon>
        </div>
        <div v-else :class="bem.is('close--placeholder')"></div>
      </div>
    </div>
    <div :class="cls.e('content')" v-if="showContent">
      <div v-for="item in standardItems" :key="item.key">
        <div :class="cls.e('content')" v-if="modelValue === item.key">
          <slot :name="item?.name">
            <span>暂无内容~</span>
          </slot>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import type { TabItem, TabsItems, TabsProps, TabsEmits } from '@ui/types/components/tabs'
import { bem } from '@ui/utils'
import { isObj, deepCopy } from 'cat-kit/fe'
import { computed, shallowRef, ref, watch, reactive, useSlots, toRaw } from 'vue'
import { Close } from 'icon-ultra'
import { useSort } from '@ui/compositions'
import { useFallbackProps } from '@ui/compositions'
import { UIcon } from '../icon'
import { isPromise } from 'cat-kit/fe'
import { vRipple } from '@ui/directives'

defineOptions({
  name: 'Tabs'
})

const props = defineProps<TabsProps>()

const { size, position, closable, sortable } = useFallbackProps([props], {
  size: 'default',
  position: 'right',
  closable: false,
  sortable: false
})

const slots = useSlots()

const cls = bem('tabs')

const emit = defineEmits<TabsEmits>()
/** 是否显示除标签以外的内容 */
const showContent = computed(() => {
  if (slots) {
    const keys = Object.keys(slots)
    const tabs = standardItems.value.filter((item: any) => {
      return keys.includes(item.name)
    })
    return !!tabs.length
  } else {
    return false
  }
})
/** 标准化传入items */
const standardItems = ref<Array<TabItem>>([])
/** 用于回传用户的原始格式数据 */
const propItems = ref<TabsItems[]>(deepCopy(props.items))
/** 监听传入的items，进行标准化处理 */
watch(
  () => props.items,
  (items) => {
    if (items.length) {
      if (isObj(items[0])) {
        standardItems.value = items.map((item: any) => {
          item.key = item.key || item.name
          return item
        })
      } else {
        standardItems.value = items.map((item: any) => {
          return { name: item, key: item }
        })
      }
    } else {
      standardItems.value = []
    }
  },
  { immediate: true, deep: true }
)
/** 标签栏ref */
const headerRef = shallowRef<HTMLDivElement>()
/** 当前活动标签 */
const active = reactive({
  lab: props.modelValue as string | number,
  index: 0
})
/** 切换标签页 */
const changeTab = (item: TabItem, index: number) => {
  emit('update:modelValue', item.key!)
  active.lab = item.key!
  active.index = index
  emit('click', { ...item }, index)
}
/** 点击标签页 */
const clickTab = (item: TabItem, index: number) => {
  const canEnter = props.beforeLeave ? props.beforeLeave(active.lab, item.key!) : () => true
  if (isPromise(canEnter)) {
    canEnter.then(() => {
      changeTab(item, index)
    })
  } else if (canEnter !== false) {
    changeTab(item, index)
  }
}
/** 标签ref */
const labRef = shallowRef<HTMLDivElement[]>()

/** 关闭标签 */
const handleClose = (item: TabItem, index: number) => {
  standardItems.value = standardItems.value.filter((row: any) => row.key !== item.key)
  if (item.key === props.modelValue) {
    const item = standardItems.value[0]!
    emit('update:modelValue', item.key!)
    active.lab = item.key!
    active.index = index
  }
  emit('delete', { ...item }, index)
}
/** 展示关闭按钮 */
const showClose = (key: string | number) => {
  if (closable.value && standardItems.value.length > 1) {
    return (
      active.lab === key &&
      standardItems.value.find((item) => {
        if (item.key === key) {
          return !item.disabled
        }
      })
    )
  } else {
    return false
  }
}
/** 使用拖拽排序 */
useSort({
  target: headerRef,
  onChange: ({ newIndex, oldIndex }) => {
    exchange(newIndex, oldIndex)
  }
})
/** 根据排序结果重排数据 */
const exchange = (newIndex: number, oldIndex: number) => {
  standardItems.value.splice(
    newIndex > oldIndex ? newIndex + 1 : newIndex,
    0,
    standardItems.value[oldIndex]!
  )
  standardItems.value.splice(newIndex > oldIndex ? oldIndex : oldIndex + 1, 1)

  propItems.value.splice(
    newIndex > oldIndex ? newIndex + 1 : newIndex,
    0,
    propItems.value[oldIndex]!
  )
  propItems.value.splice(newIndex > oldIndex ? oldIndex : oldIndex + 1, 1)
  // @ts-ignore
  // FIXME: type error
  emit('update:items', toRaw(propItems.value))
}
</script>

<style lang="scss" scoped>
:deep(.ripple-color) {
  background-color: rgba(256, 256, 256, 0.4);
}
</style>
