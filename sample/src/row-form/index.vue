<template>
  <u-radio-group :data="columns" v-model="size"></u-radio-group>
  {{ size }}
</template>
<script lang="ts" setup>
import {shallowRef} from "vue"

const columns = shallowRef([
  {label: "小", value: "large"},
  {label: "中", value: "medium"},
  {label: "大", value: "small"},
])

const size = shallowRef("large")
</script>
