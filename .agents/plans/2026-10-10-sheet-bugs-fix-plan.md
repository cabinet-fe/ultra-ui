# Sheet 六项 Bug 修复计划(2026-10-10 调研定稿;2026-10-11 复核修订,待执行)

> 自包含文档:可在新会话直接按此执行。2026-10-11 已对照两仓库现状逐项复核:全部修复项均未实施(两仓库工作区干净),上游 core/sheet 关键行号未漂移;ultra-ui 侧因 `75b9d4ac`/`c1bb6d91` 重构有路径与行号更新,已同步。hucre 相关修复暂缓(见文末暂缓区)。执行前如相关文件再有大改动需重新核对行号。

## 背景与关键事实

- `infinitable` 并非 npm 安装,而是 **bun link 到本地仓库 `/Users/whj/codes/infinite-table`**(`packages/sheet/node_modules/infinitable → infinite-table/packages/infinitable`);其 `package.json` 入口指向 `dist/`,因此**上游改动后必须重新构建**(`bun run build`,重活建议 `taskpolicy -b`)才能被 ultra-ui 消费到。ultra-ui 消费面是 `infinitable/sheet` 子路径(`SheetGrid`、`Sheet` 等从 `'infinitable/sheet'` 导入)。
- xlsx 解析依赖 **hucre@1.2.0(第三方,productdevbook/hucre)**。hucre 目前仍在迭代中,**本次跳过一切 hucre 改动**(不打 patch、不提 PR);hucre@1.2.0 已解析并暴露 `sheet.defaultRowHeight` / `sheet.defaultColWidth`(worksheet.mjs :281-296、:1092-1093;`_types.d.mts` :654-657 有类型),默认尺寸修复不受影响。hucre 仍丢弃 anchor 的 `colOff`/`rowOff`,该主因暂缓。
- **用户已确认决策:滚动条缺省档改为「画布常驻档」(`scrollbar: true`,滑块始终可见);`mode: 'native'` 保留为显式可选项。**
- 2026-10-11 复核补充:`extendsTheme` 与 `ThemeOverride` **已从 `@infinitable/core` 导出**(core/src/index.ts :11-12),A4 无需再加导出。

## 问题归属总表

| # | 问题 | 根因归属 |
|---|------|---------|
| 1 | 行/列头 resize 手柄悬浮无 `col-resize`/`row-resize` 光标 | 上游 core:原生档 cursor 写到 `pointer-events:none` 的 sticky 视口上,永不生效 |
| 2 | 图片编辑被强制钳制在可视区内,大图交互差 | 上游 core:`float-object-layer.ts` 编辑钳制,宿主无法关闭(commit 0676b98 引入) |
| 3 | `[Vue warn] UNavSearch class 无法继承` | ultra-ui playground:双根(div+Teleport)组件未 `inheritAttrs:false` 未绑 `$attrs` |
| 4 | 原生 vs 画布滚动条疑惑、原生档看不见滚动条 | ultra-ui 缺省档选择(b79cf33c 切到 native);macOS 悬浮滚动条静止即隐;#1 光标 bug 也出自原生档 |
| 5 | sheet 画布背景色不跟主题 | 上游 `grid-theme.ts` 硬编码 `#FFF/#F5F5F5`(注释明说 canvas 读不了 CSS 变量)+ `SheetGridOptions` 无 theme 透传口 + ultra-ui 未接入 `updateTheme` |
| 6 | 某条件下列头字母渲染到左上角、与角块重叠(两滚动档均可复现) | 上游 core:`updateSceneWindow` 增量滚动补建的列头节点 `appendChild` 挂树尾,画在一次性创建的 cornerNode 之上 |
| 7 | 导入 xlsx 后图片位置与桌面 WPS 有偏差 | 主因:hucre 丢弃锚点格内偏移(colOff/rowOff)——**暂缓,等 hucre 迭代**;次因:默认行高 28px/列宽 80px 与 Excel 的 20px/64px 不一致,且导入忽略文件的 defaultRowHeight/defaultColWidth,累计偏移——**本次只修次因** |

