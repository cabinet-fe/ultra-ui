<template>
  <div>
    <CustomCard title="单选数据">
      {{ cascade }}
    </CustomCard>
    <CustomCard title="单选">
      <u-cascade v-model="cascade" :options="data" label-key="name" value-key="code"/>
    </CustomCard>

  </div>
</template>
<script lang="ts" setup>
import CustomCard from "../card/custom-card.vue"
// import { province, city, area } from "province-city-china/data"
// console.log(province, city, area)

import { shallowRef } from "vue"

const cascade = shallowRef(["component", "basic", "layout"])


const data = shallowRef<any[]>([])

setTimeout(() => {
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
            {
              code: "form",
              name: "Form",
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
