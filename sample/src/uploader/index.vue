<template>
  <u-uploader>
    <template #default="{ items }">
      <ul>
        <li v-for="item of items">
          {{ item.name }}
        </li>
      </ul>
    </template>

    <!-- 文件拾取器 -->
    <template #picker>
      <u-button>上传文件</u-button>
    </template>
  </u-uploader>
</template>

<script lang="ts" setup></script>

<style lang="scss" scoped></style>
