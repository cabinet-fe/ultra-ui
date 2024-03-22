<template>
  <div class="tagList">
    <h2>基本用法</h2>
    <p>由 type 属性来选择 tag 的类型,可选值包括 primary, success, info, warning, danger</p>
    <u-tag type="primary"> primary</u-tag>
    <u-tag type="success"> success</u-tag>
    <u-tag type="info"> info</u-tag>
    <u-tag type="warning"> warning</u-tag>
    <u-tag type="danger"> danger</u-tag>
  </div>

  <div class="tagList">
    <h2>可移除标签</h2>
    <p>设置 closable 属性可以定义一个标签是否可移除,它接受一个 Boolean。</p>
    <u-tag v-for="item in tagList" :type="item.type" closable>
      {{ item.name }}
    </u-tag>
  </div>

  <div class="tagList">
    <h2>动态编辑标签</h2>
    <p>动态编辑标签可以通过点击标签关闭按钮后触发的 close 事件来实现。</p>

    <u-tag v-for="(item, index) in tagList2" :type="item.type" closable @close="handleClose(index)">
      {{ item.name }}
    </u-tag>

    <u-input v-model="tagValue" v-if="showInput" @blur="handleBlur" />
    <u-button @click="handleCreate" v-if="showButton">+new tag</u-button>
  </div>

  <div class="tagList">
    <h2>不同尺寸</h2>
    <p>使用 size 属性来设置额外尺寸, 可选值包括 large, default 或 small</p>
    <u-tag type="primary" size="small"> 小</u-tag>
    <u-tag type="primary" size="default"> 中</u-tag>
    <u-tag type="primary" size="large"> 大</u-tag>
    <u-tag type="primary"> 默认</u-tag>
  </div>

  <div class="tagList">
    <h2>圆角标签</h2>
    <p>使用 round 属性来设置标签是否为圆角。</p>
    <u-tag round type="primary">圆角</u-tag>
  </div>

  <div class="tagList">
    <h2>可选中的标签</h2>
    <u-check-tag :checked="checked1" @update:model-value="handleChecked">11</u-check-tag>
  </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue'

const tagList = ref<any>([
  { name: 'Tag 1', type: 'primary' },
  { name: 'Tag 2', type: 'success' },
  { name: 'Tag 3', type: 'info' },
  { name: 'Tag 4', type: 'warning' },
  { name: 'Tag 5', type: 'danger' }
])

const tagList2 = ref([...tagList.value])

const handleClose = (index: number) => {
  tagList.value.splice(index, 1)
}

const tagValue = ref<any>()
const showInput = ref<boolean>(false)
const showButton = ref<boolean>(true)
const handleCreate = () => {
  showInput.value = true
  showButton.value = false
}
const handleBlur = () => {
  showInput.value = false
  showButton.value = true
  if (tagValue.value === '') return

  tagList2.value.push({
    name: tagValue.value,
    type: 'primary'
  })
  tagValue.value = ''
}

/** 可选中的标签 */
const checked1 = ref<boolean>(false)
const handleChecked = (val: boolean) => {
  console.log(val, 'val')
  checked1.value = !val
}
</script>

<style lang="scss" scoped>
.tagList {
  margin-bottom: 30px;
  & > div {
    margin-right: 10px;
    // margin-bottom: 10px;
  }
}
</style>
