# @veltra/utils

## 1.4.0

## 1.3.10

## 1.3.9

## 1.3.8

## 1.3.7

## 1.3.6

## 1.3.5

## 1.3.4

## 1.3.3

## 1.3.2

## 1.3.1

## 1.3.0

## 1.2.34

## 1.2.33

## 1.2.32

## 1.2.31

## 1.2.30

## 1.2.29

## 1.2.28

## 1.2.27

## 1.2.26

## 1.2.25

### Patch Changes

- e6a0721: UCodeEditor：`language` 改为 `langs` + `v-model:lang`，新增 prefix/suffix 外壳；表单组件统一用 `fieldKey` 处理 label/value 字段名

## 1.2.24

## 1.2.23

## 1.2.22

## 1.2.21

## 1.2.20

## 1.2.19

## 1.2.18

## 1.2.17

## 1.2.16

## 1.2.15

## 1.2.14

## 1.2.13

## 1.2.12

## 1.2.11

## 1.2.10

## 1.2.9

## 1.2.8

## 1.2.7

## 1.2.6

## 1.2.5

## 1.2.4

## 1.2.3

## 1.2.2

## 1.2.1

### Patch Changes

- acadad3: 将表单字段校验规则与通用属性类型上移至 `@veltra/utils.FormComponentProps`，删除 `@veltra/desktop` 中的 `form-field` 类型。

## 1.2.0

### Minor Changes

- a9b9eff: 重构表单体系：移除 `IFormModel` / `dynamic-form-model`，`UForm` 改为使用 `Record` 数据模型；校验逻辑下沉至 `form-item` 与各表单控件 `rules` 属性；从 `@veltra/utils` 移除 `validate` 导出及相关类型。

## 1.1.36

## 1.1.35

## 1.1.34

## 1.1.33

## 1.1.32

## 1.1.31

## 1.1.30

## 1.1.29

## 1.1.28

## 1.1.27

## 1.1.26

## 1.1.25

## 1.1.24

## 1.1.23

## 1.1.22

## 1.1.21

## 1.1.20

## 1.1.19

## 1.1.18

### Patch Changes

- 503ad2b: 重构条件编辑器数据模型与求值机制；@cat-kit/\* 依赖结构调整为 peerDependencies；各类构建配置与类型修复

## 1.1.17

## 1.1.16

## 1.1.15

## 1.1.14

## 1.1.13

## 1.1.12

## 1.1.11

## 1.1.10

## 1.1.9

### Patch Changes

- ca68f74: chore: republish all packages since 1.1.8 was not published

## 1.1.8

## 1.1.7

## 1.1.6

## 1.1.5

## 1.1.4

## 1.1.3

### Patch Changes

- 将表单上下文抽到 `@veltra/utils`，统一 `form` 相关组件的 `provide/inject` 入口。

## 1.1.2

### Patch Changes

- ef0ef2d: Refine shared expand transitions and related component/theme behavior.

## 1.1.1

## 1.1.0

## 1.0.15

## 1.0.14

## 1.0.13

## 1.0.12

## 1.0.11

## 1.0.10

## 1.0.9

### Patch Changes

- 81dbe41: 重构 use-lock -> use-user-action, 更加符合直觉
- 组件优化

## 1.0.8

### Patch Changes

- f758a81: 修复样式问题

## 1.0.7

### Patch Changes

- a91e7a8: 新增面包屑组件

## 1.0.6

### Patch Changes

- ab2d8e6: 新增一个 vite 包

## 1.0.5

## 1.0.4

### Patch Changes

- Fix published subpath exports so npm consumers resolve wildcard entries to the correct built files.

## 1.0.3

### Patch Changes

- Fix published package manifests to strip `exports.development` conditions from npm tarballs during release.

## 1.0.2

### Patch Changes

- 修复发布流程，确保发布到 npm 的内部包依赖不会保留 `workspace:*`，而是展开为对应版本号。

## 1.0.1
