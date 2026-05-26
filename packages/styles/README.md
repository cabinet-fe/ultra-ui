# 样式系统

## 预置样式

### 导入所有预置样式

下面的代码一键导入所有预置 transition 过渡 css 类 和` normalize`，通常在你的 `main.ts` 中导入：

```ts main.ts 
import '@vltra/styles'
```


### 单独导入
如果对性能有要求，可以单独导入。例如：

- 在 `main.ts` 中导入 `normalize` 样式：

```ts
import '@veltra/styles/normalize'
```

- 在用到过渡效果的时候:

```ts
import '@veltra/styles/'
```

## scss 工具

本包提供了一些常用的 `scss` 工具，包括常用的 `mixins` 与 常用的 `functions`, 你还可以通过覆盖


## 主题加载以及切换
