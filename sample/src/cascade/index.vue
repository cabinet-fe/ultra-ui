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
      />
    </CustomCard>
  </div>
</template>
<script lang="ts" setup>
import CustomCard from "../card/custom-card.vue"
// import { province, city, area } from "province-city-china/data"
// console.log(province, city, area)

import { shallowRef } from "vue"

const cascade = shallowRef<any[]>([])

const cascadeFilter = shallowRef(["component", "basic"])

const cascadeTree = shallowRef([1, 2, 7, 8])

const data = shallowRef<any[]>([])

const multiData = shallowRef<any[]>([])

const dataFilter = shallowRef<any[]>([])

setTimeout(() => {
  cascade.value = ['guide','introduction']
},2500)

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
  data.value = [
    {
      code: "guide",
      name: "Guide",
      children: [
        {
          code: "introduction",
          name: "Introduction",
          children: [
            {
              code: "overview",
              name: "Overview",
              children: [
                {
                  code: "setup",
                  name: "Setup",
                  children: [
                    {
                      code: "requirements",
                      name: "Requirements",
                    },
                    {
                      code: "installation",
                      name: "Installation",
                    },
                    {
                      code: "configuration",
                      name: "Configuration",
                    },
                  ],
                },
                {
                  code: "usage",
                  name: "Usage",
                  children: [
                    {
                      code: "basics",
                      name: "Basics",
                    },
                    {
                      code: "advanced",
                      name: "Advanced",
                    },
                    {
                      code: "examples",
                      name: "Examples",
                    },
                  ],
                },
                {
                  code: "support",
                  name: "Support",
                  children: [
                    {
                      code: "faq",
                      name: "FAQ",
                    },
                    {
                      code: "community",
                      name: "Community",
                    },
                    {
                      code: "contact",
                      name: "Contact",
                    },
                  ],
                },
              ],
            },
            {
              code: "getting-started",
              name: "Getting Started",
              children: [
                {
                  code: "quick-start",
                  name: "Quick Start",
                  children: [
                    {
                      code: "requirements",
                      name: "Requirements",
                    },
                    {
                      code: "installation",
                      name: "Installation",
                    },
                    {
                      code: "configuration",
                      name: "Configuration",
                    },
                  ],
                },
                {
                  code: "tutorials",
                  name: "Tutorials",
                  children: [
                    {
                      code: "basics",
                      name: "Basics",
                    },
                    {
                      code: "intermediate",
                      name: "Intermediate",
                    },
                    {
                      code: "advanced",
                      name: "Advanced",
                    },
                  ],
                },
                {
                  code: "resources",
                  name: "Resources",
                  children: [
                    {
                      code: "docs",
                      name: "Documentation",
                    },
                    {
                      code: "videos",
                      name: "Videos",
                    },
                    {
                      code: "blogs",
                      name: "Blogs",
                    },
                  ],
                },
              ],
            },
            {
              code: "best-practices",
              name: "Best Practices",
              children: [
                {
                  code: "coding",
                  name: "Coding",
                  children: [
                    {
                      code: "standards",
                      name: "Standards",
                    },
                    {
                      code: "patterns",
                      name: "Patterns",
                    },
                    {
                      code: "tips",
                      name: "Tips",
                    },
                  ],
                },
                {
                  code: "testing",
                  name: "Testing",
                  children: [
                    {
                      code: "unit",
                      name: "Unit Testing",
                    },
                    {
                      code: "integration",
                      name: "Integration Testing",
                    },
                    {
                      code: "end-to-end",
                      name: "End-to-End Testing",
                    },
                  ],
                },
                {
                  code: "deployment",
                  name: "Deployment",
                  children: [
                    {
                      code: "ci-cd",
                      name: "CI/CD",
                    },
                    {
                      code: "docker",
                      name: "Docker",
                    },
                    {
                      code: "kubernetes",
                      name: "Kubernetes",
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
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
              children: [
                {
                  code: "grid",
                  name: "Grid",
                  children: [
                    {
                      code: "rows",
                      name: "Rows",
                    },
                    {
                      code: "columns",
                      name: "Columns",
                    },
                    {
                      code: "gaps",
                      name: "Gaps",
                    },
                  ],
                },
                {
                  code: "flex",
                  name: "Flex",
                  children: [
                    {
                      code: "direction",
                      name: "Direction",
                    },
                    {
                      code: "wrap",
                      name: "Wrap",
                    },
                    {
                      code: "justify",
                      name: "Justify",
                    },
                  ],
                },
                {
                  code: "container",
                  name: "Container",
                  children: [
                    {
                      code: "fluid",
                      name: "Fluid",
                    },
                    {
                      code: "fixed",
                      name: "Fixed",
                    },
                    {
                      code: "responsive",
                      name: "Responsive",
                    },
                  ],
                },
              ],
            },
            {
              code: "color",
              name: "Color",
              children: [
                {
                  code: "palette",
                  name: "Palette",
                  children: [
                    {
                      code: "primary",
                      name: "Primary Colors",
                    },
                    {
                      code: "secondary",
                      name: "Secondary Colors",
                    },
                    {
                      code: "accent",
                      name: "Accent Colors",
                    },
                  ],
                },
                {
                  code: "scheme",
                  name: "Scheme",
                  children: [
                    {
                      code: "light",
                      name: "Light Scheme",
                    },
                    {
                      code: "dark",
                      name: "Dark Scheme",
                    },
                    {
                      code: "custom",
                      name: "Custom Scheme",
                    },
                  ],
                },
                {
                  code: "usage",
                  name: "Usage",
                  children: [
                    {
                      code: "background",
                      name: "Background",
                    },
                    {
                      code: "text",
                      name: "Text",
                    },
                    {
                      code: "border",
                      name: "Border",
                    },
                  ],
                },
              ],
            },
            {
              code: "typography",
              name: "Typography",
              children: [
                {
                  code: "font",
                  name: "Font",
                  children: [
                    {
                      code: "families",
                      name: "Font Families",
                    },
                    {
                      code: "sizes",
                      name: "Font Sizes",
                    },
                    {
                      code: "weights",
                      name: "Font Weights",
                    },
                  ],
                },
                {
                  code: "alignment",
                  name: "Alignment",
                  children: [
                    {
                      code: "left",
                      name: "Left Align",
                    },
                    {
                      code: "center",
                      name: "Center Align",
                    },
                    {
                      code: "right",
                      name: "Right Align",
                    },
                  ],
                },
                {
                  code: "spacing",
                  name: "Spacing",
                  children: [
                    {
                      code: "line-height",
                      name: "Line Height",
                    },
                    {
                      code: "letter-spacing",
                      name: "Letter Spacing",
                    },
                    {
                      code: "margin",
                      name: "Margin",
                    },
                  ],
                },
              ],
            },
          ],
        },
        {
          code: "form",
          name: "Form",
          children: [
            {
              code: "input",
              name: "Input",
              children: [
                {
                  code: "text",
                  name: "Text Input",
                  children: [
                    {
                      code: "single-line",
                      name: "Single Line",
                    },
                    {
                      code: "multi-line",
                      name: "Multi Line",
                    },
                    {
                      code: "password",
                      name: "Password",
                    },
                  ],
                },
                {
                  code: "number",
                  name: "Number Input",
                  children: [
                    {
                      code: "integer",
                      name: "Integer",
                    },
                    {
                      code: "decimal",
                      name: "Decimal",
                    },
                    {
                      code: "range",
                      name: "Range",
                    },
                  ],
                },
                {
                  code: "date",
                  name: "Date Input",
                  children: [
                    {
                      code: "single-date",
                      name: "Single Date",
                    },
                    {
                      code: "date-range",
                      name: "Date Range",
                    },
                    {
                      code: "datetime",
                      name: "Date & Time",
                    },
                  ],
                },
              ],
            },
            {
              code: "select",
              name: "Select",
              children: [
                {
                  code: "single",
                  name: "Single Select",
                  children: [
                    {
                      code: "dropdown",
                      name: "Dropdown",
                    },
                    {
                      code: "autocomplete",
                      name: "Autocomplete",
                    },
                    {
                      code: "native",
                      name: "Native",
                    },
                  ],
                },
                {
                  code: "multi",
                  name: "Multi Select",
                  children: [
                    {
                      code: "dropdown",
                      name: "Dropdown",
                    },
                    {
                      code: "autocomplete",
                      name: "Autocomplete",
                    },
                    {
                      code: "native",
                      name: "Native",
                    },
                  ],
                },
                {
                  code: "group",
                  name: "Group Select",
                  children: [
                    {
                      code: "dropdown",
                      name: "Dropdown",
                    },
                    {
                      code: "autocomplete",
                      name: "Autocomplete",
                    },
                    {
                      code: "native",
                      name: "Native",
                    },
                  ],
                },
              ],
            },
            {
              code: "checkbox",
              name: "Checkbox",
              children: [
                {
                  code: "single",
                  name: "Single Checkbox",
                  children: [
                    {
                      code: "indeterminate",
                      name: "Indeterminate",
                    },
                    {
                      code: "disabled",
                      name: "Disabled",
                    },
                  ],
                },
                {
                  code: "group",
                  name: "Checkbox Group",
                  children: [
                    {
                      code: "vertical",
                      name: "Vertical",
                    },
                    {
                      code: "horizontal",
                      name: "Horizontal",
                    },
                    {
                      code: "inline",
                      name: "Inline",
                    },
                  ],
                },
                {
                  code: "toggle",
                  name: "Checkbox Toggle",
                  children: [
                    {
                      code: "indeterminate",
                      name: "Indeterminate",
                    },
                    {
                      code: "disabled",
                      name: "Disabled",
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
  ]

  dataFilter.value = data.value
}, 2000)
</script>
