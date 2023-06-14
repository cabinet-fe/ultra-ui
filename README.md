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
