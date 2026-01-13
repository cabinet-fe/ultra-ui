# 排版规范 (Typography)

良好的排版是界面可读性和美观度的基础。本规范定义了 Ultra UI 的字体、字号、行高、字重等排版属性。

## 字体族

### 主字体栈

```css
--font-family:
  Inter, 'Roboto', 'Segoe UI', -apple-system, BlinkMacSystemFont,
  'Microsoft YaHei', 'PingFang SC', sans-serif;
```

**字体优先级说明：**

| 顺序 | 字体               | 说明                             |
| ---- | ------------------ | -------------------------------- |
| 1    | Inter              | 首选西文字体，现代几何无衬线字体 |
| 2    | Roboto             | Google 设计的无衬线字体          |
| 3    | Segoe UI           | Windows 系统字体                 |
| 4    | -apple-system      | macOS/iOS 系统字体               |
| 5    | BlinkMacSystemFont | 旧版 Chrome on macOS             |
| 6    | Microsoft YaHei    | 微软雅黑，中文显示               |
| 7    | PingFang SC        | 苹方字体，macOS 中文             |
| 8    | sans-serif         | 兜底无衬线字体                   |

### 等宽字体

用于代码展示：

```css
font-family:
  'JetBrains Mono', 'Fira Code', 'SF Mono', Consolas, 'Liberation Mono', Menlo,
  monospace;
```

## 字号体系

Ultra UI 使用基于尺寸变体的字号系统：

### 标题字号

| 尺寸    | CSS 变量                    | 值   | 用途     |
| ------- | --------------------------- | ---- | -------- |
| small   | `--font-size-title-small`   | 16px | 紧凑标题 |
| default | `--font-size-title-default` | 16px | 常规标题 |
| large   | `--font-size-title-large`   | 18px | 大号标题 |

### 正文字号

| 尺寸    | CSS 变量                   | 值   | 用途     |
| ------- | -------------------------- | ---- | -------- |
| small   | `--font-size-main-small`   | 12px | 紧凑正文 |
| default | `--font-size-main-default` | 14px | 常规正文 |
| large   | `--font-size-main-large`   | 16px | 大号正文 |

### 辅助字号

| 尺寸    | CSS 变量                     | 值   | 用途     |
| ------- | ---------------------------- | ---- | -------- |
| small   | `--font-size-assist-small`   | 12px | 辅助信息 |
| default | `--font-size-assist-default` | 12px | 辅助信息 |
| large   | `--font-size-assist-large`   | 14px | 辅助信息 |

### 推荐字号表

除了动态字号外，以下是完整的字号参考：

| 等级 | 像素值 | rem      | 用途           |
| ---- | ------ | -------- | -------------- |
| xs   | 10px   | 0.625rem | 最小文字、角标 |
| sm   | 12px   | 0.75rem  | 辅助文字、标签 |
| base | 14px   | 0.875rem | 正文默认       |
| md   | 16px   | 1rem     | 大正文、小标题 |
| lg   | 18px   | 1.125rem | 二级标题       |
| xl   | 20px   | 1.25rem  | 一级标题       |
| 2xl  | 24px   | 1.5rem   | 页面标题       |
| 3xl  | 30px   | 1.875rem | 大标题         |
| 4xl  | 36px   | 2.25rem  | 超大标题       |

## 行高

| 类型 | 值  | 用途           |
| ---- | --- | -------------- |
| 紧凑 | 1.2 | 单行文本、按钮 |
| 标准 | 1.4 | 默认行高       |
| 宽松 | 1.6 | 段落文本       |
| 超松 | 2   | 特殊强调       |

**默认行高：** 1.4（定义于 html 元素）

## 字重

| 名称 | 值  | CSS 关键字 | 用途       |
| ---- | --- | ---------- | ---------- |
| 细体 | 300 | light      | 大标题装饰 |
| 常规 | 400 | normal     | 正文       |
| 中等 | 500 | medium     | 次要强调   |
| 粗体 | 600 | semibold   | 标题、按钮 |
| 加粗 | 700 | bold       | 重要强调   |

