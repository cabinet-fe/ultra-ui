<template>
  <div>
    <CustomCard title="单选数据">
      {{ cascade }}
    </CustomCard>
    <CustomCard title="单选">
      <u-cascade
        v-model="cascade"
        :options="data"
        label-key="name"
        value-key="code"
        @update:modelValue="console.log($event)"
      />
    </CustomCard>
    <CustomCard title="多选数据">
      {{ cascadeTree }}
    </CustomCard>
    <CustomCard title="多选">
      <u-cascade
        v-model="cascadeTree"
        :options="multiData"
        @update:modelValue="console.log($event)"
        multiple
      />
    </CustomCard>
    <CustomCard title="过滤数据">
      {{ cascadeFilter }}
    </CustomCard>
    <CustomCard title="过滤">
      <u-cascade
        v-model="cascadeFilter"
        :options="dataFilter"
        label-key="name"
        value-key="code"
        @update:modelValue="console.log($event)"
        filterable
        selectAndReset
        :disabledNode="disabledNode"
      />
    </CustomCard>
  </div>
</template>
<script lang="ts" setup>
import CustomCard from "../card/custom-card.vue"
import area from "./area.json"
// import { province, city, area } from "province-city-china/data"
// console.log(province, city, area)

import { shallowRef } from "vue"

const cascade = shallowRef<any[]>(["11", "1101", "110101"])

const cascadeFilter = shallowRef(["13", "1306", "130606"])

const cascadeTree = shallowRef([1, 2, 7, 8])

const data = shallowRef<any[]>([])

const multiData = shallowRef<any[]>([])

const dataFilter = shallowRef<any[]>([])

const disabledNode = (data) => {
  return data.code % 2 === 0
}

setTimeout(() => {
  multiData.value = [
    {
      value: 1,
      label: "Asia",
      children: [
        {
          value: 2,
          label: "China",
          disabled: true,
          children: [
            { value: 3, label: "Beijing" },
            { value: 4, label: "Shanghai" },
            { value: 5, label: "Hangzhou" },
          ],
        },
        {
          value: 6,
          label: "Japan",
          children: [
            { value: 7, label: "Tokyo" },
            { value: 8, label: "Osaka" },
            { value: 9, label: "Kyoto" },
          ],
        },
        {
          value: 10,
          label: "Korea",
          children: [
            { value: 11, label: "Seoul" },
            { value: 12, label: "Busan" },
            { value: 13, label: "Taegu" },
          ],
        },
      ],
    },
    {
      value: 14,
      label: "Europe",
      children: [
        {
          value: 15,
          label: "France",
          children: [
            { value: 16, label: "Paris" },
            { value: 17, label: "Marseille" },
            { value: 18, label: "Lyon" },
          ],
        },
        {
          value: 19,
          label: "UK",
          children: [
            { value: 20, label: "London" },
            { value: 21, label: "Birmingham" },
            { value: 22, label: "Manchester" },
          ],
        },
      ],
    },
    {
      value: 23,
      label: "North America",
      children: [
        {
          value: 24,
          label: "US",
          children: [
            { value: 25, label: "New York" },
            { value: 26, label: "Los Angeles" },
            { value: 27, label: "Washington" },
          ],
        },
        {
          value: 28,
          label: "Canada",
          children: [
            { value: 29, label: "Toronto" },
            { value: 30, label: "Montreal" },
            { value: 31, label: "Ottawa" },
          ],
        },
      ],
    },
  ]
  data.value = area.area

  dataFilter.value = data.value
}, 2000)
</script>
