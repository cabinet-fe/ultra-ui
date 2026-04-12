# Source Discovery

## 目标

在别的项目中使用本 skill 时，先确定 `@veltra/directives` 是源码依赖还是安装依赖，并顺手定位样式副作用入口。

## 推荐定位流程

```bash
rg --files . | rg '(@veltra/directives|packages/directives|node_modules/.*/@veltra/directives)'
```

```bash
rg -n '"@veltra/directives"|sideEffects|exports|style' package.json node_modules/@veltra/directives/package.json packages/directives/package.json
```

## 额外关注点

这个包除了指令实现，还要找：

- `src/index.ts`
- 各指令目录 `index.ts`
- `style.ts`
- `package.json.sideEffects`

如果消费项目通过样式副作用入口加载 ripple，继续查：

```bash
rg -n "@veltra/directives/.*/style|vRipple|vClickOutside|vFocus" .
```

## 只有安装包时的处理

优先阅读：

1. `package.json.exports`
2. `dist/index.d.ts`
3. `dist/**/style.*`
4. `dist/index.js`

只要安装包里还保留了样式入口和声明文件，这个 skill 仍然可用。
