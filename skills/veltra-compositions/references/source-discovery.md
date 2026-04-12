# Source Discovery

## 目标

这个 skill 在其它项目里应先定位 `@veltra/compositions` 的来源，再决定读 workspace 源码还是安装包声明。

## 推荐定位流程

```bash
rg --files . | rg '(@veltra/compositions|packages/compositions|node_modules/.*/@veltra/compositions)'
```

```bash
rg -n '"@veltra/compositions"|name\": \"@veltra/compositions\"|exports|types' package.json node_modules/@veltra/compositions/package.json packages/compositions/package.json
```

## 读包的顺序

优先：

1. `src/index.ts`
2. 具体 `use-*/index.ts`

退化：

1. `dist/index.d.ts`
2. `dist/index.js`
3. `package.json.exports`

## 从消费方反推

如果包目录不好找，就从调用点反推：

```bash
rg -n "from '@veltra/compositions'|useFormComponent\\(|useModel\\(|useVirtual\\(|usePop\\(" .
```

先找真实 import，再回到包实现。