**实施顺序:先上游(core → sheet → 构建),后 ultra-ui(消费新 API),最后统一验证。建议执行完不自动 commit,先报告两仓库改动清单。**

---

## A. 上游仓库 `/Users/whj/codes/infinite-table`

### A1. 修复 resize 光标失效(core)

- `packages/core/src/list-table.ts`:构造区约 :549-556(`this.container = this.nativeScrollbar?.viewportElement ?? options.hostOptions?.container` 与 `restoreFocusTarget` 分流旁)新增字段 `cursorContainer = options.hostOptions?.container ?? this.container`;`setContainerCursor`(约 :1179)改写 `cursorContainer` 而非 `this.container`。
- 根因论证:原生档 `this.container` 是 sticky 视口,`native-scrollbar.ts` 的 spacer `pointer-events:none` 使其永不成为命中元素,`style.cursor` 无效;宿主容器是 wrapper(真实命中元素)的祖先,光标沿 CSS 继承生效。canvas 档 `this.container === hostOptions.container`,行为零变化。写法参照同文件 `restoreFocusTarget`(约 :555)已有的同型分流。
- 光标设置的调用链:`list-table-interaction.ts` `updatePointerCursor`(约 :884)→ `table.setContainerCursor('col-resize'/'row-resize'/...)`,拖拽会话期钉住光标(约 :168/:294)。

### A2. 修复列头画到左上角(core)

- `packages/core/src/list-table-scene.ts` `updateSceneWindow`:约 :407-417 增量补建列头 `headerGroup.appendChild(node)` 挂树尾;cornerNode 仅在 :429-431 不存在时创建一次,永不重挂 → 新列头画在角块之上,滚到左缘半截列的居中字母(如 "J")叠进 (0,0) 角块区;任何 `applyGeometryChange` 全量重建(改列宽/冻结/resize)会恢复正确 z 序——故「时有时无」。
- 修复::429-431 块改为——若 `table.cornerNode` 已存在则 `headerGroup.appendChild(table.cornerNode)`(appendChild 自带摘除重挂,O(1)),保持「角块最上」不变量。
- 新增回归测试:模拟增量滚动使新列头滚入窗口后,断言 cornerNode 仍是 headerGroup 最后一个子节点。

### A3. 移除图片编辑视口钳制(core)

`packages/core/src/float/float-object-layer.ts`:

- `dragMove`(约 :555)与 `transformMove`(约 :761)末尾不再调用 `clampToViewport`;
- 删除 `clampToViewport`(约 :770-794)与缩放上限块(约 :744-748,`maxW/maxH = viewport − 2×SELECTED_PAD`)——图片可自由放大到超出视口、拖出可视区;
- **必须保留**:`bodyViewport` 传参与绘制裁剪(约 :248-269 paint 的 clip、:294-304 clipWindow)——这是「浮层在表头/行头下层、不遮挡」的保证;注意 `bodyViewport` 共 4 类用途(裁剪/剔除、缩放上限、位置钳制、落点投影),只动后三类中的前两个;
- **保留** `pointInView`(约 :800-809)落点投影(endDrag :577 / endTransform :828 调用),注释语义更新:从「配合钳制的越缘回投」改为「越缘落点就近换算」——拖出边界松手仍能换算最近格锚点提交,而不是整拖回弹。
- ListTable 侧 `bodyViewport: this.bodyViewport`(list-table.ts 约 :757)与 resize 路径 `setBodyViewport`(约 :1355)不动。
- 测试 `packages/core/tests/float/float-object-layer.test.ts`:删除/改写约 :426-492 的钳制用例(拖拽钳制、宽出视口取中出血、缩放上限、旋转钳制)为「不钳制」断言;约 :219-257 与 :408-424 的**绘制裁剪**用例保留不动(describe 块「编辑态位置钳制与严格裁剪」约 :379 起的台架 `clampSetup` :384 可复用)。

### A4. SheetGrid 主题透传 + 默认行列尺寸模型化(sheet)

