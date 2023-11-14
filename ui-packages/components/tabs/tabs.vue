<template>
  <div :class="[cls.b, cls.e(position!)]">
    <div :class="[cls.e('header'), cls.em('header', position!)]">
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
import { computed, getCurrentInstance, shallowRef, ref, watch, reactive } from 'vue'
import { useDrag } from '@ui/compositions'

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
/** 将传入的items进行标准化处理 */
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

let closedList = ref<Array<string | number>>([])
/** 关闭标签 */
const handleClose = (item: Item) => {
  closedList.value.push(item.key!)
  if (item.key === props.modelValue) {
    let index = standardItems.value.length - 1
    changeTab(standardItems.value[index]?.key!, index)
  }
}

const translated = reactive<Array<Record<string, any>>>([])

watch(
  () => labRef,
  (ref) => {
    if (ref) {
      ref.value?.forEach((item, index) => {
        translated.push({ x: 0, y: 0 })
        useDrag({
          target: shallowRef(item),
          onDrag(x, y) {
            if (!labRef.value) return
            const target = labRef.value[index]!
            target.style.transform = `translate(${translated[index]!.x + x}px,${
              translated[index]!.y + y
            }px)`
          },
          onDragEnd(x, y) {
            translated[index]!.x += x
            translated[index]!.y += y
          }
        })
      })
    }
  },
  { deep: true }
)
</script>
