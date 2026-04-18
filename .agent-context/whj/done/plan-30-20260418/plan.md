# 修复 @veltra/\* 包 exports 条件顺序，让 development 条件真正生效

> 状态: 已执行

## 目标

消费方（`@veltra/desktop`、`playgrounds/desktop` 等）已在 `tsconfig.json` 配置 `customConditions: ["development"]`，期望在 IDE / `tsc` 解析 `@veltra/*` 工作区内部包时落到源码（`src/*.ts`）而非产物（`dist/*.d.ts` + `dist/*.js`）。

当前所有 `@veltra/*` 包 `package.json` 的 `exports` 条件顺序均为：

```json
{
  "types": "./dist/index.d.ts",
  "development": "./src/index.ts",
  "import": "./dist/index.js"
}
```

TypeScript 在解析 `exports` 时按键的声明顺序匹配，`types` 条件默认一直激活且排在最前，所以 `development` 条件永远抢不到，IDE「转到定义」/ 类型悬浮始终跳到 `dist/*.d.ts`。

目的：把 `development` 条件在每个条件分支中排到 `types` / `import` / `default` 之前，使激活 `development` 的消费者直接命中源码 `.ts`，同时不破坏外部发布消费者（未激活 `development` 条件）的产物解析，也不影响 Vite 生产构建、Node 运行时、Sass 导入等路径。

## 内容

> 统一规则：在每个存在 `types` / `import` / `default` 键的 `exports` 分支中，把 `development` 这一条**移到所有其它条件之前**作为首键；分支内仅放源码路径的 scss 分支无需改动（`sass` 键已先于 `development`，但指向的同是 `.scss` 源文件，无优先级冲突）。

### 1. `packages/compositions/package.json`

改 `exports["."]` 为：

```json
"exports": {
  ".": {
    "development": "./src/index.ts",
    "types": "./dist/index.d.ts",
    "import": "./dist/index.js"
  }
}
```

### 2. `packages/directives/package.json`

改 `exports["."]` 与 `exports["./*"]` 两个分支：

```json
"exports": {
  ".": {
    "development": "./src/index.ts",
    "types": "./dist/index.d.ts",
    "import": "./dist/index.js"
  },
  "./*": {
    "development": "./src/*",
    "types": "./dist/*",
    "import": "./dist/*"
  }
}
```

### 3. `packages/utils/package.json`

改 `exports["."]` 与 `exports["./*"]`：

```json
"exports": {
  ".": {
    "development": "./src/index.ts",
    "types": "./dist/index.d.ts",
    "import": "./dist/index.js"
  },
  "./*": {
    "development": "./src/*",
    "types": "./dist/*",
    "import": "./dist/*"
  }
}
```

### 4. `packages/icons/package.json`

改三个分支 `.` / `./normal` / `./colorful`：

```json
"exports": {
  ".": {
    "development": "./src/index.ts",
    "types": "./dist/index.d.ts",
    "import": "./dist/index.js"
  },
  "./normal": {
    "development": "./src/normal.ts",
    "types": "./dist/normal.d.ts",
    "import": "./dist/normal.js"
  },
  "./colorful": {
    "development": "./src/colorful.ts",
    "types": "./dist/colorful.d.ts",
    "import": "./dist/colorful.js"
  }
}
```

### 5. `packages/styles/package.json`

仅改含有 `types` 的两个分支 `.` 和 `./theme`，其它 SCSS 分支（`./normalize`、`./mixins`、`./vars`、`./functions`、`./anime/*`、`./*`）**保持不变**（这些分支不存在 `types`，不影响 TS 解析；`sass` 条件先匹配是正确的）。

```json
"exports": {
  ".": {
    "development": "./src/index.ts",
    "types": "./dist/index.d.ts",
    "import": "./dist/index.js",
    "default": "./dist/index.js"
  },
  "./theme": {
    "development": "./src/theme/index.ts",
    "types": "./dist/theme/index.d.ts",
    "import": "./dist/theme/index.js",
    "default": "./dist/theme/index.js"
  }
  // 其余 scss 分支保持原样
}
```

### 6. `packages/vite/package.json`

改 `exports["."]`：

```json
"exports": {
  ".": {
    "development": "./src/index.ts",
    "types": "./dist/index.d.mts",
    "import": "./dist/index.mjs"
  }
}
```

### 7. `packages/desktop/package.json`

改 `exports["."]` 与 `exports["./*"]`：

```json
"exports": {
  ".": {
    "development": "./src/index.ts",
    "types": "./dist/index.d.ts",
    "import": "./dist/index.js"
  },
  "./*": {
    "development": "./src/*",
    "types": "./dist/*",
    "import": "./dist/*"
  }
}
```

### 8. 验证

按以下顺序执行，任一失败需定位并修复后再进行下一步：

1. 在仓库根执行 `bun run check-types`，确保所有包 `tsc --noEmit` 通过，没有新增类型错误。
2. 在仓库根执行 `bun run build`，确保 `tsdown` 产物生成成功（验证生产构建解析未受影响，`development` 条件在构建时不应抢到非 dev 链路）。
3. 启动 `cd playgrounds/desktop && bun dev`，打开端口 7788 预览一个组件页面，确保 Vite dev server 运行时组件行为正常（此时 Vite 应匹配 `development` 条件，直接从 `packages/*/src` 加载源码）。
4. IDE 侧人工验证：在 `packages/desktop/src/components/cascade/cascade.vue` 上对 `useUserAction`、`useFormComponent` 等 `@veltra/compositions` 导入执行「转到定义」，目标文件应落在 `packages/compositions/src/**/*.ts` 而非 `packages/compositions/dist/**/*.d.ts`。对 `@veltra/utils`、`@veltra/directives`、`@veltra/icons`、`@veltra/styles/theme`、`@veltra/vite` 的典型导入各抽查一处。

## 影响范围

- `packages/compositions/package.json`：`exports["."]` 将 `development` 条件提前至首位。
- `packages/directives/package.json`：`exports["."]`、`exports["./*"]` 两分支 `development` 条件前移。
- `packages/utils/package.json`：`exports["."]`、`exports["./*"]` 两分支 `development` 条件前移。
- `packages/icons/package.json`：`exports["."]`、`exports["./normal"]`、`exports["./colorful"]` 三分支 `development` 条件前移。
- `packages/styles/package.json`：仅带 `types` 的 `exports["."]` 与 `exports["./theme"]` 两分支 `development` 条件前移；其余 SCSS 分支保持不变。
- `packages/vite/package.json`：`exports["."]` 将 `development` 条件提前至首位。
- `packages/desktop/package.json`：`exports["."]`、`exports["./*"]` 两分支 `development` 条件前移。

## 历史补丁
