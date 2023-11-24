<template>
  <div :class="cls.b">
    <ul :class="cls.e('item')">
      <li v-for="(item, index) in data">
        <slot name="content" v-if="$slots.content" :data="item" />
        <div v-else>
          <!-- left  -->
          <div :class="cls.e('left')">
            <!-- TODO v-model 值有点问题 -->
            <div :class="cls.e('checkbox')">
              <u-checkbox
                v-model="item.checked"
                v-if="showCheck"
                @update:model-value="handleUpdate(item, index)"
              ></u-checkbox>
            </div>

            <div :clsaa="cls.e('star')"></div>

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
            <u-icon :size="16"><Delete @click="handleDelete(item, index)" /></u-icon>
            <u-icon :size="16"><Message @click="handleMessage(item, index)" /></u-icon>
            <u-icon :size="16"><Warning @click="handleTip(item, index)" /></u-icon>
          </div>
          <!-- action end-->
        </div>
      </li>
    </ul>
  </div>
</template>

<script lang="ts" setup>
import { type ListProps, type ListEmits } from '@ui/types/components/list'
import { useSlots } from 'vue'
import { UIcon } from '../icon'
import { UCheckbox } from '../checkbox'
import { Delete, Message, Warning } from 'icon-ultra'
import { bem } from '@ui/utils'

defineOptions({
  name: 'List'
})

const emit = defineEmits<ListEmits>()

const props = withDefaults(defineProps<Partial<ListProps>>(), {})

const slots = useSlots()

/** 删除 */
const handleDelete = (item: any, index: number) => {
  emit('delete', item, index)
}
const handleMessage = (item: any, index: number) => {
  emit('message', item, index)
}
const handleTip = (item: any, index: number) => {
  emit('tip', item, index)
}
const handleUpdate = (item: any, index: number) => {
  let list = props.data?.filter(item => item.checked)
  emit('update:check', list)
}

const cls = bem('list')
</script>
