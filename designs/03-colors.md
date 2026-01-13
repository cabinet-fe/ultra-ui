# 颜色规范 (Colors)

颜色是品牌识别和用户体验的重要组成部分。Ultra UI 采用语义化的颜色系统，通过 CSS 变量实现主题切换。

## 颜色类型

Ultra UI 定义了 7 种语义化颜色类型：

| 类型   | 标识       | 亮色主题值 | 暗色主题值 | 语义               |
| ------ | ---------- | ---------- | ---------- | ------------------ |
| 品牌色 | `primary`  | #1E88E5    | #4f8ff7    | 主要操作、关键信息 |
| 成功色 | `success`  | #2ba471    | #52c41a    | 成功状态、正向反馈 |
| 警告色 | `warning`  | #e37318    | #faad14    | 警告提示、需注意   |
| 危险色 | `danger`   | #d54941    | #ff4d4f    | 错误状态、危险操作 |
| 信息色 | `info`     | #009688    | #13c2c2    | 辅助信息、提示     |
| 禁用色 | `disabled` | #f5f7fa    | #212020    | 禁用状态背景       |
| 默认色 | `default`  | #f1f5f9    | #595959    | 默认按钮等         |

## 颜色色阶

每种颜色自动生成亮化和暗化的色阶变体：

### 亮化色阶 (与白色混合)

| 等级    | CSS 变量格式             | 混合比例 | 用途           |
| ------- | ------------------------ | -------- | -------------- |
| light-1 | `--color-{type}-light-1` | 10%      | 微亮           |
| light-3 | `--color-{type}-light-3` | 30%      | 浅色           |
| light-5 | `--color-{type}-light-5` | 50%      | 中亮           |
| light-7 | `--color-{type}-light-7` | 70%      | 很浅           |
| light-9 | `--color-{type}-light-9` | 90%      | 极浅（背景色） |

### 暗化色阶 (与黑色混合)

| 等级   | CSS 变量格式            | 混合比例 | 用途         |
| ------ | ----------------------- | -------- | ------------ |
| dark-1 | `--color-{type}-dark-1` | 10%      | 微暗（悬浮） |
| dark-3 | `--color-{type}-dark-3` | 30%      | 浅暗         |
| dark-5 | `--color-{type}-dark-5` | 50%      | 中暗         |
| dark-7 | `--color-{type}-dark-7` | 70%      | 深色         |
| dark-9 | `--color-{type}-dark-9` | 90%      | 极暗         |

### Primary 色阶示例

| 变量名                    | 亮色主题值 | 用途     |
| ------------------------- | ---------- | -------- |
| `--color-primary-light-9` | #e8f4fd    | 极浅背景 |
| `--color-primary-light-7` | #b3d8f7    | 浅色背景 |
| `--color-primary-light-5` | #8fc4f2    | 选中背景 |
| `--color-primary-light-3` | #5aa9eb    | 次要色   |
| `--color-primary-light-1` | #3796e8    | 微亮     |
| `--color-primary`         | #1E88E5    | 标准色   |
| `--color-primary-dark-1`  | #1b7ace    | 悬浮色   |
| `--color-primary-dark-3`  | #155fa0    | 按下色   |
| `--color-primary-dark-5`  | #0f4573    | 深色     |
| `--color-primary-dark-7`  | #0a2a45    | 很深     |
| `--color-primary-dark-9`  | #040f18    | 极深     |

## 中性色

### 背景色

| 层级 | CSS 变量            | 亮色值  | 暗色值  | 用途       |
| ---- | ------------------- | ------- | ------- | ---------- |
| 底层 | `--bg-color-bottom` | #f5f5f5 | #0f0f0f | 页面背景   |
| 中层 | `--bg-color-middle` | #fafafa | #1a1a1a | 容器背景   |
| 顶层 | `--bg-color-top`    | #ffffff | #262626 | 卡片、弹窗 |
| 悬浮 | `--bg-color-hover`  | #f5f7fa | #303030 | 悬浮状态   |
| 黑色 | `--bg-color-black`  | #000000 | #000000 | 遮罩等     |

### 文字色

| 类型   | CSS 变量                   | 亮色值  | 暗色值  | 对比度(亮) |
| ------ | -------------------------- | ------- | ------- | ---------- |
| 标题   | `--text-color-title`       | #303133 | #f0f0f0 | 12.6:1     |
| 主要   | `--text-color-main`        | #606266 | #d9d9d9 | 7.0:1      |
| 次要   | `--text-color-second`      | #979797 | #a6a6a6 | 3.5:1      |
| 占位符 | `--text-color-placeholder` | #a8abb2 | #737373 | 2.8:1      |
| 辅助   | `--text-color-assist`      | #c0c4cc | #595959 | 2.1:1      |
| 禁用   | `--text-color-disabled`    | #a8abb2 | #434343 | 2.8:1      |
| 白色   | `--text-color-white`       | #ffffff | #ffffff | -          |

