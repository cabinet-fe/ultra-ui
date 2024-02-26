<template>
  <div>
    <h3>两栏布局</h3>
    <u-layout cols="200px 1fr" class="layout">
      <aside class="aside"></aside>
      <main class="main"></main>
    </u-layout>

    <h3>三栏布局</h3>
    <u-layout cols="60px 200px 1fr" class="layout">
      <div class="nav"></div>
      <aside class="aside"></aside>
      <main class="main"></main>
    </u-layout>

    <h3>布局示例</h3>
    <u-layout cols="60px 200px 1fr">
      <div class="nav"></div>
      <aside class="aside"></aside>
      <main class="main">
        <nav class="menu-bar"></nav>
        <div class="content"></div>
      </main>
    </u-layout>

    <h3>尺寸可调节</h3>
    <u-layout cols="200px 1fr 300px" resizable>
      <div class="nav"></div>
      <aside class="aside"></aside>
      <main class="main"></main>
    </u-layout>
  </div>
</template>

<script lang="ts" setup></script>

<style lang="scss" scoped>
.nav,
.aside,
.main {
  height: 600px;
}
.nav {
  background-color: rgb(113, 152, 139);
}
.aside {
  background-color: #ccc;
}

.main {
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
