# UEmpty - 空状态

## 布局说明（重要）

`UEmpty` 根元素是 **`display: inline-block`**，自身不会撑满容器也不会自动水平居中。直接放进块级容器时会靠左对齐——请务必在外层容器中居中它，例如：

```vue
<div style="text-align: center">
  <u-empty text="暂无数据" />
</div>
```

或 flex 容器：`display: flex; justify-content: center`（垂直居中再加 `align-items: center`）。

## 类型文件

见 `./types.d.ts`

## 示例

见 `./examples.md`
