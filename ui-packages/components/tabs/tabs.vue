<template>
  <div :class="[cls.b, cls.e(position!)]">
    <div :class="[cls.e('header'), cls.em('header', position!)]" ref="headerRef">
      <div
        v-for="(item, index) in standardItems"
        :key="item.key"
        :class="[cls.em('header', 'label'), bem.is('active', modelValue === item.key)]"
        @click="changeTab(item.key!, index)"
        ref="labRef"
      >
        <slot :name="`${item?.name}-label`">
          {{ item.name }}
        </slot>
        <div
          v-if="closable && standardItems.length > 1"
          :class="bem.is('close')"
          @click.stop="handleClose(item)"
        >
          x
        </div>
      </div>
      <div :class="[cls.em('header', 'line'), bem.is(position)]" :style="lineStyle"></div>
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
import type { Item, TabsProps } from '@ui/types/components/tabs'
import { bem } from '@ui/utils'
import { isObj } from 'cat-kit'
import {
  computed,
  getCurrentInstance,
  shallowRef,
  ref,
  watch,
  reactive,
  type ShallowRef
} from 'vue'

defineOptions({
  name: 'Tabs'
})

const props: TabsProps = withDefaults(defineProps<TabsProps>(), {
  position: 'right',
  closable: false
})
/** 切换position回归初始状态 */
watch(
  () => props.position,
  () => {
    labIndex.value = 0
    emit('update:modelValue', standardItems.value[0]?.key!)
  }
)

const instance = getCurrentInstance()!

const cls = bem('tabs')

const emit = defineEmits<{
  'update:modelValue': [key: string | number]
}>()
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
/** 将传入的items进行标准化处理 */
let standardItems = ref<any[]>([])

watch(
  () => [props.items, closedList],
  ([items, closed]) => {
    let res: Item[] = []
    if (items && items.length) {
      if (isObj(items[0])) {
        res = items.map((item: any) => {
          item.key = item.key || item.name
          return item
        })
      } else {
        res = items.map((item: any) => {
          return { name: item, key: item }
        })
      }
    } else {
      res = []
    }
    standardItems.value = res.filter((item: any) => !closed.value.includes(item.key))
  },
  { immediate: true, deep: true }
)
// const standardItems = computed<Array<Item>>(() => {
//   let res: Item[] = []
//   if (props.items.length) {
//     if (isObj(props.items[0])) {
//       res = props.items.map((item: any) => {
//         item.key = item.key || item.name
//         return item
//       })
//     } else {
//       res = props.items.map((item: any) => {
//         return { name: item, key: item }
//       })
//     }
//   } else {
//     res = []
//   }
//   return res.filter((item: any) => !closedList.value.includes(item.key))
// })

const headerRef = shallowRef<HTMLDivElement>()
const active = reactive({
  index: 0,
  targetIndex: 0,
  width: 0,
  clientX: 0,
  domList: new Set()
})

const useSort = (target: ShallowRef<HTMLElement | undefined>, mode: 'horizontal' | 'vertical') => {
  watch(target, (dom) => {
    let children = Array.from(dom?.children!)
    children.forEach((child: any, index) => {
      if (child.getAttribute('draggable') === 'false') return
      child.setAttribute('draggable', 'true')
      child.setAttribute('style', 'transition: transform 0.3s ease-out')
      child.addEventListener('dragstart', (e) => {
        console.log(e.target, children.findIndex((item) => item === e.target))
        e.stopPropagation()
        active.index = children.findIndex((item) => item === e.target)
        active.width = e.target.offsetWidth
      })
      child.addEventListener('drag', (e) => {})
      child.addEventListener('dragenter', (e) => {
        const index = children.findIndex((item) => item === e.target)
        e.preventDefault()
        if (index === -1 || index === active.index) return
        console.log(e.clientX, active.clientX)
        e.target.style.transform = `translate(${
          e.clientX > active.clientX ? -active.width : active.width
        }px)`
        active.domList.add(e.target)
        active.targetIndex = index
        active.clientX = e.clientX
      })
      child.addEventListener('dragleave', (e) => {
        e.preventDefault()
      })
      child.addEventListener('dragover', (e) => {
        e.preventDefault()
      })
      child.addEventListener('drop', (e) => {
        console.log('drop')
      })
      child.addEventListener('dragend', (e) => {
        active.domList.forEach((dom: any) => {
          dom.style.transform = ''
        })
        if (active.index !== active.targetIndex) {
          const source = standardItems.value[active.index]
          standardItems.value.splice(active.index, 1)
          standardItems.value.splice(active.targetIndex, 0, source!)
        }

        active.index = 0
        active.targetIndex = 0
        active.width = 0
        active.clientX = 0
        active.domList.clear()
      })
    })
  })
}

useSort(headerRef, 'horizontal')

let labIndex = ref<number>(0)
/** 切换标签页 */
const changeTab = (key: string | number, index: number) => {
  emit('update:modelValue', key)
  labIndex.value = index
}

const labRef = shallowRef<HTMLDivElement[]>()
/** 标签下面那根蓝条 */
const lineStyle = computed(() => {
  if (!labRef.value) return
  const target = labRef.value[labIndex.value]!
  if (['top', 'bottom'].includes(props.position!)) {
    return {
      transform: `translate(${target.offsetLeft}px)`,
      width: `${target.offsetWidth}px`
    }
  } else if (['left', 'right'].includes(props.position!)) {
    return {
      transform: `translate(${props.position === 'left' ? target.offsetWidth + 1 : 0}px, ${
        target.offsetTop
      }px)`,
      height: `${target.offsetHeight}px`
    }
  }
})

/** 关闭标签 */
const handleClose = (item: Item) => {
  closedList.value.push(item.key!)
  if (item.key === props.modelValue) {
    let index = standardItems.value.length - 1
    changeTab(standardItems.value[index]?.key!, index)
  }
}
</script>
