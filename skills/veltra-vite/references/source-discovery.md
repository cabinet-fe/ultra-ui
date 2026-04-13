# Source Discovery

## 目标

skill 被安装到其它项目后，先判断你手里是：

- workspace 源码
- 安装到 `node_modules` 的包
- 只有 `dist` 和 `.d.ts`

不要默认存在当前仓库里的 `packages/vite`。

## 推荐定位流程

先找包与相关配置：

```bash
rg --files . | rg '(@veltra/vite|@veltra/desktop|vite\\.config|unplugin-vue-components)'
```

再确认依赖声明与版本来源：

```bash
rg -n '"@veltra/vite"|"@veltra/desktop"|"unplugin-vue-components"' package.json node_modules/@veltra/vite/package.json node_modules/@veltra/desktop/package.json
```

如果项目是 monorepo，再查 workspace 包目录：

```bash
rg -n '"name": "@veltra/vite"|"name": "@veltra/desktop"' .
```

## 必查文件

- `vite.config.ts` 或等价配置文件
- `node_modules/@veltra/vite/package.json`
- `node_modules/@veltra/desktop/package.json`
- `node_modules/@veltra/vite/src/resolver.ts` 或 `dist/index.mjs`
- `node_modules/@veltra/vite/dist/index.d.mts`

## 没有源码时怎么退化

如果只有安装包：

- 先看 `package.json.exports`
- 再看 `.d.ts` 确认导出 API
- 再看 `dist/index.mjs` 还原 resolver 行为

只要还能拿到 `package.json`、`dist` 和类型声明，就足够分析集成问题；不要把“没有 monorepo 源码”误判成“无法排查”。
