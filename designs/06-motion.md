# 动效规范 (Motion)

动效是界面反馈和用户体验的重要组成部分。合理的动效能够引导用户注意力、提供操作反馈、创造流畅体验。

## 动效原则

### 1. 有目的 (Purposeful)

每个动效都应有明确目的，不做无意义的装饰性动画。

### 2. 快速响应 (Responsive)

动效应快速响应用户操作，避免让用户等待。

### 3. 自然流畅 (Natural)

遵循物理规律，使用自然的缓动函数。

### 4. 一致性 (Consistent)

相同类型的交互使用相同的动效模式。

## 时长规范

| 类型   | 时长      | 用途                 | CSS 变量建议        |
| ------ | --------- | -------------------- | ------------------- |
| 微交互 | 100-150ms | 颜色、透明度变化     | `--duration-fast`   |
| 标准   | 200-250ms | 大多数交互反馈       | `--duration-base`   |
| 复杂   | 300-350ms | 展开、收起、页面过渡 | `--duration-slow`   |
| 强调   | 400-500ms | 特殊强调动画         | `--duration-slower` |

### 距离与时长关系

| 移动距离  | 推荐时长  |
| --------- | --------- |
| < 100px   | 150-200ms |
| 100-300px | 200-300ms |
| > 300px   | 300-400ms |

## 缓动函数

### 标准缓动

| 名称        | 值                             | 用途             |
| ----------- | ------------------------------ | ---------------- |
| ease-out    | `cubic-bezier(0, 0, 0.2, 1)`   | 进入屏幕的元素   |
| ease-in     | `cubic-bezier(0.4, 0, 1, 1)`   | 离开屏幕的元素   |
| ease-in-out | `cubic-bezier(0.4, 0, 0.2, 1)` | 屏幕内移动的元素 |
| linear      | `linear`                       | 连续循环动画     |

### 特殊缓动

| 名称   | 值                                        | 用途     |
| ------ | ----------------------------------------- | -------- |
| spring | `cubic-bezier(0.175, 0.885, 0.32, 1.275)` | 弹性效果 |
| sharp  | `cubic-bezier(0.4, 0, 0.6, 1)`            | 快速响应 |
| smooth | `cubic-bezier(0.25, 0.1, 0.25, 1)`        | 平滑过渡 |

### 缓动可视化

```
ease-out (进入):     ease-in (离开):      ease-in-out:
      ___                 ___                ___
     /                       \              /   \
    /                         \            /     \
   /                           \          |       |
  /                             \        /         \
 /_______________            ___\      /___________ \
```

## 动画类型

### 1. 状态过渡

颜色、透明度、尺寸的变化。

```scss
.button {
  transition:
    background-color 0.25s ease,
    box-shadow 0.2s ease;

  &:hover {
    background-color: fn.use-var(color, primary, dark-1);
  }
}
```

### 2. 进入/退出

元素的出现和消失。

**淡入淡出：**

```scss
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.25s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
```

**缩放：**

```scss
.zoom-enter-active,
.zoom-leave-active {
  transition:
    opacity 0.25s ease,
    transform 0.25s ease;
}

.zoom-enter-from,
.zoom-leave-to {
  opacity: 0;
  transform: scale(0.95);
}
```

**滑入：**

```scss
.slide-up-enter-active,
.slide-up-leave-active {
  transition:
    opacity 0.3s ease-out,
    transform 0.3s ease-out;
}

.slide-up-enter-from,
.slide-up-leave-to {
  opacity: 0;
  transform: translateY(20px);
}
```

### 3. 展开/收起

高度或宽度的变化。

```scss
.collapse-enter-active,
.collapse-leave-active {
  transition: height 0.3s ease-in-out;
  overflow: hidden;
}

.collapse-enter-from,
.collapse-leave-to {
  height: 0;
}
```

### 4. 加载动画

持续循环的等待动画。

**旋转：**

```scss
@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.loading-spinner {
  animation: spin 1s linear infinite;
}
```

**脉冲：**

```scss
@keyframes pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

.loading-pulse {
  animation: pulse 1.5s ease-in-out infinite;
}
```

## 组件动效规范

### Button 按钮

| 交互 | 动效             |
| ---- | ---------------- |
| 悬浮 | 背景色过渡 250ms |
| 点击 | 波纹扩散效果     |
| 加载 | 图标旋转动画     |

### Dialog 弹窗

| 动作   | 动效                       |
| ------ | -------------------------- |
| 打开   | 淡入 + 缩放 (从 0.95 到 1) |
| 关闭   | 淡出 + 缩放 (从 1 到 0.95) |
| 最大化 | 尺寸和位置过渡 250ms       |

### Drawer 抽屉

| 方向 | 动效                  |
| ---- | --------------------- |
| 左侧 | translateX(-100%) → 0 |
| 右侧 | translateX(100%) → 0  |
| 时长 | 300ms ease-out        |

### Dropdown 下拉

| 动作 | 动效               |
| ---- | ------------------ |
| 展开 | 淡入 + 下滑 (10px) |
| 收起 | 淡出 + 上滑        |
| 时长 | 200ms              |

### Message/Notification 消息

| 动作 | 动效            |
| ---- | --------------- |
| 进入 | 从顶部/右侧滑入 |
| 退出 | 淡出 + 上滑     |
| 时长 | 300ms           |

### Loading 加载

| 类型   | 动效        |
| ------ | ----------- |
| 旋转   | 1s 循环     |
| 脉冲   | 1.5s 循环   |
| 骨架屏 | 渐变闪烁 2s |

### Menu 菜单

| 动作       | 动效              |
| ---------- | ----------------- |
| 悬浮       | 背景色过渡 150ms  |
| 展开子菜单 | 淡入 + 缩放 200ms |

### Tab 标签页

| 动作 | 动效             |
| ---- | ---------------- |
| 切换 | 下划线滑动 250ms |
| 内容 | 淡入淡出 200ms   |

## 减少动画

为尊重用户偏好，应支持 `prefers-reduced-motion` 媒体查询：

```scss
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

## 性能优化

### 推荐使用的属性

以下属性可触发 GPU 加速，性能更好：

| 属性      | 用途             |
| --------- | ---------------- |
| transform | 移动、缩放、旋转 |
| opacity   | 透明度           |

### 避免动画的属性

以下属性会触发重排，应避免用于动画：

| 属性           | 替代方案               |
| -------------- | ---------------------- |
| width/height   | transform: scale()     |
| top/left       | transform: translate() |
| margin/padding | transform: translate() |

### will-change 提示

对于复杂动画，可使用 `will-change` 提前通知浏览器：

```scss
.dialog {
  will-change: transform, opacity;
}
```

**注意：** 不要过度使用 `will-change`，会增加内存消耗。

## Vue Transition 封装

Ultra UI 提供预设的过渡组件：

```vue
<!-- 淡入淡出 -->
<u-animation type="fade">
  <div v-if="visible">Content</div>
</u-animation>

<!-- 缩放 -->
<u-animation type="zoom">
  <div v-if="visible">Content</div>
</u-animation>

<!-- 滑动 -->
<u-animation type="slide-up">
  <div v-if="visible">Content</div>
</u-animation>
```

## 动效检查清单

- [ ] 动画时长适中（不超过 400ms）
- [ ] 使用合适的缓动函数
- [ ] 使用 transform/opacity 优化性能
- [ ] 支持 prefers-reduced-motion
- [ ] 仅为有目的的交互添加动效
- [ ] 相同类型交互使用一致动效
- [ ] 进入和退出动画成对设计
