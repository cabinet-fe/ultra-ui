# 移除 legacy 主题兼容层 & 优化 Tabs 选中视觉

> 状态: 已执行

## 目标

- 简化 `UITheme` 类：不再输出无前缀 legacy CSS 变量副本（如 `--color-primary`），删除相关废弃告警与开发环境判断，减小运行时开销并降低维护成本。
- 优化 `tabs-bar` 组件视觉：修复垂直方向缺少上/下内边距导致顶部紧贴容器边沿的问题；选中态使用主题 Primary 色高亮字体，并让状态切换过渡更顺滑有"呼吸感"。

## 内容

### 1. 移除 `packages/styles/src/theme/ui-theme.ts` 中所有 legacy 相关实现

1. 删除文件顶部 `isDevEnv()` 函数（仅服务于 legacy 警告）。
2. 删除静态成员 `private static legacyDeprecationWarned = false`。
3. 删除静态方法 `withLegacyDuplicates(decls)`（生成无前缀变量副本）。
4. 删除静态方法 `warnLegacyOnce()`（开发环境一次性警告）。
5. 简化静态方法 `declarationBlock(decls)`：直接返回 `decls.join(';')`，不再调用 legacy 合并和警告。
6. 删除 `themeToDeclarationList` 上方 JSDoc 注释中"不含 legacy 副本"的说明，改为中性描述。
7. 校验文件内不再出现 `legacy` 字样（大小写不敏感）。

### 2. 优化 `packages/desktop/src/components/tabs/style.scss`

1. **垂直布局内边距**：为 `@include m.b(tabs-bar)` 的 `@include m.m(vertical)` 块新增 `padding: $list-padding 0;`，与 `@include m.e(viewport)` 水平方向的 `padding: $list-padding 0;` 对称，确保垂直容器首个 / 末个 item 与容器上下沿有呼吸空间。
   - 此时容器的基础样式 `padding: 0 $list-padding;`（水平）与垂直修饰符的 `padding: $list-padding 0;` 冲突，需改为：基础声明保持左右内边距，垂直修饰符内通过 `padding-block: $list-padding;` 覆写上下内边距，避免水平布局被误加上下 padding。
2. **选中态字体使用 Primary 高亮**：修改 `@include m.e(item)` 的 `@include m.is(active)` 分支：
   - `color: fn.use-var(color, primary);`（替换原 `fn.use-var(text-color, title)`）。
3. **增强状态切换过渡**：
   - 将 `@include m.e(item)` 的 `transition` 中每个 channel 的 timing-function 统一从 `ease` 改为 `cubic-bezier(0.4, 0, 0.2, 1)`（Material 标准曲线），并将过渡时长从 `0.2s` 微调为 `0.22s` 增强"呼吸感"。
   - 保持已有的 `color / background-color / box-shadow` 三条过渡通道，不新增也不删除。
4. 不改动水平布局既有逻辑、关闭按钮、nav 按钮与 rounded / block / size 修饰符。

### 3. 验证

1. 运行 `pnpm -C packages/styles test`（或最小相关测试）确认 `ui-theme.test.ts` 仍通过（测试仅校验 `--u-` 前缀，应无影响）。
2. 运行 lint/类型检查：在 styles 与 desktop 两个包 workspace 内执行 `pnpm run -r --filter @veltra/styles --filter @veltra/desktop build`（若较慢，可仅做 tsc --noEmit 或跳过，人工 ReadLints）。
3. 使用 ReadLints 工具检查修改后的两个文件无新增诊断。

## 影响范围

- `packages/styles/src/theme/ui-theme.ts`
  - 删除 `isDevEnv()` 顶层函数。
  - 删除 `UITheme.legacyDeprecationWarned` 静态字段。
  - 删除 `UITheme.withLegacyDuplicates()` 与 `UITheme.warnLegacyOnce()` 静态方法。
  - 简化 `UITheme.declarationBlock()` 为 `decls.join(';')`。
  - 更新 `themeToDeclarationList` 的 JSDoc 注释为"均为 `--u-` 前缀的 CSS 自定义属性"。
- `packages/desktop/src/components/tabs/style.scss`
  - `tabs-bar.m(vertical)` 新增 `padding-block: $list-padding;` 补齐上下呼吸空间。
  - `tabs-bar__item` 的 `transition` 将 timing-function 从 `ease` 升级为 `cubic-bezier(0.4, 0, 0.2, 1)`，时长从 `0.2s` 调整为 `0.22s`。
  - `tabs-bar__item.is-active` 的 `color` 由 `fn.use-var(text-color, title)` 改为 `fn.use-var(color, primary)`。
- `packages/desktop/src/components/progress/progress.vue`（patch-1）
- `playgrounds/desktop/src/progress/index.vue`（patch-1）
- `playgrounds/desktop/src/progress-nodes/index.vue`（patch-1）

## 历史补丁

- patch-1: 修复 legacy 移除引发的 CSS 变量引用失效
