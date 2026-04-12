# Source Discovery

## 目标

这个 skill 不应默认消费方仍然持有当前 monorepo。被复制到其它项目后，先判断能看到的是哪一种形态：

- workspace 形式接入 `@veltra/desktop`
- `node_modules/@veltra/desktop` 安装包
- 只有声明文件、编译代码和业务侧 import

## 推荐定位流程

先找包本身：

```bash
rg --files . | rg '(@veltra/desktop|packages/desktop|node_modules/.*/@veltra/desktop)'
```

再找真实消费点：

```bash
rg -n "from '@veltra/desktop'|from '@veltra/desktop/|<u-[a-z-]+" .
```

再找样式副作用入口：

```bash
rg -n "@veltra/desktop/components/.*/style|style\\.ts" .
```

## 按存在形态选择分析路径

### 情况 1：有 workspace 源码

优先读：

1. `src/index.ts`
2. `src/components/index.ts`
3. `src/types/index.ts`
4. 目标组件目录
5. 目标类型文件

### 情况 2：只有安装包

优先读：

1. `package.json.exports`
2. `dist/index.d.ts`
3. `dist/types/index.d.ts` 或对应组件声明
4. `dist/components/**/style.js`
5. 已编译 `dist/components/**`

如果安装包保留 `development -> src/*` 条件，也可以顺着它找源码。

### 情况 3：包都不好找，只看到业务使用

从业务代码反推：

- 先找 import
- 再找具体组件名
- 再看类型引用和样式入口

例如：

```bash
rg -n "UButton|USelect|UTable|UTheme|@veltra/desktop" .
```

## 找不到 playground 时怎么办

在别的项目里通常没有原仓库的 `playgrounds/desktop`。这时：

- 优先读业务侧真实用例
- 再读类型声明和组件 props
- 最后把当前 skill 里的 catalog / authoring 作为结构参考

不要把“没有 playground”当成无法理解组件。
