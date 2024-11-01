# ultra-ui

给你带来极致性能, 极致代码, 极致体验的 Vue3 组件库

[查看文档](https://cabinet-fe.github.io/ultra-ui-doc/)

### 代码简洁之道

1. 尽可能地减少代码块的嵌套

```ts
// 不好的做法
if (!disabled) {
  console.log('1')
}

// 好的做法
if (disabled) return
console.log('1')
```

2. 函数尽可能保持简短，一个函数的代码行数不应该超过50行

3. 命名务必规范，可以询问chat-gpt之类的AI工具来获取命名

4. 为了类型的性能， 请务必完整地注解**_函数_**和方法的参数类型和返回值类型

```ts
// 常用的做法, 这样做可行也没有可读性问题， 但是TS编译器需要进行类型推断
// 在函数中， 编译器需要分析函数本身， 越复杂的函数分析代价越大
function sum(n1: number, n2: number) {
  return n1 + n2
}

// 更好的做法, 无需进行类型推断
function sum(n1: number, n2: number): number {
  return n1 + n2
}
```

5. 避免过多的函数参数， 如果参数超过3个应合并为一个对象参数
