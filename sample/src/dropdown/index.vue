<template>
  <div>
    <div style="height: 80vh"></div>

    <div style="display: flex; justify-content: space-between">
      <u-dropdown>
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
        <template #trigger><u-button>dropdown-click</u-button> </template>

        <template #content>
          <ul>
            <li>第一层click</li>
            <li>第二层click</li>
            <li>第三层click</li>
            <li>第四层click</li>
            <li>第五层click</li>
            <li>第六层click</li>
          </ul>
        </template>
      </u-dropdown>
      <u-dropdown trigger="click" maxContent>
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

<script setup lang="ts"></script>

<style lang="scss" scoped></style>