- `grid/sheet-grid.ts` `SheetGridOptions`(约 :57-108)新增 `theme?: ThemeOverride`;构造 ListTable(约 :233,现硬编码 `theme: SHEET_GRID_THEME`)改为 `theme: extendsTheme(SHEET_GRID_THEME, options.theme)`(`extendsTheme` 已从 `@infinitable/core` 导出——core/src/index.ts :11,签名见 `core/src/theme.ts` :203-221;未传时等价现状。注意参数序按 `extendsTheme` 实际签名核对,保证 SHEET_GRID_THEME 为底、用户 override 为覆盖层)。
- `SheetGrid` 新增公开方法 `updateTheme(override)` 转发 `table.updateTheme`(引擎已支持级联深覆盖+重绘,list-table.ts 约 :626-644;重复传同形 override 幂等,主题来回切换安全)。
- 模型 `core/sheet.ts`:新增可选字段 `defaultRowHeight?` / `defaultColWidth?`(单位 px)+ setter;`SheetReplaceItem`(io/import.ts 约 :755 一带)补这两个字段,replace 快照不丢。
- `sheet-grid.ts` 默认值消费点改为 `sheet.defaultRowHeight ?? SHEET_DEFAULT_ROW_HEIGHT`(列宽同理,常量在 `grid-theme.ts` :63/:75):
  - 约 :227-228 传 ListTable 的 `rowHeight`/`defaultColWidth`;
  - 约 :256 模型行高等于默认值时跳过 `setRowHeight` 的判等;
  - 约 :447 `buildColumns` 列宽兜底;
  - 约 :175-182 与 :384-404 fitRows/fitCols 估算。
- 新建空白表不受影响(仍 28px/80px),仅导入 xlsx 的表换用文件缺省值。

### A5. xlsx 导入:默认行列尺寸(sheet)

`core/io/import.ts`:

- 消费 `source.defaultRowHeight`(pt→px:`Math.round(v * 4 / 3)`,缺省按 Excel 规范 15pt→20px;注意 hucre 会丢弃恰好等于 15 的值,undefined 即视为 15)与 `source.defaultColWidth`(字符→px:`Math.round(v * 7 + 5)`,缺省 8.43→64px,与既有显式列宽换算 :643 同口径 MDW=7),写入 A4 新模型字段。**这是图片纵向/横向累计偏移的次因**(28px vs 20px 每行差 8px,列 80 vs 64 每列差 16px)。hucre@1.2.0 已提供这两个字段,无需改动 hucre。
- ~~`hucreImageToInput`(约 :336-349)透传锚点格内偏移到 `offsetX`/`offsetY`~~ **暂缓**:hucre 现不输出 anchor 偏移,透传为空操作;等 hucre 迭代支持后只需此一处透传(模型/渲染链路已全程支持 px 偏移:`core/image.ts` :10-14 → `grid/grid-float-images.ts` :32-33 → 引擎 `float-object-layer.ts` `layoutNode` 约 :951-968,只缺导入来源)。

### A6. 上游构建与测试

- `bun test`(packages/core 与 packages/sheet 相关用例,增量跑);
- `taskpolicy -b bun run build`(infinitable 构建,产出 dist 供 ultra-ui link 消费)。

---

## B. ultra-ui 仓库 `/Users/whj/codes/ultra-ui`

### B1. 修复 UNavSearch Vue 警告(playground)

- `playground/src/nav-search.vue`(约 :59 `defineOptions({ name: 'UNavSearch' })`):加 `inheritAttrs: false`;根节点是 div(约 :2-26)+ Teleport(约 :28-44)双根,在触发器 div 上加 `v-bind="$attrs"`。
- 使用处 `playground/src/App.vue` :21 传的 `class="control-bar__search"`(样式 :432-434 `margin-inline: auto`)会落到触发器上,语义正确,App.vue 不动。

### B2. 滚动条缺省改画布常驻档(sheet 包,行为变更)

