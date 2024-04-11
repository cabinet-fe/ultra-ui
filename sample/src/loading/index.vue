<template>
  <div>
    <CustomCard title="基础使用">
      <u-table :data="data" :columns="columns.slice(0)" v-loading="loading" />
    </CustomCard>
    <CustomCard title="自定义文字、背景色、加载图标">
      <u-list
        :data="listData"
        :draggable="true"
        v-loading:[Refresh]="loading"
        loading-text="加载中..."
        loading-background="red"

      />
    </CustomCard>
    <u-button @click="timer">再次加载数据</u-button>
  </div>
</template>

<script lang="ts" setup>
import {defineTableColumns} from "ultra-ui"
import {shallowRef, onMounted, ref} from "vue"
import CustomCard from "../card/custom-card.vue"
import {Refresh} from "icon-ultra"

let loading = shallowRef(false)

const columns = defineTableColumns(
  [
    {name: "姓名", key: "name", align: "center", fixed: "left"},
    {name: "年龄", key: "age", fixed: "left"},
    {name: "性别", key: "sex", fixed: "right"},
    {
      name: "地址",
      key: "address",
      children: [
        {name: "省", key: "province"},
        {name: "市", key: "city"},
        {name: "区", key: "area"},
        {name: "街道", key: "street"},
        {
          name: "小区",
          key: "community",
          fixed: "right",
          children: [
            {name: "a", key: "a", fixed: "right"},
            {name: "b", key: "b", fixed: "right"},
          ],
        },
      ],
    },
  ],
  {minWidth: 180}
)

const data = shallowRef<any>([])

const listData = ref<any>([
  {
    avatar:
      "https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png",
    title: "基础列表1",
    desc: '判定目标节点能否成为拖动目标位置。 如果返回 false ，拖动节点不能被拖放到目标节点。 type 参数有三种情况："prev"、"inner" 和 "next"分别表示放置在目标节点前、插入至目标节点和放置在目标节点后',
  },
  {
    avatar:
      "https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png",
    title: "基础列表2",
    desc: '判定目标节点能否成为拖动目标位置。 如果返回 false ，拖动节点不能被拖放到目标节点。 type 参数有三种情况："prev"、"inner" 和 "next"分别表示放置在目标节点前、插入至目标节点和放置在目标节点后',
  },
  {
    avatar:
      "https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png",
    title: "基础列表3",
    desc: '判定目标节点能否成为拖动目标位置。 如果返回 false ，拖动节点不能被拖放到目标节点。 type 参数有三种情况："prev"、"inner" 和 "next"分别表示放置在目标节点前、插入至目标节点和放置在目标节点后',
  },
  {
    avatar:
      "https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png",
    title: "基础列表4",
    desc: '判定目标节点能否成为拖动目标位置。 如果返回 false ，拖动节点不能被拖放到目标节点。 type 参数有三种情况："prev"、"inner" 和 "next"分别表示放置在目标节点前、插入至目标节点和放置在目标节点后',
  },
  {
    avatar:
      "https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png",
    title: "基础列表5",
    desc: '判定目标节点能否成为拖动目标位置。 如果返回 false ，拖动节点不能被拖放到目标节点。 type 参数有三种情况："prev"、"inner" 和 "next"分别表示放置在目标节点前、插入至目标节点和放置在目标节点后',
  },
])

const timer = () => {
  loading.value = true
  let time = setTimeout(() => {
    clearTimeout(time)
    loading.value = false
  }, 1500)
}
const timer2 = () => {
  let time = setTimeout(() => {
    clearTimeout(time)
    data.value = Array.from({length: 4}).map((_, index) => {
      return {
        sex: index % 2 === 0 ? "男" : "女",
        name: "name1" + index,
        age: Math.random() * 100,
        province: "江苏省" + index,
        city: "苏州市" + index,
        area: "姑苏区" + index,
        street: "金昌街道" + index,
        community: "彩香花园" + index,
        b: "aa",
      }
    })
  }, 1000)
}

onMounted(() => {
  timer()
  timer2()
})
</script>

<style lang="scss" scoped></style>
