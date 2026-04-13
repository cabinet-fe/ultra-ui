# Troubleshooting

## 组件没有自动导入

优先检查：

- `vite.config.ts` 是否真的注册了 `Components(...)`
- `Components` 是否真的包含 `resolvers: [VeltraDesktopUIResolver()]`
- 组件名是否符合 `U` + PascalCase 约定
- 模板里用的是不是 `@veltra/desktop` 组件，而不是业务组件或其它包导出的同名组件

如果项目里组件名不是 `UButton` 这类形式，resolver 根本不会命中。

## 组件导入了，但样式没进来

优先检查：

- 是否传了 `VeltraDesktopUIResolver({ importStyle: false })`
- `@veltra/desktop/components/<dir>/style` 是否能被当前包版本解析
- `@veltra/desktop` 发布包是否包含对应 `style.js` 与 CSS
- 是否有构建工具或别名把 `@veltra/desktop/components/...` 改写坏了

如果只在 build 失败，问题通常不在 resolver，而在 `@veltra/desktop` 的构建产物或 `exports`。

## dev 正常，build 丢样式

这是典型的条件导出差异问题。按这个顺序查：

1. 打开 `node_modules/@veltra/desktop/package.json`
2. 确认 `./*` 或相关子路径是否同时提供 `development` 与 `import`
3. 确认 `dist/components/<dir>/style.js` 是否存在
4. 确认 `dist/**/*.css` 是否被一起发布

如果 `development` 指向源码而 `import` 指向缺失的构建文件，dev 会正常，build 会出错。

## 子组件样式路径看起来“不对应”

这通常不是 bug，而是共目录子组件共享父组件样式入口。典型例子：

- `UButtonGroup` 复用 `button/style`
- `UCardHeader` 复用 `card/style`
- `UMenuItem` 复用 `menu/style`

需要完整映射表时，读取 [resolver-contract.md](resolver-contract.md)。

## 排错策略

- 先证明确实命中了 resolver，再判断样式 sideEffects 是否命中
- 先看消费项目安装产物，再看 workspace 源码
- 先看 `@veltra/desktop` 的 `exports` 和发布文件，再回头怀疑 `@veltra/vite`

这类问题里，真正出错的对象经常不是 resolver，而是被消费包的发布结构与条件导出。