- `packages/sheet/src/components/sheet/sheet.vue`(约 :106 起 withDefaults):缺省 `scrollbar: true`——画布常驻档(滑块始终可见、画布侧预留轨道条带 `reserve: true` 不占页面布局、不遮挡单元格),注释同步改写;`{ mode: 'native' }` 保留为显式可选项(其 cursor bug 已由 A1 修复)。现缺省在 :119(`scrollbar: { mode: 'native' }`);同块 :122 已有 `growOnScroll: true`(c1bb6d91 新增),改缺省时勿动。
- 归一化参考(上游 `core/src/scrollbar.ts` `resolveScrollbarConfig` :65-95):`undefined` → canvas hover+reserve;`true` → canvas always+reserve;`false` → 关;`{mode:'native'}` → 原生档。
- `playground/src/sheet/index.vue`(约 :444-452):演示页缺省档改 `'canvas'`,且 canvas 档映射为 `true`(与组件缺省一致);native 档保留可切换(验证 A1)。
- 添加 changeset(@veltra/sheet,说明缺省档变更)。

### B3. 主题色接入画布(sheet 包)

- 新增小型组合(并入 `use-sheet-grid.ts` 或独立 `use-sheet-theme.ts`;注意该文件已在重构中迁至 **`packages/sheet/src/components/sheet/use-sheet-grid.ts`**,composables 目录已不存在):
  - `resolveCanvasThemeOverride(el)`:对 grid 宿主元素 `getComputedStyle` 读 CSS 变量并映射为引擎 `ThemeOverride`:

    | 引擎 token | CSS 变量 | 说明 |
    |---|---|---|
    | `body.background` + `underlayBackgroundColor` | `--u-bg-color-top` | 与 `.u-sheet` 外层同底(浅 #fff / 深 #1c1c21) |
    | `header.background` | `--u-bg-color-bottom` | 浅 #f4f4f5 ≈ 现硬编码 #F5F5F5;rowHeader/corner 由引擎随 header 派生(`extendsTheme`),无需单写 |
    | `body.color` / `header.color` | `--u-text-color-main` | 深色下自动浅字 |
    | `body.borderColor` / `header.borderColor` / `frameStyle.color` | `--u-border-color` | 网格线(浅 #e4e4e7 ≈ 现 #E1E4E8) |
    | `interaction.freezeDividerColor` | `--u-border-muted-color` | 冻结分隔线 |

  - 任一变量为空(未 loadTheme)→ 返回 `undefined`,保持引擎缺省白底(不破坏无主题环境);
  - `createGrid` 时经 A4 新增的 `SheetGridOptions.theme` 传入(use-sheet-grid.ts `createGrid` 现约 :112 起,构造区约 :112-168);
  - `watch` 主题变化后对缓存中**所有** grid 实例调 `grid.updateTheme(override)`:`currentTheme` 从 `@veltra/styles` 导入(`load-theme.ts` :7 导出的 `ShallowRef<UITheme>`,sheet 包已依赖 styles);监听 `() => currentTheme.value?.theme` deep + `currentTheme` 本身(实例替换),`flush: 'post'` 保证在 UITheme 自身渲染 CSS 变量之后读取。
- 演示页切主题(dark/midnight/neon 等 presets)验证:画布底色、表头、网格线、文字全跟随,运行时切换无需重建网格。

### B4. 测试与验证

- `bun test`(packages/sheet 相关用例;如断言旧 native 缺省需同步更新);
- playground `bun run dev` 手测清单:
  1. 悬停列头/行头 resize 边界出现 `col-resize`/`row-resize` 光标(画布档 + 原生档都测);
  2. 插入大图:可拖出/缩放超出可视区,松手落点换算合理,编辑中不遮行列头;
  3. 滚动条常驻可见,拖拽流畅无双滚;
  4. 切换主题画布颜色即时跟随;
  5. 重新导入用户的 xlsx:默认行列尺寸修复后,远离锚点的**累计**偏移应显著收敛(每行 −8px/每列 −16px 的误差消除);锚点**格内**偏移(主因在 hucre)本次仍存在,如实记录不阻塞;
  6. 控制台无 UNavSearch 警告;
  7. 横向滚动停在半列处反复左右滚,列头字母不再叠到左上角角块。

---

## 暂缓区(hucre 迭代期不做,2026-10-11 用户确认)

以下条目依赖 hucre 提供或写回 anchor 偏移能力,hucre 上游仍在迭代,待其稳定后再评估(届时优先等上游修复,打 patch 是最后手段):

- **锚点格内偏移导入(原 A5 后半)**:`hucreImageToInput` 透传 `offsetX`/`offsetY`——图片与 WPS 偏差的主因,下游链路已就绪,只差 hucre 来源;
- **hucre bun patch(原 A6)**:`parseAnchorPosition` 补读 `colOff`/`rowOff`(EMU→px `Math.round(v / 9525)`)、one/twoCellAnchor 组装携带 offset、`_types.d.mts` 补类型——参考时序:hucre@1.2.0 的 reader.mjs 偏移丢失点在 :1079-1097(parseAnchorPosition)、:775-810(twoCell)、:1030-1056(oneCell);
- **导出方向写回偏移**:`export.ts`(约 :134-148 `imageToHucre`)现状已丢,与导入侧对称修复,一并等 hucre;
- hucre 对 `absoluteAnchor` 图片静默丢弃(仅处理 twoCell/oneCell),如遇此类文件图片整张缺失,属 hucre 上游问题。

## 已知残留(本次不做,如实说明)

- **twoCellAnchor 尺寸口径**:导入按 spPr `ext` 取图片尺寸,WPS 按 from→to 跨度;两者不一致的文件右/下缘仍可能微差,默认尺寸修复后如仍可见再跟进。
- **MDW=7 硬编码**:默认字体非 Calibri 的文件(如宋体 MDW=8)列宽换算有累计偏差,与现有显式列宽换算同口径,不动。

## 参考索引(2026-10-11 复核确认行号)

- 上游 core:`list-table.ts`(:549-556 container/restoreFocusTarget、:626 updateTheme、:757 bodyViewport 透传、:1179 setContainerCursor、:1355 setBodyViewport、:1683 bodyViewport getter)、`index.ts`(:11-12 extendsTheme/ThemeOverride 已导出)、`list-table-scene.ts`(:407-432 表头补建/角块)、`list-table-interaction.ts`(:884 updatePointerCursor)、`float/float-object-layer.ts`(:248-269/:294-304 裁剪、:555/:761 钳制调用、:744-748 缩放上限、:770-794 clampToViewport、:800-809 pointInView、:951-968 layoutNode)、`native-scrollbar.ts`(:225-258 assemble、:245 pointer-events)、`scrollbar.ts`(:65-95 resolveScrollbarConfig)、`theme.ts`(:119-133 ThemeOverride、:203-221 extendsTheme)
- 上游 sheet:`grid/sheet-grid.ts`(:57-108 options、:233 theme 硬编码、:227-228/:256/:447 默认尺寸消费、:175-182/:384-404 fit)、`grid/grid-theme.ts`(:26-60 主题、:63/:75 默认尺寸)、`core/sheet.ts`(:164-171 稀疏行列尺寸)、`core/image.ts`(:10-14 anchor 偏移)、`core/io/import.ts`(:336-349 hucreImageToInput、:643 显式列宽换算、:626-648 行列尺寸导入、:755 replace item)、`grid/grid-float-images.ts`(:32-33 偏移透传)
- hucre(node_modules/.bun/hucre@1.2.0/.../dist,仅参考不动):`xlsx/reader.mjs`(:1015 EMU、:762 parseTwoCellAnchor、:1017 parseOneCellAnchor、:1079 parseAnchorPosition)、`xlsx/worksheet.mjs`(:281-296 sheetFormatPr,defaultRowHeight==15 被丢弃;:1092-1093 defaultRowHeight/defaultColWidth 赋值)、`_types.d.mts`(:460-484 SheetImage、:654-657 defaultColWidth)
- ultra-ui:`packages/sheet/src/components/sheet/sheet.vue`(:106 withDefaults、:119 scrollbar 缺省、:122 growOnScroll)、`packages/sheet/src/components/sheet/use-sheet-grid.ts`(:112 createGrid、:112-168 构造区;**已从 composables/ 迁移至此**)、`packages/styles/src/theme/load-theme.ts`(:7 currentTheme)、`presets/light.ts`/`dark.ts`(token 值)、`playground/src/nav-search.vue`(:59 defineOptions、双根)、`playground/src/App.vue`(:21 使用处)、`playground/src/sheet/index.vue`(:444-452 滚动条切换器)
