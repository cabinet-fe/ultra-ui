<template>
  <div class="tip-box">
    <h4>Hover</h4>
    <div class="tip-row flex-row">
      <u-tip model-value="自定义样式" :customStyle="styleValue">
        <u-button>上左</u-button>
      </u-tip>
      <u-tip model-value="上中">
        <u-button>上中</u-button>
      </u-tip>
      <u-tip model-value="上右">
        <u-button>上右</u-button>
      </u-tip>
    </div>
    <div class="tip-center">
      <div class="tip-column flex-column">
        <u-tip model-value="右上">
          <u-button>右上</u-button>
        </u-tip>
        <u-tip model-value="右中">
          <u-button>右中</u-button>
        </u-tip>
        <u-tip model-value="右下">
          <u-button>右下</u-button>
        </u-tip>
      </div>
      <div class="tip-column flex-column">
        <u-tip model-value="左上">
          <u-button>左上</u-button>
        </u-tip>
        <u-tip model-value="左中">
          <u-button>左中</u-button>
        </u-tip>
        <u-tip model-value="左下">
          <u-button>左下</u-button>
        </u-tip>
      </div>
    </div>
    <div class="tip-row flex-row">
      <u-tip model-value="下左">
        <u-button>下左</u-button>
      </u-tip>
      <u-tip model-value="下中">
        <u-button>下中</u-button>
      </u-tip>
      <u-tip model-value="下右">
        <u-button>下右</u-button>
      </u-tip>
    </div>
    <h4 class="pd20">Click</h4>
    <div class="tip-row flex-row">
      <u-tip
        content="自定义样式"
        :customStyle="styleValue"
        :trigger-pop-up-mode="'click'"
      >
        <u-button>点击上左</u-button>
      </u-tip>
      <u-tip model-value="上中" :trigger-pop-up-mode="'click'">
        <u-button>点击上中</u-button>
      </u-tip>
      <u-tip model-value="上右" :trigger-pop-up-mode="'click'">
        <u-button>点击上右</u-button>
      </u-tip>
    </div>

    <div style="height: 100vh"></div>
  </div>
</template>

<script setup lang="ts">
import { shallowReactive } from 'vue'
const styleValue = shallowReactive({
  background: '#000',
  color: '#fff'
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
  width: 400px;
  h4 {
    text-align: center;
    padding-bottom: 20px;
  }
}
.tip-row {
  padding: 0 20px;
  .u-tip:nth-child(1) {
    padding-left: 50px;
  }
  .u-tip:nth-child(3) {
    padding-right: 50px;
  }
}
.tip-center {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.tip-column {
  width: 60px;
  height: 160px;
  padding: 10px 0;
}
.pd20 {
  padding: 20px;
}
</style>
