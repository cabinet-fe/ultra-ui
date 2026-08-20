# 兼容性堆砌

长期项目需求常变；默认一条通路，不堆双实现。

## 反例：新旧双路径长期共存

```ts
function loadList(params) {
  if (params.useLegacy) {
    return api.getListLegacy(mapLegacyParams(params))
  }
  return api.getList(params)
}

function mapLegacyParams(params) {
  return { ...params, page_no: params.pageNo, /* 大量字段映射 */ }
}
```

用户只要求接新接口时，应改调用方，而不是永久 `useLegacy`。

## 正例

```ts
function loadList(params) {
  return api.getList(params)
}
```

同步改所有调用方；旧 API 删除或留给 git 历史。

## 反例：为「少破坏」包一层适配永远不删

```ts
/** @deprecated */ export function formatDateOld(v) { return formatDate(v) }
export function formatDate(v) { /* 新实现 */ }
```

无人要求保留旧名时，直接改名/改导入即可。

## 正例

只保留 `formatDate`；全局替换导入。

## 反例：无开关的 feature flag 空壳

```ts
const ENABLE_NEW_FILTER = true
if (ENABLE_NEW_FILTER) { /* 唯一路径 */ }
```

## 正例

直接写新筛选逻辑，不要恒为 `true` 的旗标。

## 例外

用户明确说「要兼容旧数据/旧接口/灰度」时，再写兼容，并尽量：

- 范围小、有删除条件或注释说明何时可删；
- 仍避免两套完整业务复制，优先数据适配一点、逻辑一份。