**默认字重：** 400 normal

## 文字颜色

| 类型   | CSS 变量                   | 亮色值  | 暗色值  | 用途         |
| ------ | -------------------------- | ------- | ------- | ------------ |
| 标题   | `--text-color-title`       | #303133 | #f0f0f0 | 标题文字     |
| 主要   | `--text-color-main`        | #606266 | #d9d9d9 | 正文         |
| 次要   | `--text-color-second`      | #979797 | #a6a6a6 | 次要信息     |
| 占位符 | `--text-color-placeholder` | #a8abb2 | #737373 | 输入提示     |
| 辅助   | `--text-color-assist`      | #c0c4cc | #595959 | 辅助信息     |
| 禁用   | `--text-color-disabled`    | #a8abb2 | #434343 | 禁用状态     |
| 白色   | `--text-color-white`       | #fff    | #fff    | 深色背景文字 |

## 标题层级

建议的标题使用规范：

| 层级 | HTML   | 字号    | 字重 | 用途                 |
| ---- | ------ | ------- | ---- | -------------------- |
| H1   | `<h1>` | 24-30px | 600  | 页面主标题，每页一个 |
| H2   | `<h2>` | 20-24px | 600  | 区块标题             |
| H3   | `<h3>` | 18-20px | 600  | 子区块标题           |
| H4   | `<h4>` | 16-18px | 600  | 小节标题             |
| H5   | `<h5>` | 14-16px | 600  | 列表标题             |
| H6   | `<h6>` | 12-14px | 600  | 最小标题             |

## 段落规范

### 段落间距

| 属性     | 推荐值            |
| -------- | ----------------- |
| 段落间距 | 1em (当前字号)    |
| 首行缩进 | 不推荐（Web环境） |

### 最佳行宽

| 类型 | 字符数 | 说明         |
| ---- | ------ | ------------ |
| 推荐 | 60-80  | 最佳阅读体验 |
| 最小 | 45     | 窄列布局     |
| 最大 | 90     | 宽屏显示     |

对于中文内容，建议每行 **35-45 个汉字**。

## 文本截断

### 单行截断

```scss
@mixin ellipsis {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
```

使用方法：

```scss
.title {
  @include m.ellipsis;
  max-width: 200px;
}
```

### 多行截断

```css
.multi-line-ellipsis {
  display: -webkit-box;
  -webkit-line-clamp: 3; /* 显示行数 */
  -webkit-box-orient: vertical;
  overflow: hidden;
}
```

## 字间距与字母间距

| 类型       | 属性           | 推荐值 | 用途       |
| ---------- | -------------- | ------ | ---------- |
| 字母间距   | letter-spacing | 0.02em | 大写文本   |
| 中文字间距 | letter-spacing | 0      | 中文正文   |
| 宽松字间距 | letter-spacing | 0.05em | 装饰性文本 |

## 使用示例

### 标题组件

```scss
.page-title {
  font-size: fn.use-var(font-size-title, large);
  font-weight: 600;
  color: fn.use-var(text-color, title);
  line-height: 1.2;
  margin-bottom: 16px;
}
```

### 正文段落

```scss
.paragraph {
  font-size: fn.use-var(font-size-main, default);
  color: fn.use-var(text-color, main);
  line-height: 1.6;

  & + & {
    margin-top: 1em;
  }
}
```

### 辅助文本

```scss
.helper-text {
  font-size: fn.use-var(font-size-assist, default);
  color: fn.use-var(text-color, second);
  line-height: 1.4;
}
```

## 无障碍考虑

1. **最小字号**: 不低于 12px，确保可读性
2. **颜色对比度**: 文字与背景对比度至少 4.5:1 (WCAG AA)
3. **避免全大写**: 长段文字不使用全大写
4. **行高充足**: 正文至少 1.4 行高
5. **响应式字号**: 在小屏幕上适当调整字号
