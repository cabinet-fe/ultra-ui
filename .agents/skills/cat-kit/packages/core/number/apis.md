# 数值 — API

```ts
declare function n(n: number): Num

declare const $n: {
  formatter(options: NumberFormatOptions): Intl.NumberFormat
  plus(...numbers: (number | string)[]): number
  minus(...numbers: (number | string)[]): number
  mul(num1: number | string, num2: number | string): number
  div(num1: number | string, num2: number | string): number
  sum(...numbers: (number | string)[]): number
  calc(expression: string): number
}
```

`Num` 实例方法（经 `n()` 获得，一般不作为运行时命名导入）：`currency`、`fixed`、`each`、`range`、`max`、`min` 等。

`NumberFormatOptions`：`style`、`currency`、`precision`、`maximumFractionDigits`、`minimumFractionDigits`、`notation`。

详见 generated 声明。
