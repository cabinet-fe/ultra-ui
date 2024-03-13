<template>
  <div :class="cls.b">
    <ul
      :class="cls.e('item')"
      @scroll="handleScroll"
      :style="{ height: props.infiniteScroll == true ? height + 'px' : '' }"
    >
      <!-- <li
        v-for="(item, index) in visibleItems"
        :draggable="props.draggable"
        @dragstart="onDragStart(item, index)"
        @dragover.prevent="onDragOver"
        @drop="onDrop($event, item, index)"
        :data-index="index"
      > -->
      <li
        v-for="(item, index) in props.data"
        :draggable="props.draggable"
        @dragstart="onDragStart(item, index)"
        @dragover.prevent="onDragOver"
        @drop="onDrop($event, item, index)"
        :data-index="index"
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
import { computed, ref } from 'vue'

defineOptions({
  name: 'List'
})
const cls = bem('list')

const emit = defineEmits<ListEmits>()

const props = withDefaults(defineProps<ListProps>(), {})

const height = document.documentElement.clientHeight

let dragIndex: any = ref(null)

/** 没有更多了 */
const noMore = ref(false)

/** 所有列表 */
const items = ref<any>(props.data)

/** 当前页码 */
const currentPage = ref(1)

/** 每页显示多少条 */
const pageSize = ref(props.pageSize)

/** 总数量 */
const total = ref(props.total)

/** 要显示的列表 */
let visibleItems = computed(() => {
  const startIndex = (currentPage.value - 1) * pageSize.value

  const endIndex = startIndex + pageSize.value

  return items.value?.slice(0, endIndex)
})

/** 显示加载更多按钮 */
// const showLoadMoreButton = computed(() => {
//   return visibleItems.value.length < items.value.length
// })

/** 加载更多 */
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

  // if (scrollTop + clientHeight == scrollHeight) {
  //   console.log('没有更多了')
  //   noMore.value = true
  // } else {
  //   currentPage.value++
  //   emit('handleScroll', visibleItems.value)
  // }
}

/** 加载更多 */
const loadMore = () => {
  console.log('loadMore')
  emit('loadMore')
  currentPage.value++

  if (props.data?.length > props.total) {
    noMore.value = true
    props.data = props.data.slice(0, total.value)
  }

  // emit('handleScroll', visibleItems.value)
}
// loadMore()
/**
 * 拖动元素触发
 * @param item
 * @param index
 */
const onDragStart = (item: any, index: number) => {
  console.log(item, 'item', index, 'index')

  dragIndex.value = index
  console.log(dragIndex.value, 'dragIndex.value')
}

/**
 * ondragover事件在拖动元素在目标元素上方时触发，通常用于防止默认的拖放行为。
 * 可以通过event.preventDefault()方法阻止默认行为。
 */
const onDragOver = (event: DragEvent) => {
  event.preventDefault()
}
/**
 * ondrop事件在拖动元素在目标元素上释放时触发，通常用于实现拖放功能。
 * */
const onDrop = (e: any, item: any, index: number) => {
  console.log(e, 'e', e.target.dataset.index, '11')
  const draggItem: any = items.value[dragIndex.value]

  console.log(draggItem, 'draggItem')

  items.value.splice(dragIndex.value, 1)
  console.log(items.value, 'items.value')

  items.value.splice(index, 0, draggItem)
  console.log(items.value, 'items.value++')

  dragIndex.value = null
}
</script>
