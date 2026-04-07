# sample：修复 estree-walker 与 CJS 解析冲突

## 补丁内容

`bun install` 将 `estree-walker@3` 提升到 `.bun/node_modules` 后，`@vitejs/plugin-vue` 通过 `createRequire` 加载 `vue/compiler-sfc` → `@vue/compiler-core` 在 CJS 路径下 `require('estree-walker')` 会命中 v3；v3 的 `package.json` `exports` 仅声明 `import`，无 `require`，Node 报 `ERR_PACKAGE_PATH_NOT_EXPORTED`，导致 `sample` 无法启动 Vite。

在仓库根 `package.json` 增加 `overrides`，将全树 `estree-walker` 固定为 `2.0.2`（与 `@vue/compiler-core` 声明一致，且提供 `require` 导出），`bun install` 后 `bun dev` 可正常拉起。

## 影响范围

- 修改文件: `package.json`、`bun.lock`
- 新增文件: 无
- 删除文件: 无
