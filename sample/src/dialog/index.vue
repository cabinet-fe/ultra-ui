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

    <div>
      <u-checkbox v-model="modal">模态</u-checkbox>
    </div>

    <u-button @click="visible = true">打开</u-button>

    <u-dialog
      v-model="visible"
      :modal="modal"
      style="width: 80%"
      title="对话框标题"
    >
      <u-card v-for="i in 2" :key="i">
        <u-card-cover
          src="http://5b0988e595225.cdn.sohucs.com/images/20190625/2a57bb7082f84e33b53dd79b30b949df.jpeg"
        />
      </u-card>

      <template #footer>
        <u-button type="primary" text @click="visible = false">取消</u-button>
        <u-pop-confirm
          @confirm="visible = false"
          title="确认删除吗asds sad asd"
        >
          <template #reference>
            <u-button type="primary">确认</u-button>
          </template>
        </u-pop-confirm>
      </template>
    </u-dialog>

    <u-button ref="buttonRef" @click="transition.toggle(a => !a)">
      移动
    </u-button>

    <u-button @click="visible2 = !visible2">弹出</u-button>

    <div
      style="width: 100px; height: 100px; background-color: #ccc"
      v-if="visible2"
      ref="boxRef"
    ></div>
  </div>
</template>

<script lang="ts" setup>
import { useTransition, type ButtonExposed } from 'ultra-ui'
import { computed, nextTick, shallowRef, watch } from 'vue'

const visible = shallowRef(false)
const modal = shallowRef(true)

const buttonRef = shallowRef<ButtonExposed>()
const buttonDom = computed(() => {
  return buttonRef.value?.el
})

const transition = useTransition('style', {
  target: buttonDom,
  enterTo: {
    transform: 'translate(100px, 0)'
  },
  enterActive: {
    transition: 'transform 0.3s'
  },
  leaveActive: {
    transition: 'transform 0.3s'
  }
})

const visible2 = shallowRef(false)

const boxRef = shallowRef<HTMLDivElement>()

const transition2 = useTransition('css', {
  name: 'slide-down',
  target: boxRef
})

watch(visible2, v => {
  if (v) {
    nextTick(() => {
      transition2.enter()
    })
  } else {
    transition2.leave()
  }
})
</script>

<style lang="scss" scoped>
.slide-down-enter-from,
.slide-down-leave-to {
  opacity: 0;
}

.slide-down-enter-active,
.slide-down-leave-active {
  transition: all 1s;
}

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
