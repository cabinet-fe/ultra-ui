# Source Discovery

## 目标

本 skill 被复制到其它项目后，先确认你看到的是：

- 图标库源码包
- 安装后的 `node_modules/@veltra/icons`
- 只有业务 import

## 推荐定位流程

```bash
rg --files . | rg '(@veltra/icons|packages/icons|node_modules/.*/@veltra/icons)'
```

```bash
rg -n "from '@veltra/icons|from '@veltra/icons/normal|from '@veltra/icons/colorful" .
```

## 如果有源码

优先看：

1. `src/svg/normal/` 与 `src/svg/colorful/`
2. `scripts/`
3. `src/normal.ts` 与 `src/colorful.ts`
4. `src/vue/`

## 如果只有安装包

优先看：

1. `package.json.exports`
2. `dist/normal.d.ts`
3. `dist/colorful.d.ts`
4. `dist/*.js`

没有源码并不妨碍识别可用图标名和导出面。

## 从业务侧反推最稳

当包目录复杂或被 hoist 时，先从业务 import 反推：

```bash
rg -n "ArrowLeft|Search|Loading|@veltra/icons" .
```

先拿到真实导入名，再回到包声明或源码。