### 边框色

| 类型   | CSS 变量            | 亮色值  | 暗色值  |
| ------ | ------------------- | ------- | ------- |
| 默认   | `--border-color`    | #dcdfe6 | #404040 |
| 复选框 | `--checkbox-border` | #ccc    | #595959 |
| 单选框 | `--radio-border`    | #ccc    | #595959 |

## 功能色

### 状态色

| 状态 | 颜色类型  | 说明               |
| ---- | --------- | ------------------ |
| 成功 | `success` | 操作成功、通过验证 |
| 警告 | `warning` | 需要注意、风险提示 |
| 错误 | `danger`  | 操作失败、错误信息 |
| 信息 | `info`    | 普通提示、帮助信息 |

### 链接色

| 状态   | 推荐色值                  | 说明           |
| ------ | ------------------------- | -------------- |
| 默认   | `--color-primary`         | 未访问链接     |
| 悬浮   | `--color-primary-dark-1`  | 鼠标悬浮       |
| 按下   | `--color-primary-dark-3`  | 鼠标按下       |
| 已访问 | `--color-primary-light-3` | 已访问（可选） |

## 颜色使用原则

### 1. 语义优先

使用语义化颜色变量，而非硬编码颜色值：

```scss
// ✅ 推荐
.success-message {
  color: fn.use-var(color, success);
}

// ❌ 避免
.success-message {
  color: #2ba471;
}
```

### 2. 层次分明

使用不同层级的背景色区分内容层次：

```scss
.page {
  background: fn.use-var(bg-color, bottom);

  .card {
    background: fn.use-var(bg-color, top);
  }
}
```

### 3. 状态一致

同类型交互使用一致的颜色变化：

| 状态 | 颜色变化 |
| ---- | -------- |
| 默认 | 基础色   |
| 悬浮 | dark-1   |
| 按下 | dark-3   |
| 禁用 | light-5  |

### 4. 对比度保证

确保文字与背景有足够对比度：

| 场景           | 最低对比度 | 标准     |
| -------------- | ---------- | -------- |
| 正文           | 4.5:1      | WCAG AA  |
| 大文字 (18px+) | 3:1        | WCAG AA  |
| 增强           | 7:1        | WCAG AAA |

## 主题适配

### 颜色计算

Ultra UI 使用以下方法生成色阶：

```typescript
// 混合颜色函数
function mixColor(color1: string, color2: string, weight: number): string {
  // RGB 通道线性插值
  return interpolatedColor
}

// 生成亮化色阶
const light5 = mixColor(primaryColor, '#fff', 0.5)

// 生成暗化色阶
const dark5 = mixColor(primaryColor, '#000', 0.5)
```

### 暗色主题考虑

暗色主题中：

- 主色调适当提亮，保证在深色背景上的可见性
- 阴影使用浅色增强层次感
- 边框适当加深，增强分隔效果

## 使用示例

### 按钮颜色

```scss
.button-primary {
  background-color: fn.use-var(color, primary);
  color: fn.use-var(text-color, white);

  &:hover {
    background-color: fn.use-var(color, primary, dark-1);
  }

  &:active {
    background-color: fn.use-var(color, primary, dark-3);
  }

  &:disabled {
    background-color: fn.use-var(color, primary, light-5);
  }
}
```

### 表单验证

```scss
.form-item {
  &.is-error {
    .input {
      box-shadow: inset 0 0 0 1px fn.use-var(color, danger);
    }

    .error-message {
      color: fn.use-var(color, danger);
    }
  }

  &.is-success {
    .input {
      box-shadow: inset 0 0 0 1px fn.use-var(color, success);
    }
  }
}
```

### 消息提示

```scss
.message {
  @each $type in (success, warning, danger, info) {
    &--#{$type} {
      background-color: fn.use-var(color, $type, light-9);
      border: 1px solid fn.use-var(color, $type, light-5);
      color: fn.use-var(color, $type);
    }
  }
}
```

## 无障碍检查清单

- [ ] 所有文字与背景对比度 ≥ 4.5:1
- [ ] 交互元素边界对比度 ≥ 3:1
- [ ] 不单独依赖颜色传达信息
- [ ] 禁用状态仍有足够辨识度
- [ ] 在灰度模式下仍可区分不同状态
