# 死代码与残留

重构与新功能都适用：引入过的符号/样式，不用就删。

## 反例：重构后旧路径残留

```ts
// 已改用 fetchUserList，旧方法仍留着
async function getUsers() { /* ... */ }

async function fetchUserList() { /* ... */ }
```

```scss
// 模板已不用 .old-panel
.old-panel { padding: 16px; }
.user-panel { padding: 16px; }
```

## 正例

只保留 `fetchUserList` 与 `.user-panel`；删掉无引用函数、import、样式。

## 反例：新功能顺手留下「备用」

```ts
const DEBUG = false
function logDebug() { if (DEBUG) console.log(...) } // 从未调用

// 复制组件时带来的未使用 props / emit
```

## 正例

不需要就不写；复制代码后立刻删未用 props、emit、import。

## Pass B 自检（做完再收工）

- [ ] 本次文件是否还有未引用的函数 / 变量 / 类型 / import
- [ ] 模板里是否还有无对应 DOM 的 class / 样式块
- [ ] 是否留下注释掉的大段旧实现 → 删，靠 git 回滚
