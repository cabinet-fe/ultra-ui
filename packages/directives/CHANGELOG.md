# @veltra/directives

## 1.14.1

No changes in this release.

## 1.14.0

### Patch Changes

- 2842ee5: 修复 `vRipple` 按下时给宿主按钮内联 `overflow: hidden`、导致 flex/grid 工具栏中按钮被压缩、相邻图标瞬间位移的问题：波纹改为渲染在指令自建的 `u-ripple__layer` 内并由该层裁剪，宿主只在 `position: static` 时临时设置 `relative`（作为波纹层的定位包含块），不再修改 `overflow`，因此不再影响元素的自动最小尺寸与布局；连续快速按下时波纹层与宿主内联样式也能正确回收。

## 1.13.3

### Patch Changes

- 78645c3: 修复 `UDualNav` 左轨一级应用溢出时真实鼠标点击失效：应用按钮固定 `flex-shrink: 0`，波纹在 `mousedown` 时临时写入的 `overflow: hidden` 不再把按钮压缩到 0 高，图标不再消失、后续按钮不再位移，`click` 正确命中按钮并切换右栏。左轨一级应用过多时改为内部滚动并隐藏滚动条。
  
  修复 `vRipple` 把布尔 `true` 当作类名写入 `data-ripple-class` 的问题：仅非空字符串绑定值写入波纹类名；波纹回收在等待 `transitionend` 之外增加兜底定时器，避免内联 `overflow` / `position` 长时间残留。

## 1.13.2

No changes in this release.

## 1.13.1

No changes in this release.

## 1.13.0

No changes in this release.

## 1.12.1

No changes in this release.

## 1.12.0

No changes in this release.

## 1.11.0

No changes in this release.

## 1.10.0

No changes in this release.

## 1.9.2

No changes in this release.

## 1.9.1

No changes in this release.

## 1.9.0

No changes in this release.

## 1.8.5

No changes in this release.

## 1.8.4

No changes in this release.

## 1.8.3

No changes in this release.

## 1.8.2

No changes in this release.

## 1.8.1

No changes in this release.

## 1.8.0

No changes in this release.

## 1.7.19

No changes in this release.

## 1.7.18

No changes in this release.

## 1.7.17

No changes in this release.

## 1.7.16

No changes in this release.

## 1.7.15

No changes in this release.

## 1.7.14

No changes in this release.

## 1.7.13

No changes in this release.

## 1.7.12

No changes in this release.

## 1.7.11

No changes in this release.

## 1.7.10

No changes in this release.

## 1.7.9

No changes in this release.

## 1.7.8

## 1.7.7

## 1.7.6

## 1.7.5

## 1.7.4

## 1.7.3

## 1.7.2

## 1.7.1

## 1.7.0

## 1.6.6

## 1.6.5

## 1.6.4

## 1.6.3

## 1.6.2

## 1.6.1

## 1.6.0

## 1.5.0

## 1.4.0

### Patch Changes

- Updated dependencies [394ea96]
  - @veltra/styles@1.4.0
  - @veltra/utils@1.4.0

## 1.3.10

### Patch Changes

- Updated dependencies [6308e5b]
  - @veltra/styles@1.3.10
  - @veltra/utils@1.3.10

## 1.3.9

### Patch Changes

- Updated dependencies [b7fe083]
  - @veltra/styles@1.3.9
  - @veltra/utils@1.3.9

## 1.3.8

### Patch Changes

- @veltra/utils@1.3.8
- @veltra/styles@1.3.8

## 1.3.7

### Patch Changes

- Updated dependencies [afd1656]
  - @veltra/styles@1.3.7
  - @veltra/utils@1.3.7

## 1.3.6

### Patch Changes

- @veltra/utils@1.3.6
- @veltra/styles@1.3.6

## 1.3.5

### Patch Changes

- @veltra/utils@1.3.5
- @veltra/styles@1.3.5

## 1.3.4

### Patch Changes

- @veltra/styles@1.3.4
- @veltra/utils@1.3.4

## 1.3.3

### Patch Changes

- @veltra/utils@1.3.3
- @veltra/styles@1.3.3

## 1.3.2

### Patch Changes

- @veltra/utils@1.3.2
- @veltra/styles@1.3.2

