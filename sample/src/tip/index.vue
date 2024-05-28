<template>
  <div>
    <u-tip
      @click="countIncrease"
      content="左上左上左上左上左上左上左上左上左上左上左上左上左上左上左上左上左上左上左上左上左上左上左上左上左上左上左"
      position="top-start"
    >
      <p class="color-red">97586754412312313</p>
    </u-tip>
    <div style="height: 60vh"></div>
    <div class="tip-box">
      <!-- <div class="anime-test" ref="divRef">11111</div> -->
      <!-- <u-button @click="divRef.style.display = 'block'; transition.toggle(b => !b)">动画进入</u-button> -->
      <h4>Hover</h4>

      <div class="tip-row flex-row">
        <u-tip
          @click="countIncrease"
          content="上左上左上左上左上左上左上左上左上左上左上左上左上左上左上左上左上左上左上左上左上左上左上左上左上左上左上左上左上左上左上左上左上左上左上左上左上左上左上左上左上左上左上左上左上左上左上左上左上左上左上左上左上左上左上左上左上左上左上左上左上左上左上左上左上左上左"
          position="top-start"
          :customStyle="styleValue"
        >
          <u-button @click="countIncrease"
            >上左上左上左上左上左
            {{ count }}
          </u-button>
        </u-tip>
        <u-tip
          content="上中--------鼠标入tip区域"
          position="top"
          :mouse-enterable="false"
        >
          <u-button>鼠标不可进入tip区域</u-button>
        </u-tip>
        <u-tip
          content="上右上右上右上右上右上右上右上右上右上右上右上右上右上右上右上右上右上右上右上右上右上右上右上右上右上右上右上右上右上右上右上右上右上右上右上右上右上右上右上右上右上右上右上右上右上右上右上右上右上右上右上右上右上右上右上右上右上右上右上右上右上右上右上右"
          position="top-end"
        >
          <u-button>上右上右 Light</u-button>
        </u-tip>
      </div>
      <div class="tip-center">
        
        <div class="tip-column flex-column">
          <u-tip content="右上右上右上右上右上右上" position="right-start">
            <u-button>右上右上右上</u-button>
          </u-tip>
          <u-tip
            content="右中右中右中右中右中右中右中右中右中右中右中右中右中右中右中右中右中右中右中右中右中右中右中右中右中右中右中右中右中右中右中右中右中右中右中右中右中右中右中右中右中右中右中右中右中右中右中右中右中右中右中右中右中右中右中右中右中右中右中右中右中右中右中右中右中右中右中右中右中"
            position="right"
          >
            <u-button>右中右中右中右中</u-button>
          </u-tip>
          <u-tip
            content="右下右下右下右下右下右下右下右下右下右下右下右下右下右下右下右下右下右下右下右下右下右下右下右下右下右下右下右下右下右下右下右下右下右下右下右下右下右下右下右下右下右下右下右下右下右下右下右下右下右下右下右下右下右下右下右下右下右下右下右下右下右下右下右下右下右下右下右下右下右下"
            position="right-end"
          >
            <u-button>右下右下Light</u-button>
          </u-tip>
        </div>
        <div class="tip-column flex-column">
          <u-tip
            content="颠勺好厉害颠勺好厉害颠勺好厉害颠勺好厉害颠勺好厉害颠勺好厉害颠勺好厉害颠勺好厉害"
            position="left-start"
          >
            <u-button>左上左上左上</u-button>
          </u-tip>
          <u-tip
            content="金鹏火男宝宝会颠勺好厉害金鹏火男宝宝会颠勺好厉害金鹏火男宝宝会颠勺好厉害金鹏火男宝宝会颠勺好厉害金鹏火男宝宝会颠勺好厉害金鹏火男宝宝会颠勺好厉害金鹏火男宝宝会颠勺好厉害金鹏火男宝宝会颠勺好厉害金鹏火男宝宝会颠勺好厉害金鹏火男宝宝会颠勺好厉害金鹏火男宝宝会颠勺好厉害金鹏火男宝宝会颠勺好厉害金鹏火男宝宝会颠勺好厉害金鹏火男宝宝会颠勺好厉害金鹏火男宝宝会颠勺好厉害金鹏火男宝宝会颠勺好厉害金鹏火男宝宝会颠勺好厉害金鹏火男宝宝会颠勺好厉害金鹏火男宝宝会颠勺好厉害金鹏火男宝宝会颠勺好厉害金鹏火男宝宝会颠勺好厉害金鹏火男宝宝会颠勺好厉害金鹏火男宝宝会颠勺好厉害金鹏火男宝宝会颠勺好厉害金鹏火男宝宝会颠勺好厉害金鹏火男宝宝会颠勺好厉害金鹏火男宝宝会颠勺好厉害金鹏火男宝宝会颠勺好厉害金鹏火男宝宝会颠勺好厉害金鹏火男宝宝会颠勺好厉害金鹏火男宝宝会颠勺好厉害金鹏火男宝宝会颠勺好厉害金鹏火男宝宝会颠勺好厉害金鹏火男宝宝会颠勺好厉害金鹏火男宝宝会颠勺好厉害金鹏火男宝宝会颠勺好厉害金鹏火男宝宝会颠勺好厉害金鹏火男宝宝会颠勺好厉害金鹏火男宝宝会颠勺好厉害金鹏火男宝宝会颠勺好厉害金鹏火男宝宝会颠勺好厉害金鹏火男宝宝会颠勺好厉害金鹏火男宝宝会颠勺好厉害金鹏火男宝宝会颠勺好厉害金鹏火男宝宝会颠勺好厉害金鹏火男宝宝会颠勺好厉害金鹏火男宝宝会颠勺好厉害金鹏火男宝宝会颠勺好厉害金鹏火男宝宝会颠勺好厉害金鹏火男宝宝会颠勺好厉害金鹏火男宝宝会颠勺好厉害金鹏火男宝宝会颠勺好厉害金鹏火男宝宝会颠勺好厉害金鹏火男宝宝会颠勺好厉害"
            position="left"
          >
            <u-button>左中左中左中</u-button>
          </u-tip>
          <u-tip
            content="金鹏火男宝宝会颠勺好厉害金鹏火男宝宝会颠勺好厉害金鹏火男宝宝会颠勺好厉害金鹏火男宝宝会颠勺好厉害金鹏火男宝宝会颠勺好厉害金鹏火男宝宝会颠勺好厉害金鹏火男宝宝会颠勺好厉害金鹏火男宝宝会颠勺好厉害金鹏火男宝宝会颠勺好厉害金鹏火男宝宝会颠勺好厉害金鹏火男宝宝会颠勺好厉害金鹏火男宝宝会颠勺好厉害金鹏火男宝宝会颠勺好厉害金鹏火男宝宝会颠勺好厉害金鹏火男宝宝会颠勺好厉害金鹏火男宝宝会颠勺好厉害金鹏火男宝宝会颠勺好厉害金鹏火男宝宝会颠勺好厉害金鹏火男宝宝会颠勺好厉害金鹏火男宝宝会颠勺好厉害金鹏火男宝宝会颠勺好厉害金鹏火男宝宝会颠勺好厉害金鹏火男宝宝会颠勺好厉害金鹏火男宝宝会颠勺好厉害金鹏火男宝宝会颠勺好厉害金鹏火男宝宝会颠勺好厉害金鹏火男宝宝会颠勺好厉害金鹏火男宝宝会颠勺好厉害金鹏火男宝宝会颠勺好厉害金鹏火男宝宝会颠勺好厉害金鹏火男宝宝会颠勺好厉害金鹏火男宝宝会颠勺好厉害金鹏火男宝宝会颠勺好厉害金鹏火男宝宝会颠勺好厉害金鹏火男宝宝会颠勺好厉害金鹏火男宝宝会颠勺好厉害金鹏火男宝宝会颠勺好厉害金鹏火男宝宝会颠勺好厉害金鹏火男宝宝会颠勺好厉害金鹏火男宝宝会颠勺好厉害金鹏火男宝宝会颠勺好厉害金鹏火男宝宝会颠勺好厉害金鹏火男宝宝会颠勺好厉害金鹏火男宝宝会颠勺好厉害金鹏火男宝宝会颠勺好厉害金鹏火男宝宝会颠勺好厉害金鹏火男宝宝会颠勺好厉害金鹏火男宝宝会颠勺好厉害金鹏火男宝宝会颠勺好厉害金鹏火男宝宝会颠勺好厉害金鹏火男宝宝会颠勺好厉害金鹏火男宝宝会颠勺好厉害金鹏火男宝宝会颠勺好厉害金鹏火男宝宝会颠勺好厉害"
            position="left-end"
          >
            <u-button>左下左下 Light</u-button>
          </u-tip>
        </div>
      </div>
      <div class="tip-row flex-row">
        <u-tip
          content="下左下左下左下左下左下左下左下左下左下左下左下左下左下左下左下左下左下左下左下左下左下左下左下左下左下左下左下左下左下左下左下左下左下左下左下左下左下左下左下左下左下左下左下左下左下左下左下左下左下左下左下左下左下左下左下左下左下左下左下左下左下左下左下左下左下左下左下左下左下左下左下左下左下左下左下左下左"
          position="bottom-start"
        >
          <u-button>下左下左下左下左</u-button>
        </u-tip>
        <u-tip
          content="bottombottombottombottom"
          position="bottom"
        >
          <u-button>下中下中下中下中</u-button>
        </u-tip>
        <u-tip
          content="下右下右下右下右下右下右下右下右下右下右下右下右下右下右下右下右下右下右下右下右下右下右下右下右下右下右下右下右下右下右下右下右下右下右下右下右下右下右下右下右下右下右下右下右下右下右下右下右下右下右下右下右下右下右下右下右下右下右下右下右下右下右下右下右下右下右下右下右下右下右下右下右下右下右下右下右下右下右下右下右下右下右下右下右下右下右下右下右下右下右下右"
          position="bottom-end"
        >
          <u-button>下右下右 Light</u-button>
        </u-tip>
      </div>
      <br /><br /><br />
      <h4 class="pd20">Click</h4>
      <div class="tip-row flex-row">
        <u-tip
          :trigger="'click'"
          position="top-start"
          content="点击上左点击上左点击上左点击上左点击上左点击上左点击上左点击上左点击上左"
          click-close
        >
          <u-button>点击上左空白区域点击不可隐藏</u-button>
        </u-tip>
        <u-tip content="上中" :trigger="'click'">
          <u-button>点击上中</u-button>
        </u-tip>
        <u-tip content="上右" position="top-end" :trigger="'click'">
          <u-button>点击上右</u-button>
        </u-tip>
      </div>
      <br /><br /><br />
      <div class="tip-row flex-row">
        <u-tip
          :trigger="'click'"
          content="下左下左下左下左下左下左下左下左下左下左下左下左下左下左下左下左下左下左下左下左下左下左下左下左下左下左下左下左下左下左下左下左下左下左下左下左下左下左下左下左下左下左下左下左下左下左下左下左下左下左下左下左下左下左下左下左下左下左下左下左下左下左下左下左下左下左下左下左下左下左下左下左下左下左下左下左下左"
          position="bottom-start"
        >
          <u-button>点击下左下左下左下左</u-button>
        </u-tip>
        <u-tip content="下中" position="bottom" :trigger="'click'">
          <u-button @click="countIncrease">点击下中下中下中下中</u-button>
        </u-tip>
        <u-tip content="下右" position="bottom-end" :trigger="'click'">
          <u-button>点击下右下右 Light</u-button>
        </u-tip>
      </div>
      <div style="height: 100vh"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
// import { useTransition } from 'ultra-ui'
import { shallowReactive, shallowRef } from "vue"
const styleValue = shallowReactive({
  background: "linear-gradient(90deg, rgb(159, 229, 151), rgb(204, 229, 129))",
  color: "#fff",
  // display:'block'
})
// const divRef = shallowRef()
// const transition = useTransition('style', {
//   target: divRef,
//   enterToStyle: {
//     transform: 'translate(100px, 0)',
//     opacity: 1
//   },
//   transitionInStyle: {
//     transition: 'all 3s'
//   },
//   transitionOutStyle: {
//     transition: 'all 3s'
//   },

//   afterLeave() {
//     divRef.value.style.display = 'none'
//   }

// })

const count = shallowRef(0)

const countIncrease = () => {
  count.value++
}
</script>

<style lang="scss" scoped>
.color-red {
  color: red;
}


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
  width: max-content;
  padding: 10px 0;
  .u-tip {
    margin: 20px 0;
  }
}
.pd20 {
  margin-bottom: 80px;
}

.anime-test {
  display: none;
  opacity: 0;
}
</style>
