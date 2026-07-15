# 数组与对象 — API

从 `@cat-kit/core` 导入。`Arr` / `CatObject` 为返回类型，**不可**作为命名导入。

## 数组函数

```ts
declare function last<T extends any[]>(arr: [...T]): Last<T>
declare function union<T>(...arrList: T[][]): T[]
declare function unionBy<T extends Record<string, any>>(
  key: string,
  ...arrList: T[][]
): T[]
declare function eachRight<T>(
  arr: T[],
  cb: (v: T, i: number, arr: T[]) => void
): void
declare function omitArr<T>(arr: T[], indexes: number | number[]): T[]
declare function arr<T>(arr: T[]): Arr<T>
```

`Arr<T>` 方法：`eachRight`、`omit`、`find`、`last`（getter）、`move`、`groupBy`。

## 对象包装

```ts
declare function o<O extends Record<string, any>>(object: O): CatObject<O>
```

`CatObject` 方法：`keys`、`each`、`pick`、`omit`、`extend`、`deepExtend`、`copy`、`merge`、`get`、`set`。

完整声明：[array.d.ts](../../../generated/core/data/array.d.ts)、[object.d.ts](../../../generated/core/data/object.d.ts)
