# 修复组件黑边框与过度圆角

## 补丁内容

- 用户反馈组件渲染非常丑陋。经查是因为将渲染标签由 `li` 和 `div` 换成了 `button`，但没有清除 `button` 自带的默认边框 (`border`) 和轮廓 (`outline`)，导致页面上的标签页呈现出类似线框图的粗糙黑边。
- 将原本为了"胶囊形状"硬编码的 `$list-radius: 9999px` 和 `$item-radius: 9999px` 还原为跟随主题的常规圆角 `fn.use-var(radius, default)`，使得水平和垂直模式下的 UI 更加接近标准的 Shadcn 风格，不再表现出怪异的长条胶囊状。

## 影响范围

- 修改文件: `/packages/desktop/src/components/tabs/style.scss`
