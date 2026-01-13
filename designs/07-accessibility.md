# 可访问性规范 (Accessibility)

可访问性确保所有用户都能有效使用 Ultra UI 组件。本规范遵循 WCAG 2.1 AA 标准。

## 核心原则

| 原则   | 含义               |
| ------ | ------------------ |
| 可感知 | 信息可被用户感知   |
| 可操作 | 界面可被用户操作   |
| 可理解 | 信息和操作可被理解 |
| 健壮性 | 兼容辅助技术       |

## 颜色与对比度

### 对比度要求

| 场景           | 最低要求 (AA) |
| -------------- | ------------- |
| 正文文字       | 4.5:1         |
| 大文字 (≥18px) | 3:1           |
| UI 组件边界    | 3:1           |

### 避免仅用颜色传达信息

```html
<!-- ✅ 正确 -->
<span style="color: red">* 必填</span>
```

## 键盘导航

### 焦点可见性

```scss
:focus-visible {
  outline: 2px solid fn.use-var(color, primary);
  outline-offset: 2px;
}
```

### 组件键盘支持

| 组件   | 按键         | 行为     |
| ------ | ------------ | -------- |
| Button | Enter, Space | 触发点击 |
| Select | ↑↓           | 切换选项 |
| Dialog | Esc          | 关闭     |
| Menu   | 方向键       | 导航     |

## ARIA 属性

### 常用状态属性

| 属性          | 用途     |
| ------------- | -------- |
| aria-disabled | 禁用状态 |
| aria-expanded | 展开状态 |
| aria-selected | 选中状态 |
| aria-invalid  | 校验失败 |

### 组件 ARIA 示例

**按钮：**

```html
<button aria-disabled="true">提交</button>
```

**输入框：**

```html
<label id="name-label">姓名</label>
<input aria-labelledby="name-label" aria-required="true" />
```

**弹窗：**

```html
<div role="dialog" aria-modal="true" aria-labelledby="dialog-title">
  <h2 id="dialog-title">确认</h2>
</div>
```

## 表单可访问性

每个表单控件必须有关联标签：

```html
<label for="email">邮箱</label> <input id="email" type="email" />
```

## 测试检查清单

- [ ] 仅用键盘能完成所有操作
- [ ] 焦点顺序符合逻辑
- [ ] 焦点始终可见
- [ ] 颜色对比度达标
- [ ] ARIA 属性正确使用
