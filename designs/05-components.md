# 组件设计指南 (Component Guidelines)

本文档定义了 Ultra UI 组件的设计规范和开发指南，确保所有组件风格统一、可维护。

## 组件分类

Ultra UI 组件按功能分为以下类别：

| 分类     | 组件                                   | 说明             |
| -------- | -------------------------------------- | ---------------- |
| 基础     | Button, Icon, Text                     | 最基本的 UI 单元 |
| 表单     | Input, Select, Checkbox, Radio, Switch | 数据输入         |
| 数据展示 | Table, List, Card, Tree, Badge         | 数据呈现         |
| 反馈     | Message, Notification, Dialog, Loading | 用户反馈         |
| 导航     | Menu, Tabs, Paginator, Steps           | 页面导航         |
| 布局     | Layout, Grid                           | 页面结构         |
| 其他     | Dropdown, ContextMenu, Tip             | 辅助功能         |

## 组件结构

### 文件组织

每个组件遵循统一的目录结构：

```
components/
└── button/
    ├── index.ts          # 导出入口
    ├── button.vue        # 组件主体
    ├── button.ts         # Props 定义
    ├── style.scss        # 组件样式
    └── helper.ts         # 辅助函数（可选）
```

### BEM 命名规范

Ultra UI 采用 BEM (Block Element Modifier) 命名规范：

```
.u-{block}
.u-{block}__{element}
.u-{block}--{modifier}
.u-{block}__{element}--{modifier}
```

**示例：**

```scss
.u-button {
} // Block
.u-button__icon {
} // Element
.u-button--primary {
} // Modifier
.u-button--color-primary {
} // Modifier with value
.u-button.is-disabled {
} // State
```

### 状态类

使用 `is-*` 前缀表示状态：

| 状态   | 类名           | 说明     |
| ------ | -------------- | -------- |
| 禁用   | `.is-disabled` | 不可交互 |
| 加载中 | `.is-loading`  | 正在加载 |
| 激活   | `.is-active`   | 已激活   |
| 选中   | `.is-checked`  | 已选中   |
| 聚焦   | `.is-focus`    | 获得焦点 |
| 展开   | `.is-expanded` | 已展开   |
| 隐藏   | `.is-hidden`   | 已隐藏   |

## 尺寸体系

所有可调整大小的组件支持三档尺寸：

| 尺寸    | 类名            | 表单组件高度 | 字号 | 适用场景 |
| ------- | --------------- | ------------ | ---- | -------- |
| small   | `.u-*--small`   | 24px         | 12px | 紧凑布局 |
| default | `.u-*--default` | 32px         | 14px | 常规场景 |
| large   | `.u-*--large`   | 40px         | 16px | 触摸友好 |

### 尺寸实现

```scss
@include m.b(button) {
  @include m.size using ($size) {
    height: fn.use-var(form-component-height, $size);
    font-size: fn.use-var(font-size-main, $size);
  }
}
```

## 交互状态

### 通用状态

| 状态 | 视觉变化      | 触发条件      |
| ---- | ------------- | ------------- |
| 默认 | 基础样式      | 无交互        |
| 悬浮 | 颜色加深/阴影 | 鼠标悬停      |
| 按下 | 颜色更深      | 鼠标按下      |
| 聚焦 | 焦点轮廓      | 键盘导航      |
| 禁用 | 淡化/灰度     | disabled 属性 |
| 加载 | 加载动画      | loading 属性  |

### 实现示例

```scss
.u-button {
  background-color: fn.use-var(color, primary);
  transition: background-color 0.25s;

  &:hover:not(.is-disabled) {
    background-color: fn.use-var(color, primary, dark-1);
  }

  &:active:not(.is-disabled) {
    background-color: fn.use-var(color, primary, dark-3);
  }

  &.is-disabled {
    background-color: fn.use-var(color, primary, light-5);
    cursor: not-allowed;
  }
}
```

## 组件设计规范

### Button 按钮

| 属性     | 规范                     |
| -------- | ------------------------ |
| 高度     | 24px / 32px / 40px       |
| 圆角     | `--radius-default` (6px) |
| 内边距   | 0 0.8em                  |
| 最小宽度 | 无                       |
| 图标间距 | `--gap-small` (6px)      |

**变体：**

- 默认 (default)
- 主要 (primary)
- 成功 (success)
- 警告 (warning)
- 危险 (danger)
- 文本 (text)
- 朴素 (plain)
- 圆形 (circle)

### Input 输入框

| 属性   | 规范               |
| ------ | ------------------ |
| 高度   | 24px / 32px / 40px |
| 圆角   | 对应尺寸圆角       |
| 边框   | 1px inset shadow   |
| 内边距 | gap / 2 水平       |

**状态边框色：**

- 默认：`--border-color`
- 悬浮：`--color-primary`
- 聚焦：`--color-primary`
- 错误：`--color-danger`
- 禁用：`--border-color` + 灰色背景

### Card 卡片

