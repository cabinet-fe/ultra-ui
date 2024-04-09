<template>
  <div>
    <div style="height: 80vh"></div>

    <div style="display: flex; justify-content: space-between">
      <u-dropdown disabled>
        <template #trigger>
          <u-button>dropdown-hover</u-button>
        </template>

        <template #content>
          <ul>
            <li>第一层hover</li>
            <li>第二层hover</li>
            <li>第三层hover</li>
            <li>第四层hover</li>
            <li>第五层hover</li>
            <li>第六层hover</li>
          </ul>
        </template>
      </u-dropdown>

      <u-dropdown trigger="click">
        <template #trigger>
          <div :style="{border: '1px solid #ddd',padding: padding + 'px'}">
            padding：{{ padding }}
          </div>
        </template>

        <template #content >
          <div @click="padding += 20">
            1231231231231231231212312312312312312312
          </div>
        </template>
      </u-dropdown>
      <u-dropdown trigger="click" maxContent v-for="i in 5" :key="i">
        <template #trigger><u-button>maxContent</u-button> </template>

        <template #content>
          <ul>
            <li>第一层maxContent</li>
            <li>第二层maxContent</li>
            <li>第三层maxContent</li>
            <li>第四层maxContent</li>
            <li>第五层maxContent</li>
            <li>第六层maxContent</li>
            <li>第一层maxContent</li>
            <li>第二层maxContent</li>
            <li>第三层maxContent</li>
            <li>第四层maxContent</li>
            <li>第五层maxContent</li>
            <li>第六层maxContent</li>
            <li>第一层maxContent</li>
            <li>第二层maxContent</li>
            <li>第三层maxContent</li>
            <li>第四层maxContent</li>
            <li>第五层maxContent</li>
            <li>第六层maxContent</li>
          </ul>
        </template>
      </u-dropdown>
      <div style="height: 80vh"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { shallowRef } from 'vue';


let padding = shallowRef(20);
</script>

<style lang="scss" scoped></style>
