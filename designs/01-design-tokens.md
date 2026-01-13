# 设计令牌规范 (Design Tokens)

设计令牌是设计系统的原子单位，定义了颜色、尺寸、间距、字体等基础视觉属性。Ultra UI 使用 CSS 变量实现设计令牌，支持运行时主题切换。

## 命名规范

所有 CSS 变量遵循以下命名规则：

```
--{category}-{property}-{variant}
```

**示例：**

- `--color-primary` - 主色
- `--color-primary-light-5` - 主色亮化 50%
- `--text-color-main` - 主要文字颜色
- `--form-component-height-default` - 默认尺寸表单组件高度

## 尺寸体系

Ultra UI 采用三档尺寸体系，适用于不同场景：

| 尺寸 | 标识      | 适用场景           |
| ---- | --------- | ------------------ |
| 小号 | `small`   | 紧凑布局、辅助操作 |
| 默认 | `default` | 常规场景           |
| 大号 | `large`   | 突出展示、触摸友好 |

### 表单组件高度

| 尺寸    | CSS 变量                          | 值   |
| ------- | --------------------------------- | ---- |
| small   | `--form-component-height-small`   | 24px |
| default | `--form-component-height-default` | 32px |
| large   | `--form-component-height-large`   | 40px |

### 圆角

| 尺寸    | CSS 变量           | 值  | 适用场景       |
| ------- | ------------------ | --- | -------------- |
| small   | `--radius-small`   | 4px | 小型组件、标签 |
| default | `--radius-default` | 6px | 按钮、输入框   |
| large   | `--radius-large`   | 8px | 卡片、弹窗     |

## 间距体系

基于 **4px 的倍数** 构建间距系统，确保视觉节奏的一致性。

### 基础间距

| 尺寸    | CSS 变量        | 值   | 用途     |
| ------- | --------------- | ---- | -------- |
| small   | `--gap-small`   | 6px  | 紧凑间距 |
| default | `--gap-default` | 8px  | 常规间距 |
| large   | `--gap-large`   | 12px | 宽松间距 |

### 推荐间距值

| 等级 | 值   | 用途示例       |
| ---- | ---- | -------------- |
| 4xs  | 2px  | 最小微调间距   |
| 3xs  | 4px  | 图标与文字间距 |
| 2xs  | 6px  | 紧凑元素间距   |
| xs   | 8px  | 元素内部间距   |
| sm   | 12px | 相关元素间距   |
| md   | 16px | 段落间距       |
| lg   | 24px | 区块间距       |
| xl   | 32px | 大区块间距     |
| 2xl  | 48px | 页面级间距     |

## 阴影

| 层级 | CSS 变量组合 | 效果                         | 用途       |
| ---- | ------------ | ---------------------------- | ---------- |
| 基础 | `--shadow`   | 0 0 4px 1px rgba(0,0,0,0.1)  | 卡片、下拉 |
| 悬浮 | 自定义       | 0 2px 8px 0 rgba(0,0,0,0.15) | 悬浮态     |
| 弹出 | 自定义       | 0 4px 16px 0 rgba(0,0,0,0.2) | 弹窗、抽屉 |

### 阴影分解变量

```css
--shadow-x: 0; /* 水平偏移 */
--shadow-y: 0; /* 垂直偏移 */
--shadow-blur: 4px; /* 模糊半径 */
--shadow-spread: 1px; /* 扩散半径 */
--shadow-color: rgba(0, 0, 0, 0.1); /* 阴影颜色 */
```

## 边框

| 属性 | CSS 变量         | 亮色主题值        | 暗色主题值        |
| ---- | ---------------- | ----------------- | ----------------- |
| 颜色 | `--border-color` | #dcdfe6           | #404040           |
| 宽度 | `--border-width` | 1px               | 1px               |
| 样式 | `--border-style` | solid             | solid             |
| 组合 | `--border`       | 1px solid #dcdfe6 | 1px solid #404040 |

## 断点

用于响应式布局的断点定义：

| 断点 | CSS 变量          | 值     | 适用设备 |
| ---- | ----------------- | ------ | -------- |
| xs   | `--breakpoint-xs` | 600px  | 手机横屏 |
| sm   | `--breakpoint-sm` | 960px  | 平板     |
| md   | `--breakpoint-md` | 1280px | 小型桌面 |
| lg   | `--breakpoint-lg` | 1920px | 大型桌面 |

## 过渡动画

### 推荐时长

| 类型 | 时长  | 用途               |
| ---- | ----- | ------------------ |
| 快速 | 150ms | 颜色、透明度变化   |
| 标准 | 250ms | 大多数交互反馈     |
| 慢速 | 350ms | 复杂动画、页面过渡 |

### 推荐缓动函数

| 名称        | 值                             | 用途     |
| ----------- | ------------------------------ | -------- |
| ease-out    | `cubic-bezier(0, 0, 0.2, 1)`   | 进入动画 |
| ease-in     | `cubic-bezier(0.4, 0, 1, 1)`   | 退出动画 |
| ease-in-out | `cubic-bezier(0.4, 0, 0.2, 1)` | 状态切换 |

## 背景

### 层级背景色

用于构建界面层次感：

| 层级 | CSS 变量            | 亮色值  | 暗色值  | 用途       |
| ---- | ------------------- | ------- | ------- | ---------- |
| 底层 | `--bg-color-bottom` | #f5f5f5 | #0f0f0f | 页面背景   |
| 中层 | `--bg-color-middle` | #fafafa | #1a1a1a | 次级容器   |
| 顶层 | `--bg-color-top`    | #ffffff | #262626 | 卡片、弹窗 |
| 悬浮 | `--bg-color-hover`  | #f5f7fa | #303030 | 悬浮状态   |

### 背景滤镜

用于毛玻璃效果：

| 属性   | CSS 变量               | 值                        |
| ------ | ---------------------- | ------------------------- |
| 模糊   | `--bg-filter-blur`     | blur(16px)                |
| 饱和度 | `--bg-filter-saturate` | saturate(180%)            |
| 组合   | `--bg-filter`          | blur(16px) saturate(180%) |

## 使用示例

### SCSS 中使用

```scss
@use '../../styles/functions' as fn;

.my-component {
  // 使用单个变量
  color: fn.use-var(text-color, main);

  // 使用复合变量
  border: fn.use-var(border);

  // 使用尺寸变量
  height: fn.use-var(form-component-height, default);
}
```

### CSS 中直接使用

```css
.my-component {
  color: var(--text-color-main);
  border: var(--border);
  height: var(--form-component-height-default);
}
```

### JavaScript 中动态获取

```javascript
const primaryColor = getComputedStyle(
  document.documentElement
).getPropertyValue('--color-primary')
```