## 1.3.1

### Patch Changes

- Updated dependencies [f6c2fc6]
  - @veltra/styles@1.3.1
  - @veltra/utils@1.3.1

## 1.3.0

### Patch Changes

- Updated dependencies [db6c574]
  - @veltra/styles@1.3.0
  - @veltra/utils@1.3.0

## 1.2.34

### Patch Changes

- @veltra/utils@1.2.34
- @veltra/styles@1.2.34

## 1.2.33

### Patch Changes

- @veltra/utils@1.2.33
- @veltra/styles@1.2.33

## 1.2.32

### Patch Changes

- @veltra/utils@1.2.32
- @veltra/styles@1.2.32

## 1.2.31

### Patch Changes

- @veltra/utils@1.2.31
- @veltra/styles@1.2.31

## 1.2.30

### Patch Changes

- @veltra/utils@1.2.30
- @veltra/styles@1.2.30

## 1.2.29

### Patch Changes

- @veltra/utils@1.2.29
- @veltra/styles@1.2.29

## 1.2.28

### Patch Changes

- @veltra/utils@1.2.28
- @veltra/styles@1.2.28

## 1.2.27

### Patch Changes

- @veltra/utils@1.2.27
- @veltra/styles@1.2.27

## 1.2.26

### Patch Changes

- @veltra/utils@1.2.26
- @veltra/styles@1.2.26

## 1.2.25

### Patch Changes

- Updated dependencies [e6a0721]
  - @veltra/utils@1.2.25
  - @veltra/styles@1.2.25

## 1.2.24

### Patch Changes

- @veltra/utils@1.2.24
- @veltra/styles@1.2.24

## 1.2.23

### Patch Changes

- @veltra/utils@1.2.23
- @veltra/styles@1.2.23

## 1.2.22

### Patch Changes

- @veltra/utils@1.2.22
- @veltra/styles@1.2.22

## 1.2.21

### Patch Changes

- @veltra/utils@1.2.21
- @veltra/styles@1.2.21

## 1.2.20

### Patch Changes

- @veltra/utils@1.2.20
- @veltra/styles@1.2.20

## 1.2.19

### Patch Changes

- @veltra/utils@1.2.19
- @veltra/styles@1.2.19

## 1.2.18

### Patch Changes

- @veltra/utils@1.2.18
- @veltra/styles@1.2.18

## 1.2.17

### Patch Changes

- @veltra/utils@1.2.17
- @veltra/styles@1.2.17

## 1.2.16

### Patch Changes

- @veltra/utils@1.2.16
- @veltra/styles@1.2.16

## 1.2.15

### Patch Changes

- @veltra/utils@1.2.15
- @veltra/styles@1.2.15

## 1.2.14

### Patch Changes

- Updated dependencies [457b117]
  - @veltra/styles@1.2.14
  - @veltra/utils@1.2.14

## 1.2.13

### Patch Changes

- @veltra/utils@1.2.13
- @veltra/styles@1.2.13

## 1.2.12

### Patch Changes

- @veltra/utils@1.2.12
- @veltra/styles@1.2.12

## 1.2.11

### Patch Changes

- @veltra/utils@1.2.11
- @veltra/styles@1.2.11

## 1.2.10

### Patch Changes

- @veltra/utils@1.2.10
- @veltra/styles@1.2.10

## 1.2.9

### Patch Changes

- @veltra/utils@1.2.9
- @veltra/styles@1.2.9

## 1.2.8

### Patch Changes

- @veltra/utils@1.2.8
- @veltra/styles@1.2.8

## 1.2.7

### Patch Changes

- @veltra/utils@1.2.7
- @veltra/styles@1.2.7

## 1.2.6

### Patch Changes

- @veltra/utils@1.2.6
- @veltra/styles@1.2.6

## 1.2.5

### Patch Changes

- @veltra/utils@1.2.5
- @veltra/styles@1.2.5

## 1.2.4

### Patch Changes

- @veltra/utils@1.2.4
- @veltra/styles@1.2.4

## 1.2.3

### Patch Changes

- @veltra/utils@1.2.3
- @veltra/styles@1.2.3

## 1.2.2

### Patch Changes

