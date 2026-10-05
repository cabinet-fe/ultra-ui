<template>
  <div class="demo">
    <section>
      <h3>基础用法</h3>
      <div class="row">
        <UButton type="primary" @click="showBasic">确认 / 取消</UButton>
        <UButton @click="showOnlyConfirm">仅确认按钮</UButton>
      </div>
    </section>

    <section>
      <h3>快捷方法</h3>
      <div class="row">
        <UButton size="small" type="danger" @click="showDanger">danger</UButton>
        <UButton size="small" @click="showWarning">warning</UButton>
        <UButton size="small" @click="showSuccess">success</UButton>
      </div>
    </section>

    <section>
      <h3>标题与长文本</h3>
      <div class="row">
        <UButton size="small" @click="showTitled">带标题</UButton>
        <UButton size="small" @click="showLong">长内容</UButton>
      </div>
    </section>

    <section>
      <h3>回调</h3>
      <div class="row">
        <UButton size="small" @click="showWithPromise">Promise 形式</UButton>
        <span class="hint">最近操作：{{ lastAction || '无' }}</span>
      </div>
    </section>

    <section>
      <h3>背景滚动锁定</h3>
      <div class="row">
        <UButton size="small" @click="showLockDemo">打开确认框</UButton>
        <span class="hint">打开期间页面不可滚动，关闭后回到原滚动位置</span>
      </div>
    </section>
  </div>
</template>

<script lang="ts" setup>
import { messageConfirm, UButton } from '@veltra/mobile'
import { shallowRef } from 'vue'
import '@veltra/mobile/components/button/style'
import '@veltra/mobile/components/message-confirm/style'

function showBasic() {
  messageConfirm({
    title: '删除确认',
    message: '确定要删除这条记录吗？',
    cancelButtonText: '取消',
    onClosed: (action) => console.log('onClosed:', action)
  })
}

function showOnlyConfirm() {
  messageConfirm('已保存至草稿箱', { confirmButtonText: '知道了' })
}

function showDanger() {
  messageConfirm
    .danger('确认删除该文件吗？此操作不可撤销', { cancelButtonText: '取消' })
    .onClosed.then((action) => console.log('danger closed:', action))
}

function showWarning() {
  messageConfirm.warning('当前网络不稳定，建议稍后重试', { cancelButtonText: '暂不' })
}

function showSuccess() {
  messageConfirm.success('同步完成，是否查看结果？', { cancelButtonText: '以后再看' })
}

function showTitled() {
  messageConfirm({ title: '通知', message: '这是一个居中卡片形态的确认框。' })
}

function showLong() {
  messageConfirm({
    title: '服务协议',
    message: '长内容在 移动端视口内自动换行，卡片宽度受视口约束不会溢出屏幕边缘。'
  })
}

const lastAction = shallowRef('')

function showWithPromise() {
  messageConfirm({ message: '记录最近一次用户操作', cancelButtonText: '取消' }).onClosed.then(
    (action) => {
      lastAction.value = action
    }
  )
}

function showLockDemo() {
  messageConfirm({
    title: '滚动锁定',
    message: '确认框打开期间背景滚动被锁定，关闭后恢复原滚动位置。',
    cancelButtonText: '取消'
  })
}
</script>

<style lang="scss" scoped>
// 手机设备外壳视口内呈现，验证移动端密度与触控热区
.demo {
  display: flex;
  flex-direction: column;
  gap: 20px;

  h3 {
    margin: 0 0 8px;
    font-size: 13px;
    font-weight: 600;
    color: var(--u-text-color-title);
  }
}

.row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px 12px;
}

.hint {
  font-size: 13px;
  color: var(--u-text-color-second);
}
</style>
