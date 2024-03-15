<template>
  <div :class="cls.b">
    <ul
      :class="cls.e('item')"
      @scroll="handleScroll"
      :style="{ height: props.infiniteScroll == true ? height + 'px' : '' }"
    >
      <li
        v-for="(item, index) in props.data"
        :draggable="props.draggable"
        @dragstart="onDragStart($event, index)"
        @dragover.prevent="onDragOver($event)"
        @dragenter="ondragenter($event, index)"
        @drop="onDrop($event, item, index)"
        :data-index="index"
        :class="index === dragIndex ? cls.e('dragging') : ''"
      >
        <!-- 自定义样式 -->
        <slot name="content" v-if="$slots.content" :item="item" :index="index" />

        <!-- 默认样式 -->
        <div v-else :class="cls.e('container')">
          <div :class="cls.e('left')">
            <slot :item="item" :index="index"></slot>
          </div>

          <div :class="cls.e('content')">
            <h3>{{ item.title }}</h3>
            <div>{{ item.desc }}</div>
            <div>{{ item.date }}</div>
          </div>
        </div>
      </li>
      <p v-if="props.infiniteScroll == true && noMore" :class="cls.e('handleScroll')">
        没有更多了...
      </p>
    </ul>
  </div>
</template>

<script lang="ts" setup>
import { type ListProps, type ListEmits } from '@ui/types/components/list'
import { bem } from '@ui/utils'
import { ref } from 'vue'

defineOptions({
  name: 'List'
})
const cls = bem('list')

const emit = defineEmits<ListEmits>()

const props = withDefaults(defineProps<ListProps>(), {})

const height = document.documentElement.clientHeight

/** 拖动元素索引 */
let dragIndex = ref<number>()
/** 目标对象元素索引 */
let enterIndex = ref<number>()

/** 没有更多了 */
const noMore = ref(false)

/** 当前页码 */
const currentPage = ref(1)

/** 总数量 */
const total = ref(props.total)

const handleScroll = e => {
  if (props.infiniteScroll == false) return

  let scrollTop = e.target.scrollTop

  let scrollHeight = e.target.scrollHeight

  let clientHeight = e.target.clientHeight

  console.log(scrollTop, 'scrollTop', clientHeight, 'clientHeight', scrollHeight, 'scrollHeight')

  if (scrollTop + clientHeight >= scrollHeight - 10) {
    loadMore()
  } else {
    console.log('else')
  }
}

/** 加载更多 */
const loadMore = () => {
  console.log('loadMore')
  emit('loadMore')
  currentPage.value++

  if (props.data?.length > props.total!) {
    noMore.value = true
    props.data = props.data.slice(0, total.value)
  }
}

/**
 * 拖动元素触发
 * @param item
 * @param index
 */
const onDragStart = (e: any, index: number) => {
  dragIndex.value = index

  const dragItem = e.target.closest('li')

  if (dragItem) {
    dragItem.classList.add('fade-in')

    requestAnimationFrame(() => {
      dragItem.classList.add('fade-out')

      setTimeout(() => {
        dragItem.classList.remove('fade-out')
      }, 300)
    })
  }
}

/**
 * ondragover事件在拖动元素在目标元素上方时触发，通常用于防止默认的拖放行为。
 * 可以通过event.preventDefault()方法阻止默认行为。
 */
const onDragOver = (event: DragEvent) => {
  event.preventDefault()
}

const ondragenter = (e: any, index: number) => {
  enterIndex.value = index
}

/**
 * ondrop事件在拖动元素在目标元素上释放时触发，通常用于实现拖放功能。
 * */
const onDrop = (e: any, item: any, index: number) => {
  props.data.splice(
    dragIndex.value!,
    1,
    ...props.data.splice(enterIndex?.value!, 1, props.data[dragIndex.value!]!)
  )
  const dragItem = e.target.closest('li')

  if (dragItem) {
    dragItem.classList.remove('fade-in')

    requestAnimationFrame(() => {
      dragItem.classList.remove('fade-out')

      setTimeout(() => {
        dragItem.classList.add('fade-in')
      }, 300)
    })
  }
}
</script>
