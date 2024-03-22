<template>
  <div :class="[cls.b, cls.e(position!)]">
    <div :class="[cls.e('header'), cls.em('header', position!)]" ref="headerRef">
      <div
        v-for="(item, index) in standardItems"
        :key="item.key"
        :class="[
          cls.em('header', 'label'),
          bem.is('active', modelValue === item.key),
          bem.is('disabled', item.disabled === true)
        ]"
        @click="changeTab(item, index)"
        ref="labRef"
        :draggable="sortable"
      >
        <slot :name="`${item?.name}-label`">
          {{ item.name }}
        </slot>
        <div
          v-if="showClose(item.key!)"
          :class="bem.is('close')"
          @click.stop="handleClose(item, index)"
        >
          <Close />
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
import type { Item, TabsItems, TabsProps, TabsEmits } from '@ui/types/components/tabs'
import { bem } from '@ui/utils'
import { isObj, deepCopy } from 'cat-kit'
import { computed, shallowRef, ref, watch, reactive, useSlots, toRaw } from 'vue'
import { Close } from 'icon-ultra'
import { useSort } from '@ui/compositions'

defineOptions({
  name: 'Tabs'
})

const props: TabsProps<TabsItems> = withDefaults(defineProps<TabsProps<TabsItems>>(), {
  position: 'right',
  closable: false,
  sortable: false
})
/** 切换position回归初始状态 */
watch(
  () => props.position,
  () => {
    active.index = 0
    emit('update:modelValue', standardItems.value[0]?.key!)
  }
)

const slots = useSlots()

const cls = bem('tabs')

const emit = defineEmits<TabsEmits<TabsItems>>()
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

const standardItems = ref<Array<Item>>([])

const propItems = ref<TabsItems[]>(deepCopy(props.items))

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

const headerRef = shallowRef<HTMLDivElement>()

const active = reactive({
  lab: props.modelValue as string | number,
  index: 0
})
/** 切换标签页 */
const changeTab = (item: Item, index: number) => {
  if (item.disabled) return
  emit('update:modelValue', item.key!)
  active.lab = item.key!
  active.index = index
  emit('click', { ...item }, index)
}

const labRef = shallowRef<HTMLDivElement[]>()

/** 关闭标签 */
const handleClose = (item: Item, index: number) => {
  standardItems.value = standardItems.value.filter((row: any) => row.key !== item.key)
  if (item.key === props.modelValue) {
    const item = standardItems.value[0]!
    emit('update:modelValue', item.key!)
    active.lab = item.key!
    active.index = index
  }
  emit('delete', { ...item }, index)
}

const showClose = (key: string | number) => {
  if (props.closable && standardItems.value.length > 1) {
    return active.lab === key
  } else {
    return false
  }
}

useSort({
  target: headerRef,
  onChange: ({ newIndex, oldIndex }) => {
    exchange(newIndex, oldIndex)
  }
})

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
  emit('update:items', toRaw(propItems.value))
}
</script>
