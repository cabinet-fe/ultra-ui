<template>
  <div class="theme-demo">
    <div class="demo-content">
      <h2>主题配置演示</h2>
      <p>使用右侧的主题配置面板来实时调整主题样式</p>

      <div class="demo-section">
        <h3>按钮样式</h3>
        <div class="button-group">
          <button class="btn btn-primary">主要按钮</button>
          <button class="btn btn-success">成功按钮</button>
          <button class="btn btn-warning">警告按钮</button>
          <button class="btn btn-danger">危险按钮</button>
        </div>
      </div>

      <div class="demo-section">
        <h3>卡片样式</h3>
        <div class="demo-card">
          <h4>示例卡片</h4>
          <p>
            这是一个示例卡片，展示了当前主题的背景色、文字颜色、边框和阴影效果。
          </p>
        </div>
      </div>

      <div class="demo-section">
        <h3>表单样式</h3>
        <div class="form-group">
          <label>输入框：</label>
          <input type="text" placeholder="请输入内容" class="demo-input" />
        </div>
      </div>
    </div>

    <div class="theme-panel">
      <u-theme />
    </div>
  </div>
</template>

<script lang="ts" setup>
// 组件会自动注册，无需额外导入
</script>

<style scoped>
.theme-demo {
  display: flex;
  gap: 20px;
  padding: 20px;
  min-height: 100vh;
}

.demo-content {
  flex: 1;
  padding: 20px;
}

.theme-panel {
  flex-shrink: 0;
}

.demo-section {
  margin-bottom: 30px;
}

.demo-section h3 {
  color: var(--text-color-title);
  margin-bottom: 15px;
}

.button-group {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.btn {
  padding: 8px 16px;
  border: none;
  border-radius: var(--radius-default);
  cursor: pointer;
  font-size: var(--font-size-main-default);
  transition: all 0.2s ease;
}

.btn-primary {
  background-color: var(--color-primary);
  color: white;
}

.btn-primary:hover {
  background-color: var(--color-primary-dark-1);
}

.btn-success {
  background-color: var(--color-success);
  color: white;
}

.btn-success:hover {
  background-color: var(--color-success-dark-1);
}

.btn-warning {
  background-color: var(--color-warning);
  color: white;
}

.btn-warning:hover {
  background-color: var(--color-warning-dark-1);
}

.btn-danger {
  background-color: var(--color-danger);
  color: white;
}

.btn-danger:hover {
  background-color: var(--color-danger-dark-1);
}

.demo-card {
  background-color: var(--bg-color-top);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-default);
  padding: 20px;
  box-shadow: var(--shadow);
}

.demo-card h4 {
  color: var(--text-color-title);
  margin-bottom: 10px;
}

.demo-card p {
  color: var(--text-color-main);
  line-height: 1.5;
}

.form-group {
  display: flex;
  align-items: center;
  gap: 10px;
}

.form-group label {
  color: var(--text-color-main);
  font-weight: 500;
  min-width: 80px;
}

.demo-input {
  flex: 1;
  max-width: 300px;
  height: var(--form-component-height-default);
  padding: 0 12px;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-default);
  font-size: var(--font-size-main-default);
  background-color: var(--bg-color-top);
  color: var(--text-color-main);
}

.demo-input:focus {
  outline: none;
  border-color: var(--color-primary);
}

.demo-input::placeholder {
  color: var(--text-color-placeholder);
}
</style>
