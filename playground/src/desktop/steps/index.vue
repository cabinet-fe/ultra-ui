<template>
  <div class="demo">
    <section>
      <h3>横向</h3>
      <u-steps v-model:current="current" :items="items" />
      <div class="actions">
        <u-button size="small" :disabled="current === 0" @click="current--">上一步</u-button>
        <u-button
          size="small"
          type="primary"
          :disabled="current === items.length - 1"
          @click="current++"
        >
          下一步
        </u-button>
      </div>
    </section>

    <section>
      <h3>横向居中</h3>
      <u-steps v-model:current="current" :items="items" align-center />
    </section>

    <section>
      <h3>纵向</h3>
      <u-steps v-model:current="current" class="vertical" direction="vertical" :items="items">
        <template #content="{ item }">
          <span class="title">{{ item.label }}</span>
          <span class="desc">{{ item.desc }}</span>
        </template>
      </u-steps>
    </section>

    <section>
      <h3>颜色</h3>
      <u-steps
        :items="items"
        :current="1"
        align-center
        current-step-type="warning"
        finished-step-type="primary"
      />
    </section>
  </div>
</template>

<script setup lang="ts">
import { UButton, USteps } from '@veltra/desktop'
import { ref } from 'vue'

const current = ref(1)

const items = [
  { label: '填写资料', desc: '姓名、手机号与基础信息' },
  { label: '验证身份', desc: '短信或邮箱验证码' },
  { label: '确认提交', desc: '核对信息后进入审核' },
  { label: '完成', desc: '流程结束，等待结果' }
]
</script>

<style lang="scss" scoped>
.demo {
  display: flex;
  flex-direction: column;
  gap: 28px;

  h3 {
    margin: 0 0 12px;
    font-size: 13px;
    font-weight: 600;
    color: var(--u-text-color-title);
  }
}

.actions {
  display: flex;
  gap: 8px;
  margin-top: 12px;
}

.vertical {
  max-width: 420px;
}

.title,
.desc {
  display: block;
}

.desc {
  margin-top: 2px;
  font-weight: 400;
  color: var(--u-text-color-second);
}
</style>