- @veltra/utils@1.2.2
- @veltra/styles@1.2.2

## 1.2.1

### Patch Changes

- Updated dependencies [acadad3]
  - @veltra/utils@1.2.1
  - @veltra/styles@1.2.1

## 1.2.0

### Patch Changes

- Updated dependencies [a9b9eff]
  - @veltra/utils@1.2.0
  - @veltra/styles@1.2.0

## 1.1.36

### Patch Changes

- @veltra/utils@1.1.36
- @veltra/styles@1.1.36

## 1.1.35

### Patch Changes

- Updated dependencies [08fc992]
  - @veltra/styles@1.1.35
  - @veltra/utils@1.1.35

## 1.1.34

### Patch Changes

- @veltra/utils@1.1.34
- @veltra/styles@1.1.34

## 1.1.33

### Patch Changes

- @veltra/utils@1.1.33
- @veltra/styles@1.1.33

## 1.1.32

### Patch Changes

- @veltra/utils@1.1.32
- @veltra/styles@1.1.32

## 1.1.31

### Patch Changes

- @veltra/utils@1.1.31
- @veltra/styles@1.1.31

## 1.1.30

### Patch Changes

- @veltra/utils@1.1.30
- @veltra/styles@1.1.30

## 1.1.29

### Patch Changes

- @veltra/utils@1.1.29
- @veltra/styles@1.1.29

## 1.1.28

### Patch Changes

- @veltra/utils@1.1.28
- @veltra/styles@1.1.28

## 1.1.27

### Patch Changes

- @veltra/utils@1.1.27
- @veltra/styles@1.1.27

## 1.1.26

### Patch Changes

- Updated dependencies [7ef551a]
  - @veltra/styles@1.1.26
  - @veltra/utils@1.1.26

## 1.1.25

### Patch Changes

- @veltra/utils@1.1.25
- @veltra/styles@1.1.25

## 1.1.24

### Patch Changes

- Updated dependencies [767edb6]
  - @veltra/styles@1.1.24
  - @veltra/utils@1.1.24

## 1.1.23

### Patch Changes

- @veltra/utils@1.1.23
- @veltra/styles@1.1.23

## 1.1.22

### Patch Changes

- @veltra/utils@1.1.22
- @veltra/styles@1.1.22

## 1.1.21

### Patch Changes

- @veltra/utils@1.1.21
- @veltra/styles@1.1.21

## 1.1.20

### Patch Changes

- @veltra/utils@1.1.20
- @veltra/styles@1.1.20

## 1.1.19

### Patch Changes

- Updated dependencies [e63faf1]
  - @veltra/styles@1.1.19
  - @veltra/utils@1.1.19

## 1.1.18

### Patch Changes

- 503ad2b: 重构条件编辑器数据模型与求值机制；@cat-kit/\* 依赖结构调整为 peerDependencies；各类构建配置与类型修复
- Updated dependencies [503ad2b]
  - @veltra/utils@1.1.18
  - @veltra/styles@1.1.18

## 1.1.17

### Patch Changes

- Updated dependencies [5bd35b3]
  - @veltra/styles@1.1.17
  - @veltra/utils@1.1.17

## 1.1.16

### Patch Changes

- Updated dependencies [ab50e27]
  - @veltra/styles@1.1.16
  - @veltra/utils@1.1.16

## 1.1.15

### Patch Changes

- @veltra/utils@1.1.15
- @veltra/styles@1.1.15

## 1.1.14

### Patch Changes

- @veltra/utils@1.1.14
- @veltra/styles@1.1.14

## 1.1.13

### Patch Changes

- @veltra/utils@1.1.13
- @veltra/styles@1.1.13

## 1.1.12

### Patch Changes

- Updated dependencies [df8bd87]
  - @veltra/styles@1.1.12
  - @veltra/utils@1.1.12

## 1.1.11

### Patch Changes

- @veltra/utils@1.1.11
- @veltra/styles@1.1.11

## 1.1.10

### Patch Changes

- @veltra/utils@1.1.10
- @veltra/styles@1.1.10

## 1.1.9

### Patch Changes

- ca68f74: chore: republish all packages since 1.1.8 was not published
- Updated dependencies [ca68f74]
  - @veltra/utils@1.1.9
  - @veltra/styles@1.1.9

