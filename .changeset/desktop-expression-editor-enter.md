---
'@veltra/desktop': patch
---

修复 `UExpressionEditor` 手动按 Enter 换行丢失的问题。

- 浏览器对 contenteditable 的 Enter 默认行为是插入 `<br>`，而组件从 DOM 反推模型时只读取 `textContent`，`<br>` 无文本内容导致换行被静默丢弃（粘贴多行文本走 `onPaste` 保留 `\n`，故不受影响）。
- 现拦截 Enter（含 Shift+Enter）改为在光标处插入 `\n` 文本节点，与粘贴路径行为一致；IME 合成中用于确认候选词的 Enter 不拦截，mention / 重选面板打开时 Enter 仍优先由面板处理。
