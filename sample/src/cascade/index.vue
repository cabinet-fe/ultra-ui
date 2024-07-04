<template>
  <div>
    <CustomCard title="单选数据">
      {{ cascade }}
    </CustomCard>
    <CustomCard title="单选">
      <u-cascade
        v-model:selected="cascade"
        :options="data"
        label-key="name"
        value-key="code"
      />
    </CustomCard>
    <CustomCard title="多选数据">
      {{ cascadeTree }}
    </CustomCard>
    <CustomCard title="多选">
      <u-cascade v-model:checked="cascadeTree" :options="multiData" multiple/>
    </CustomCard>
  </div>
</template>
<script lang="ts" setup>
import CustomCard from "../card/custom-card.vue"
// import { province, city, area } from "province-city-china/data"
// console.log(province, city, area)

import { shallowRef } from "vue"
// const handleChange = (value: any, label: any, data: any) => {
//   console.log("value", value)
//   console.log("label", label)
//   console.log("data", data)
// }

const cascade = shallowRef(["component", "basic", "layout"])

const cascadeTree = shallowRef([1, 2, 7, 8])

const data = shallowRef<any[]>([])

const multiData = shallowRef<any[]>([])

setTimeout(() => {
  multiData.value = [
    {
      value: 1,
      label: "Asia",
      children: [
        {
          value: 2,
          label: "China",
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
  data.value = [
    {
      code: "guide",
      name: "Guide",
    },
    {
      code: "component",
      name: "Component",
      children: [
        {
          code: "basic",
          name: "Basic",
          children: [
            {
              code: "layout",
              name: "Layout",
            },
            {
              code: "color",
              name: "Color",
            },
            {
              code: "typography",
              name: "Typography",
            },
            {
              code: "icon",
              name: "Icon",
            },
            {
              code: "button",
              name: "Button",
            },
          ],
        },
        {
          code: "form",
          name: "Form",
          children: [
            {
              code: "radio",
              name: "Radio",
            },
            {
              code: "checkbox",
              name: "Checkbox",
            },
            {
              code: "input",
              name: "Input",
            },
            {
              code: "input-number",
              name: "InputNumber",
            },
            {
              code: "select",
              name: "Select",
            },
            {
              code: "cascader",
              name: "Cascader",
            },
            {
              code: "switch",
              name: "Switch",
            },
            {
              code: "slider",
              name: "Slider",
            },
            {
              code: "time-picker",
              name: "TimePicker",
            },
            {
              code: "date-picker",
              name: "DatePicker",
            },
            {
              code: "datetime-picker",
              name: "DateTimePicker",
            },
            {
              code: "upload",
              name: "Upload",
            },
            {
              code: "rate",
              name: "Rate",
            },
          ],
        },
        {
          code: "data",
          name: "Data",
          children: [
            {
              code: "table",
              name: "Table",
            },
            {
              code: "tag",
              name: "Tag",
            },
            {
              code: "progress",
              name: "Progress",
            },
            {
              code: "tree",
              name: "Tree",
            },
            {
              code: "pagination",
              name: "Pagination",
            },
            {
              code: "badge",
              name: "Badge",
            },
          ],
        },
        {
          code: "notice",
          name: "Notice",
          children: [
            {
              code: "alert",
              name: "Alert",
            },
            {
              code: "loading",
              name: "Loading",
            },
            {
              code: "message",
              name: "Message",
            },
            {
              code: "message-box",
              name: "MessageBox",
            },
            {
              code: "notification",
              name: "Notification",
            },
          ],
        },
        {
          code: "navigation",
          name: "Navigation",
          children: [
            {
              code: "menu",
              name: "Menu",
            },
            {
              code: "tabs",
              name: "Tabs",
            },
            {
              code: "breadcrumb",
              name: "Breadcrumb",
            },
            {
              code: "dropdown",
              name: "Dropdown",
            },
            {
              code: "steps",
              name: "Steps",
            },
          ],
        },
        {
          code: "others",
          name: "Others",
          children: [
            {
              code: "dialog",
              name: "Dialog",
            },
            {
              code: "tooltip",
              name: "Tooltip",
            },
            {
              code: "popover",
              name: "Popover",
            },
            {
              code: "card",
              name: "Card",
            },
            {
              code: "carousel",
              name: "Carousel",
            },
            {
              code: "collapse",
              name: "Collapse",
            },
          ],
        },
      ],
    },
    {
      code: "resource",
      name: "Resource",
      children: [
        {
          code: "axure",
          name: "Axure Components",
        },
        {
          code: "sketch",
          name: "Sketch Templates",
        },
        {
          code: "docs",
          name: "Design Documentation",
        },
      ],
    },
  ]
}, 2000)
</script>
