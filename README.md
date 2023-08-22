# ultra-ui

给你带来极致性能, 极致代码, 极致体验的 Vue3 组件库

## 注释友好

我们为代码添加了提示完备的注释

## SSR 支持

目前暂时不支持 SSR

- [] 待后续再支持

## 主题策略

css 的变量系统帮我们能完全解决了主题的问题

通过定义足够的主题变量, 再加上变量配置器, 足够支撑我们实现高度可定义的主题系统


```scss
@use 'ultra-ui/styles/functions' as fn;

.wrap {
  font-size: fn.use-var(font-size, main);
}


```

## 贡献指南

### 创建组件

在项目根目录下执行以下命令

```bash
pnpm gen
```

## 一些术语和API解释

### define开头的方法
define开头的方法绝大部分是用来做类型辅助的, 比如你使用表格组件时, 要求你传入一个列属性, 这时候你不知道列有哪些属性和方法, define开头的方法就派上了用场

下面是一个使用的示例

```ts
// 实际上 columns的值就是{ name: 'xxx', key: 'aa' }
const columns = defineTableColumns([
  { name: 'xxx', key: 'aa' }
])
```