| 属性   | 规范                     |
| ------ | ------------------------ |
| 圆角   | `--radius-default` (6px) |
| 背景   | `--bg-color-top`         |
| 阴影   | `--shadow`               |
| 内边距 | 对应尺寸 gap             |

**结构：**

```
┌─────────────────────┐
│      Header         │ ← 可选，带底部边框
├─────────────────────┤
│                     │
│      Content        │
│                     │
├─────────────────────┤
│      Action         │ ← 可选，带顶部边框
└─────────────────────┘
```

### Dialog 弹窗

| 属性     | 规范                            |
| -------- | ------------------------------- |
| 圆角     | `--radius-large` (8px)          |
| 最大高度 | 90vh                            |
| 头部高度 | 49px                            |
| 背景     | `--bg-color-middle` (头部/底部) |
| 遮罩     | rgba(0,0,0,0.32)                |

**结构：**

```
┌─────────────────────────────────┐
│  [○] [○] [○]     标题           │ ← Header 49px
├─────────────────────────────────┤
│                                 │
│          主体内容               │ ← Body
│                                 │
├─────────────────────────────────┤
│              [取消] [确定]       │ ← Footer
└─────────────────────────────────┘
```

### Table 表格

| 属性     | 规范                   |
| -------- | ---------------------- |
| 边框色   | `--table-border-color` |
| 表头背景 | `--table-header-bg`    |
| 斑马纹   | `--table-stripe-bg`    |
| 行悬浮   | `--table-hover-bg`     |

### Menu 菜单

| 属性   | 规范               |
| ------ | ------------------ |
| 项高度 | 32px / 44px / 56px |
| 背景   | `--menu-bg-color`  |
| 悬浮   | `--menu-hover-bg`  |
| 激活   | `--menu-active-bg` |

## 组件 Props 设计

### 命名规范

| 类型 | 命名约定         | 示例                         |
| ---- | ---------------- | ---------------------------- |
| 布尔 | is/has/can/show  | disabled, loading, clearable |
| 尺寸 | size             | size="small"                 |
| 类型 | type             | type="primary"               |
| 值   | value/modelValue | v-model                      |
| 回调 | on\*             | onClose                      |

### 通用 Props

大多数组件应支持：

```typescript
interface CommonProps {
  size?: 'small' | 'default' | 'large'
  disabled?: boolean
  class?: string | object | array
  style?: string | object
}
```

### 表单组件 Props

```typescript
interface FormComponentProps {
  modelValue?: any
  disabled?: boolean
  readonly?: boolean
  placeholder?: string
  clearable?: boolean
  size?: 'small' | 'default' | 'large'
}
```

## 无障碍要求

### 键盘导航

| 组件   | 支持按键             |
| ------ | -------------------- |
| Button | Enter, Space         |
| Input  | 标准输入             |
| Select | 上下箭头, Enter, Esc |
| Dialog | Tab 陷阱, Esc 关闭   |
| Menu   | 上下左右箭头         |

### ARIA 属性

| 场景 | 属性                       |
| ---- | -------------------------- |
| 禁用 | aria-disabled="true"       |
| 展开 | aria-expanded="true/false" |
| 选中 | aria-selected="true"       |
| 必填 | aria-required="true"       |
| 描述 | aria-describedby           |
| 错误 | aria-invalid="true"        |

### 焦点管理

- 弹出层打开时移动焦点到内部
- 弹出层关闭时恢复焦点
- Tab 键在弹出层内循环
- 提供 Esc 键关闭

## 响应式适配

### 断点系统

```scss
@include m.xs {
  /* < 600px */
}
@include m.sm {
  /* 600px - 960px */
}
@include m.md {
  /* 960px - 1280px */
}
@include m.lg {
  /* > 1280px */
}
```

### 组件响应策略

| 组件   | 响应策略           |
| ------ | ------------------ |
| Dialog | 小屏全屏显示       |
| Table  | 横向滚动或卡片模式 |
| Menu   | 折叠为抽屉         |
| Grid   | 调整列数           |

## 代码规范

### SCSS 导入

```scss
@use 'sass:map';
@use '../../styles/mixins' as m;
@use '../../styles/vars';
@use '../../styles/functions' as fn;
```

### 组件根样式

```scss
$root-name: button;

@include m.b($root-name) {
  // 基础样式

  @include m.size using ($size) {
    // 尺寸变体
  }

  @include m.is(disabled) {
    // 状态样式
  }

  @include m.e(icon) {
    // 子元素样式
  }

  @include m.m(primary) {
    // 修饰符样式
  }
}
```

## 设计检查清单

- [ ] 支持三档尺寸
- [ ] 使用设计令牌变量
- [ ] 遵循 BEM 命名
- [ ] 处理所有交互状态
- [ ] 支持禁用状态
- [ ] 提供键盘导航
- [ ] 添加 ARIA 属性
- [ ] 考虑暗色主题
- [ ] 过渡动画平滑
- [ ] 颜色对比度达标
