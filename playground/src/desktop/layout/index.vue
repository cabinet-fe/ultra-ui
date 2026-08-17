<template>
  <div>
    <h3>两栏布局</h3>
    <u-layout cols="200px 1fr" class="layout">
      <div class="l-aside"></div>
      <div class="l-main"></div>
    </u-layout>

    <h3>三栏布局</h3>
    <u-layout cols="60px 200px 1fr" class="layout">
      <div class="l-nav"></div>
      <div class="l-aside"></div>
      <div class="l-main"></div>
    </u-layout>

    <h3>布局示例</h3>
    <u-layout cols="60px 200px 1fr">
      <div class="l-nav"></div>
      <div class="l-aside"></div>
      <div class="l-main">
        <div class="menu-bar"></div>
        <div class="content"></div>
      </div>
    </u-layout>

    <h3>尺寸可调节（列最小宽度 120px）</h3>
    <u-layout cols="300px 1fr 300px" resizable :col-min-sizes="[120, 120, 120]">
      <div class="l-nav"></div>
      <div class="l-aside"></div>
      <div class="l-main"></div>
    </u-layout>
  </div>
</template>

<script lang="ts" setup></script>

<style lang="scss" scoped>
.l-nav,
.l-aside,
.l-main {
  height: 600px;
}
.l-nav {
  background-color: rgb(113, 152, 139);
}
.l-aside {
  background-color: #ccc;
}

.l-main {
  background-color: #f2f2f2;
}

.menu-bar {
  height: 60px;
  box-shadow: 0 2px 4px rgba($color: #000000, $alpha: 0.1);
  background-color: #fff;
}

.content {
  height: calc(100% - 60px);
}
</style>