## 1.1.8

### Patch Changes

- @veltra/utils@1.1.8
- @veltra/styles@1.1.8

## 1.1.7

### Patch Changes

- Updated dependencies [cc1d822]
  - @veltra/styles@1.1.7
  - @veltra/utils@1.1.7

## 1.1.6

### Patch Changes

- @veltra/utils@1.1.6
- @veltra/styles@1.1.6

## 1.1.5

### Patch Changes

- @veltra/styles@1.1.5
- @veltra/utils@1.1.5

## 1.1.4

### Patch Changes

- 27aa057: fix(desktop): expression-editor and number-range-input width; group-input add button type; multi-select-option ripple refactor

  fix(directives/ripple): use dataset-based reference counting for safe multi-instance collaboration

  - @veltra/utils@1.1.4
  - @veltra/styles@1.1.4

## 1.1.3

### Patch Changes

- Updated dependencies
  - @veltra/utils@1.1.3
  - @veltra/styles@1.1.3

## 1.1.2

### Patch Changes

- Updated dependencies [ef0ef2d]
  - @veltra/utils@1.1.2
  - @veltra/styles@1.1.2

## 1.1.1

### Patch Changes

- Updated dependencies [a9e4a86]
  - @veltra/styles@1.1.1
  - @veltra/utils@1.1.1

## 1.1.0

### Patch Changes

- Updated dependencies [dad6fef]
  - @veltra/styles@1.1.0
  - @veltra/utils@1.1.0

## 1.0.15

### Patch Changes

- @veltra/utils@1.0.15
- @veltra/styles@1.0.15

## 1.0.14

### Patch Changes

- Updated dependencies [3da006a]
  - @veltra/styles@1.0.14
  - @veltra/utils@1.0.14

## 1.0.13

### Patch Changes

- @veltra/utils@1.0.13
- @veltra/styles@1.0.13

## 1.0.12

### Patch Changes

- @veltra/utils@1.0.12
- @veltra/styles@1.0.12

## 1.0.11

### Patch Changes

- @veltra/utils@1.0.11
- @veltra/styles@1.0.11

## 1.0.10

### Patch Changes

- Updated dependencies [f1bce93]
  - @veltra/styles@1.0.10
  - @veltra/utils@1.0.10

## 1.0.9

### Patch Changes

- 81dbe41: 重构 use-lock -> use-user-action, 更加符合直觉
- 组件优化
- Updated dependencies [81dbe41]
- Updated dependencies
  - @veltra/styles@1.0.9
  - @veltra/utils@1.0.9

## 1.0.8

### Patch Changes

- f758a81: 修复样式问题
- Updated dependencies [f758a81]
  - @veltra/styles@1.0.8
  - @veltra/utils@1.0.8

## 1.0.7

### Patch Changes

- a91e7a8: 新增面包屑组件
- Updated dependencies [a91e7a8]
  - @veltra/styles@1.0.7
  - @veltra/utils@1.0.7

## 1.0.6

### Patch Changes

- ab2d8e6: 新增一个 vite 包
- Updated dependencies [ab2d8e6]
  - @veltra/styles@1.0.6
  - @veltra/utils@1.0.6

## 1.0.5

### Patch Changes

- @veltra/utils@1.0.5
- @veltra/styles@1.0.5

## 1.0.4

### Patch Changes

- Fix published subpath exports so npm consumers resolve wildcard entries to the correct built files.
- Updated dependencies
  - @veltra/utils@1.0.4
  - @veltra/styles@1.0.4

## 1.0.3

### Patch Changes

- Fix published package manifests to strip `exports.development` conditions from npm tarballs during release.
- Updated dependencies
  - @veltra/utils@1.0.3
  - @veltra/styles@1.0.3

## 1.0.2

### Patch Changes

- 修复发布流程，确保发布到 npm 的内部包依赖不会保留 `workspace:*`，而是展开为对应版本号。
- Updated dependencies
  - @veltra/utils@1.0.2
  - @veltra/styles@1.0.2

## 1.0.1

### Patch Changes

- @veltra/utils@1.0.1
- @veltra/styles@1.0.1
