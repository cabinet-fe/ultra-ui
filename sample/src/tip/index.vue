<template>
  <div class="tip-box">
    <h4>Hover</h4>
    <div class="tip-row flex-row">
      <u-tip model-value="上左上左上左上左上左上左上左上左上左上左上左上左上左上左上左上左上左上左上左上左上左上左上左上左上左上左上左上左上左上左上左上左上左上左上左上左上左上左上左上左上左上左上左上左上左上左上左上左上左上左上左上左上左上左上左上左上左上左上左上左上左上左上左上左上左上左" position="top-start">
        <u-button>上左上左上左上左上左</u-button>
      </u-tip>
      <u-tip model-value="上中" position="top">
        <u-button>上中上中上中上中上中上中</u-button>
      </u-tip>
      <u-tip model-value="上右" position="top-end" theme="light">
        <u-button>上右上右 Light</u-button>
      </u-tip>
    </div>
    <div class="tip-center">
      <div class="tip-column flex-column">
        <u-tip model-value="火男宝宝会颠勺好厉害火男宝宝会颠勺好厉害" position="left-start">
          <p>左上左上左上</p>
        </u-tip>
        <u-tip model-value="左中" position="left">
          <p>左中左中左中</p>
        </u-tip>
        <u-tip model-value="左下" position="left-end" theme="light">
          <p>左下左下 Light</p>
        </u-tip>
      </div>
      <div class="tip-column flex-column">
        <u-tip model-value="右上右上右上右上右上右上右上右上右上右上右上右上右上右上右上右上右上右上右上右上右上右上右上右上右上右上右上右上右上右上右上右上右上右上右上右上右上右上右上右上右上右上右上右上右上右上右上右上右上右上右上右上右上右上右上右上右上右上右上右上右上右上右上右上右上右上右上右上右上右上右上右上" position="right-start">
          <p style="width: 50px">右上右上右上</p>
        </u-tip>
        <u-tip model-value="右中" position="right">
          <p>右中右中右中右中</p>
        </u-tip>
        <u-tip model-value="右下" position="right-end" theme="light">
          <p>右下右下 Light</p>
        </u-tip>
      </div>
    </div>
    <div class="tip-row flex-row">
      <u-tip model-value="下左下左下左下左下左下左下左下左下左下左下左下左下左下左下左下左下左下左下左下左下左下左下左下左下左下左下左下左下左下左下左下左下左下左下左下左下左下左下左下左下左下左下左下左下左下左下左下左下左下左下左下左下左下左下左下左下左下左下左下左下左下左下左下左下左下左下左下左下左下左下左下左下左下左下左下左下左" position="bottom-start">
        <p>下左下左下左下左</p>
      </u-tip>
      <u-tip model-value="下中" position="bottom">
        <p>下中下中下中下中</p>
      </u-tip>
      <u-tip model-value="下右" position="bottom-end" theme="light">
        <p>下右下右 Light</p>
      </u-tip>
    </div>
    <h4 class="pd20">Click</h4>
    <div class="tip-row flex-row">
      <u-tip
        content="自定义样式"
        :trigger-pop-up-mode="'click'"
        theme="light"
      >
        <u-button>点击上左</u-button>
      </u-tip>
      <u-tip model-value="上中"  :trigger-pop-up-mode="'click'">
        <u-button>点击上中</u-button>
      </u-tip>
      <u-tip model-value="上右" position="top-end" :trigger-pop-up-mode="'click'" theme="light">
        <u-button>点击上右</u-button>
      </u-tip>
    </div>

    <div style="height: 100vh"></div>
  </div>
</template>

<script setup lang="ts">
import {shallowReactive} from "vue"
const styleValue = shallowReactive({
  background: "#000",
  color: "#fff",
  // display:'block'
})
</script>

<style lang="scss" scoped>
.flex-row {
  display: flex;
  align-items: center;
  justify-content: space-around;
}
.flex-column {
  display: flex;
  flex-flow: column;
  align-items: center;
  justify-content: space-around;
}
.tip-box {
  padding-top: 100px;
  width: 600px;
  h4 {
    text-align: center;
    padding-bottom: 20px;
  }
}
.tip-row {
  padding: 0 20px;
  .u-tip:nth-child(1) {
    margin-left: 50px;
  }
  .u-tip:nth-child(3) {
    margin-right: 50px;
  }
}
.tip-center {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.tip-column {
  width: 60px;
  padding: 10px 0;
}
.pd20 {
  margin-bottom: 80px;
}
</style>
