<template>
  <div :class="cls.b">
    <ul
      :class="cls.e('item')"
      @scroll="loadMore"
      :style="{ height: props.infiniteScroll == true ? height + 'px' : '' }"
    >
      <li
        v-for="(item, index) in visibleItems"
        :draggable="props.draggable"
        @dragstart="onDragStart(item, index)"
        @dragover.prevent="onDragOver"
        @drop="onDrop($event, item, index)"
        :data-index="index"
      >
        <!-- 自定义样式 -->
        <slot
          name="content"
          v-if="$slots.content"
          :item="item"
          :index="index"
        />
        <!-- 默认样式 -->
        <div v-else :class="cls.e('container')">
          <!-- left  -->
          <div :class="cls.e('left')">
            <div :class="cls.e('checkbox')">
              <u-checkbox
                v-model="item.checked"
                v-if="showCheck"
                @update:model-value="handleUpdate(item, index)"
              ></u-checkbox>
            </div>

            <div :class="cls.e('star')"></div>

            <div :class="cls.e('avatar')" v-if="item.avatar">
              <img :src="item.avatar" alt="" />
            </div>
          </div>
          <!-- left  end-->

          <!-- content -->
          <div :class="cls.e('content')">
            <h3>{{ item.title }}</h3>
            <div>{{ item.desc }}</div>
            <div>{{ item.date }}</div>
          </div>
          <!-- content end -->

          <!-- action -->
          <div :class="cls.e('action')" v-if="showActions">
            <ButtonCommonProps>
              <u-button
                :icon="Delete"
                @click="handleDelete(item, index)"
              ></u-button>
              <u-button
                :icon="Message"
                @click="handleMessage(item, index)"
              ></u-button>
              <u-button
                :icon="Warning"
                @click="handleTip(item, index)"
              ></u-button>
            </ButtonCommonProps>
          </div>
          <!-- action end-->
        </div>
      </li>
      <p
        v-if="props.infiniteScroll == true && noMore"
        :class="cls.e('loadMore')"
      >
        没有更多了...
      </p>
    </ul>
  </div>
</template>

<script lang="ts" setup>
import { type ListProps, type ListEmits } from '@ui/types/components/list'
import { UCheckbox } from '../checkbox'
import { UButton, type ButtonProps } from '../button'
import { Delete, Message, Warning } from 'icon-ultra'
import { bem } from '@ui/utils'
import { computed, ref } from 'vue'
import { useComponentProps } from '@ui/compositions'

defineOptions({
  name: 'List'
})
const cls = bem('list')

const emit = defineEmits<ListEmits>()

const props = withDefaults(defineProps<Partial<ListProps>>(), {
  /** 每页显示多少条 */
  itemsPerPage: 20,

  /** 是否无限滚动 */
  infiniteScroll: false
})

const ButtonCommonProps = useComponentProps<ButtonProps>({
  type: 'primary',
  text: true,
  size: 'small',
  circle: true
})

const height = document.documentElement.clientHeight

let dragIndex: any = ref(null)

/** 没有更多了 */
const noMore = ref(false)

/** 所有列表 */
const items = ref<any>(props.data)

/** 当前页码 */
const currentPage = ref(1)

/** 每页显示多少条 */
const itemsPerPage = ref(props.itemsPerPage || 10)

/** 要显示的列表 */
const visibleItems = computed(() => {
  const startIndex = (currentPage.value - 1) * itemsPerPage.value

  const endIndex = startIndex + itemsPerPage.value

  return items.value?.slice(0, endIndex)
})

/** 显示加载更多按钮 */
// const showLoadMoreButton = computed(() => {
//   return visibleItems.value.length < items.value.length
// })

/** 加载更多 */
const loadMore = e => {
  if (props.infiniteScroll == false) return
  let scrollTop = e.target.scrollTop

  let scrollHeight = e.target.scrollHeight

  let clientHeight = e.target.clientHeight

  console.log(
    scrollTop,
    'scrollTop',
    clientHeight,
    'clientHeight',
    scrollHeight,
    'scrollHeight'
  )

  if (scrollTop + clientHeight == scrollHeight) {
    console.log('没有更多了')
    noMore.value = true
  } else {
    currentPage.value++
  }
}

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

/** 删除 */
const handleDelete = (item: any, index: number) => {
  emit('delete', item, index)
}

/** 消息 */
const handleMessage = (item: any, index: number) => {
  emit('message', item, index)
}

/** 提示 */
const handleTip = (item: any, index: number) => {
  emit('tip', item, index)
}

/** 更新 */
const handleUpdate = (item: any, index: number) => {
  let list = props.data?.filter(item => item.checked)
  emit('update:check', list)
}
</script>
