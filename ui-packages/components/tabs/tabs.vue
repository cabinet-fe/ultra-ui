<template>
  <div :class="[cls.b, cls.e(position!)]">
    <div :class="[cls.e('header'), cls.em('header', position!)]" ref="headerRef">
      <div
        v-for="(item, index) in standardItems"
        :key="item.key"
        :class="[cls.em('header', 'label'), bem.is('active', modelValue === item.key)]"
        @click="changeTab(item, index)"
        ref="labRef"
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
        <div v-if="closable && !showClose(item.key!)" :class="bem.is('close--placeholder')"></div>
      </div>
    </div>
    <div :class="cls.e('content')" v-if="showContent">
      <div v-for="item in standardItems" :key="item.key">
        <div :class="cls.e('content')" v-if="modelValue === item.name">
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
import { isObj } from 'cat-kit'
import { computed, getCurrentInstance, shallowRef, ref, watch, reactive } from 'vue'
import { Close } from 'icon-ultra'

defineOptions({
  name: 'Tabs'
})

const props: TabsProps<TabsItems> = withDefaults(defineProps<TabsProps<TabsItems>>(), {
  position: 'right',
  closable: false
})
/** 切换position回归初始状态 */
watch(
  () => props.position,
  () => {
    active.index = 0
    emit('update:modelValue', standardItems.value[0]?.key!)
  }
)

const instance = getCurrentInstance()!

const cls = bem('tabs')

const emit = defineEmits<TabsEmits<TabsItems>>()
/** 是否显示除标签以外的内容 */
const showContent = computed(() => {
  if (instance?.slots) {
    const keys = Object.keys(instance?.slots)
    const slots = standardItems.value.filter((item: any) => {
      return keys.includes(item.key)
    })
    return !!slots.length
  } else {
    return false
  }
})
let closedList = ref<Array<string | number>>([])

const standardItems = computed<Array<Item>>(() => {
  let res: Item[] = []
  if (props.items.length) {
    if (isObj(props.items[0])) {
      res = props.items.map((item: any) => {
        item.key = item.key || item.name
        return item
      })
    } else {
      res = props.items.map((item: any) => {
        return { name: item, key: item }
      })
    }
  } else {
    res = []
  }
  return res.filter((item: any) => !closedList.value.includes(item.key))
})

const headerRef = shallowRef<HTMLDivElement>()

const active = reactive({
  lab: props.modelValue as string | number,
  index: 0
})
/** 切换标签页 */
const changeTab = (item: Item, index: number) => {
  emit('update:modelValue', item.key!)
  active.lab = item.key!
  active.index = index
  emit('click', item, index)
}

const labRef = shallowRef<HTMLDivElement[]>()

// const lineStyle = computed(() => {
//   if (!labRef.value) return
//   const target = labRef.value[active.index]!
//   if (['top', 'bottom'].includes(props.position!)) {
//     return {
//       transform: `translate(${target.offsetLeft}px)`,
//       width: `${target.offsetWidth}px`
//     }
//   } else if (['left', 'right'].includes(props.position!)) {
//     return {
//       transform: `translate(${props.position === 'left' ? target.offsetWidth + 1 : 0}px, ${
//         target.offsetTop
//       }px)`,
//       height: `${target.offsetHeight}px`
//     }
//   }
// })

/** 关闭标签 */
const handleClose = (item: Item, index: number) => {
  closedList.value.push(item.key!)
  if (item.key === props.modelValue) {
    const item = standardItems.value[0]!
    emit('update:modelValue', item.key!)
    active.lab = item.key!
    active.index = index
  }
  emit('delete', item, index)
}

const showClose = (key: string | number) => {
  if (props.closable && standardItems.value.length > 1) {
    return active.lab === key
  } else {
    return false
  }
}
</script>
