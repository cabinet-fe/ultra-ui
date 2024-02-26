<template>
  <div>
    <div>
      <p>对话框是是常用的交互型组件。</p>

      <p>在过去对话框有一些痛点：</p>

      <p>
        1. 在刚进入页面时还没打开弹框数据也会先渲染，
        只能在组件外部用v-if配合使用，而且会有每一次打开都会重新渲染数据渲染的问题
      </p>

      <p>2. 美观度不好</p>
    </div>

    <u-button @click="visible = true">打开</u-button>

    <u-dialog v-model="visible" style="width: 900px" title="对话框标题">
      <u-card v-for="i in 2" :key="i">
        <u-card-cover
          src="http://5b0988e595225.cdn.sohucs.com/images/20190625/2a57bb7082f84e33b53dd79b30b949df.jpeg"
        />
      </u-card>

      <template #footer>
        <u-button type="primary" text @click="visible = false">取消</u-button>
        <u-button type="primary" @click="visible = false">确认</u-button>
      </template>
    </u-dialog>

    <div class="box">
      <section class="section1">
        <p>1</p>
      </section>
      <section class="section2">
        <p>2</p>
        <p>2</p>
        <p>2</p>
        <p>2</p>
        <p>2</p>
        <p>2</p>
      </section>
      <section class="section3">
        <p>3</p>
      </section>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { shallowRef } from 'vue'

const visible = shallowRef(false)
</script>

<style lang="scss" scoped>
.box {
  display: flex;
  flex-direction: column;
  max-height: 200px;
  overflow: auto;
  border: 1px solid #ccc;

  p {
    height: 32px;
    margin: 0;
  }
}

.section1 {
  background-color: #ccc;
  flex-shrink: 0;

}
.section2 {
  background-color: cadetblue;
  flex-grow: 1;
  overflow: auto;
}
.section3 {
  background-color: #ccc;
  flex-shrink: 0;
}
</style>
